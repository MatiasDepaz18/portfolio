import { Component, viewChild, type ElementRef } from '@angular/core';

/**
 * Tili, el dragón del portfolio.
 * Personaje 100% original (inspirado en el arquetipo "dragón verde
 * de plataformas", sin copiar ninguna IP). Es decorativo: aria-hidden.
 * Expone #tili (cuerpo) y #tongue (lengua) para que About anime con GSAP.
 */
@Component({
  selector: 'app-character',
  standalone: true,
  template: `
    <svg class="tili" viewBox="0 0 140 120" aria-hidden="true" focusable="false">
      <g #tili>
        <!-- cola -->
        <path
          d="M18 82 C6 74 4 58 12 52 C21 47 24 56 18 64 C25 58 35 61 38 71 C40 76 36 80 30 80 Z"
          fill="#47591a"
        />
        <!-- pies -->
        <ellipse cx="50" cy="112" rx="13" ry="7" fill="#47591a" />
        <ellipse cx="92" cy="112" rx="13" ry="7" fill="#47591a" />
        <!-- cuerpo -->
        <ellipse cx="70" cy="92" rx="48" ry="24" fill="#6e8c1e" />
        <!-- panza -->
        <ellipse cx="64" cy="98" rx="28" ry="13" fill="#e9eee3" />
        <!-- cabeza -->
        <circle cx="78" cy="52" r="34" fill="#6e8c1e" />
        <!-- hocico -->
        <ellipse cx="112" cy="58" rx="21" ry="14" fill="#6e8c1e" />
        <!-- fosas nasales -->
        <circle cx="124" cy="54" r="2.6" fill="#47591a" />
        <circle cx="118" cy="60" r="2.2" fill="#47591a" />
        <!-- mejilla -->
        <circle cx="54" cy="62" r="6" fill="#d65a4a" opacity="0.5" />
        <!-- cuernos -->
        <path d="M58 24 L52 8 L70 18 Z" fill="#47591a" />
        <path d="M102 20 L110 6 L116 21 Z" fill="#47591a" />
        <!-- ojos -->
        <circle cx="64" cy="42" r="10" fill="#e9eee3" />
        <circle cx="92" cy="42" r="10" fill="#e9eee3" />
        <circle cx="66" cy="43" r="4.4" fill="#10140e" />
        <circle cx="94" cy="43" r="4.4" fill="#10140e" />
        <circle cx="67.5" cy="41" r="1.5" fill="#e9eee3" />
        <circle cx="95.5" cy="41" r="1.5" fill="#e9eee3" />
        <!-- brazo -->
        <ellipse cx="106" cy="96" rx="9" ry="6" fill="#47591a" transform="rotate(-12 106 96)" />
        <!-- boca -->
        <path
          d="M106 63 C112 69 108 74 98 73"
          stroke="#47591a"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
        />
        <!-- lengua: grupo animable por GSAP -->
        <g #tongue>
          <path
            d="M104 64 C122 62 138 66 146 71 C150 73 148 78 142 77 C134 76 124 72 110 72 C106 72 104 70 103 67 Z"
            fill="#e06c5b"
          />
          <path
            d="M108 68 C124 66 138 70 144 73"
            stroke="#c9503e"
            stroke-width="2"
            stroke-linecap="round"
            fill="none"
          />
        </g>
      </g>
    </svg>
  `,
  styles: `
    .tili {
      display: block;
      width: 100%;
      height: auto;
    }
  `,
})
export class Character {
  /** Grupo raíz del personaje (cuerpo completo). */
  readonly body = viewChild.required<ElementRef<SVGGElement>>('tili');
  /** Grupo de la lengua (se escala desde la boca). */
  readonly tongue = viewChild.required<ElementRef<SVGGElement>>('tongue');
}
