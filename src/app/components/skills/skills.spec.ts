import { describe, expect, it } from 'vitest';
import { clampIndex, slideX } from './skills';

describe('clampIndex', () => {
  it('limita el índice al rango válido', () => {
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(5, 3)).toBe(3);
    expect(clampIndex(2, 3)).toBe(2);
  });
});

describe('slideX', () => {
  it('centra el slide activo (x = 0)', () => {
    expect(slideX(0, 0, 548)).toBe(0);
    expect(slideX(2, 2, 548)).toBe(0);
    expect(slideX(3, 3, 548)).toBe(0);
  });

  it('mueve cada slide un step por distancia al activo', () => {
    const step = 548;
    expect(slideX(1, 0, step)).toBe(step);
    expect(slideX(0, 1, step)).toBe(-step);
    expect(slideX(3, 1, step)).toBe(2 * step);
    expect(slideX(1, 3, step)).toBe(-2 * step);
  });

  it('suma el arrastre en curso', () => {
    expect(slideX(0, 1, 548, 120)).toBe(-548 + 120);
    expect(slideX(1, 1, 548, -40)).toBe(-40);
  });
});
