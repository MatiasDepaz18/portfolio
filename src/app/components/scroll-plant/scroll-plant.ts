import { Component, ElementRef, afterNextRender, viewChild, type OnDestroy } from '@angular/core';
import { GsapService } from '../../services/gsap.service';
import { PiranhaPlant } from '../../game/sprites/piranha-plant';

/**
 * Planta decorativa fija al borde derecho de la ventana, dentro de un
 * caño. La planta emerge del caño según el progreso de scroll de toda
 * la página (GSAP ScrollTrigger con scrub sobre el documento).
 * Con prefers-reduced-motion queda estática asomando (sin GSAP).
 */
@Component({
  selector: 'app-scroll-plant',
  standalone: true,
  imports: [PiranhaPlant],
  templateUrl: './scroll-plant.html',
  styleUrl: './scroll-plant.css',
})
export class ScrollPlant implements OnDestroy {
  private wrap = viewChild<ElementRef<HTMLDivElement>>('wrap');
  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;

  constructor(private gsapService: GsapService) {
    afterNextRender(() => {
      if (
        typeof window.matchMedia !== 'function' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      void this.initScrub();
    });
  }

  private async initScrub(): Promise<void> {
    const wrapEl = this.wrap()?.nativeElement;
    if (!wrapEl) {
      return;
    }
    const gsap = await this.gsapService.get();

    this.ctx = gsap.context(() => {
      gsap.fromTo(
        wrapEl,
        { yPercent: 40 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        },
      );
    });

    const onLoad = () => this.gsapService.refresh();
    window.addEventListener('load', onLoad);
    this.cleanup = () => {
      window.removeEventListener('load', onLoad);
      this.ctx?.revert();
    };
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}