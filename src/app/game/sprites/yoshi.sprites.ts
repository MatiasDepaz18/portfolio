import type { SpriteFrame, SpriteRect, SpriteSheet } from './types';

/**
 * Sheet de Yoshi: src/assets/game/yoshi/yoshi.png (564x281, palette PNG).
 *
 * Layout (5 filas, confirmado con el mapeo visual):
 *   F1: walk (5) / think (3) / lookBack (4) / crouch (4)
 *   F2: jump (4) / flip (5) / fall (6)
 *   F3: grab (3) / throwSlow (4, incluye el objeto suelto) / throwFast (3)
 *   F4: run (10) / runFast (2) / runJump (1)
 *   F5: tongue (4, lengua crece hacia la derecha) / tongueUp (5, hacia arriba)
 *       tongueStyles (5) / tongueUpStyles (4)
 *
 * Cada frame apunta al PNG individual extraído (src) y conserva sus
 * coordenadas en el sheet master (source). Esta tabla es la ÚNICA fuente
 * de verdad: el extractor (scripts/extract-yoshi-sprites.mjs) la lee
 * para recortar los PNG, y el motor consume frame.src en runtime.
 */
const BASE = 'assets/game/yoshi';

function frame(src: string, r: SpriteRect): SpriteFrame {
  return { src, width: r.width, height: r.height, source: r };
}

function f(anim: string, n: number, x: number, y: number, w: number, h: number): SpriteFrame {
  return frame(`${BASE}/${anim}/${String(n).padStart(2, '0')}.png`, {
    x,
    y,
    width: w,
    height: h,
  });
}

export const YOSHI_SHEET: SpriteSheet = {
  url: 'assets/game/yoshi/yoshi.png',
  sheetWidth: 564,
  sheetHeight: 281,
  basePath: BASE,
  defaultAnimation: 'think',
  // Box estable del personaje: el host conserva este aspect-ratio SIEMPRE
  // y todos los frames se escalan con el mismo factor. El pie de Yoshi
  // nunca se mueve entre estados (agacharse = más bajo, lengua = sobresale).
  stageBox: { width: 27, height: 32 },
  animations: {
    /** Caminar en el lugar: paso a paso (F1, col 1). */
    walk: {
      fps: 6,
      frames: [
        f('walk', 1, 5, 6, 27, 32),
        f('walk', 2, 38, 7, 26, 31),
        f('walk', 3, 70, 8, 25, 30),
        f('walk', 4, 102, 7, 26, 31),
        f('walk', 5, 132, 6, 26, 32),
      ],
    },
    /** Quieto pensando, movimiento mínimo (F1, col 2). */
    think: {
      fps: 2,
      frames: [
        f('think', 1, 175, 8, 25, 30),
        f('think', 2, 205, 8, 25, 30),
        f('think', 3, 239, 8, 25, 30),
      ],
    },
    /** Mirar hacia atrás (F1, col 3). */
    lookBack: {
      fps: 4,
      frames: [
        f('lookBack', 1, 299, 9, 23, 29),
        f('lookBack', 2, 327, 9, 21, 29),
        f('lookBack', 3, 354, 9, 18, 29),
        f('lookBack', 4, 379, 8, 20, 30),
      ],
    },
    /** Gesto de agacharse (F1, col 4; el frame 3 es el más agachado). */
    crouch: {
      fps: 4,
      frames: [
        f('crouch', 1, 428, 12, 26, 26),
        f('crouch', 2, 459, 14, 26, 24),
        f('crouch', 3, 491, 22, 24, 16),
        f('crouch', 4, 533, 8, 26, 30),
      ],
    },
    /** Despegue del salto (F2, frames 1-4). */
    jump: {
      fps: 8,
      frames: [
        f('jump', 1, 5, 51, 25, 33),
        f('jump', 2, 36, 51, 23, 30),
        f('jump', 3, 66, 51, 23, 27),
        f('jump', 4, 115, 50, 22, 34),
      ],
    },
    /** Voltereta en el aire (F2, frames 5-9). */
    flip: {
      fps: 10,
      frames: [
        f('flip', 1, 159, 50, 21, 32),
        f('flip', 2, 188, 50, 23, 34),
        f('flip', 3, 216, 50, 25, 31),
        f('flip', 4, 275, 50, 30, 26),
        f('flip', 5, 312, 50, 27, 30),
      ],
    },
    /** Caída y aterrizaje (F2, frames 10-15). */
    fall: {
      fps: 8,
      frames: [
        f('fall', 1, 346, 50, 22, 29),
        f('fall', 2, 374, 50, 25, 25),
        f('fall', 3, 405, 50, 22, 24),
        f('fall', 4, 434, 50, 24, 28),
        f('fall', 5, 479, 50, 26, 25),
        f('fall', 6, 516, 60, 26, 18),
      ],
    },
    /** Agarrar el objeto (F3, frames 1-3). */
    grab: {
      fps: 5,
      frames: [
        f('grab', 1, 5, 104, 20, 29),
        f('grab', 2, 31, 106, 31, 27),
        f('grab', 3, 68, 105, 23, 28),
      ],
    },
    /** Tirar el objeto despacio (F3, frames 4-7; el frame 7 incluye el objeto suelto). */
    throwSlow: {
      fps: 5,
      frames: [
        f('throwSlow', 1, 117, 103, 21, 30),
        f('throwSlow', 2, 145, 102, 20, 31),
        f('throwSlow', 3, 176, 102, 23, 31),
        f('throwSlow', 4, 208, 103, 24, 30),
      ],
    },
    /** Tirar el objeto fuerte (F3, frames 8-10). */
    throwFast: {
      fps: 8,
      frames: [
        f('throwFast', 1, 283, 102, 24, 31),
        f('throwFast', 2, 313, 103, 26, 30),
        f('throwFast', 3, 346, 106, 33, 27),
      ],
    },
    /** Correr despacio (F4, frames 1-10). */
    run: {
      fps: 6,
      frames: [
        f('run', 1, 5, 152, 26, 30),
        f('run', 2, 36, 153, 26, 29),
        f('run', 3, 68, 153, 26, 29),
        f('run', 4, 100, 152, 26, 30),
        f('run', 5, 133, 152, 26, 30),
        f('run', 6, 163, 153, 26, 29),
        f('run', 7, 195, 154, 26, 28),
        f('run', 8, 227, 153, 26, 29),
        f('run', 9, 261, 151, 26, 31),
        f('run', 10, 292, 153, 26, 29),
      ],
    },
    /** Correr rápido (F4, frames 11-12). */
    runFast: {
      fps: 10,
      frames: [f('runFast', 1, 341, 156, 33, 26), f('runFast', 2, 379, 157, 36, 25)],
    },
    /** Salto de la corrida (F4, frame 13). */
    runJump: {
      fps: 1,
      frames: [f('runJump', 1, 437, 150, 24, 32)],
    },
    /** Sacar la lengua de adentro hacia afuera, crece hacia la derecha (F5, col 1).
        Anchor bottom-left: el cuerpo queda fijo a la izquierda y la lengua
        se extiende hacia el título sin desplazar al personaje. */
    tongue: {
      fps: 4,
      anchor: 'bottom-left',
      frames: [
        f('tongue', 1, 5, 248, 29, 25),
        f('tongue', 2, 42, 248, 44, 25),
        f('tongue', 3, 95, 248, 60, 25),
        f('tongue', 4, 161, 248, 76, 25),
      ],
    },
    /** Yoshi con la lengua base (solo tongueStyles/01), estático. Usado en el hero:
        el cuerpo NO cambia; la lengua se anima aparte con tongueFall. */
    tongueIdle: {
      fps: 1,
      frames: [frame(`${BASE}/tongueStyles/01.png`, { x: 250, y: 248, width: 29, height: 25 })],
    },
    /** Lengua que desciende: segmentos de tongueStyles en cascada (F5, col 2).
        Anchor top-left: cuelga desde arriba y crece hacia abajo al avanzar. */
    tongueFall: {
      fps: 3,
      anchor: 'top-left',
      frames: [
        f('tongueStyles', 2, 288, 244, 16, 3),
        f('tongueStyles', 3, 288, 254, 16, 5),
        f('tongueStyles', 4, 288, 266, 16, 7),
      ],
    },
    /** Sacar la lengua hacia arriba (F5, col 3). */
    tongueUp: {
      fps: 4,
      frames: [
        f('tongueUp', 1, 337, 243, 20, 30),
        f('tongueUp', 2, 367, 230, 20, 43),
        f('tongueUp', 3, 393, 214, 20, 59),
        f('tongueUp', 4, 420, 198, 20, 75),
        f('tongueUp', 5, 450, 243, 20, 30),
      ],
    },
    /** Estilos de lengua (F5, col 2; piezas sueltas). */
    tongueStyles: {
      fps: 2,
      frames: [
        f('tongueStyles', 1, 250, 248, 29, 25),
        f('tongueStyles', 2, 288, 244, 16, 3),
        f('tongueStyles', 3, 288, 254, 16, 5),
        f('tongueStyles', 4, 288, 266, 16, 7),
        f('tongueStyles', 5, 311, 253, 8, 7),
      ],
    },
    /** Variantes de lengua hacia arriba (F5, col 4). */
    tongueUpStyles: {
      fps: 2,
      frames: [
        f('tongueUpStyles', 1, 475, 238, 3, 16),
        f('tongueUpStyles', 2, 483, 226, 7, 8),
        f('tongueUpStyles', 3, 483, 238, 5, 16),
        f('tongueUpStyles', 4, 494, 238, 7, 16),
      ],
    },
  },
};

/** Estados públicos del personaje. */
export type YoshiState =
  | 'walk'
  | 'think'
  | 'lookBack'
  | 'crouch'
  | 'jump'
  | 'flip'
  | 'fall'
  | 'grab'
  | 'throwSlow'
  | 'throwFast'
  | 'run'
  | 'runFast'
  | 'runJump'
  | 'tongue'
  | 'tongueIdle'
  | 'tongueFall'
  | 'tongueUp'
  | 'tongueStyles'
  | 'tongueUpStyles';
