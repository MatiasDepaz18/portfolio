import { Component, input } from '@angular/core';

/**
 * Contenedor de sección con header consistente.
 * Regla del sitio: máx 1 eyebrow cada 3 secciones.
 */
@Component({
  selector: 'app-section-shell',
  standalone: true,
  template: `
    <section [id]="id()" class="py-20 md:py-28">
      <div class="mx-auto w-full max-w-6xl px-4 md:px-6">
        @if (eyebrow()) {
          <p class="eyebrow">{{ eyebrow() }}</p>
        }
        <h2 class="title">{{ title() }}</h2>
        @if (lede()) {
          <p class="lede">{{ lede() }}</p>
        }
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    .eyebrow {
      font-family: var(--font-pixel);
      font-size: 9px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.9rem;
    }
    .title {
      font-size: clamp(1.9rem, 4vw, 2.9rem);
      font-weight: 720;
      letter-spacing: -0.03em;
      line-height: 1.05;
      color: var(--ink);
    }
    .lede {
      margin-top: 0.9rem;
      max-width: 62ch;
      color: var(--ink-dim);
      line-height: 1.7;
    }
  `,
})
export class SectionShell {
  readonly id = input<string>('');
  readonly eyebrow = input<string | null>(null);
  readonly title = input('');
  readonly lede = input<string | null>(null);
}
