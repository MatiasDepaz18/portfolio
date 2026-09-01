import { Component, ElementRef, Inject, PLATFORM_ID, afterNextRender, viewChild, type OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GsapService } from '../../services/gsap.service';
import { YoshiCharacter } from '../../game/sprites/yoshi-character';
import { HeroTongue, TONGUE_SEGMENT_WIDTH_PX } from './hero-tongue';

/**
 * Escena de Yoshi en el hero (se ejecuta UNA vez, al cargar):
 *
 *   0. La CORTINA (hero-curtain, estilo Mario Bros) cubre el hero desde
 *      el render inicial: es la máscara de carga, no se ve ningún estado
 *      intermedio. Con reduced-motion la cortina no existe (CSS) y el
 *      contenido es visible de entrada.
 *   1. Al arrancar, GSAP oculta el hero-grid a la derecha (x:
 *      innerWidth, opacity 0, scale 1.25) y la cortina se abre hacia
 *      arriba (yPercent -100, 0.65s) mientras Yoshi ya viene caminando
 *      por detrás, emergiendo a mitad de apertura.
 *   2. Yoshi entra CAMINANDO (walk) mientras se desliza hacia su lugar
 *      en el medio-izquierdo del hero. Su sombra de piso aparece con él.
 *   3. Al llegar hace una VOLTERETA (flip, con arco de GSAP); la sombra
 *      se achica mientras está en el aire.
 *   4. Aterriza en la pose de lengua (tongueIdle = tongueStyles/01) con
 *      un pequeño "plant"; la sombra vuelve a su tamaño.
 *   5. Saca la lengua: los segmentos de tongueStyles/02 (punta: /05) se
 *      despliegan en barrido lineal de izquierda a derecha (scaleX 0 -> 1,
 *      origin left, un pedazo por vez) desde la boca hasta el borde
 *      derecho del hero. El barrido dura SIEMPRE 1.5s (el paso por
 *      segmento se deriva de la cantidad: no se alarga en pantallas
 *      anchas).
 *   6. SUCCIÓN: el hero-grid vuelve desde la derecha (ease power3.in,
 *      acelera al final = absorbido) y se acomoda de escala 1.25 -> 1
 *      mientras la lengua se contrae y DESVANECE en cascada real desde
 *      la punta hacia la boca, un pedazo por vez ("comiéndolo"). La
 *      retracción dura lo mismo que el vuelo del grid (0.95s) y termina
 *      exacto cuando el hero aterriza.
 *   7. Yoshi se da vuelta (espejo scaleX -1) y se va CAMINANDO (walk)
 *      hacia la izquierda; la sombra es simétrica y lo acompaña (vive
 *      dentro del stage) y el overflow del hero lo corta al salir. El
 *      contenido queda en su lugar normal.
 *
 * El cuerpo de Yoshi cambia de estado (walk -> flip -> tongueIdle ->
 * walk); la lengua es un sprite compuesto aparte (HeroTongue).
 */
@Component({
  selector: 'app-hero-yoshi',
  standalone: true,
  imports: [YoshiCharacter, HeroTongue],
  template: `
    <div class="hero-yoshi" aria-hidden="true">
      <div class="hero-yoshi-stage" #yoshiStage>
        <app-yoshi-character #yoshi state="tongueIdle" />
        <div class="hero-yoshi-shadow" #shadowEl></div>
      </div>
      <div class="hero-yoshi-tongue" #tongueWrap>
        <app-hero-tongue #tongue />
      </div>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
    }

    .hero-yoshi {
      position: absolute;
      left: 10%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 8.5rem;
    }

    .hero-yoshi-stage {
      position: relative;
      width: 100%;
    }

    /* Sombra de piso: ancla el personaje (opacity 0 hasta que la escena
       la muestra; en SSR / reduced-motion no aparece).
       En dark el fondo es casi negro (#0b0f0d): la sombra necesita ser
       muy oscura para notarse. En light se atenúa. */
    .hero-yoshi-shadow {
      position: absolute;
      left: 50%;
      bottom: -0.4rem;
      transform: translateX(-50%);
      width: 75%;
      height: 0.7rem;
      border-radius: 9999px;
      background: radial-gradient(ellipse, rgb(0 0 0 / 0.8), transparent 70%);
      opacity: 0;
      pointer-events: none;
    }

    :host-context([data-theme='light']) .hero-yoshi-shadow {
      background: radial-gradient(ellipse, rgb(0 0 0 / 0.3), transparent 70%);
    }

    /* La lengua sale de la boca (tongueStyles/01 tiene la boca a la derecha) */
    .hero-yoshi-tongue {
      position: absolute;
      left: 68%;
      top: 42%;
      transform: translateY(-50%);
    }

    @media (max-width: 767px) {
      .hero-yoshi {
        left: 16%;
        width: 6.5rem;
      }

      /* Misma alineación que desktop: la boca está en la misma posición
         relativa del stage (aspect-ratio fijo). */
      .hero-yoshi-tongue {
        left: 68%;
        top: 39%;
      }
    }
  `,
})
export class HeroYoshi implements OnDestroy {
  private yoshi = viewChild(YoshiCharacter);
  private tongue = viewChild(HeroTongue);
  private tongueWrap = viewChild<ElementRef<HTMLDivElement>>('tongueWrap');
  private stage = viewChild<ElementRef<HTMLDivElement>>('yoshiStage');
  private shadow = viewChild<ElementRef<HTMLDivElement>>('shadowEl');

  private ctx: { revert: () => void } | null = null;
  private cleanup: (() => void) | null = null;

  constructor(
    private gsapService: GsapService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    // Pre-carga GSAP apenas se construye el componente (solo cliente):
    // la descarga del chunk se solapa con la hidratación en vez de
    // esperarla dentro de la escena.
    if (isPlatformBrowser(this.platformId)) {
      void this.gsapService.get();
    }
    afterNextRender(() => {
      // Guard: jsdom/test envs no tienen matchMedia ni necesitan GSAP.
      if (typeof window.matchMedia !== 'function') {
        return;
      }
      void this.initScene();
    });
  }

  private async initScene(): Promise<void> {
    const stageEl = this.stage()?.nativeElement;
    const tongueWrapEl = this.tongueWrap()?.nativeElement;
    const shadowEl = this.shadow()?.nativeElement;
    const tongue = this.tongue();
    const yoshi = this.yoshi();
    if (!stageEl || !tongueWrapEl || !shadowEl || !tongue || !yoshi) {
      return;
    }

    const gsap = await this.gsapService.get();

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const heroGrid = document.querySelector<HTMLElement>('.hero-grid');
        const curtain = document.querySelector<HTMLElement>('.hero-curtain');
        if (!heroGrid || !curtain) {
          return;
        }
        // La lengua cruza todo el hero (el exceso se corta en overflow hidden).
        tongue.build(Math.ceil(window.innerWidth / TONGUE_SEGMENT_WIDTH_PX) + 1);
        void this.runScene(gsap, heroGrid, curtain, stageEl, tongueWrapEl, shadowEl, yoshi);
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

  private async runScene(
    gsap: typeof import('gsap').gsap,
    heroGrid: HTMLElement,
    curtain: HTMLElement,
    stageEl: HTMLDivElement,
    tongueWrapEl: HTMLDivElement,
    shadowEl: HTMLDivElement,
    yoshi: YoshiCharacter,
  ): Promise<void> {
    // Espera dos frames: los segmentos se renderizan tras build().
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const segments = gsap.utils.toArray<HTMLElement>('.hero-tongue-segment');
    if (segments.length === 0) {
      return;
    }
    // El barrido completo dura SIEMPRE 1.5s (deploy) y 0.95s (retract),
    // sin importar cuántos segmentos haya: el paso por pedazo se deriva
    // del total y así la escena no se alarga en pantallas anchas.
    const deployStep = 1.5 / segments.length;
    const retractStep = 0.95 / segments.length;
    // Distancia para salir caminando por el borde izquierdo del hero
    // (cubre desktop y mobile; el overflow hidden lo corta al salir).
    const exitX = -(window.innerWidth * 0.2 + 160);

    // Entrada: Yoshi camina hacia su lugar.
    yoshi.setState('walk');
    gsap.set(stageEl, { x: -160, opacity: 0 });
    gsap.set(tongueWrapEl, { opacity: 0 });
    gsap.set(shadowEl, { opacity: 0, scaleX: 1 });
    gsap.set(segments, { scaleX: 0, transformOrigin: 'left center' });
    // El hero-grid está visible hasta acá: la escena arranca ocultándolo
    // a la derecha (x: innerWidth, scale 1.25) y la cortina se abre hacia
    // arriba mientras Yoshi ya viene caminando por detrás (emerge a mitad
    // de apertura). La cortina es la máscara de carga: cubre el hero
    // desde el render inicial y la abre GSAP recién acá.
    gsap.set(heroGrid, { x: window.innerWidth, scale: 1.25, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.to(curtain, { yPercent: -100, duration: 0.65, ease: 'power2.inOut' }, 0)
      .to(stageEl, { x: 0, opacity: 1, duration: 0.6 }, '<0.25')
      .to(shadowEl, { opacity: 1, duration: 0.3 }, '<0.15')
      // Voltereta al llegar: flip + arco; la sombra se achica en el aire.
      .call(() => yoshi.setState('flip'), undefined, '>-0.05')
      .to(stageEl, { y: -80, duration: 0.27, ease: 'power2.out' }, '<0.05')
      .to(shadowEl, { scaleX: 0.55, opacity: 0.5, duration: 0.27 }, '<')
      .to(stageEl, { y: 0, duration: 0.27, ease: 'power2.in' }, '>-0.02')
      .to(shadowEl, { scaleX: 1, opacity: 1, duration: 0.27 }, '<')
      // Aterriza en la pose de lengua (tongueStyles/01) con un "plant".
      .call(() => yoshi.setState('tongueIdle'), undefined, '>-0.05')
      .to(stageEl, { y: 5, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<')
      // Despliegue: barrido lineal de izquierda a derecha. Con stagger ==
      // duration, un solo pedazo se llena a la vez y el siguiente arranca
      // justo cuando el anterior completó (frente continuo, sin huecos).
      .to(tongueWrapEl, { opacity: 1, duration: 0.15 }, '>-0.05')
      .to(
        segments,
        { scaleX: 1, duration: deployStep, stagger: deployStep, ease: 'power2.out' },
        '>-0.05',
      )
      // Pausa: la lengua llegó al borde derecho del hero.
      .to({}, { duration: 0.2 })
      // SUCCIÓN: el grid vuelve desde la derecha mientras la lengua se
      // contrae y DESVANECE en cascada desde la punta hacia la boca, un
      // pedazo por vez ("comiéndolo"). El grid llega grande (1.25) y se
      // acomoda a escala 1 con un ease propio y suave. El retract dura lo
      // mismo que el vuelo del grid y arranca en "<", así la lengua se
      // termina de comer exacto cuando el hero aterriza.
      .to(heroGrid, { x: 0, opacity: 1, duration: 0.95, ease: 'power3.in' }, '>-0.05')
      .to(heroGrid, { scale: 1, duration: 0.95, ease: 'power2.inOut' }, '<')
      .to(
        segments,
        {
          scaleX: 0,
          opacity: 0,
          duration: retractStep,
          stagger: { each: retractStep, from: 'end' },
          ease: 'power3.in',
        },
        '<',
      )
      // Salida: se da vuelta (espejo scaleX -1, queda mirando a la
      // izquierda), queda parado un momento, cambia a walk y se va
      // caminando hacia la izquierda. La sombra es simétrica y vive
      // dentro del stage, así que se espeja sin notarse y se va con él;
      // el overflow del hero lo corta al salir por el borde.
      .call(() => yoshi.setState('walk'), undefined, '>-0.1')
      .to(stageEl, { scaleX: -1, duration: 0.18, ease: 'power2.inOut' }, '<')
      .to({}, { duration: 0.3 })
      .to(stageEl, { x: exitX, duration: 1.4, ease: 'power1.in' });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
