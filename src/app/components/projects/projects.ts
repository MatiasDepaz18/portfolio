import { Component } from '@angular/core';
import { ProjectCard } from './project-card/project-card';

interface Project {
  title: string;
  description: string;
  tags: string[];
  repoUrl: string;
  demoUrl?: string;
}

@Component({
  selector: 'app-projects',
  imports: [ProjectCard],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects {
  projects: Project[] = [
    {
      title: 'Portfolio Web',
      description: 'Mi portfolio personal desarrollado con Angular 19 y Tailwind CSS. Diseño responsive con SSR habilitado.',
      tags: ['Angular', 'TypeScript', 'Tailwind CSS'],
      repoUrl: 'https://github.com/tu-usuario/portfolo-web',
      demoUrl: '#'
    },
    {
      title: 'Proyecto 2',
      description: 'Descripción breve del proyecto. Contá qué problema resuelve y qué tecnologías usaste.',
      tags: ['React', 'Node.js', 'MongoDB'],
      repoUrl: '#',
      demoUrl: '#'
    },
    {
      title: 'Proyecto 3',
      description: 'Descripción breve del proyecto. Contá qué problema resuelve y qué tecnologías usaste.',
      tags: ['Python', 'FastAPI', 'PostgreSQL'],
      repoUrl: '#',
    },
  ];
}
