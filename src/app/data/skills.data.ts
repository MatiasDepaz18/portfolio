/**
 * SKILLS - Power-ups.
 * `logo` es el slug de Simple Icons (https://simpleicons.org).
 * Si la skill no tiene logo de marca, usá `icon` (nombre de icono Phosphor,
 * de la lista registrada en app.config.ts).
 */
export interface Skill {
  name: string;
  logo?: string;
  icon?: string;
  note: string;
}

export interface SkillCategory {
  id: string;
  label: string;
  icon: string;
  tagline: string;
  skills: Skill[];
}

export const skillCategories: SkillCategory[] = [
  {
    id: 'software',
    label: 'Software Engineering',
    icon: 'phosphorCode',
    tagline: 'Frontend, backend y arquitectura',
    skills: [
      { name: 'Angular', logo: 'angular', note: 'Aplicaciones SPA y SSR con TypeScript' },
      { name: 'TypeScript', logo: 'typescript', note: 'Tipado estricto en todo el stack' },
      { name: 'React', logo: 'react', note: 'Componentes modernos y hooks' },
      { name: 'Next.js', logo: 'nextdotjs', note: 'SSR, RSC y rendimiento web' },
      { name: 'Node.js', logo: 'nodedotjs', note: 'APIs REST y servicios backend' },
      { name: 'Django', logo: 'django', note: 'Backend Python con ORM y admin' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'phosphorDatabase',
    tagline: 'Modelado, consultas y reportes',
    skills: [
      { name: 'Python', logo: 'python', note: 'Ciencia de datos y automatización' },
      { name: 'SQL', icon: 'phosphorTable', note: 'Consultas y modelado relacional' },
      { name: 'BigQuery', logo: 'googlebigquery', note: 'Analítica sobre grandes volúmenes' },
      { name: 'Power BI', logo: 'powerbi', note: 'Dashboards y visualización' },
    ],
  },
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    icon: 'phosphorRobot',
    tagline: 'Modelos, visión y agentes',
    skills: [
      { name: 'LLMs', icon: 'phosphorChatCircleText', note: 'Prompting, RAG y fine-tuning' },
      {
        name: 'Machine Learning',
        icon: 'phosphorBrain',
        note: 'Pipeline de entrenamiento y evaluación',
      },
      {
        name: 'Computer Vision',
        icon: 'phosphorEye',
        note: 'Detección y clasificación de imágenes',
      },
      { name: 'AI Agents', icon: 'phosphorRobot', note: 'Automatización con agentes y tools' },
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    icon: 'phosphorHardDrives',
    tagline: 'Deploy, versionado y cloud',
    skills: [
      { name: 'Docker', logo: 'docker', note: 'Contenedores y entornos reproducibles' },
      { name: 'Git', logo: 'git', note: 'Versionado y flujos colaborativos' },
      { name: 'CI/CD', icon: 'phosphorGearSix', note: 'Pipelines de build y deploy' },
      { name: 'Cloud', icon: 'phosphorCloud', note: 'Servicios y escalado en la nube' },
    ],
  },
];
