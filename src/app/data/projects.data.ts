/**
 * PROYECTOS - Cartuchos SNES.
 * Agregá tus proyectos reales copiando el bloque comentado al final.
 * image: screenshot de la landing, en src/assets/projects/<slug>.png
 * (ver README de esa carpeta). Sin image el frente muestra el title screen.
 */
export interface Project {
  title: string;
  description: string;
  problem: string;
  solution: string;
  stack: string[];
  repoUrl: string;
  demoUrl?: string;
  status?: 'SHIPPED' | 'EN CURSO';
  image?: string;
}

export const projects: Project[] = [
  {
    title: 'Portfolio Web',
    description:
      'Este portfolio. Experiencia de navegación tipo plataforma retro con personaje animado, cartuchos para proyectos y sistema de power-ups.',
    problem:
      'Un portfolio genérico no comunica la identidad de un desarrollador que ama tanto el diseño como el código.',
    solution:
      'Diseño y motores de interacción propios: GSAP para la narrativa, sistema de tokens propio y animaciones físicas sutiles.',
    stack: ['Angular', 'TypeScript', 'Tailwind', 'GSAP', 'SSR'],
    repoUrl: 'https://github.com/MatiasDepaz18/portfolio',
    image: 'assets/projects/Super_Mario_Bros._Logo.svg',
    status: 'EN CURSO',
    // image: 'assets/projects/portfolio.png',
  },
  /* TODO: copiá este bloque para agregar tu próximo proyecto
  {
    title: 'Nombre del proyecto',
    description: 'Una línea que explique qué hace.',
    problem: 'Qué problema resolvés.',
    solution: 'Cómo lo resolvés y qué lo hace interesante.',
    stack: ['Stack', 'Tecnologías'],
    repoUrl: 'https://github.com/MatiasDepaz18/nombre-del-repo',
    demoUrl: 'https://demo.example.com',
    status: 'SHIPPED',
    image: 'assets/projects/nombre.png',
  },
  */
];
