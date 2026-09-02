/**
 * EDUCACIÓN - logros académicos.
 * Cada entry aparece como un logro desbloqueado en la sección Educación.
 */
export interface Education {
  period: string;
  degree: string;
  institution: string;
  bullets: string[];
}

export const educationEntries: Education[] = [
  {
    period: '2024',
    degree: 'Ing. en Computación',
    institution: 'Facultad de Ciencias Exactas y Tecnologías, UNT',
    bullets: [
      'Formación en algoritmos, estructuras de datos y arquitectura de software.',
      'Trabajos aplicados a datos, simulación y desarrollo de sistemas.',
    ],
  },
];