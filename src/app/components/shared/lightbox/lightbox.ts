import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * Lightbox: abre las fotos de un logro (título, vida en la facultad)
 * en un carrousel pixel sobre el sitio.
 *
 * Uso:
 *   <app-lightbox
 *     [title]="'Ing. en Computación'"
 *     [images]="['assets/education/titulo-unt.jpg', 'assets/education/foto.jpg']"
 *     [captions]="['Título de grado · UNT', 'Últimas materias']"
 *     (closed)="cerrar()"
 *   />
 *
 * Comportamiento:
 * - ESC cierra, click en el scrim cierra, botón X cierra.
 * - Con más de una imagen: flechas, teclas ← → y swipe táctil cambian de foto.
 * - `captions` es una leyenda por imagen (mismo orden, opcional).
 * - Foco al abrir (caja + trap de Tab), retorno de foco al cerrar.
 * - Scroll del body bloqueado mientras está abierto.
 * - Animaciones anuladas bajo prefers-reduced-motion.
 */
@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [NgIcon],
  template: `
    <div class="lb-scrim" (click)="close()">
      <div
        class="lb-box pixel-corners"
        #box
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="$event.stopPropagation()"
        (keydown)="onKeydown($event)"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        <header class="lb-head">
          <p class="lb-title">{{ title() }}</p>
          <button type="button" class="lb-close" (click)="close()" aria-label="Cerrar">
            <ng-icon name="phosphorX" />
          </button>
        </header>

        <figure class="lb-figure">
          <img class="lb-img" [src]="current()" [alt]="title()" loading="eager" />
          @if (captions()[index()]; as c) {
            <figcaption class="lb-caption">{{ c }}</figcaption>
          }
        </figure>

        @if (images().length > 1) {
          <footer class="lb-nav">
            <button
              type="button"
              class="lb-nav-btn"
              (click)="prev()"
              [disabled]="!canPrev()"
              aria-label="Imagen anterior"
            >
              <ng-icon name="phosphorCaretLeft" />
            </button>
            <span class="lb-counter">{{ index() + 1 }} / {{ images().length }}</span>
            <button
              type="button"
              class="lb-nav-btn"
              (click)="next()"
              [disabled]="!canNext()"
              aria-label="Imagen siguiente"
            >
              <ng-icon name="phosphorCaretRight" />
            </button>
          </footer>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }

    .lb-scrim {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      background: rgb(0 0 0 / 0.72);
      animation: lb-fade 0.2s ease;
    }

    .lb-box {
      position: relative;
      width: min(1200px, 100%);
      height: min(88vh, 100%);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      background: var(--bg-surface);
      border: 2px solid color-mix(in srgb, var(--gold) 55%, var(--line));
      --p: 14px;
      padding: 1.1rem;
      outline: none;
      touch-action: pan-y;
      scrollbar-width: thin;
      scrollbar-color: var(--gold) transparent;
      animation: lb-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .lb-box::-webkit-scrollbar {
      width: 6px;
    }

    .lb-box::-webkit-scrollbar-thumb {
      background: var(--gold);
      border-radius: 3px;
    }

    .lb-head {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding-right: 2.2rem;
    }

    .lb-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 720;
      letter-spacing: -0.02em;
      line-height: 1.25;
      color: var(--ink);
    }

    .lb-close {
      position: absolute;
      top: 0.8rem;
      right: 0.8rem;
      width: 1.7rem;
      height: 1.7rem;
      display: grid;
      place-items: center;
      font-size: 1rem;
      color: var(--ink);
      background: var(--bg-sunken);
      border: 1px solid var(--line-strong);
      --p: 4px;
      clip-path: polygon(
        0 var(--p),
        var(--p) 0,
        calc(100% - var(--p)) 0,
        100% var(--p),
        100% calc(100% - var(--p)),
        calc(100% - var(--p)) 100%,
        var(--p) 100%,
        0 calc(100% - var(--p))
      );
      cursor: pointer;
    }

    .lb-close:hover,
    .lb-close:focus-visible {
      background: var(--gold);
      color: var(--accent-ink);
    }

    .lb-figure {
      flex: 1;
      min-height: 0;
      margin: 1rem 0 0;
      padding: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: var(--bg-elevated);
      border: 1px solid var(--line-strong);
    }

    .lb-img {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      object-fit: contain;
      margin: 0 auto;
    }

    .lb-caption {
      margin: 0;
      text-align: center;
      font-family: var(--font-pixel);
      font-size: 8px;
      letter-spacing: 0.1em;
      color: var(--gold);
    }

    .lb-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .lb-nav-btn {
      width: 2.2rem;
      height: 2.2rem;
      display: grid;
      place-items: center;
      font-size: 1.1rem;
      color: var(--ink);
      background: var(--bg-elevated);
      border: 1px solid var(--line-strong);
      --p: 4px;
      clip-path: polygon(
        0 var(--p),
        var(--p) 0,
        calc(100% - var(--p)) 0,
        100% var(--p),
        100% calc(100% - var(--p)),
        calc(100% - var(--p)) 100%,
        var(--p) 100%,
        0 calc(100% - var(--p))
      );
      cursor: pointer;
    }

    .lb-nav-btn:hover:not(:disabled),
    .lb-nav-btn:focus-visible:not(:disabled) {
      background: var(--accent);
      color: var(--accent-ink);
    }

    .lb-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .lb-counter {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.1em;
      color: var(--ink-dim);
    }

    @media (max-width: 767px) {
      .lb-scrim {
        padding: 0.6rem;
      }

      .lb-box {
        --p: 10px;
        height: 100%;
        padding: 0.9rem;
      }
    }

    @keyframes lb-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes lb-pop {
      from {
        opacity: 0;
        transform: translateY(14px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .lb-scrim,
      .lb-box {
        animation: none;
      }
    }
  `,
})
export class Lightbox implements AfterViewInit {
  readonly title = input('');
  readonly images = input<string[]>([]);
  readonly captions = input<string[]>([]);
  readonly closed = output<void>();

  @ViewChild('box') private boxRef!: ElementRef<HTMLElement>;

  protected readonly index = signal(0);
  protected readonly current = computed(() => this.images()[this.index()]);
  protected readonly canPrev = computed(() => this.index() > 0);
  protected readonly canNext = computed(() => this.index() < this.images().length - 1);

  private previousFocus: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    this.boxRef.nativeElement.focus();
  }

  close(): void {
    document.body.style.overflow = '';
    this.previousFocus?.focus();
    this.closed.emit();
  }

  prev(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  next(): void {
    this.index.update((i) => Math.min(this.images().length - 1, i + 1));
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.images().length <= 1) return;
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (event.key === 'ArrowLeft' && this.canPrev()) {
      this.prev();
      return;
    }
    if (event.key === 'ArrowRight' && this.canNext()) {
      this.next();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusables = this.boxRef.nativeElement.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
}