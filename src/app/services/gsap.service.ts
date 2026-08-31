import { Injectable } from '@angular/core';
import type * as GSAP from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Lazy loader para GSAP + ScrollTrigger.
 * Solo se importa el bundle pesado cuando una animación lo pide,
 * y todo se ejecuta en el cliente (SSR-safe).
 */
@Injectable({ providedIn: 'root' })
export class GsapService {
  private gsap: typeof GSAP.gsap | null = null;
  private scrollTrigger: typeof ScrollTrigger | null = null;

  async get(): Promise<typeof GSAP.gsap> {
    if (!this.gsap) {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      this.gsap = gsap;
      this.scrollTrigger = ScrollTrigger;
    }
    return this.gsap;
  }

  /** Llamar después de cargar fuentes/imágenes para recalcular triggers. */
  refresh(): void {
    this.scrollTrigger?.refresh();
  }
}
