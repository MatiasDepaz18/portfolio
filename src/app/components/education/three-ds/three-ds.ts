import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

export type ThreeDsButton =
  | 'D-PAD UP'
  | 'D-PAD DOWN'
  | 'D-PAD LEFT'
  | 'D-PAD RIGHT'
  | 'A'
  | 'B'
  | 'X'
  | 'Y'
  | 'START'
  | 'SELECT'
  | 'HOME'
  | 'POWER';

/** Índice circular: -1 → último, n → primero. */
export function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

/** Limita el vector del stick al radio máximo. */
export function clampAnalog(x: number, y: number, max: number): { x: number; y: number } {
  const dist = Math.hypot(x, y);
  if (dist <= max || dist === 0) return { x, y };
  return { x: (x / dist) * max, y: (y / dist) * max };
}

/**
 * Nintendo 3DS dibujada 100% en HTML/CSS, como modal de Educación.
 *
 * - La pantalla superior muestra el carrousel de fotos de la facultad
 *   (◀▶ / D-PAD izquierda-derecha / A avanzan y retroceden).
 * - La pantalla inferior muestra el logro, el caption y el contador.
 * - Todos los botones son reales, con efecto de presión; X/Y/START/
 *   SELECT/HOME quedan listos para conectar un juego/emulador vía la
 *   salida `press`. El stick analógico se arrastra y emite por `analog`.
 * - POWER enciende/apaga las pantallas.
 *
 * El componente se comporta como modal (scrim, ESC/click afuera/X,
 * trap de foco y bloqueo de scroll) y escala la consola al espacio
 * disponible con ResizeObserver (SSR-safe).
 */
@Component({
  selector: 'app-three-ds',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './three-ds.html',
  styleUrl: './three-ds.css',
})
export class ThreeDS implements AfterViewInit, OnDestroy {
  readonly title = input('');
  readonly images = input<string[]>([]);
  readonly captions = input<string[]>([]);
  readonly closed = output<void>();
  /** Botón presionado: preparado para conectar un juego/emulador. */
  readonly press = output<ThreeDsButton>();
  /** Stick normalizado (-1..1): preparado para conectar un juego/emulador. */
  readonly analog = output<{ x: number; y: number }>();

  @ViewChild('box') private boxRef!: ElementRef<HTMLElement>;
  @ViewChild('stage') private stageRef!: ElementRef<HTMLElement>;
  @ViewChild('analog') private analogRef!: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);

  protected readonly index = signal(0);
  protected readonly powerOn = signal(true);
  protected readonly activeButton = signal<ThreeDsButton | null>(null);
  protected readonly toast = signal('');
  protected readonly scale = signal(1);
  protected readonly dragging = signal(false);
  protected readonly stick = signal({ x: 0, y: 0 });

  /** New 3DS XL a 3,85 px/mm: 160×93,5 mm por mitad. */
  protected readonly consoleWidth = 616;
  protected readonly consoleHeight = 720;
  private readonly slideSeq = signal(0);

  protected readonly current = computed(() => this.images()[this.index()] ?? '');
  protected readonly caption = computed(() => this.captions()[this.index()] ?? '');
  protected readonly counter = computed(() =>
    this.images().length ? `${this.index() + 1} / ${this.images().length}` : '',
  );
  protected readonly slides = computed(() => {
    const src = this.current();
    return src ? [{ key: this.slideSeq(), src, alt: this.caption() || this.title() }] : [];
  });
  protected readonly stickTransform = computed(() => {
    const { x, y } = this.stick();
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  });

  private readonly keyMap: Record<string, ThreeDsButton> = {
    ArrowUp: 'D-PAD UP',
    ArrowDown: 'D-PAD DOWN',
    ArrowLeft: 'D-PAD LEFT',
    ArrowRight: 'D-PAD RIGHT',
    z: 'A',
    Z: 'A',
    x: 'B',
    X: 'B',
    a: 'Y',
    A: 'Y',
    s: 'X',
    S: 'X',
    Enter: 'START',
    Shift: 'SELECT',
    h: 'HOME',
    H: 'HOME',
  };

  private previousFocus: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    this.boxRef.nativeElement.focus();
    this.observeStage();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
      this.previousFocus?.focus();
    }
  }

  close(): void {
    this.closed.emit();
  }

  protected togglePower(): void {
    this.powerOn.update((v) => !v);
  }

  protected prev(): void {
    const total = this.images().length;
    if (total <= 1) return;
    this.index.update((i) => wrapIndex(i - 1, total));
    this.slideSeq.update((k) => k + 1);
  }

  protected next(): void {
    const total = this.images().length;
    if (total <= 1) return;
    this.index.update((i) => wrapIndex(i + 1, total));
    this.slideSeq.update((k) => k + 1);
  }

  /** Punto único de interacción; conectable a un juego a futuro. */
  protected onButton(name: ThreeDsButton): void {
    this.press.emit(name);
    this.flash(name);
    switch (name) {
      case 'D-PAD LEFT':
        this.prev();
        break;
      case 'D-PAD RIGHT':
        this.next();
        break;
      case 'A':
        this.next();
        break;
      case 'B':
        this.close();
        break;
      case 'POWER':
        this.togglePower();
        break;
      default:
        break;
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) return;

    const name = this.keyMap[event.key];
    if (!name) return;
    event.preventDefault();
    this.onButton(name);
  }

  protected onAnalogDown(event: PointerEvent): void {
    this.dragging.set(true);
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.moveAnalog(event.clientX, event.clientY);
  }

  protected onAnalogMove(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.moveAnalog(event.clientX, event.clientY);
  }

  protected onAnalogUp(): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    this.stick.set({ x: 0, y: 0 });
    this.analog.emit({ x: 0, y: 0 });
  }

  private moveAnalog(clientX: number, clientY: number): void {
    const el = this.analogRef.nativeElement;
    const rect = el.getBoundingClientRect();
    const factor = el.offsetWidth ? rect.width / el.offsetWidth : 1;
    const max = 15;
    const pos = clampAnalog(
      (clientX - (rect.left + rect.width / 2)) / factor,
      (clientY - (rect.top + rect.height / 2)) / factor,
      max,
    );
    this.stick.set(pos);
    this.analog.emit({ x: pos.x / max, y: pos.y / max });
  }

  private flash(name: ThreeDsButton): void {
    this.activeButton.set(name);
    this.toast.set(`${name} PRESIONADO`);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.activeButton.set(null), 140);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 900);
  }

  private observeStage(): void {
    const stage = this.stageRef.nativeElement;
    const measure = () => {
      const ratio = Math.min(
        stage.clientWidth / this.consoleWidth,
        stage.clientHeight / this.consoleHeight,
      );
      this.scale.set(Math.max(0.28, Math.min(3, ratio)));
    };
    measure();
    this.resizeObserver = new ResizeObserver(measure);
    this.resizeObserver.observe(stage);
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
