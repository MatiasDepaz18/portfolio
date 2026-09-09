import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { GsapService } from '../../services/gsap.service';
import { SectionShell } from '../shared/section-shell/section-shell';
import { RevealDirective } from '../../directives/reveal.directive';
import { Flag } from '../shared/flag/flag';
import { YoshiCharacter } from '../../game/sprites/yoshi-character';
import { milestones } from '../../data/experience.data';

interface Pt {
  x: number;
  y: number;
}

/**
 * Mapa de mundos estilo SMB3 interactivo.
 * Yoshi arranca quieto en START (abajo a la izquierda) y CAMINA hasta la
 * fortaleza cuando la tocás: viaja por el camino (se tweea el progreso de
 * un proxy y Yoshi se posiciona en % con pointAt, igual que los castillos)
 * y al llegar abre el cuadro de diálogo con la información del trabajo.
 *
 * El posicionamiento en % hace que Yoshi escale solo con el tablero: al
 * achicar el navegador no se desvía del camino (a diferencia de un
 * motionPath con align, que hornea píxeles al crear el tween).
 *
 * El camino tiene forma de "C" con esquinas redondeadas: entra abajo a la
 * izquierda, recorre el riel inferior, sube por el derecho (curva ancha)
 * y vuelve por el superior hasta la bandera. Las fortalezas se reparten a
 * lo largo de toda la C según cuántos trabajos haya (funciona con 1..N).
 */
const VIEWBOX = { width: 900, height: 520 } as const;

const LEFT_X = 70;
const RIGHT_X = 830;
const BOTTOM_Y = 430;
const TOP_Y = 90;
const CORNER_R = 110;

/** Puntos de un arco de esquina redondeada (centro, de grados a grados). */
function arcPoints(cx: number, cy: number, fromDeg: number, toDeg: number, steps = 6): Pt[] {
  const pts: Pt[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = (fromDeg + ((toDeg - fromDeg) * i) / steps) * (Math.PI / 180);
    pts.push({
      x: Math.round(cx + CORNER_R * Math.cos(a)),
      y: Math.round(cy + CORNER_R * Math.sin(a)),
    });
  }
  return pts;
}

/**
 * Polilínea del camino en "C" con curvas pronunciadas en las esquinas
 * inferiores-derecha y superiores-derecha (arcos de radio CORNER_R).
 */
const PATH_VERTICES: Pt[] = [
  { x: LEFT_X, y: BOTTOM_Y },
  { x: RIGHT_X - CORNER_R, y: BOTTOM_Y },
  ...arcPoints(RIGHT_X - CORNER_R, BOTTOM_Y - CORNER_R, 90, 0),
  { x: RIGHT_X, y: TOP_Y + CORNER_R },
  ...arcPoints(RIGHT_X - CORNER_R, TOP_Y + CORNER_R, 0, -90),
  { x: LEFT_X, y: TOP_Y },
];

interface Segment {
  a: Pt;
  b: Pt;
  len: number;
}

const SEGMENTS: Segment[] = PATH_VERTICES.slice(0, -1).map((a, i) => {
  const b = PATH_VERTICES[i + 1];
  return { a, b, len: Math.hypot(b.x - a.x, b.y - a.y) };
});

const PATH_TOTAL = SEGMENTS.reduce((sum, s) => sum + s.len, 0);

/** Punto de la polilínea en un progreso 0..1. */
function pointAt(progress: number): Pt {
  const target = Math.max(0, Math.min(1, progress)) * PATH_TOTAL;
  let acc = 0;
  for (const seg of SEGMENTS) {
    if (target <= acc + seg.len) {
      const t = seg.len === 0 ? 0 : (target - acc) / seg.len;
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t,
      };
    }
    acc += seg.len;
  }
  const last = PATH_VERTICES[PATH_VERTICES.length - 1];
  return { x: last.x, y: last.y };
}

function toPathD(vertices: Pt[]): string {
  return `M ${vertices.map((v) => `${v.x} ${v.y}`).join(' L ')}`;
}

@Component({
  selector: 'app-trajectory',
  standalone: true,
  imports: [SectionShell, RevealDirective, Flag, YoshiCharacter],
  templateUrl: './trajectory.html',
  styleUrl: './trajectory.css',
})
export class Trajectory implements OnDestroy {
  readonly milestones = milestones;
  readonly mapPath = toPathD(PATH_VERTICES);

  /** Fortaleza activa en el mapa (highlight). */
  readonly activeIndex = signal<number | null>(null);
  /** Fortaleza seleccionada (abrió el diálogo). */
  readonly selected = signal<number | null>(null);

  readonly selectedMilestone = computed(() => {
    const s = this.selected();
    return s === null ? null : this.milestones[s] ?? null;
  });

  private dialog = viewChild<ElementRef<HTMLDivElement>>('dialog');
  private character = viewChild<ElementRef<HTMLDivElement>>('character');
  private yoshi = viewChild(YoshiCharacter);

  private gsap: typeof import('gsap').gsap | null = null;
  private characterEl: HTMLElement | null = null;
  private travelProxy = { p: 0 };
  private travelTween: { kill: () => void } | null = null;

  constructor(private gsapService: GsapService) {
    // Al abrir el detalle, el foco pasa al cuadro de diálogo para lectores
    // de pantalla.
    effect(() => {
      if (this.selected() !== null) {
        this.dialog()?.nativeElement.focus();
      }
    });

    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen IntersectionObserver.
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      // Se inicializa apenas renderiza (no espera el viewport): así el
      // viaje de Yoshi está listo cuando el usuario toca una fortaleza.
      void this.initMap();
    });
  }

  /** % horizontal del tablero donde vive la fortaleza i. */
  nodeLeft(i: number): string {
    return `${(pointAt(this.castleProgress(i)).x / VIEWBOX.width) * 100}%`;
  }

  /** % vertical del tablero donde vive la fortaleza i. */
  nodeTop(i: number): string {
    return `${(pointAt(this.castleProgress(i)).y / VIEWBOX.height) * 100}%`;
  }

  /** Progreso (0..1) sobre el camino para la fortaleza i: se reparten a
   *  lo largo de toda la "C" dejando libres START y la bandera. */
  castleProgress(i: number): number {
    const n = this.milestones.length;
    if (n <= 1) {
      return 0.5;
    }
    return 0.08 + 0.84 * (i / (n - 1));
  }

  /** Click en una fortaleza: Yoshi camina hasta ahí y abre su info. */
  async select(i: number): Promise<void> {
    this.activeIndex.set(i);
    if (this.selected() === i) {
      return;
    }
    if (!this.characterEl || !this.gsap) {
      await this.initMap();
    }
    const el = this.characterEl;
    if (!el || !this.gsap) {
      this.selected.set(i);
      return;
    }
    this.yoshi()?.setState('walk');
    this.travelTween?.kill();
    this.travelTween = this.gsap.to(this.travelProxy, {
      p: this.castleProgress(i),
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Posición en % desde pointAt: escala con el tablero (sin drift).
        const pt = pointAt(this.travelProxy.p);
        el.style.left = `${(pt.x / VIEWBOX.width) * 100}%`;
        el.style.top = `${(pt.y / VIEWBOX.height) * 100}%`;
      },
      onComplete: () => {
        this.selected.set(i);
        this.yoshi()?.setState('think');
      },
    });
  }

  /** Cierra el diálogo (botón × o ESC). */
  close(): void {
    this.selected.set(null);
    this.activeIndex.set(null);
  }

  private async initMap(): Promise<void> {
    const characterEl = this.character()?.nativeElement;
    if (characterEl) {
      this.characterEl = characterEl;
    }
    // Se asegura de que GSAP esté cargado para el primer viaje.
    if (!this.gsap) {
      this.gsap = await this.gsapService.get();
    }
  }

  ngOnDestroy(): void {
    this.travelTween?.kill();
  }
}