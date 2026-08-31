import { Component, input } from '@angular/core';

/** Bandera de meta. Marca geométrica simple del cierre del nivel. */
@Component({
  selector: 'app-flag',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 64 88"
      fill="none"
      role="img"
      aria-label="Bandera de meta"
    >
      <path
        d="M30 4 C24 16 28 34 26 44 C24 54 30 68 29 80 L35 80 C36 66 32 52 34 42 C36 30 32 16 36 4 Z"
        fill="var(--line-strong)"
      />
      <path d="M36 8 L60 18 L36 34 Z" fill="var(--accent)" />
      <path
        d="M36 8 L60 18 L36 34 Z"
        fill="var(--bg-base)"
        opacity="0.14"
        transform="translate(3 2)"
      />
      <circle cx="32" cy="84" r="4.5" fill="var(--ink-dim)" />
    </svg>
  `,
})
export class Flag {
  readonly size = input(56);
}
