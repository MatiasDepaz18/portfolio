/**
 * EDUCACIÓN - logros académicos.
 * Cada entry aparece como un card compacto en la sección Educación:
 * título + duración + datos de la carrera. Al tocar la miniatura del
 * documento se abre un carrousel con las fotos de cómo viviste la
 * carrera (portada = foto del título, después `photos`).
 */
export interface Education {
  /** Tiempo que llevó la carrera (ej: "2017 — 2024"). */
  period: string;
  degree: string;
  institution: string;
  bullets: string[];
  /** Portada: foto del título / documento. Primera imagen del carrousel. */
  image?: string;
  /** Texto alternativo de la portada. */
  imageAlt?: string;
  /** Fotos de tu tiempo en la carrera (se recorren en el carrousel). */
  photos?: string[];
  /** Leyenda por imagen (portada + fotos, en el mismo orden). Opcional. */
  photoCaptions?: string[];
}

export const educationEntries: Education[] = [
  {
    period: '2021 — 2025',
    degree: 'Ing. en Computación',
    institution: 'Facultad de Ciencias Exactas y Tecnologías, UNT',
    bullets: [
      'Formación en algoritmos, estructuras de datos y arquitectura de software.',
      'Trabajos aplicados a datos, simulación y desarrollo de sistemas.',
    ],
    // Fotos reales en src/assets/education/ (ver el README de esa carpeta).
    // La portada es el título; `photos` son las fotos de la facultad.
    // Al completar los campos, el card muestra la miniatura y se abre el carrousel:
     image: 'assets/education/titulo.webp',
     imageAlt: 'Título de Ingeniero en Computación',
    photos: [
      'assets/education/facultad.webp',
      'assets/education/titulo.webp',
    ],
    // photoCaptions: [
    //   'Título de grado · UNT',
    //   'Últimas materias',
    //   'Egresados 2024',
    // ],
  },
];