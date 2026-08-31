import { Component, afterNextRender, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { GameButton } from '../shared/game-button/game-button';
import { HeroYoshi } from './hero-yoshi';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [GameButton, NgIcon, HeroYoshi],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  readonly tipOpen = signal(false);

  /**
   * Oculta el contenido del hero para la escena de Yoshi (la succión lo
   * trae desde la derecha). Solo en cliente y sin reduced-motion: en SSR
   * y con reduced-motion el contenido es visible de entrada.
   */
  readonly sceneHidden = signal(false);

  constructor() {
    afterNextRender(() => {
      if (
        typeof window.matchMedia === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        this.sceneHidden.set(true);
      }
    });
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleTip(): void {
    this.tipOpen.set(!this.tipOpen());
  }
}
