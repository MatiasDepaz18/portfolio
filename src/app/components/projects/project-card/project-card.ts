import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.html',
  styleUrl: './project-card.css'
})
export class ProjectCard {
  // @Input() es exactamente como las props de React
  @Input() title = '';
  @Input() description = '';
  @Input() tags: string[] = [];
  @Input() repoUrl = '#';
  @Input() demoUrl?: string;
}
