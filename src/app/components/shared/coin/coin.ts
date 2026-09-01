import { Component, input } from '@angular/core';

/**
 * Moneda real (sprite) con label. Semántica: recompensa/metadata.
 * Levita en todo momento (CSS) y reacciona al hover levantándose un
 * poco. NO gira.
 */
@Component({
  selector: 'app-coin',
  standalone: true,
  template: `
    <div class="coin-wrap">
      <div class="coin-float" role="img" [attr.aria-label]="'Moneda: ' + label()">
        <div class="coin-sprite"></div>
      </div>
      <span class="coin-label">{{ label() }}</span>
    </div>
  `,
  styles: `
    .coin-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    /* Wrapper: levitación continua (transform propio, no pelea con el hover) */
    .coin-float {
      width: 2.75rem;
      animation: coin-float 2.2s ease-in-out infinite;
    }

    .coin-sprite {
      width: 100%;
      aspect-ratio: 920 / 966;
      background-image: url('/assets/game/coins/coin-clean.png');
      background-repeat: no-repeat;
      background-size: 100% 100%;
      image-rendering: pixelated;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      will-change: transform;
    }

    /* Reacción: se levanta un poco cuando el mouse pasa por encima */
    .coin-wrap:hover .coin-sprite {
      transform: translateY(-0.6rem);
    }

    @keyframes coin-float {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-0.35rem);
      }
    }

    .coin-label {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ink-dim);
      text-align: center;
      line-height: 1.5;
    }

    @media (prefers-reduced-motion: reduce) {
      .coin-float {
        animation: none;
      }

      .coin-wrap:hover .coin-sprite {
        transform: none;
      }
    }
  `,
})
export class Coin {
  readonly label = input('');
}
