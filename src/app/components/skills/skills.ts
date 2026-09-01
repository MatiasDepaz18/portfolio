import {
  Component,
  ElementRef,
  afterNextRender,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type * as GSAP from 'gsap';
import { NgIcon } from '@ng-icons/core';
import { GsapService } from '../../services/gsap.service';
import { SectionShell } from '../shared/section-shell/section-shell';
import { RevealDirective } from '../../directives/reveal.directive';
import { skillCategories, type SkillCategory } from '../../data/skills.data';

const LOGO_COLOR = '9aa694';

/** Sprite de la consola (pantalla transparente, generado por clean-assets). */
const SWITCH_SPRITE = 'assets/game/switch/switch-body.png';

/** Power-ups de la navegación: hongo verde (posición) y rojo (activa). */
const MUSHROOM_GREEN = 'assets/game/mushrooms/mushroom-green.png';
const MUSHROOM_RED = 'assets/game/mushrooms/Super_Mushroom.webp';

/** Envuelve un índice al rango [0, count): la última vuelve a la primera. */
export function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

/**
 * Distancia circular del slide `index` al activo `target`, como entero en
 * (-count/2, count/2]. Para count = 4: {-1, 0, 1, 2}, donde -1/0/+1 son
 * los slots visibles y 2 la categoría oculta del carrusel infinito.
 */
export function wrappedDist(index: number, target: number, count: number): number {
  const raw = ((index - target) % count + count) % count;
  return raw > count / 2 ? raw - count : raw;
}

/**
 * Distancia final de un slide tras un settle. La categoría oculta (2) se
 * coloca del lado por el que venía (`cur`): si salía por la izquierda
 * queda en -2 y si salía por la derecha en +2, así la salida es siempre
 * de un solo paso y el wrap nunca atraviesa el centro del carrusel.
 */
export function slideDist(index: number, target: number, count: number, cur: number): number {
  const d = wrappedDist(index, target, count);
  return d === count / 2 ? (cur < 0 ? -count / 2 : count / 2) : d;
}

/**
 * Signo de un movimiento entre dos slides, respetando que el salto
 * última <-> primera no invierte la dirección.
 */
function stepDir(prev: number, target: number, count: number): number {
  if (target - prev === count - 1) {
    return -1; // 0 -> última: hacia atrás
  }
  if (target - prev === -(count - 1)) {
    return 1; // última -> 0: hacia adelante
  }
  return Math.sign(target - prev);
}

/**
 * Carrusel infinito de Habilidades: una consola Switch por categoría.
 * GSAP mueve cada slide en x con peeks laterales escalados y el wrap se
 * resuelve con distancias circulares (la primera muestra la última a la
 * izquierda y la última la primera a la derecha). En touch se arrastra,
 * en desktop se usan flechas/dots/teclado. Con prefers-reduced-motion el
 * CSS muestra un grid estático y GSAP no corre (SSR-safe: todo inicia en
 * afterNextRender).
 */
@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionShell, RevealDirective, NgIcon, NgTemplateOutlet],
  templateUrl: './skills.html',
  styleUrl: './skills.css',
})
export class Skills implements OnDestroy {
  readonly categories = skillCategories;
  readonly active = signal(0);
  readonly carouselReady = signal(false);
  readonly expanded = signal(false);
  readonly expandedIndex = signal(0);

  private stage = viewChild<ElementRef<HTMLElement>>('stage');
  private viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private expandedOverlay = viewChild<ElementRef<HTMLElement>>('expandedOverlay');
  private expandedConsole = viewChild<ElementRef<HTMLElement>>('expandedConsole');
  private expandedClose = viewChild<ElementRef<HTMLElement>>('expandedClose');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;
  private gsap: typeof GSAP.gsap | null = null;
  private chainTimers: gsap.core.Tween[] = [];
  private curD: number[] = [];
  private settle: (target: number, duration?: number) => void = () => {};
  private dragMoved = false;
  private expandFrom: { scale: number; x: number; y: number } | null = null;
  private escHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(private gsapService: GsapService) {
    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen matchMedia ni necesitan GSAP.
      if (typeof window.matchMedia !== 'function') {
        return;
      }
      void this.initCarousel();
    });
  }

  readonly logoColor = LOGO_COLOR;
  readonly switchSprite = SWITCH_SPRITE;
  readonly mushroomGreen = MUSHROOM_GREEN;
  readonly mushroomRed = MUSHROOM_RED;

  logoUrl(slug: string): string {
    return `https://cdn.simpleicons.org/${slug}/${this.logoColor}`;
  }

  go(dir: number): void {
    this.goToSlide(this.active() + dir);
  }

  goToSlide(index: number): void {
    const count = this.categories.length;
    const target = wrapIndex(index, count);
    const from = this.active();
    if (target === from) {
      return;
    }
    this.cancelChain();
    let steps = wrapIndex(target - from, count);
    if (steps > count / 2) {
      steps -= count;
    }
    const dir = Math.sign(steps);
    if (Math.abs(steps) === 1) {
      this.settle(target);
      return;
    }
    // Saltos largos (dots): se encadenan los slides intermedios para
    // que ningún slide cruce el centro del carrusel.
    const duration = Math.max(0.3, 0.55 / Math.abs(steps));
    for (let k = 1; k <= Math.abs(steps); k++) {
      const next = wrapIndex(from + k * dir, count);
      this.chainTimers.push(
        this.gsap!.delayedCall((k - 1) * duration, () => this.settle(next, duration)),
      );
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return; // el foco está en un botón interno (flechas, hongos, cerrar)
    }
    if (!this.carouselReady()) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.go(1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openExpanded();
    }
  }

  expandedCategory(): SkillCategory {
    return this.categories[this.expandedIndex()];
  }

  /** Click sobre una consola: la activa se expande, los peeks navegan. */
  onViewportClick(event: MouseEvent): void {
    if (this.dragMoved || !this.carouselReady()) {
      return;
    }
    const viewportEl = this.viewport()?.nativeElement;
    if (!viewportEl) {
      return;
    }
    const slides = Array.from(viewportEl.querySelectorAll<HTMLElement>('.switch-slide'));
    const target = slides.findIndex((slide) => {
      const r = slide.getBoundingClientRect();
      return (
        event.clientX >= r.left &&
        event.clientX <= r.right &&
        event.clientY >= r.top &&
        event.clientY <= r.bottom
      );
    });
    if (target < 0) {
      return;
    }
    if (target === this.active()) {
      this.openExpanded();
    } else {
      this.goToSlide(target);
    }
  }

  /** La consola activa "sale" del carrusel: crece hasta el centro con un
   *  backdrop semi-opaco detrás. */
  openExpanded(): void {
    if (this.expanded()) {
      return;
    }
    this.expandedIndex.set(this.active());
    this.expanded.set(true);
    document.body.style.overflow = 'hidden';
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeExpanded();
      }
    };
    document.addEventListener('keydown', onEsc);
    this.escHandler = onEsc;

    // Un frame para que Angular pinte el overlay y GSAP pueda partir del
    // rect actual de la consola en el carrusel.
    requestAnimationFrame(() => {
      const gsap = this.gsap;
      const consoleEl = this.expandedConsole()?.nativeElement;
      const overlayEl = this.expandedOverlay()?.nativeElement;
      if (!gsap || !consoleEl || !overlayEl) {
        return;
      }
      const slideRect = this.activeSlideElement()?.getBoundingClientRect();
      const rect = consoleEl.getBoundingClientRect();
      const scale = slideRect ? slideRect.width / rect.width : 0.9;
      const fromX = slideRect
        ? slideRect.left + slideRect.width / 2 - (rect.left + rect.width / 2)
        : 0;
      const fromY = slideRect
        ? slideRect.top + slideRect.height / 2 - (rect.top + rect.height / 2)
        : 0;
      this.expandFrom = { scale, x: fromX, y: fromY };
      gsap.set(consoleEl, { scale, x: fromX, y: fromY, transformOrigin: 'center center' });
      gsap.fromTo(
        overlayEl.querySelector('.skills-expanded-backdrop'),
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      gsap.to(consoleEl, {
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      this.expandedClose()?.nativeElement.focus();
    });
  }

  closeExpanded(): void {
    if (!this.expanded()) {
      return;
    }
    const gsap = this.gsap;
    const consoleEl = this.expandedConsole()?.nativeElement;
    const overlayEl = this.expandedOverlay()?.nativeElement;
    const from = this.expandFrom;
    if (gsap && consoleEl && overlayEl && from) {
      gsap.to(consoleEl, {
        scale: from.scale,
        x: from.x,
        y: from.y,
        duration: 0.4,
        ease: 'power3.in',
        overwrite: 'auto',
        onComplete: () => this.finishClose(),
      });
      gsap.to(overlayEl.querySelector('.skills-expanded-backdrop'), {
        opacity: 0,
        duration: 0.3,
      });
    } else {
      this.finishClose();
    }
  }

  private activeSlideElement(): HTMLElement | null {
    const viewportEl = this.viewport()?.nativeElement;
    if (!viewportEl) {
      return null;
    }
    return viewportEl.querySelectorAll<HTMLElement>('.switch-slide')[this.active()] ?? null;
  }

  private finishClose(): void {
    this.expanded.set(false);
    this.expandFrom = null;
    document.body.style.overflow = '';
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
    this.stage()?.nativeElement.focus();
  }

  private cancelChain(): void {
    for (const timer of this.chainTimers) {
      timer.kill();
    }
    this.chainTimers = [];
  }

  private async initCarousel(): Promise<void> {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // el CSS ya muestra el grid estático
    }
    const stageEl = this.stage()?.nativeElement;
    const viewportEl = this.viewport()?.nativeElement;
    if (!stageEl || !viewportEl) {
      return;
    }
    const gsap = await this.gsapService.get();
    this.gsap = gsap;

    const ctx = gsap.context(() => {
      const slides = gsap.utils.toArray<HTMLElement>('.switch-slide', viewportEl);
      if (slides.length === 0) {
        return;
      }
      const cleanupFns: Array<() => void> = [];
      const on = (target: EventTarget, type: string, fn: EventListenerOrEventListenerObject) => {
        target.addEventListener(type, fn);
        cleanupFns.push(() => target.removeEventListener(type, fn));
      };

      const count = slides.length;
      let slideW = slides[0].offsetWidth;
      const gap =
        parseFloat(getComputedStyle(stageEl).getPropertyValue('--skills-gap')) || 28;
      const step = () => slideW + gap;

      const tweenDist = (slide: HTMLElement, d: number, duration: number) => {
        gsap.to(slide, {
          x: d * step(),
          scale: d === 0 ? 1 : 0.88,
          opacity: d === 0 ? 1 : Math.abs(d) === 1 ? 0.5 : 0,
          duration,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      };

      // Mueve el carrusel hasta que el slide `target` quede centrado.
      const settle = (target: number, duration = 0.55) => {
        const t = wrapIndex(target, count);
        const dir = stepDir(this.active(), t, count);
        this.active.set(t);
        gsap.killTweensOf(slides);
        slides.forEach((slide, i) => {
          const d = slideDist(i, t, count, this.curD[i]);
          const cur = this.curD[i];
          const side = d > 0 ? 1 : d < 0 ? -1 : dir;
          // El slide oculto que debe entrar por el lado contrario se
          // teletransporta (gsap.set) mientras está oculto: invisible.
          if (Math.abs(d) <= 1 && Math.abs(cur) >= 2 && cur * side < 0) {
            gsap.set(slide, { x: side * 2 * step() });
          } else if (Math.abs(cur) >= 2 && Math.abs(d) >= 2 && Math.abs(cur - d) > 1.5) {
            gsap.set(slide, { x: d * step() });
          }
          tweenDist(slide, d, duration);
          this.curD[i] = d;
        });
      };
      this.settle = settle;

      // Estado inicial: activo = 0, vecinos como peek (último a la izquierda),
      // el resto oculto.
      this.curD = slides.map(() => 0);
      slides.forEach((slide, i) => {
        const d = slideDist(i, 0, count, this.curD[i]);
        this.curD[i] = d;
        gsap.set(slide, {
          xPercent: -50,
          x: d * step(),
          scale: d === 0 ? 1 : 0.88,
          opacity: d === 0 ? 1 : Math.abs(d) === 1 ? 0.5 : 0,
        });
      });

      // Drag: touch y mouse (click izquierdo presionado) con snap al soltar.
      const setters = slides.map((s) => gsap.quickSetter(s, 'x', 'px'));
      let dragging = false;
      let startX = 0;
      let dx = 0;

      on(viewportEl, 'pointerdown', (event: Event) => {
        const e = event as PointerEvent;
        if (e.pointerType === 'mouse' && e.button !== 0) {
          return; // solo botón izquierdo
        }
        this.cancelChain();
        dragging = true;
        this.dragMoved = false;
        startX = e.clientX;
        dx = 0;
        viewportEl.classList.add('is-dragging');
        gsap.killTweensOf(slides);
        viewportEl.setPointerCapture(e.pointerId);
      });
      on(viewportEl, 'pointermove', (event: Event) => {
        if (!dragging) {
          return;
        }
        dx = (event as PointerEvent).clientX - startX;
        if (Math.abs(dx) > 5) {
          this.dragMoved = true;
        }
        setters.forEach((set, i) => set(this.curD[i] * step() + dx));
      });
      const endDrag = () => {
        if (!dragging) {
          return;
        }
        dragging = false;
        viewportEl.classList.remove('is-dragging');
        const threshold = step() * 0.22;
        const dir = dx > threshold ? -1 : dx < -threshold ? 1 : 0;
        this.goToSlide(this.active() + dir);
      };
      on(viewportEl, 'pointerup', endDrag);
      on(viewportEl, 'pointercancel', endDrag);

      on(window, 'resize', () => {
        slideW = slides[0].offsetWidth;
        slides.forEach((slide, i) =>
          gsap.set(slide, { x: this.curD[i] * step() }),
        );
      });

      this.cleanup = () => {
        for (const fn of cleanupFns) {
          fn();
        }
      };
      this.carouselReady.set(true);
    }, stageEl);

    this.ctx = ctx;
  }

  ngOnDestroy(): void {
    this.cancelChain();
    this.cleanup?.();
    this.ctx?.revert();
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
