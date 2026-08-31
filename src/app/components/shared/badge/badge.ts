import { Component, input } from '@angular/core';

type BadgeVariant = 'accent' | 'ink' | 'gold';

/** Etiqueta pixel pequeña (solo para labels retro cortos). */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge pixel-corners badge-{{ variant() }}"><ng-content /></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.55rem;
      font-family: var(--font-pixel);
      font-size: 9px;
      letter-spacing: 0.08em;
      line-height: 1.4;
      white-space: nowrap;
      --p: 4px;
    }
    .badge-accent {
      background: var(--accent-soft);
      color: var(--accent);
      border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    }
    .badge-ink {
      background: var(--bg-elevated);
      color: var(--ink-soft);
      border: 1px solid var(--line-strong);
    }
    .badge-gold {
      background: var(--gold-soft);
      color: var(--gold);
      border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
    }
  `,
})
export class Badge {
  readonly variant = input<BadgeVariant>('accent');
}
