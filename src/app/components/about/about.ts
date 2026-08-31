import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Badge } from '../shared/badge/badge';
import { Coin } from '../shared/coin/coin';
import { GameButton } from '../shared/game-button/game-button';
import { site } from '../../data/site.data';

const COINS = ['3+ AÑOS IT', 'SOFTWARE', 'AI / ML', 'DATA'];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [Badge, Coin, GameButton, NgIcon],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  readonly coins = COINS;
  readonly cvUrl = site.cvUrl;
}
