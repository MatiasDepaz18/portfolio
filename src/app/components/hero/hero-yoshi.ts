import { Component, ElementRef, afterNextRender, viewChild, type OnDestroy } from '@angular/core';
import { GsapService } from '../../services/gsap.service';
import { YoshiCharacter } from '../../game/sprites/yoshi-character';
import { HeroTongue, TONGUE_SEGMENT_WIDTH_PX } from './hero-tongue';

/**
 * Escena de Yoshi en el hero (se ejecuta UNA vez, al cargar):
 *
 *   1. El hero-grid está oculto a la derecha (clase hero-scene-hidden
 *      en el Hero: translateX(100vw) + opacity 0, solo en cliente
 *      no-reduced-motion).
 *   2. Yoshi (tongue/01 fijo) aparece con fade+slide en el medio-
 *      izquierdo del hero.
 *   3. Sacó la lengua: los segmentos de tongueStyles se despliegan en
 *      cascada (scaleX 0 -> 1, origin left) desde la boca hasta el
 *      borde derecho del hero.
 *   4. SUCCIÓN: el hero-grid vuelve desde la derecha (ease expo.in,
 *      acelera al final = absorbido) mientras la lengua se contrae en
 *      cascada inversa (punta -> boca, power3.in = "comiéndolo").
 *   5. Yoshi se desvanece; el contenido queda en su lugar normal.
 *
 * El cuerpo de Yoshi es SIEMPRE tongueIdle (tongue/01); la lengua es un
 * sprite compuesto aparte (HeroTongue).
 */
@Component({
  selector: 'app-hero-yoshi',
  standalone: true,
  imports: [YoshiCharacter, HeroTongue],
  template: `
    <div class="hero-yoshi" aria-hidden="true">
      <div class="hero-yoshi-stage" #yoshiStage>
        <app-yoshi-character state="tongueIdle" />
      </div>
      <div class="hero-yoshi-tongue" #tongueWrap>
        <app-hero-tongue #tongue />
      </div>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
    }

    .hero-yoshi {
      position: absolute;
      left: 10%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 8.5rem;
    }

    .hero-yoshi-stage {
      position: relative;
      width: 100%;
    }

    /* La lengua sale de la boca (tongue/01 tiene la boca a la derecha) */
    .hero-yoshi-tongue {
      position: absolute;
      left: 68%;
      top: 62%;
      transform: translateY(-50%);
    }

    @media (max-width: 767px) {
      .hero-yoshi {
        left: 16%;
        width: 6.5rem;
      }

      .hero-yoshi-tongue {
        left: 80%;
      }
    }
  `,
})
export class HeroYoshi implements OnDestroy {
  private tongue = viewChild(HeroTongue);
  private tongueWrap = viewChild<ElementRef<HTMLDivElement>>('tongueWrap');
  private stage = viewChild<ElementRef<HTMLDivElement>>('yoshiStage');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;

  constructor(private gsapService: GsapService) {
    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen matchMedia ni necesitan GSAP.
      if (typeof window.matchMedia !== 'function') {
        return;
      }
      void this.initScene();
    });
  }

  private async initScene(): Promise<void> {
    const stageEl = this.stage()?.nativeElement;
    const tongueWrapEl = this.tongueWrap()?.nativeElement;
    const tongue = this.tongue();
    if (!stageEl || !tongueWrapEl || !tongue) {
      return;
    }

    const gsap = await this.gsapService.get();

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const heroGrid = document.querySelector<HTMLElement>('.hero-grid');
        if (!heroGrid) {
          return;
        }
        // La lengua cruza todo el hero (el exceso se corta en overflow hidden).
        tongue.build(Math.ceil(window.innerWidth / TONGUE_SEGMENT_WIDTH_PX) + 1);
        void this.runScene(gsap, heroGrid, stageEl, tongueWrapEl);
      });
    });

    this.ctx = ctx;

    const onLoad = () => this.gsapService.refresh();
    window.addEventListener('load', onLoad);
    this.cleanup = () => {
      window.removeEventListener('load', onLoad);
      this.ctx?.revert();
    };
  }

  private async runScene(
    gsap: typeof import('gsap').gsap,
    heroGrid: HTMLElement,
    stageEl: HTMLDivElement,
    tongueWrapEl: HTMLDivElement,
  ): Promise<void> {
    // Espera dos frames: los segmentos se renderizan tras build().
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const segments = gsap.utils.toArray<HTMLElement>('.hero-tongue-segment');
    if (segments.length === 0) {
      return;
    }

    gsap.set(stageEl, { x: -160, opacity: 0 });
    gsap.set(tongueWrapEl, { opacity: 0 });
    gsap.set(segments, { scaleX: 0, transformOrigin: 'left center' });
    // El hero-grid ya está oculto por la clase hero-scene-hidden (CSS).
    gsap.set(heroGrid, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, delay: 0.55 });

    tl.to(stageEl, { x: 0, opacity: 1, duration: 0.45 })
      .to(tongueWrapEl, { opacity: 1, duration: 0.15 }, '<0.3')
      // Despliegue: la lengua se estira segmento a segmento hacia la derecha.
      .to(segments, { scaleX: 1, duration: 0.3, stagger: 0.025, ease: 'power2.out' }, '>-0.05')
      // Pausa: la lengua llegó al borde derecho del hero.
      .to({}, { duration: 0.4 })
      // SUCCIÓN: el grid vuelve desde la derecha mientras la lengua se
      // contrae y DESVANECE desde la punta hacia la boca ("comiéndolo").
      .to(heroGrid, { x: 0, opacity: 1, duration: 0.95, ease: 'expo.in' }, '>-0.05')
      .to(
        segments,
        {
          scaleX: 0,
          opacity: 0,
          duration: 0.6,
          stagger: { each: 0.01, from: 'end' },
          ease: 'power3.in',
        },
        '<0.15',
      )
      .to(stageEl, { opacity: 0, duration: 0.35, ease: 'power2.in' }, '>-0.25');
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
