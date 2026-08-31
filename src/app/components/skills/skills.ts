import { Component } from '@angular/core';

interface Skill {
  name: string;
  level: number;
  category: string;
}

@Component({
  selector: 'app-skills',
  templateUrl: './skills.html',
  styleUrl: './skills.css'
})
export class Skills {
  skills: Skill[] = [
    { name: 'Angular', level: 70, category: 'Frontend' },
    { name: 'TypeScript', level: 75, category: 'Frontend' },
    { name: 'HTML / CSS', level: 85, category: 'Frontend' },
    { name: 'Tailwind CSS', level: 75, category: 'Frontend' },
    { name: 'JavaScript', level: 80, category: 'Frontend' },
    { name: 'Node.js', level: 60, category: 'Backend' },
    { name: 'Git', level: 70, category: 'Herramientas' },
    { name: 'SQL', level: 65, category: 'Backend' },
  ];

  categories = ['Frontend', 'Backend', 'Herramientas'];
}
