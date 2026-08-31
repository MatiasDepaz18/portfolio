import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SectionShell } from '../shared/section-shell/section-shell';
import { Cartridge } from './cartridge/cartridge';
import { GameButton } from '../shared/game-button/game-button';
import { RevealDirective } from '../../directives/reveal.directive';
import { projects } from '../../data/projects.data';
import { site } from '../../data/site.data';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [SectionShell, Cartridge, GameButton, RevealDirective, NgIcon],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
  readonly projects = projects;
  readonly github = site.github;
}
