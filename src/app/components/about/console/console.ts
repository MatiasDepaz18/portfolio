import { Component, HostListener, OnDestroy, computed, effect, input, signal } from '@angular/core';
import { site } from '../../../data/site.data';
import { DINOS, MiniGame, drawDinoPreview } from './game';

type Screen = 'menu' | 'cv' | 'download' | 'select' | 'game';

interface MenuItem {
  id: Screen;
  label: string;
}

const MENU: MenuItem[] = [
  { id: 'cv', label: 'Mi CV' },
  { id: 'download', label: 'Descargar CV' },
  { id: 'select', label: 'Mini juego' },
];

/**
 * Consola "DEV BOY" dibujada en CSS, con LCD interactivo:
 * - Arranca directo en el MENÚ; navega con la cruceta (y teclado ↑↓) y
 *   abre con A.
 * - Vistas: Mi CV, Descargar CV (cvUrl) y Mini juego.
 * - Mini juego: primero se elige el personaje (select con preview en el
 *   canvas, ◀▶/↑↓ cambian, A confirma) y luego corre el runner.
 * - POWER apaga/enciende el LCD.
 * - El teclado solo consume flechas/espacio cuando el menú, el select o
 *   el juego están abiertos, para no romper el scroll de la página.
 * - El juego se inicializa con un effect solo en browser: si el canvas
 *   no está disponible, se muestra un aviso en vez de pantalla verde.
 */
@Component({
  selector: 'app-about-console',
  standalone: true,
  templateUrl: './console.html',
  styleUrl: './console.css',
})
export class AboutConsole implements OnDestroy {
  readonly cvUrl = input<string>(site.cvUrl);

  readonly site = site;
  readonly menu = MENU;

  readonly powerOn = signal(true);
  readonly screen = signal<Screen>('menu');
  readonly menuIndex = signal(0);
  readonly dinoIndex = signal(0);
  readonly gameUnavailable = signal(false);

  readonly selectedDino = computed(() => DINOS[this.dinoIndex()]);

  private game: MiniGame | null = null;

  readonly footerLeft = computed(() => {
    if (!this.powerOn()) return 'POWER OFF';
    switch (this.screen()) {
      case 'menu':
        return '↑↓ ELEGIR   A ABRIR';
      case 'cv':
        return 'B  VOLVER';
      case 'download':
        return 'A  DESCARGAR';
      case 'select':
        return '◀ ▶ PERSONAJE   A JUGAR';
      case 'game':
        return 'A · ↑  SALTAR';
    }
  });

  readonly footerRight = computed(() => {
    if (this.screen() === 'select') return this.selectedDino().name;
    return this.screen() === 'menu' ? 'MENU' : 'OK';
  });

  constructor() {
    effect(() => {
      if (typeof window === 'undefined') return;
      const s = this.screen();
      if (s === 'select') {
        this.game?.stop();
        this.drawPreview();
      } else if (s === 'game') {
        this.startGame();
      } else {
        this.game?.stop();
      }
    });
  }

  ngOnDestroy(): void {
    this.game?.stop();
  }

  private drawPreview(): void {
    const canvas = document.querySelector<HTMLCanvasElement>('.lcd-canvas');
    if (!canvas) {
      this.gameUnavailable.set(true);
      return;
    }
    this.gameUnavailable.set(false);
    drawDinoPreview(canvas, this.selectedDino());
  }

  private startGame(): void {
    const canvas = document.querySelector<HTMLCanvasElement>('.lcd-canvas');
    if (!this.game || this.game.canvas !== canvas || this.game.dino.id !== this.selectedDino().id) {
      this.game?.stop();
      this.game = canvas ? new MiniGame(canvas, this.selectedDino()) : null;
    }
    if (!this.game || !this.game.isReady()) {
      this.gameUnavailable.set(true);
      return;
    }
    this.gameUnavailable.set(false);
    this.game.start();
  }

  /* ---------------- acciones ---------------- */

  togglePower(): void {
    this.powerOn.update((v) => !v);
    if (!this.powerOn()) {
      this.game?.stop();
      this.screen.set('menu');
    }
  }

  onStart(): void {
    if (!this.powerOn()) return;
    this.openMenu();
  }

  onSelect(): void {
    /* sin función por ahora */
  }

  prevDino(): void {
    if (!this.powerOn() || this.screen() !== 'select') return;
    this.dinoIndex.update((i) => (i - 1 + DINOS.length) % DINOS.length);
  }

  nextDino(): void {
    if (!this.powerOn() || this.screen() !== 'select') return;
    this.dinoIndex.update((i) => (i + 1) % DINOS.length);
  }

  onUp(): void {
    if (!this.powerOn()) return;
    if (this.screen() === 'select') this.prevDino();
    else if (this.screen() === 'game') this.game?.jump();
    else this.move(-1);
  }

  onDown(): void {
    if (!this.powerOn()) return;
    if (this.screen() === 'select') this.nextDino();
    else this.move(1);
  }

  onLeft(): void {
    if (!this.powerOn()) return;
    if (this.screen() === 'select') this.prevDino();
  }

  onRight(): void {
    if (!this.powerOn()) return;
    if (this.screen() === 'select') this.nextDino();
  }

  move(delta: number): void {
    if (!this.powerOn() || this.screen() !== 'menu') return;
    this.menuIndex.update((i) => (i + delta + this.menu.length) % this.menu.length);
  }

  onA(): void {
    if (!this.powerOn()) return;
    switch (this.screen()) {
      case 'menu': {
        const id = this.menu[this.menuIndex()]?.id;
        this.enterScreen(id);
        break;
      }
      case 'select':
        this.screen.set('game');
        break;
      case 'download':
        this.downloadCv();
        break;
      case 'game':
        this.game?.jump();
        break;
    }
  }

  onB(): void {
    if (!this.powerOn()) return;
    if (this.screen() === 'menu') return;
    this.openMenu();
  }

  openMenu(): void {
    this.game?.stop();
    this.screen.set('menu');
  }

  downloadCv(): void {
    const url = this.cvUrl();
    if (typeof window !== 'undefined' && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  private enterScreen(id: Screen | undefined): void {
    if (id) this.screen.set(id);
  }

  /* ---------------- teclado ---------------- */

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.powerOn()) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    ) {
      return;
    }

    const k = e.key;
    const s = this.screen();

    if (s === 'select') {
      if (k === 'ArrowLeft' || k === 'ArrowUp') {
        e.preventDefault();
        this.prevDino();
      } else if (k === 'ArrowRight' || k === 'ArrowDown') {
        e.preventDefault();
        this.nextDino();
      } else if (k === 'Enter' || k === 'a' || k === 'A' || k === ' ') {
        e.preventDefault();
        this.onA();
      } else if (k === 'Escape' || k === 'b' || k === 'B') {
        e.preventDefault();
        this.onB();
      }
      return;
    }

    if (s === 'game') {
      if (k === 'ArrowUp' || k === ' ' || k === 'a' || k === 'A' || k === 'Enter') {
        e.preventDefault();
        this.game?.jump();
      } else if (k === 'Escape' || k === 'b' || k === 'B') {
        e.preventDefault();
        this.openMenu();
      }
      return;
    }

    if (s === 'menu') {
      if (k === 'ArrowUp') {
        e.preventDefault();
        this.move(-1);
      } else if (k === 'ArrowDown') {
        e.preventDefault();
        this.move(1);
      } else if (k === 'Enter' || k === 'a' || k === 'A' || k === ' ') {
        e.preventDefault();
        this.onA();
      } else if (k === 'Escape' || k === 'b' || k === 'B') {
        e.preventDefault();
        this.onB();
      }
      return;
    }

    if (k === 'Enter' || k === 'a' || k === 'A' || k === ' ') {
      e.preventDefault();
      this.onA();
    } else if (k === 'Escape' || k === 'b' || k === 'B') {
      e.preventDefault();
      this.onB();
    }
  }
}
