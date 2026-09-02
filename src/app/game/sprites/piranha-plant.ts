import { Component, input } from '@angular/core';
import { SpriteCharacter } from './sprite-character';
import { PIRANHA_SHEET } from './piranha.sprites';

export type PiranhaState = 'bite' | 'stemShort' | 'stemTall';

/**
 * Planta Piraña del portfolio, envuelta sobre el motor genérico
 * SpriteCharacter. API: <app-piranha-plant state="bite" [scale]="1" />
 *
 * Estados:
 *   - `bite` (default): boca abriendo/cerrando sin parar. La cabeza
 *     nunca desaparece. Usado por la scroll plant y por la punta del
 *     tallo del recorrido.
 *   - `stemShort` / `stemTall`: los "tallos chicos" (planta con el tallo,
 *     boca cerrada) que forman los segmentos del tallo horizontal del
 *     recorrido.
 *
 * El movimiento del host (x/y/opacity) lo maneja GSAP desde afuera.
 */
@Component({
  selector: 'app-piranha-plant',
  standalone: true,
  imports: [SpriteCharacter],
  template: ` <app-sprite-character [sheet]="sheet" [state]="state()" [scale]="scale()" /> `,
})
export class PiranhaPlant {
  readonly sheet = PIRANHA_SHEET;
  readonly state = input<PiranhaState | undefined>(undefined);
  readonly scale = input(1);
}