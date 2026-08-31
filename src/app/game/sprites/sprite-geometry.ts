import type { SpriteAnimation, SpriteFrame, SpriteSheet } from './types';

/**
 * Geometría del sistema de sprites (PNG individuales).
 *
 * Los frames de una animación tienen tamaños distintos; todos se
 * escalan con el MISMO factor (el box de la animación -o el stageBox
 * del sheet si existe- ajustado al ancho del contenedor). El frame se
 * ancla abajo (feet planted), así el personaje no "salta" al cambiar
 * de frame.
 *
 * El host del personaje es width:100% con aspect-ratio boxW/boxH.
 * El frame se dimensiona relativo al ALTO del host:
 *   fw = frameW / boxH   -> width: calc(100% * fw)
 *   fh = frameH / boxH   -> height: calc(100% * fh)
 * y se ancla con bottom:0 (y left:50% o left:0 según anchor).
 */
export interface SpriteBox {
  width: number;
  height: number;
}

export interface SpriteGeometry {
  fw: number;
  fh: number;
}

export function boxOf(anim: SpriteAnimation): SpriteBox {
  return {
    width: Math.max(...anim.frames.map((f) => f.width)),
    height: Math.max(...anim.frames.map((f) => f.height)),
  };
}

/**
 * Box estable del sheet: si el sheet declara stageBox, el host conserva
 * su aspect-ratio SIEMPRE (el personaje no cambia de proporciones entre
 * animaciones). Si no, se usa el box de la animación activa.
 */
export function stageBoxOf(sheet: SpriteSheet, anim: SpriteAnimation): SpriteBox {
  return sheet.stageBox ?? boxOf(anim);
}

export function frameGeometry(frame: SpriteFrame, box: SpriteBox): SpriteGeometry {
  return {
    fw: frame.width / box.height,
    fh: frame.height / box.height,
  };
}
