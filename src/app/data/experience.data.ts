/**
 * TRAYECTORIA - la línea START → bandera.
 * Agregá tus experiencias reales copiando el bloque comentado al final.
 * Cada milestone aparece como un checkpoint en la línea del nivel.
 */
export interface Milestone {
  period: string;
  title: string;
  place: string;
  bullets: string[];
}

export const milestones: Milestone[] = [
  {
    period: '2024',
    title: 'Ing. en Computación',
    place: 'Facultad de Ciencias Exactas y Tecnologías, UNT',
    bullets: [
      'Formación en algoritmos, estructuras de datos y arquitectura de software.',
      'Trabajos aplicados a datos, simulación y desarrollo de sistemas.',
    ],
  },
  {
    period: 'Actualidad',
    title: 'Software Developer',
    place: 'En búsqueda activa / freelance',
    bullets: [
      'Desarrollo web con Angular y TypeScript, con foco en experiencia de usuario.',
      'Soluciones de datos e inteligencia artificial aplicadas a problemas reales.',
    ],
  },
  /* TODO: copiá este bloque para agregar una experiencia laboral real
  {
    period: '2025 - Presente',
    title: 'Desarrollador Full Stack',
    place: 'Nombre de la empresa',
    bullets: [
      'Logro o responsabilidad concreto y medible.',
      'Otro logro con la tecnología y el impacto.',
    ],
  },
  */
];
