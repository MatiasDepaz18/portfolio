import { Component, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { Project } from '../../../data/projects.data';
import { Badge } from '../../shared/badge/badge';
import { GameButton } from '../../shared/game-button/game-button';

/**
 * Cartucho SNES en CSS puro (paleta tomada de las fotos de
 * src/assets/game/cartucho): frente con label azul y panel de título,
 * reverso de plástico gris con la placa de datos del proyecto, como
 * cuando volteabas el cartucho. En desktop el hover voltea la cara;
 * en touch se voltea con un tap (los links del reverso navegan sin
 * voltear). Con prefers-reduced-motion las caras se apilan.
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

  readonly flipped = signal(false);

  rotateClass(index: number): string {
    return index % 2 === 0 ? 'cart-tilt-l' : 'cart-tilt-r';
  }

  toggleFlip(event: Event): void {
    if ((event.target as HTMLElement).closest('a')) {
      return; // los botones del reverso navegan, no voltean
    }
    if (this.canHover()) {
      return; // en desktop el hover ya voltea
    }
    this.flipped.set(!this.flipped());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (this.canHover()) {
      return;
    }
    event.preventDefault();
    this.flipped.set(!this.flipped());
  }

  private canHover(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  }
}