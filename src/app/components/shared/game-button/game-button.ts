import { Component, input } from '@angular/core';

/**
 * Botón de juego con contorno, esquinas punteadas y relleno por barrido.
 * Se renderiza como <a> si `href` existe, si no como <button>.
 *
 * Interacción:
 * - Contorno y puntos en las 4 esquinas con el color del tema (--ink).
 * - Hover: el fondo se rellena de amarillo de derecha a izquierda;
 *   el texto se invierte a tinta oscura.
 * - Mouse out: el relleno retrocede de izquierda a derecha desde el
 *   punto en el que quedó.
 */
@Component({
  selector: 'app-game-button',
  standalone: true,
  template: `
    @if (href()) {
      <a
        [attr.href]="href()"
        [attr.target]="external() ? '_blank' : null"
        [attr.rel]="external() ? 'noopener noreferrer' : null"
        class="game-btn pixel-corners"
      >
        <ng-content />
      </a>
    } @else {
      <button
        [attr.type]="type()"
        [disabled]="disabled()"
        class="game-btn pixel-corners"
      >
        <ng-content />
      </button>
    }
  `,
  styles: `
    .game-btn {
      --p: 5px;
      --btn-fill: #ffd11a;
      --btn-fill-ink: #16130a;
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.75rem;
      background-color: transparent;
      border: 2px solid var(--ink);
      color: var(--ink);
      font-family: var(--font-display);
      font-size: 0.925rem;
      font-weight: 650;
      letter-spacing: 0.02em;
      cursor: pointer;
      text-decoration: none;
      user-select: none;
      white-space: nowrap;
      transition: color 0.12s ease 0.08s;
      /* Puntos de las 4 esquinas: color del tema (blanco en oscuro,
         oscuro en claro) */
      background-image:
        radial-gradient(circle, var(--ink) 2.5px, transparent 3.5px),
        radial-gradient(circle, var(--ink) 2.5px, transparent 3.5px),
        radial-gradient(circle, var(--ink) 2.5px, transparent 3.5px),
        radial-gradient(circle, var(--ink) 2.5px, transparent 3.5px);
      background-size: 14px 14px;
      background-repeat: no-repeat;
      background-position:
        0 0,
        100% 0,
        0 100%,
        100% 100%;
    }

    /* Relleno por barrido. Anclado a la derecha: al entrar crece de
       derecha a izquierda; al salir retrocede de izquierda a derecha. */
    .game-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--btn-fill);
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: -1;
      pointer-events: none;
    }

    /* Táctil: no hay hover. El relleno se dispara con :active mientras
       el dedo presiona y retrocede al soltar. El bloque (hover: hover)
       evita que el hover "pegajoso" del tap deje el botón relleno. */
    .game-btn:active:not(:disabled)::before {
      transform: scaleX(1);
    }

    .game-btn:active:not(:disabled) {
      color: var(--btn-fill-ink);
      transition: color 0.1s ease;
    }

    /* Mouse: el relleno barre de derecha a izquierda al entrar y el
       texto se invierte cuando el relleno ya lo cubre. Al salir,
       retrocede de izquierda a derecha y el texto vuelve. */
    @media (hover: hover) and (pointer: fine) {
      .game-btn:hover:not(:disabled)::before,
      .game-btn:focus-visible:not(:disabled)::before {
        transform: scaleX(1);
      }

      .game-btn:hover:not(:disabled),
      .game-btn:focus-visible:not(:disabled) {
        color: var(--btn-fill-ink);
        transition: color 0.12s ease 0.2s;
      }
    }

    .game-btn:active:not(:disabled) {
      transform: translateY(1px);
    }

    .game-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .game-btn {
        transition: none;
      }

      .game-btn::before {
        transition: none;
      }
    }
  `,
})
export class GameButton {
  readonly href = input<string | null | undefined>(null);
  readonly external = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
}