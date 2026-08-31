import { Component, signal } from '@angular/core';

export interface TongueSegment {
  src: string;
  ratio: string;
}

/** Ancho de cada segmento de lengua en px (debe coincidir con el CSS `width` en rem). */
export const TONGUE_SEGMENT_WIDTH_PX = 33; // 2rem

/**
 * Genera la lengua compuesta del hero: todos los segmentos son
 * tongueStyles/02 (el cuerpo de la lengua) y el último es
 * tongueStyles/05 (la punta). Cada segmento es un PNG individual
 * renderizado con background-image.
 */
export function generateTongueSegments(count: number): TongueSegment[] {
  const out: TongueSegment[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ src: 'assets/game/yoshi/tongueStyles/02.png', ratio: '16 / 3' });
  }
  if (out.length > 0) {
    out[out.length - 1] = {
      src: 'assets/game/yoshi/tongueStyles/05.png',
      ratio: '8 / 7',
    };
  }
  return out;
}

/**
 * Lengua de Yoshi compuesta por segmentos en fila (crece hacia la
 * derecha). Solo expone los PNG; el despliegue/contracción lo anima
 * GSAP desde la escena del hero (scaleX con origin left).
 */
@Component({
  selector: 'app-hero-tongue',
  standalone: true,
  template: `
    <div class="hero-tongue" aria-hidden="true">
      @for (seg of segments(); track $index) {
        <div
          class="hero-tongue-segment"
          [style.background-image]="'url(' + seg.src + ')'"
          [style.aspect-ratio]="seg.ratio"
        ></div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .hero-tongue {
      display: flex;
    }

    .hero-tongue-segment {
      flex-shrink: 0;
      width: 2rem;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      image-rendering: pixelated;
      transform-origin: left center;
    }
  `,
})
export class HeroTongue {
  readonly segments = signal<TongueSegment[]>([]);

  /** Genera la cantidad de segmentos necesaria (se llama desde la escena). */
  build(count: number): void {
    this.segments.set(generateTongueSegments(count));
  }
}
