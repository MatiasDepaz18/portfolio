import { Component, ElementRef, afterNextRender, viewChild, type OnDestroy } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { GsapService } from '../../services/gsap.service';
import { Character } from '../character/character';
import { Badge } from '../shared/badge/badge';
import { Coin } from '../shared/coin/coin';
import { GameButton } from '../shared/game-button/game-button';
import { RevealDirective } from '../../directives/reveal.directive';
import { site } from '../../data/site.data';

const COINS = ['3+ AÑOS IT', 'SOFTWARE', 'AI / ML', 'DATA'];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [Character, Badge, Coin, GameButton, RevealDirective, NgIcon],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnDestroy {
  readonly coins = COINS;
  readonly cvUrl = site.cvUrl;

  private stage = viewChild<ElementRef<HTMLDivElement>>('stage');
  private character = viewChild(Character);
  private title = viewChild<ElementRef<HTMLHeadingElement>>('title');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;
  private proximity: IntersectionObserver | null = null;

  constructor(private gsapService: GsapService) {
    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen IntersectionObserver ni necesitan GSAP.
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      const section = document.getElementById('about');
      if (!section) {
        return;
      }
      // GSAP se carga recién cuando About está cerca del viewport.
      this.proximity = new IntersectionObserver(
        () => {
          this.proximity?.disconnect();
          void this.initTonguePull();
        },
        { rootMargin: '300px 0px' },
      );
      this.proximity.observe(section);
    });
  }

  /**
   * Momento narrativo: Tili entra, saca la lengua, agarra el título
   * "Sobre mí" y lo trae a escena. Una vez, no bloquea nada.
   */
  private async initTonguePull(): Promise<void> {
    const stageEl = this.stage()?.nativeElement;
    const charEl = this.character()?.body().nativeElement;
    const tongueEl = this.character()?.tongue().nativeElement;
    const titleEl = this.title()?.nativeElement;
    if (!stageEl || !charEl || !tongueEl || !titleEl) {
      return;
    }

    const gsap = await this.gsapService.get();

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // La lengua mide 44 unidades en el viewBox 140. Convertimos a px reales.
        const svgScale = charEl.getBoundingClientRect().width / 140;
        const tongueWorld = 44 * svgScale;
        const gap = titleEl.getBoundingClientRect().left - stageEl.getBoundingClientRect().right;
        const tongueScale = Math.max(1.5, Math.min(4.5, gap / tongueWorld));
        const shift = Math.max(48, Math.min(110, gap * 0.55));

        gsap.set(charEl, { x: -180, opacity: 0 });
        gsap.set(tongueEl, { scaleX: 0.06, svgOrigin: '104 66' });
        gsap.set(titleEl, { x: shift, y: -64, opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: titleEl,
            start: 'top 82%',
            once: true,
          },
        });

        tl.to(charEl, { x: 0, opacity: 1, duration: 0.55 })
          .to(charEl, { y: -9, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' })
          .to(tongueEl, { scaleX: tongueScale, duration: 0.42, ease: 'power2.in' }, '<0.1')
          .to(
            titleEl,
            { rotate: 2, duration: 0.08, yoyo: true, repeat: 5, ease: 'sine.inOut' },
            '>-0.05',
          )
          .to(tongueEl, { scaleX: 0.06, duration: 0.5, ease: 'power2.in' })
          .to(
            titleEl,
            { x: 0, y: 0, opacity: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' },
            '<0.02',
          )
          .to(charEl, { x: 260, y: -20, opacity: 0, duration: 0.5, ease: 'power2.in' }, '>-0.15');
      });
    });

    this.ctx = ctx;

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
