import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { site } from '../../data/site.data';

const FOOTER_LINKS = [
  { id: 'about', label: 'Sobre mí' },
  { id: 'skills', label: 'Habilidades' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'trajectory', label: 'Experiencia laboral' },
  { id: 'education', label: 'Educación' },
  { id: 'contact', label: 'Contacto' },
] as const;

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly site = site;
  readonly links = FOOTER_LINKS;
  readonly currentYear = new Date().getFullYear();

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
