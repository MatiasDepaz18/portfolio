import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { Project } from '../../../data/projects.data';
import { Badge } from '../../shared/badge/badge';
import { GameButton } from '../../shared/game-button/game-button';

/**
 * Cartucho: metáfora de juego para un proyecto.
 * Colorways: 'green' | 'ink' | 'gold' (sistema documentado, misma familia
 * de paleta). La etiqueta no es un enlace: navegan los botones CÓDIGO/DEMO.
 */
@Component({
  selector: 'app-cartridge',
  standalone: true,
  imports: [Badge, GameButton, NgIcon],
  templateUrl: './cartridge.html',
  styleUrl: './cartridge.css',
})
export class Cartridge {
  readonly project = input.required<Project>();
  readonly index = input(0);

  rotateClass(index: number): string {
    return index % 2 === 0 ? 'cart-tilt-l' : 'cart-tilt-r';
  }
}
