import { Component, input } from '@angular/core';

type ButtonVariant = 'primary' | 'ghost' | 'gold';

/**
 * Botón de juego con física de presión.
 * Se renderiza como <a> si `href` existe, si no como <button>.
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
        class="game-btn pixel-corners game-btn-{{ variant() }}"
      >
        <ng-content />
      </a>
    } @else {
      <button
        [attr.type]="type()"
        [disabled]="disabled()"
        class="game-btn pixel-corners game-btn-{{ variant() }}"
      >
        <ng-content />
      </button>
    }
  `,
  styles: `
    .game-btn {
      --p: 5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.7rem 1.4rem;
      font-family: var(--font-display);
      font-size: 0.925rem;
      font-weight: 650;
      letter-spacing: 0.01em;
      border: 1px solid transparent;
      cursor: pointer;
      text-decoration: none;
      transition:
        transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
      user-select: none;
      white-space: nowrap;
    }
    .game-btn:active {
      transform: translateY(2px) scale(0.98);
    }
    .game-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .game-btn-primary {
      background: var(--accent);
      color: var(--accent-ink);
      box-shadow:
        inset 0 -2px 0 rgb(0 0 0 / 0.22),
        0 1px 0 color-mix(in srgb, var(--accent) 30%, transparent);
    }
    .game-btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow:
        inset 0 -2px 0 rgb(0 0 0 / 0.22),
        0 6px 18px color-mix(in srgb, var(--accent) 28%, transparent);
    }

    .game-btn-ghost {
      background: transparent;
      border-color: var(--line-strong);
      color: var(--ink-soft);
    }
    .game-btn-ghost:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: var(--accent);
      color: var(--accent);
    }

    .game-btn-gold {
      background: var(--gold);
      color: #16130a;
      font-weight: 750;
      box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.2);
    }
    .game-btn-gold:hover:not(:disabled) {
      transform: translateY(-2px);
    }
  `,
})
export class GameButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly href = input<string | null | undefined>(null);
  readonly external = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
}
