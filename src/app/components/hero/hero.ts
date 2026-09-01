import { Component, signal } from '@angular/core';
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
