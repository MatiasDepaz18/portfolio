/**
 * Tipos base del sistema de sprites.
 *
 * Un SpriteSheet describe un set de animaciones. Cada frame apunta a un
 * PNG individual (src) y opcionalmente conserva sus coordenadas en el
 * sheet master (source), que son la fuente de verdad del extractor
 * (scripts/extract-yoshi-sprites.mjs).
 */
export interface SpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteFrame {
  /** URL pública del PNG individual (ej: 'assets/game/yoshi/idle/01.png'). */
  src: string;
  /** Tamaño natural del frame en píxeles (para el anchor bottom-center). */
  width: number;
  height: number;
  /** Coordenadas en el sheet master. Solo las consume el extractor. */
  source: SpriteRect;
}

export interface SpriteAnimation {
  /** Velocidad de reproducción en frames por segundo. */
  fps: number;
  frames: SpriteFrame[];
  /**
   * Punto de ancla del frame dentro del host.
   * - 'bottom-center' (default): pies centrados (personaje parado).
   * - 'bottom-left': pies al borde izquierdo, ideal para sprites cuyo
   *   cuerpo está a la izquierda y se extienden a la derecha (ej: lengua).
   * - 'top-left': cuelga desde el borde superior izquierdo, ideal para
   *   elementos que crecen hacia abajo (ej: lengua que desciende).
   */
  anchor?: 'bottom-center' | 'bottom-left' | 'top-left';
  /**
   * Pinta de blanco el interior de la boca de los frames (extractor).
   * Regla: los píxeles transparentes flanqueados por rojo (labios) a un
   * lado y por cualquier píxel opaco al otro se rellenan de blanco, y el
   * relleno se propaga por el interior conectado (flood fill).
   */
  whiteMouth?: boolean;
  /**
   * Rota los PNG extraídos (extractor). El frame queda horneado con esa
   * orientación y `width`/`height` del frame pasan a ser las del PNG
   * rotado.
   * - 90 : giro horario (el contenido arriba pasa a la derecha)
   * - 270: giro antihorario (el contenido arriba pasa a la izquierda)
   */
  rotate?: 90 | 270;
}

export interface SpriteSheet {
  /** URL del sheet master (extractor + documentación). */
  url: string;
  sheetWidth: number;
  sheetHeight: number;
  /** Ruta base de los PNG extraídos (ej: 'assets/game/yoshi'). */
  basePath: string;
  /** Animación que se reproduce si no se especifica estado. */
  defaultAnimation: string;
  /**
   * Box estable del personaje (opcional). Si está definido, el host
   * mantiene SIEMPRE este aspect-ratio y todos los frames se escalan con
   * el mismo factor: el personaje no cambia de proporciones ni se mueve
   * de base al cambiar de animación (el "salto" al agacharse/saltar
   * desaparece). Sin stageBox se usa el box de cada animación.
   */
  stageBox?: { width: number; height: number };
  animations: Record<string, SpriteAnimation>;
}
