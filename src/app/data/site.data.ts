/**
 * DATOS DEL SITIO - editá acá tus datos reales.
 * Buscá los TODO y reemplazalos.
 */
export interface SiteData {
  name: string;
  role: string;
  email: string;
  github: string;
  githubHandle: string;
  linkedin: string;
  linkedinHandle: string;
  cvUrl: string;
  location: string;
}

export const site: SiteData = {
  name: 'Matías Depaz',
  role: 'Software & AI Engineer',
  // TODO: reemplazar con tu email real
  email: 'tu-email@gmail.com',
  github: 'https://github.com/MatiasDepaz18',
  githubHandle: 'github.com/MatiasDepaz18',
  // TODO: reemplazar con tu perfil real de LinkedIn
  linkedin: 'https://www.linkedin.com/in/tu-usuario',
  linkedinHandle: 'linkedin.com/in/tu-usuario',
  // TODO: si no existe public/cv.pdf, borrá la línea o apuntá a tu CV
  cvUrl: '/cv.pdf',
  location: 'Tucumán, Argentina',
};
