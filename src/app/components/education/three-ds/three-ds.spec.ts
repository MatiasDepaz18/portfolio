import { describe, expect, it } from 'vitest';
import { clampAnalog, wrapIndex } from './three-ds';

describe('wrapIndex', () => {
  it('envuelve el índice dentro del rango', () => {
    expect(wrapIndex(0, 3)).toBe(0);
    expect(wrapIndex(2, 3)).toBe(2);
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(-4, 3)).toBe(2);
  });

  it('devuelve 0 sin fotos', () => {
    expect(wrapIndex(2, 0)).toBe(0);
  });
});

describe('clampAnalog', () => {
  it('deja pasar vectores dentro del radio', () => {
    expect(clampAnalog(3, 4, 15)).toEqual({ x: 3, y: 4 });
  });

  it('recorta al borde del círculo', () => {
    const { x, y } = clampAnalog(30, 40, 15);
    expect(Math.hypot(x, y)).toBeCloseTo(15);
    expect(x).toBeCloseTo(9);
    expect(y).toBeCloseTo(12);
  });

  it('mantiene el centro quieto', () => {
    expect(clampAnalog(0, 0, 15)).toEqual({ x: 0, y: 0 });
  });
});
