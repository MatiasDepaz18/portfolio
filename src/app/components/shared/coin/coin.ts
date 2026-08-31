import { Component, input } from '@angular/core';

/** Moneda dorada con etiqueta. Semántica: recompensa/metadata. */
@Component({
  selector: 'app-coin',
  standalone: true,
  template: `
    <div class="coin-wrap">
      <div class="coin" role="img" [attr.aria-label]="'Moneda: ' + label()">
        <div class="coin-face">
          <span class="coin-dot"></span>
        </div>
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
    .coin {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 9999px;
      background: radial-gradient(
        circle at 32% 28%,
        #f3d98a 0%,
        var(--gold) 42%,
        color-mix(in srgb, var(--gold) 72%, #000 28%) 100%
      );
      border: 2px solid color-mix(in srgb, var(--gold) 60%, transparent);
      box-shadow:
        inset 0 -2px 0 rgb(0 0 0 / 0.25),
        inset 0 2px 2px rgb(255 255 255 / 0.35),
        0 2px 0 color-mix(in srgb, var(--gold) 35%, transparent);
      display: grid;
      place-items: center;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-style: preserve-3d;
    }
    .coin:hover,
    .coin:focus-visible {
      transform: rotateY(360deg);
    }
    .coin-face {
      width: 1.15rem;
      height: 1.15rem;
      border-radius: 9999px;
      border: 2px dashed color-mix(in srgb, var(--gold) 55%, transparent);
      display: grid;
      place-items: center;
    }
    .coin-dot {
      width: 5px;
      height: 5px;
      border-radius: 9999px;
      background: color-mix(in srgb, var(--gold) 70%, #000 30%);
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
  `,
})
export class Coin {
  readonly label = input('');
}
