import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  input,
  model,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import type { SpriteAnimation, SpriteSheet } from './types';
import { frameGeometry, stageBoxOf } from './sprite-geometry';

/**
 * Motor de sprites reutilizable para PNG individuales.
 * Un único elemento visual (background-image) cuyo src cambia según el
 * frame activo; los frames se precargan para evitar parpadeos.
 *
 * Responsabilidades separadas:
 *   - El componente SOLO reproduce frames (sprite system).
 *   - GSAP anima #host (x/y/scale/opacity/rotation) por fuera (movement).
 *
 * #host queda expuesto como target de GSAP. El input `scale` se aplica
 * con la propiedad CSS `scale` sobre el frame (independiente de los
 * transform de GSAP) y crece desde el baseline bottom-center.
 */
@Component({
  selector: 'app-sprite-character',
  standalone: true,
  template: `
    @if (currentFrame(); as fr) {
      <div #host class="sprite-character" [style.aspect-ratio]="boxRatio()" aria-hidden="true">
        <div
          class="sprite-frame"
          [class.sprite-frame--bottom-left]="anchor() === 'bottom-left'"
          [class.sprite-frame--top-left]="anchor() === 'top-left'"
          [style.background-image]="'url(' + fr.src + ')'"
          [style.--fw]="geometry().fw"
          [style.--fh]="geometry().fh"
          [style.--s]="scale()"
        ></div>
      </div>
    }
  `,
  styles: `
    .sprite-character {
      position: relative;
      width: 100%;
    }

    .sprite-frame {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      transform-origin: 50% 100%;
      scale: var(--s);
      width: calc(100% * var(--fw));
      height: calc(100% * var(--fh));
      background-repeat: no-repeat;
      background-size: 100% 100%;
      image-rendering: pixelated;
      pointer-events: none;
    }

    .sprite-frame--bottom-left {
      left: 0;
      transform: none;
    }

    .sprite-frame--top-left {
      left: 0;
      top: 0;
      bottom: auto;
      transform: none;
      transform-origin: 50% 0%;
    }
  `,
})
export class SpriteCharacter implements OnDestroy {
  /** Definición del sheet (PNG individuales + animaciones). */
  readonly sheet = input.required<SpriteSheet>();
  /** Nombre de la animación a reproducir (writable: setState para cambio imperativo). */
  readonly state = model<string | undefined>(undefined);
  /** Escala CSS del sprite (independiente de los transform de GSAP). */
  readonly scale = input(1);

  /** Host del personaje: target de GSAP para el movimiento. */
  readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  /** Cambia la animación de forma imperativa (desde GSAP). */
  setState(name: string): void {
    this.state.set(name);
  }

  private readonly current = signal<{ anim: string; idx: number }>({ anim: 'idle', idx: 0 });
  private animRef: SpriteAnimation | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private reduced = false;
  private mediaQuery: MediaQueryList | null = null;
  private onMediaChange: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    effect(() => {
      const sheet = this.sheet();
      const name = this.state() ?? sheet.defaultAnimation;
      const anim = sheet.animations[name] ?? sheet.animations[sheet.defaultAnimation];
      this.animRef = anim;
      this.current.set({ anim: name, idx: 0 });
      this.restartTimer(anim);
    });
    afterNextRender(() => {
      this.preloadFrames();
      if (typeof window.matchMedia === 'function') {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.mediaQuery = mq;
        const apply = (reduce: boolean): void => {
          this.reduced = reduce;
          if (reduce) {
            this.stopTimer();
          } else if (this.animRef) {
            this.restartTimer(this.animRef);
          }
        };
        apply(mq.matches);
        this.onMediaChange = (e) => apply(e.matches);
        mq.addEventListener('change', this.onMediaChange);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.mediaQuery && this.onMediaChange) {
      this.mediaQuery.removeEventListener('change', this.onMediaChange);
    }
    this.mediaQuery = null;
    this.onMediaChange = null;
  }

  private readonly animDef = computed(() => {
    const sheet = this.sheet();
    const { anim } = this.current();
    return sheet.animations[anim] ?? sheet.animations[sheet.defaultAnimation];
  });

  readonly currentFrame = computed(() => {
    return this.animDef().frames[this.current().idx] ?? this.animDef().frames[0];
  });

  readonly box = computed(() => stageBoxOf(this.sheet(), this.animDef()));

  readonly geometry = computed(() => frameGeometry(this.currentFrame(), this.box()));

  readonly boxRatio = computed(() => `${this.box().width} / ${this.box().height}`);

  readonly anchor = computed(() => this.animDef().anchor ?? 'bottom-center');

  /** Precarga todos los frames del sheet (cache del navegador, sin parpadeos). */
  private preloadFrames(): void {
    const sheet = this.sheet();
    for (const anim of Object.values(sheet.animations)) {
      for (const frame of anim.frames) {
        const img = new Image();
        img.src = frame.src;
      }
    }
  }

  private restartTimer(anim: SpriteAnimation): void {
    this.stopTimer();
    if (this.reduced || anim.frames.length < 2) {
      return;
    }
    this.timer = setInterval(() => {
      const { anim: name, idx } = this.current();
      const next = (idx + 1) % anim.frames.length;
      this.current.set({ anim: name, idx: next });
    }, 1000 / anim.fps);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
