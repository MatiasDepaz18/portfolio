import {
  Directive,
  ElementRef,
  Inject,
  Input,
  type AfterViewInit,
  type OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

/**
 * Reveal al entrar al viewport. Usa IntersectionObserver + CSS,
 * sin tocar el main thread por frame (no usa listeners de scroll).
 * Uso: <div appReveal appRevealDelay="120">...</div>
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  @Input() appRevealDelay = 0;

  private observer: IntersectionObserver | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const node = this.el.nativeElement;
    node.classList.add('reveal');
    if (this.appRevealDelay) {
      node.style.setProperty('--reveal-delay', `${this.appRevealDelay}ms`);
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          node.classList.add('is-in');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
