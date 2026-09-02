import type { SpriteFrame, SpriteRect, SpriteSheet } from './types';

/**
 * Sheet de la Planta Piraña: src/assets/game/piraña/planta-sprite.png
 * (419x380, RGBA).
 *
 * Layout (mapeado con análisis de píxeles; cada componente conexo es un
 * frame aparte):
 *   Izquierda arriba - "tallos chicos": la planta con el tallo, boca
 *   cerrada, en dos tamaños:
 *     - stemShort (47, 29, 77, 38) : planta corta
 *     - stemTall  (47, 89, 77, 77) : planta alta
 *   Izquierda abajo - la boca (cabeza abriendo/cerrando):
 *     - mouth/01 (15, 193, 76, 76) : boca abierta (labios rojos,
 *                                     interior transparente -> blanco)
 *     - mouth/02 (15, 273, 76, 75) : boca cerrada (mandíbula levantada)
 *
 * TODOS los frames se extraen rotados 270 grados (antihorario): el tallo
 * vertical del sprite queda HORIZONTAL, con la cabeza a la izquierda y
 * el tallo hacia la derecha. Así los segmentos del recorrido y la boca
 * se ven acostados a lo largo de la línea.
 *
 * En el recorrido de Experiencia laboral los "tallos chicos" se usan
 * como segmentos del tallo: aparecen en fila a lo largo de la línea,
 * revelados progresivamente con el scroll, y la boca (que NUNCA
 * desaparece) viaja pegada a la punta del tallo.
 *
 * Animación `bite` (default): loop mouth/01 <-> mouth/02, la boca abre
 * y cierra sin parar. `whiteMouth: true` hace que el extractor pinte de
 * blanco el interior de la boca (el hueco transparente entre los labios
 * rojos).
 *
 * Cada frame apunta al PNG individual extraído (src) y conserva sus
 * coordenadas en el sheet master (source). Esta tabla es la ÚNICA fuente
 * de verdad: el extractor (scripts/extract-yoshi-sprites.mjs) la lee
 * para recortar los PNG, y el motor consume frame.src en runtime.
 */
const BASE = 'assets/game/piraña';

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

/**
 * Frame rotado 270 (el extractor hornea la rotación): el `source` (rect
 * del sheet master) conserva las coordenadas originales y las
 * dimensiones naturales del frame pasan a ser las del PNG rotado (h, w).
 */
function fr(anim: string, n: number, x: number, y: number, w: number, h: number): SpriteFrame {
  const rect: SpriteRect = { x, y, width: w, height: h };
  return {
    src: `${BASE}/${anim}/${String(n).padStart(2, '0')}.png`,
    width: rect.height,
    height: rect.width,
    source: rect,
  };
}

export const PIRANHA_SHEET: SpriteSheet = {
  url: 'assets/game/piraña/planta-sprite.png',
  sheetWidth: 419,
  sheetHeight: 380,
  basePath: BASE,
  defaultAnimation: 'bite',
  // Box estable: la cabeza nunca cambia de proporciones. mouth/01 y
  // mouth/02 tienen la misma altura: el paso abierta <-> cerrada es
  // continuo, sin saltos de escala.
  stageBox: { width: 77, height: 77 },
  animations: {
    /** Boca abriendo/cerrando sin parar: la cabeza nunca desaparece. */
    bite: {
      fps: 5,
      whiteMouth: true,
      rotate: 270,
      frames: [
        fr('mouth', 1, 15, 193, 76, 76), // boca abierta (76x76 rotado)
        fr('mouth', 2, 15, 273, 76, 75), // boca cerrada (75x76 rotado)
      ],
    },
    /** Tallo corto (boca cerrada): segmento de la fila del recorrido. */
    stemShort: {
      fps: 1,
      rotate: 270,
      frames: [fr('start', 1, 47, 29, 77, 38)], // 38x77 rotado
    },
    /** Tallo alto (boca cerrada): segmento alterno de la fila. */
    stemTall: {
      fps: 1,
      rotate: 270,
      frames: [fr('start', 2, 47, 89, 77, 77)], // 77x77 rotado
    },
  },
};