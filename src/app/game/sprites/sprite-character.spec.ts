import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpriteCharacter } from './sprite-character';
import { YOSHI_SHEET } from './yoshi.sprites';
import { boxOf, frameGeometry, stageBoxOf } from './sprite-geometry';

describe('sprite-geometry', () => {
  it('boxOf: el box es el frame más grande de la animación', () => {
    const box = boxOf(YOSHI_SHEET.animations['tongue']);
    expect(box).toEqual({ width: 76, height: 25 });
  });

  it('stageBoxOf: usa el stageBox del sheet si existe (proporciones estables)', () => {
    const box = stageBoxOf(YOSHI_SHEET, YOSHI_SHEET.animations['tongue']);
    expect(box).toEqual({ width: 27, height: 32 });
  });

  it('stageBoxOf: cae al box de la animación si el sheet no declara stageBox', () => {
    const sheetNoStage = { ...YOSHI_SHEET, stageBox: undefined };
    const box = stageBoxOf(sheetNoStage, YOSHI_SHEET.animations['tongue']);
    expect(box).toEqual({ width: 76, height: 25 });
  });

  it('frameGeometry: dimensiona el frame relativo al ALTO del box (anchor bottom-center)', () => {
    const box = boxOf(YOSHI_SHEET.animations['tongue']);
    const g = frameGeometry(YOSHI_SHEET.animations['tongue'].frames[0], box);
    expect(g.fw).toBeCloseTo(29 / 25, 6);
    expect(g.fh).toBeCloseTo(25 / 25, 6);
  });

  it('frameGeometry: frames de una misma animación comparten el box', () => {
    const box = boxOf(YOSHI_SHEET.animations['run']);
    expect(box).toEqual({ width: 26, height: 31 });
  });
});

describe('YOSHI_SHEET', () => {
  it('todas las coordenadas caen dentro del sheet 564x281', () => {
    for (const [name, anim] of Object.entries(YOSHI_SHEET.animations)) {
      for (const f of anim.frames) {
        expect(f.source.x, `${name} x`).toBeGreaterThanOrEqual(0);
        expect(f.source.y, `${name} y`).toBeGreaterThanOrEqual(0);
        expect(f.source.x + f.source.width, `${name} right`).toBeLessThanOrEqual(
          YOSHI_SHEET.sheetWidth,
        );
        expect(f.source.y + f.source.height, `${name} bottom`).toBeLessThanOrEqual(
          YOSHI_SHEET.sheetHeight,
        );
      }
    }
  });

  it('cada frame apunta a su PNG individual con patrón basePath/anim/NN.png en orden', () => {
    // tongueIdle y tongueFall reutilizan PNG de otras animaciones (src custom).
    for (const [name, anim] of Object.entries(YOSHI_SHEET.animations)) {
      anim.frames.forEach((f, i) => {
        if (name === 'tongueIdle' || name === 'tongueFall') return;
        const n = String(i + 1).padStart(2, '0');
        expect(f.src).toBe(`${YOSHI_SHEET.basePath}/${name}/${n}.png`);
        expect(f.width).toBe(f.source.width);
        expect(f.height).toBe(f.source.height);
      });
    }
  });

  it('expone los estados del nuevo sheet (mapeo de 5 filas)', () => {
    const expected = [
      'walk',
      'think',
      'lookBack',
      'crouch',
      'jump',
      'flip',
      'fall',
      'grab',
      'throwSlow',
      'throwFast',
      'run',
      'runFast',
      'runJump',
      'tongue',
      'tongueIdle',
      'tongueFall',
      'tongueUp',
      'tongueStyles',
      'tongueUpStyles',
    ];
    for (const state of expected) {
      expect(YOSHI_SHEET.animations[state], state).toBeDefined();
    }
  });

  it('el conteo de frames coincide con el sheet (76 frames en total)', () => {
    const total = Object.values(YOSHI_SHEET.animations).reduce((n, a) => n + a.frames.length, 0);
    expect(total).toBe(76);
  });

  it('tongueIdle reutiliza tongueStyles/01.png y tongueFall reutiliza los segmentos de tongueStyles', () => {
    expect(YOSHI_SHEET.animations['tongueIdle'].frames[0].src).toBe(
      'assets/game/yoshi/tongueStyles/01.png',
    );
    expect(YOSHI_SHEET.animations['tongueFall'].frames[0].src).toBe(
      'assets/game/yoshi/tongueStyles/02.png',
    );
  });
});

describe('SpriteCharacter', () => {
  let fixture: ReturnType<typeof create>;

  function create() {
    TestBed.configureTestingModule({ imports: [SpriteCharacter] });
    const fx = TestBed.createComponent(SpriteCharacter);
    fx.componentRef.setInput('sheet', YOSHI_SHEET);
    fx.detectChanges();
    return fx;
  }

  function frameEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.sprite-frame') as HTMLElement;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = create();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('muestra el primer frame de la animación por defecto (think)', () => {
    expect(frameEl().style.backgroundImage).toContain('think/01.png');
  });

  it('cambia de estado y muestra el primer frame del nuevo estado', () => {
    fixture.componentRef.setInput('state', 'run');
    fixture.detectChanges();
    expect(frameEl().style.backgroundImage).toContain('run/01.png');
  });

  it('avanza frames según el FPS de la animación', () => {
    const advance = (ms: number): void => {
      vi.advanceTimersByTime(ms);
      fixture.detectChanges();
    };
    fixture.componentRef.setInput('state', 'walk');
    fixture.detectChanges();
    advance(167); // walk fps 6 -> ~167ms por frame
    expect(frameEl().style.backgroundImage).toContain('walk/02.png');
    advance(167);
    expect(frameEl().style.backgroundImage).toContain('walk/03.png');
    advance(167);
    expect(frameEl().style.backgroundImage).toContain('walk/04.png');
    advance(167);
    expect(frameEl().style.backgroundImage).toContain('walk/05.png');
    advance(167);
    expect(frameEl().style.backgroundImage).toContain('walk/01.png'); // loop
  });

  it('usa el fps declarado (tongue: 4fps = 250ms por frame)', () => {
    fixture.componentRef.setInput('state', 'tongue');
    fixture.detectChanges();
    vi.advanceTimersByTime(249);
    fixture.detectChanges();
    expect(frameEl().style.backgroundImage).toContain('tongue/01.png');
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(frameEl().style.backgroundImage).toContain('tongue/02.png');
  });

  it('estado inexistente cae a la animación por defecto sin errores', () => {
    expect(() => {
      fixture.componentRef.setInput('state', 'zzz-no-existe');
      fixture.detectChanges();
    }).not.toThrow();
    expect(frameEl().style.backgroundImage).toContain('think/01.png');
  });

  it('cambiar de animación reinicia el ciclo en el primer frame', () => {
    vi.advanceTimersByTime(1000); // think avanzó
    fixture.componentRef.setInput('state', 'flip');
    fixture.detectChanges();
    expect(frameEl().style.backgroundImage).toContain('flip/01.png');
  });

  it('aplica la escala como propiedad CSS scale (independiente de GSAP)', () => {
    fixture.componentRef.setInput('scale', 1.5);
    fixture.detectChanges();
    expect(frameEl().style.getPropertyValue('--s')).toBe('1.5');
  });

  it('con stageBox el host mantiene el aspect-ratio estable en cualquier estado', () => {
    const host = fixture.nativeElement.querySelector('.sprite-character') as HTMLElement;
    expect(host.style.aspectRatio).toBe('27 / 32');
    fixture.componentRef.setInput('state', 'tongue');
    fixture.detectChanges();
    expect(host.style.aspectRatio).toBe('27 / 32');
    fixture.componentRef.setInput('state', 'flip');
    fixture.detectChanges();
    expect(host.style.aspectRatio).toBe('27 / 32');
  });

  it('aplica el anchor bottom-left a la animación tongue (cuerpo a la izquierda)', () => {
    expect(frameEl().classList.contains('sprite-frame--bottom-left')).toBe(false);
    fixture.componentRef.setInput('state', 'tongue');
    fixture.detectChanges();
    expect(frameEl().classList.contains('sprite-frame--bottom-left')).toBe(true);
    fixture.componentRef.setInput('state', 'walk');
    fixture.detectChanges();
    expect(frameEl().classList.contains('sprite-frame--bottom-left')).toBe(false);
  });

  it('aplica el anchor top-left a tongueFall (la lengua cuelga y crece hacia abajo)', () => {
    fixture.componentRef.setInput('state', 'tongueFall');
    fixture.detectChanges();
    expect(frameEl().classList.contains('sprite-frame--top-left')).toBe(true);
    expect(frameEl().classList.contains('sprite-frame--bottom-left')).toBe(false);
  });

  it('una animación de un solo frame no crea timers', () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    fixture.componentRef.setInput('state', 'runJump');
    fixture.detectChanges();
    vi.advanceTimersByTime(2000);
    expect(frameEl().style.backgroundImage).toContain('runJump/01.png');
    spy.mockRestore();
  });

  it('la destrucción del componente limpia el timer', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    fixture.destroy();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
