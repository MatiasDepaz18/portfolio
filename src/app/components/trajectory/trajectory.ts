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
import { RevealDirective } from '../../directives/reveal.directive';
import { PiranhaPlant, type PiranhaState } from '../../game/sprites/piranha-plant';
import { milestones } from '../../data/experience.data';

/**
 * Tallos 01 (start/01) que se van creando con el scroll, formando una
 * cadena densa de izquierda a derecha a lo largo del recorrido.
 *
 * TUNEO MANUAL: el tamaño y la separación de los tallos 01 viven en
 * trajectory.css, dentro de `.course-stem`:
 *   --stem-piece-w: ancho de cada tallo (tamaño de la planta).
 *   --stem-pitch:   separación entre tallos; más chico = más juntos.
 *   --stem-reveal-lead / --stem-reveal-dur: ritmo de aparición.
 * La CANTIDAD se recalcula sola al render (según el ancho del curso y
 * el pitch) para llenar el recorrido.
 */
const DEFAULT_PIECES: { state: PiranhaState }[] = Array.from({ length: 32 }, () => ({
  state: 'stemShort',
}));

const STEM_LIMITS = { min: 8, max: 80 } as const;

@Component({
  selector: 'app-trajectory',
  standalone: true,
  imports: [SectionShell, RevealDirective, PiranhaPlant],
  templateUrl: './trajectory.html',
  styleUrl: './trajectory.css',
})
export class Trajectory implements OnDestroy {
  readonly milestones = milestones;
  readonly stemPieces = signal<{ state: PiranhaState }[]>(DEFAULT_PIECES);

  private course = viewChild<ElementRef<HTMLDivElement>>('course');
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
      if (!section || !stemEl || !courseEl) {
        return;
      }
      // Cantidad de tallos 01 según el ancho del curso y el pitch del CSS.
      this.resizeStemPieces(stemEl, courseEl);
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

  /** Recalcula la cantidad de tallos 01 para llenar el recorrido
   *  (deja 24px libres al final, junto a la bandera). */
  private resizeStemPieces(stemEl: HTMLElement, courseEl: HTMLElement): void {
    const css = getComputedStyle(stemEl);
    const pitch = parseFloat(css.getPropertyValue('--stem-pitch')) || 16;
    if (!(pitch > 0)) {
      return;
    }
    this.stemPitch = pitch;
    const available = courseEl.clientWidth - 24;
    if (!(available > 0)) {
      return;
    }
    const count = Math.max(STEM_LIMITS.min, Math.min(STEM_LIMITS.max, Math.floor(available / pitch)));
    this.stemPieces.set(Array.from({ length: count }, () => ({ state: 'stemShort' })));
  }

  /**
   * El recorrido se dibuja al scrollear: la línea avanza y los tallos
   * 01 se van creando de izquierda a derecha, cada uno aparece cuando
   * la ola de revelado lo alcanza. Solo desktop (mobile: línea vertical).
   */
  private async initCourseScrub(): Promise<void> {
    const courseEl = this.course()?.nativeElement;
    const stemEl = this.stem()?.nativeElement;
    const headEl = this.head()?.nativeElement;
    if (!courseEl || !stemEl || !headEl) {
      return;
    }

    const gsap = await this.gsapService.get();

    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const pieces = gsap.utils.toArray<HTMLElement>('.course-stem-piece', stemEl);
        const pitch = this.stemPitch || 16;
        const chainLen = Math.max(1, pieces.length * pitch);

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

        const stemCss = getComputedStyle(stemEl);
        const lead = parseFloat(stemCss.getPropertyValue('--stem-reveal-lead')) || 8;
        const durPx = parseFloat(stemCss.getPropertyValue('--stem-reveal-dur')) || 4;

        // La boca (mouth/01 <-> mouth/02) se posa sobre el último tallo
        // VISIBLE: avanza de tallo en tallo y llega a cada pieza cuando
        // esta ya quedó formada (fin del reveal). Así nunca queda sobre
        // un tallo que todavía no apareció.
        const endPos = (k: number) => Math.max(0, (k * pitch - lead + durPx) / chainLen);
        pieces.forEach((piece, i) => {
          if (i === 0) {
            return; // la boca arranca sobre el primer tallo (left 0)
          }
          const from = endPos(i - 1);
          const to = endPos(i);
          tl.to(headEl, { x: i * pitch, duration: Math.max(to - from, 0.0001) }, from);
        });

        // Cada tallo 01 aparece de a poco: empieza `lead` px antes de
        // que la ola lo alcance y queda formado tras `durPx` px.
        pieces.forEach((piece, i) => {
          const pos = Math.max(0, (i * pitch - lead) / chainLen);
          tl.fromTo(
            piece,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: durPx / chainLen },
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