import {
  Component,
  ElementRef,
  afterNextRender,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { GsapService } from '../../services/gsap.service';
import { SectionShell } from '../shared/section-shell/section-shell';
import { Flag } from '../shared/flag/flag';
import { RevealDirective } from '../../directives/reveal.directive';
import { PiranhaPlant, type PiranhaState } from '../../game/sprites/piranha-plant';
import { milestones } from '../../data/experience.data';

/**
 * Tallos 01 (start/01) que se van creando con el scroll detrás de la
 * cabeza, formando una cadena densa a lo largo del recorrido. El tallo
 * 02 (alto) es estático y siempre está a la izquierda.
 *
 * TUNEO MANUAL: el tamaño y la separación de los tallos 01 viven en
 * trajectory.css, dentro de `.course-stem`:
 *   --stem-piece-w: ancho de cada tallo (tamaño de la planta).
 *   --stem-pitch:   separación entre tallos; más chico = más juntos.
 * La CANTIDAD se recalcula sola al render (según el ancho del curso y
 * el pitch) para llenar el recorrido sin separaciones.
 */
const DEFAULT_PIECES: { state: PiranhaState }[] = Array.from({ length: 32 }, () => ({
  state: 'stemShort',
}));

const STEM_LIMITS = { min: 8, max: 80 } as const;

@Component({
  selector: 'app-trajectory',
  standalone: true,
  imports: [SectionShell, Flag, RevealDirective, PiranhaPlant],
  templateUrl: './trajectory.html',
  styleUrl: './trajectory.css',
})
export class Trajectory implements OnDestroy {
  readonly milestones = milestones;
  readonly stemPieces = signal<{ state: PiranhaState }[]>(DEFAULT_PIECES);

  private course = viewChild<ElementRef<HTMLDivElement>>('course');
  private fill = viewChild<ElementRef<HTMLSpanElement>>('fill');
  private stem = viewChild<ElementRef<HTMLDivElement>>('stem');
  private head = viewChild<ElementRef<HTMLDivElement>>('head');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;
  private proximity: IntersectionObserver | null = null;
  /** Pitch (separación) de los tallos 01, leído del CSS. */
  private stemPitch = 0;

  constructor(private gsapService: GsapService) {
    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen IntersectionObserver ni necesitan GSAP.
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      const section = document.getElementById('trajectory');
      const stemEl = this.stem()?.nativeElement;
      const courseEl = this.course()?.nativeElement;
      const headEl = this.head()?.nativeElement;
      if (!section || !stemEl || !courseEl || !headEl) {
        return;
      }
      // Cantidad de tallos 01 según el viaje de la cabeza y el pitch del CSS.
      this.resizeStemPieces(stemEl, courseEl, headEl);
      // GSAP se carga recién cuando Experiencia laboral está cerca del viewport
      // (para entonces el DOM ya tiene la cantidad final de tallos).
      this.proximity = new IntersectionObserver(
        () => {
          this.proximity?.disconnect();
          void this.initCourseScrub();
        },
        { rootMargin: '300px 0px' },
      );
      this.proximity.observe(section);
    });
  }

  /** Recalcula la cantidad de tallos 01: la cadena mide exactamente el
   *  viaje de la cabeza (course - cabeza - margen final - arranque),
   *  así el último tallo aparece justo cuando la cabeza llega a la meta. */
  private resizeStemPieces(stemEl: HTMLElement, courseEl: HTMLElement, headEl: HTMLElement): void {
    const css = getComputedStyle(stemEl);
    const pitch = parseFloat(css.getPropertyValue('--stem-pitch')) || 16;
    if (!(pitch > 0)) {
      return;
    }
    const headStart = headEl.offsetLeft;
    const distance = courseEl.clientWidth - headEl.clientWidth - 24 - headStart;
    if (!(distance > 0)) {
      return;
    }
    this.stemPitch = pitch;
    const count = Math.max(STEM_LIMITS.min, Math.min(STEM_LIMITS.max, Math.floor(distance / pitch)));
    this.stemPieces.set(Array.from({ length: count }, () => ({ state: 'stemShort' })));
  }

  /**
   * El recorrido se dibuja al scrollear: la línea avanza, el tallo 02
   * (estático, izquierda) siempre está con la cabeza a su par, los
   * tallos 01 se van creando de izquierda a derecha detrás de la
   * cabeza, y la cabeza (siempre comiendo, nunca se hunde) avanza hasta
   * la bandera. Solo desktop (mobile: línea vertical).
   */
  private async initCourseScrub(): Promise<void> {
    const courseEl = this.course()?.nativeElement;
    const fillEl = this.fill()?.nativeElement;
    const stemEl = this.stem()?.nativeElement;
    const headEl = this.head()?.nativeElement;
    if (!courseEl || !fillEl || !stemEl || !headEl) {
      return;
    }

    const gsap = await this.gsapService.get();

    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        // La cabeza arranca a la par del tallo 02 (left fijo en CSS) y
        // viaja hasta la bandera; el offset inicial (offsetLeft real de
        // la cabeza) resta ese tramo: si se mueve el left de la cabeza,
        // la distancia al final se recalcula sola.
        const startOffset = headEl.offsetLeft;
        const distance = courseEl.clientWidth - headEl.clientWidth - 24 - startOffset;
        const pieces = gsap.utils.toArray<HTMLElement>('.course-stem-piece', stemEl);
        const pitch = this.stemPitch || 16;

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: courseEl,
            start: 'top 75%',
            end: 'bottom 55%',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        tl.fromTo(fillEl, { scaleX: 0 }, { scaleX: 1 }, 0);

        // La boca viaja hasta la punta del tallo: distancia completa.
        tl.fromTo(headEl, { x: 0 }, { x: distance }, 0);

        // Cada tallo 01 aparece justo cuando la cabeza lo alcanza
        // (posición = i * pitch / distance): la cabeza va siempre a la
        // par de la punta y el último tallo aparece con la meta.
        pieces.forEach((piece, i) => {
          const pos = (i * pitch) / distance;
          tl.fromTo(
            piece,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: pitch / distance },
            pos,
          );
        });
      });
    });

    const onLoad = () => this.gsapService.refresh();
    window.addEventListener('load', onLoad);
    this.cleanup = () => {
      window.removeEventListener('load', onLoad);
      this.ctx?.revert();
    };
  }

  ngOnDestroy(): void {
    this.proximity?.disconnect();
    this.cleanup?.();
  }
}