import {
  Component,
  ElementRef,
  afterNextRender,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { GsapService } from '../../services/gsap.service';
import { SectionShell } from '../shared/section-shell/section-shell';
import { RevealDirective } from '../../directives/reveal.directive';
import { skillCategories } from '../../data/skills.data';

const LOGO_COLOR = '9aa694';

/** Sprite de la consola (pantalla transparente, generado por clean-assets). */
const SWITCH_SPRITE = 'assets/game/switch/switch-body.png';

/** Limita un índice de slide al rango válido [0, last]. */
export function clampIndex(index: number, last: number): number {
  return Math.max(0, Math.min(last, index));
}

/**
 * Desplazamiento x de un slide para que quede centrado cuando
 * slide == active. Los slides viven en left: 50% + xPercent: -50, así
 * que x = 0 ya los centra: la posición del slide i es la distancia al
 * activo por el step (ancho + gap), más el arrastre en curso.
 */
export function slideX(
  index: number,
  activeIndex: number,
  step: number,
  dragDx = 0,
): number {
  return (index - activeIndex) * step + dragDx;
}

/**
 * Carrusel de Habilidades: una consola Switch por categoría (4 slides).
 * GSAP mueve cada slide en x con peeks laterales escalados; en touch se
 * arrastra, en desktop se usan flechas/dots/teclado. Con
 * prefers-reduced-motion el CSS muestra un grid estático y GSAP no corre
 * (SSR-safe: todo inicia en afterNextRender).
 */
@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionShell, RevealDirective, NgIcon],
  templateUrl: './skills.html',
  styleUrl: './skills.css',
})
export class Skills implements OnDestroy {
  readonly categories = skillCategories;
  readonly active = signal(0);
  readonly carouselReady = signal(false);

  private stage = viewChild<ElementRef<HTMLElement>>('stage');
  private viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;
  private goTo: (target: number) => void = () => {};

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

  logoUrl(slug: string): string {
    return `https://cdn.simpleicons.org/${slug}/${this.logoColor}`;
  }

  go(dir: number): void {
    this.goTo(clampIndex(this.active() + dir, this.categories.length - 1));
  }

  goToSlide(index: number): void {
    this.goTo(clampIndex(index, this.categories.length - 1));
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.carouselReady()) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.go(1);
    }
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

      let slideW = slides[0].offsetWidth;
      const gap =
        parseFloat(getComputedStyle(stageEl).getPropertyValue('--skills-gap')) || 28;
      const step = () => slideW + gap;

      const settle = (target: number) => {
        const t = clampIndex(target, slides.length - 1);
        this.active.set(t);
        gsap.killTweensOf(slides);
        slides.forEach((slide, i) => {
          const dist = i - t;
          gsap.to(slide, {
            x: slideX(i, t, step()),
            scale: dist === 0 ? 1 : 0.88,
            opacity: dist === 0 ? 1 : Math.abs(dist) === 1 ? 0.5 : 0,
            duration: 0.55,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        });
      };
      this.goTo = settle;

      // Estado inicial: activo = 0, vecinos como peek, el resto oculto.
      slides.forEach((slide, i) => {
        const dist = i;
        gsap.set(slide, {
          xPercent: -50,
          x: slideX(i, 0, step()),
          scale: dist === 0 ? 1 : 0.88,
          opacity: dist === 0 ? 1 : dist === 1 ? 0.5 : 0,
        });
      });

      // Drag en touch: quickSetter de x + snap al soltar.
      const setters = slides.map((s) => gsap.quickSetter(s, 'x', 'px'));
      let dragging = false;
      let startX = 0;
      let dx = 0;

      on(viewportEl, 'pointerdown', (event: Event) => {
        const e = event as PointerEvent;
        if (e.pointerType !== 'touch') {
          return;
        }
        dragging = true;
        startX = e.clientX;
        dx = 0;
        gsap.killTweensOf(slides);
        viewportEl.setPointerCapture(e.pointerId);
      });
      on(viewportEl, 'pointermove', (event: Event) => {
        if (!dragging) {
          return;
        }
        dx = (event as PointerEvent).clientX - startX;
        const target = this.active();
        setters.forEach((set, i) => set(slideX(i, target, step(), dx)));
      });
      const endDrag = () => {
        if (!dragging) {
          return;
        }
        dragging = false;
        const threshold = step() * 0.22;
        const dir = dx > threshold ? -1 : dx < -threshold ? 1 : 0;
        settle(this.active() + dir);
      };
      on(viewportEl, 'pointerup', endDrag);
      on(viewportEl, 'pointercancel', endDrag);

      on(window, 'resize', () => {
        slideW = slides[0].offsetWidth;
        slides.forEach((slide, i) =>
          gsap.set(slide, { x: slideX(i, this.active(), step()) }),
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
    this.cleanup?.();
    this.ctx?.revert();
  }
}
