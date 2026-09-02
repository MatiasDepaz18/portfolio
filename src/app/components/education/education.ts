import { Component } from '@angular/core';
import { SectionShell } from '../shared/section-shell/section-shell';
import { Badge } from '../shared/badge/badge';
import { RevealDirective } from '../../directives/reveal.directive';
import { educationEntries } from '../../data/education.data';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [SectionShell, Badge, RevealDirective],
  templateUrl: './education.html',
  styleUrl: './education.css',
})
export class Education {
  readonly entries = educationEntries;
}