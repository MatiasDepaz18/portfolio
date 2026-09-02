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
      'Portfolio personal interactivo con una experiencia de navegación inspirada en videojuegos retro, utilizando un sistema de cartuchos para presentar proyectos y tecnologías.',
    problem:
      'Un portfolio convencional no refleja mi interés por combinar desarrollo de software, diseño e interacción.',
    solution:
      'Desarrollo de una experiencia web propia con animaciones, navegación interactiva y una arquitectura orientada a componentes reutilizables.',
    stack: ['Angular', 'TypeScript', 'Tailwind', 'GSAP', 'SSR'],
    repoUrl: 'https://github.com/MatiasDepaz18/portfolio',
    image: 'assets/projects/Super_Mario_Bros._Logo.svg',
    status: 'EN CURSO',
  },

  {
    title: 'CRM Conversacional con IA',
    description:
      'Plataforma CRM conversacional integrada con WhatsApp para automatizar la atención al cliente y la gestión de turnos mediante agentes de inteligencia artificial.',
    problem:
      'La gestión manual de consultas y turnos genera tareas repetitivas y dificulta centralizar las conversaciones y la información de los clientes.',
    solution:
      'Desarrollo de un CRM multi-tenant con agentes de IA, integración con WhatsApp y Google Calendar, autenticación, roles y APIs para automatizar conversaciones y gestión de turnos.',
    stack: [
      'React',
      'Next.js',
      'TypeScript',
      'Python',
      'FastAPI',
      'PostgreSQL',
      'Docker',
      'Claude API',
      'LangChain',
    ],
    repoUrl: '',
    status: 'SHIPPED',
  },

  {
    title: 'Sistema de Publicidad y Subsidios',
    description:
      'Sistema web empresarial para gestionar publicidad institucional, subsidios, proveedores, cuentas bancarias y procesos administrativos.',
    problem:
      'La gestión de procesos administrativos y financieros requería centralizar información proveniente de diferentes áreas y sistemas internos.',
    solution:
      'Desarrollo end-to-end de una plataforma web con módulos administrativos, APIs backend e integración con sistemas internos de compras, presupuestos y proveedores.',
    stack: [
      'React',
      'TypeScript',
      'TailwindCSS',
      'Python',
      'Django',
      'PostgreSQL',
      'Docker',
    ],
    repoUrl: '',
    status: 'SHIPPED',
  },

  {
    title: 'Videojuegos Inclusivos con Computer Vision',
    description:
      'Aplicación que permite controlar videojuegos mediante gestos faciales, diseñada para facilitar la interacción de personas con discapacidades motrices.',
    problem:
      'Los controles tradicionales pueden representar una barrera para personas con movilidad reducida que desean interactuar con videojuegos.',
    solution:
      'Desarrollo de un sistema de reconocimiento facial capaz de interpretar gestos y movimientos para transformarlos en comandos de control dentro de videojuegos.',
    stack: [
      'Python',
      'TensorFlow',
      'OpenCV',
      'MediaPipe',
      'Keras',
      'PyInstaller',
    ],
    repoUrl: '',
    status: 'SHIPPED',
  },

  {
    title: 'Detección de Eventos Cardíacos',
    description:
      'Sistema de clasificación basado en Machine Learning para detectar eventos cardíacos a partir de datos biomédicos.',
    problem:
      'El análisis manual de grandes volúmenes de información biomédica puede resultar complejo y dificultar la identificación automática de determinados patrones.',
    solution:
      'Procesamiento de datos y entrenamiento de modelos de clasificación utilizando redes neuronales para identificar patrones asociados a eventos cardíacos.',
    stack: [
      'Python',
      'TensorFlow',
      'Keras',
      'Pandas',
      'NumPy',
      'Machine Learning',
    ],
    repoUrl: '',
    status: 'SHIPPED',
  },

  {
    title: 'Vehículo Autónomo',
    description:
      'Proyecto de conducción autónoma basado en visión por computadora y redes neuronales para interpretar el entorno y tomar decisiones de conducción.',
    problem:
      'Un vehículo autónomo necesita interpretar imágenes del entorno y detectar elementos relevantes para poder tomar decisiones en tiempo real.',
    solution:
      'Implementación de redes neuronales convolucionales y procesamiento de imágenes para detectar elementos del entorno y generar información utilizada durante la conducción.',
    stack: [
      'Python',
      'OpenCV',
      'TensorFlow',
      'Computer Vision',
      'CNN',
    ],
    repoUrl: '',
    status: 'SHIPPED',
  },
];