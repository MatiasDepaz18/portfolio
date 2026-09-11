import { Component, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SectionShell } from '../shared/section-shell/section-shell';
import { Badge } from '../shared/badge/badge';
import { ThreeDS } from './three-ds/three-ds';
import { RevealDirective } from '../../directives/reveal.directive';
import { educationEntries, Education as EducationEntry } from '../../data/education.data';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [SectionShell, Badge, ThreeDS, NgIcon, RevealDirective],
  templateUrl: './education.html',
  styleUrl: './education.css',
})
export class Education {
  readonly entries = educationEntries;
  readonly selected = signal<EducationEntry | null>(null);

  imagesFor(entry: EducationEntry): string[] {
    return [...(entry.image ? [entry.image] : []), ...(entry.photos ?? [])];
  }

  hasImages(entry: EducationEntry): boolean {
    return !!entry.image || (entry.photos?.length ?? 0) > 0;
  }

  onCardKeydown(event: KeyboardEvent, entry: EducationEntry): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open(entry);
    }
  }

  open(entry: EducationEntry): void {
    if (!this.hasImages(entry)) return;
    this.selected.set(entry);
  }

  close(): void {
    this.selected.set(null);
  }
}