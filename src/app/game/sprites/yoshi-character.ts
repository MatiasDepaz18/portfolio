import { Component, input, model, viewChild } from '@angular/core';
import { SpriteCharacter } from './sprite-character';
import { YOSHI_SHEET, type YoshiState } from './yoshi.sprites';

/**
 * Yoshi del portfolio, envuelto sobre el motor genérico SpriteCharacter.
 * API: <app-yoshi-character state="idle" [scale]="1" />
 *
 * Solo representa el personaje y controla el frame; la narrativa
 * (entrada, lengua, salida) la maneja GSAP desde el componente About.
 */
@Component({
  selector: 'app-yoshi-character',
  standalone: true,
  imports: [SpriteCharacter],
  template: ` <app-sprite-character [sheet]="sheet" [state]="state()" [scale]="scale()" /> `,
})
export class YoshiCharacter {
  readonly sheet = YOSHI_SHEET;
  readonly state = model<YoshiState>('think');
  readonly scale = input(1);

  private readonly sprite = viewChild(SpriteCharacter);

  /** Cambia la animación de forma imperativa (desde GSAP). */
  setState(name: YoshiState): void {
    this.state.set(name);
  }

  /** Host del sprite: target de GSAP para x/y/opacity/rotation. */
  get element(): HTMLDivElement | undefined {
    return this.sprite()?.host().nativeElement;
  }
}
