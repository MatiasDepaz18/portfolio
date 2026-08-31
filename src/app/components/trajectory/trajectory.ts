import { Component, ElementRef, afterNextRender, viewChild, type OnDestroy } from '@angular/core';
import { GsapService } from '../../services/gsap.service';
import { SectionShell } from '../shared/section-shell/section-shell';
import { Flag } from '../shared/flag/flag';
import { RevealDirective } from '../../directives/reveal.directive';
import { milestones } from '../../data/experience.data';

@Component({
  selector: 'app-trajectory',
  standalone: true,
  imports: [SectionShell, Flag, RevealDirective],
  templateUrl: './trajectory.html',
  styleUrl: './trajectory.css',
})
export class Trajectory implements OnDestroy {
  readonly milestones = milestones;

  private course = viewChild<ElementRef<HTMLDivElement>>('course');
  private fill = viewChild<ElementRef<HTMLSpanElement>>('fill');
  private walker = viewChild<ElementRef<HTMLDivElement>>('walker');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;
  private proximity: IntersectionObserver | null = null;

  constructor(private gsapService: GsapService) {
    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen IntersectionObserver ni necesitan GSAP.
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      const section = document.getElementById('trajectory');
      if (!section) {
        return;
      }
      // GSAP se carga recién cuando Trayectoria está cerca del viewport.
      this.proximity = new IntersectionObserver(
        () => {
          this.proximity?.disconnect();
          void this.initCourseScrub();
        },
        { rootMargin: '300px 0px' },
      );
      this.proximity.observe(section);
    });
  }

  /**
   * El recorrido se dibuja al scrollear: la línea avanza y Tili camina
   * desde START hasta la bandera. Solo desktop (mobile: línea vertical).
   */
  private async initCourseScrub(): Promise<void> {
    const courseEl = this.course()?.nativeElement;
    const fillEl = this.fill()?.nativeElement;
    const walkerEl = this.walker()?.nativeElement;
    if (!courseEl || !fillEl || !walkerEl) {
      return;
    }

    const gsap = await this.gsapService.get();

    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const distance = courseEl.clientWidth - walkerEl.clientWidth - 24;

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: courseEl,
            start: 'top 75%',
            end: 'bottom 55%',
            scrub: 0.6,
          },
        });

        tl.fromTo(fillEl, { scaleX: 0 }, { scaleX: 1 }, 0).fromTo(
          walkerEl,
          { x: 0 },
          { x: distance },
          0,
        );
      });
    });

    const onLoad = () => this.gsapService.refresh();
    window.addEventListener('load', onLoad);
    this.cleanup = () => {
      window.removeEventListener('load', onLoad);
      this.ctx?.revert();
    };
  }

  ngOnDestroy(): void {
    this.proximity?.disconnect();
    this.cleanup?.();
  }
}
