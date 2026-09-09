/**
 * EXPERIENCIA LABORAL - fortalezas del mapa de mundos.
 * Cada milestone es una fortaleza: tocá una en el mapa para que Yoshi
 * viaje hasta ahí y el panel de abajo muestre el detalle del trabajo.
 *
 * El mapa reparte los castillos solos según cuántas entradas haya.
 */
export interface Milestone {
  /** Label corto que aparece en la fortaleza del mapa (ej: "DATA ENGINEER").
   *  Si no se define, se usa `title`. */
  label?: string;
  /** Tiempo en el trabajo (ej: "2026 - Actualidad"). */
  period: string;
  /** Título del puesto (ej: "Analista de Datos / Data Engineer"). */
  title: string;
  /** Empresa / lugar. */
  place: string;
  /** Ruta del logo de la empresa (se muestra en un cuadrado). Opcional:
   *  si no existe, se muestra la inicial de `place`. */
  logo?: string;
  /** Línea corta opcional que resume el rol. */
  description?: string;
  /** Logros / responsabilidades del trabajo. */
  bullets: string[];
  /** Tecnologías usadas (aparecen como etiquetas). */
  tech: string[];
}

export const milestones: Milestone[] = [
  {
    label: 'DATA ENGINEER',
    period: '2026 - Actualidad',
    title: 'Analista de Datos / Data Engineer',
    place: 'La Gaceta',
    bullets: [
      'Desarrollo de pipelines ETL y automatización de procesos de datos con Python y SQL.',
      'Integración, transformación y procesamiento de información de múltiples fuentes.',
      'Procesamiento y análisis con BigQuery, Snowflake, Azure Data Factory y Databricks.',
      'Construcción de dashboards y métricas con Power BI y Looker Studio.',
      'Extracción y estructuración de información mediante web scraping y herramientas basadas en IA.',
      'Validación, control de calidad y trazabilidad de datos para garantizar la confiabilidad.',
      'Análisis de métricas de negocio y comportamiento de usuarios para soportar decisiones.',
    ],
    tech: ['Python', 'SQL', 'BigQuery', 'Snowflake', 'Azure Data Factory', 'Databricks', 'Power BI', 'Looker Studio'],
  },
  {
    label: 'FULLSTACK & AI',
    period: '2025 - 2026',
    title: 'Desarrollador FullStack & AI',
    place: 'Caja Popular de Ahorros',
    bullets: [
      'Desarrollo y mantenimiento de aplicaciones empresariales en producción con React, TypeScript, Next.js, Node.js, Python, Django, FastAPI y PostgreSQL.',
      'Integración con servicios y APIs externas, incluyendo sistemas relacionados con ARCA/AFIP.',
      'Uso de Redis para gestión de sesiones y soporte a procesos concurrentes.',
      'Desarrollo y despliegue con Docker y pipelines CI/CD con GitLab.',
      'Participación en análisis de requerimientos, diseño técnico, priorización y despliegue.',
      'Implementación de agentes y skills para generación de código con Claude Code.',
      'Análisis funcional y toma de requerimientos con los clientes del área correspondiente.',
      'Respuesta y resolución de tickets internos.',
    ],
    tech: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'GitLab CI/CD'],
  },
  {
    label: 'INFRA IT',
    period: '2024 - 2025',
    title: 'Administrador de Servidores / Infraestructura IT',
    place: 'SOLMAR',
    bullets: [
      'Administración y mantenimiento de servicios DNS, HTTP, MAIL y DHCP.',
      'Gestión de infraestructura de red y resolución de incidentes técnicos.',
      'Configuración y mantenimiento de routers, switches y sistemas de videovigilancia.',
      'Administración de infraestructura con TCP/IP y MikroTik RouterOS.',
      'Soporte sobre sistemas VoIP utilizando SIP/PJSIP.',
      'Mantenimiento básico de bases de datos y servicios SQL Server.',
    ],
    tech: ['TCP/IP', 'MikroTik', 'VoIP / SIP', 'SQL Server', 'DNS', 'HTTP', 'DHCP'],
  },
  {
    label: 'DOCENTE',
    period: '2023 - Actualidad',
    title: 'Ayudante de Cátedra / Docente',
    place: 'Universidad Nacional de Tucumán',
    bullets: [
      'Enseñanza y asistencia académica en programación, bases de datos, algoritmos y estructuras de datos.',
      'Desarrollo de material práctico y acompañamiento de estudiantes en problemas computacionales.',
      'Docencia en el área de Bases de Datos desde 2026.',
    ],
    tech: ['Programación', 'Bases de datos', 'Algoritmos', 'Estructuras de datos', 'Métodos numéricos'],
  },
  /* TODO: copiá este bloque para agregar un trabajo real
  {
    label: 'TU LABEL',
    period: '2025 - Presente',
    title: 'Tu Puesto',
    place: 'Nombre de la empresa',
    logo: 'assets/company/logo.png',
    description: 'Una línea corta opcional.',
    bullets: ['Logro o responsabilidad 1.', 'Logro o responsabilidad 2.'],
    tech: ['Tecnología 1', 'Tecnología 2'],
  },
  */
];