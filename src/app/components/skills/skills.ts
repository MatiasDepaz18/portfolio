import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SectionShell } from '../shared/section-shell/section-shell';
import { RevealDirective } from '../../directives/reveal.directive';
import { skillCategories } from '../../data/skills.data';

const LOGO_COLOR = '9aa694';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionShell, RevealDirective, NgIcon],
  templateUrl: './skills.html',
  styleUrl: './skills.css',
})
export class Skills {
  readonly categories = skillCategories;
  readonly logoColor = LOGO_COLOR;

  logoUrl(slug: string): string {
    return `https://cdn.simpleicons.org/${slug}/${this.logoColor}`;
  }
}
