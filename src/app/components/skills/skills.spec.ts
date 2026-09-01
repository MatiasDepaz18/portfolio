import { describe, expect, it } from 'vitest';
import { wrapIndex, wrappedDist, slideDist } from './skills';

describe('wrapIndex', () => {
  it('envuelve el índice dentro del rango', () => {
    expect(wrapIndex(-1, 4)).toBe(3);
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(2, 4)).toBe(2);
    expect(wrapIndex(-5, 4)).toBe(3);
  });
});

describe('wrappedDist', () => {
  it('centra el slide activo (x = 0)', () => {
    expect(wrappedDist(0, 0, 4)).toBe(0);
    expect(wrappedDist(2, 2, 4)).toBe(0);
    expect(wrappedDist(3, 3, 4)).toBe(0);
  });

  it('acerca los vecinos por el camino circular corto', () => {
    expect(wrappedDist(1, 0, 4)).toBe(1); // primero: siguiente a la derecha
    expect(wrappedDist(3, 0, 4)).toBe(-1); // primero: último a la izquierda
    expect(wrappedDist(0, 3, 4)).toBe(1); // último: primero a la derecha
    expect(wrappedDist(2, 0, 4)).toBe(2); // la restante queda oculta
    expect(wrappedDist(0, 1, 4)).toBe(-1);
    expect(wrappedDist(3, 1, 4)).toBe(2);
  });
});

describe('slideDist', () => {
  it('mantiene los slots visibles tal cual', () => {
    expect(slideDist(2, 1, 4, 2)).toBe(1);
    expect(slideDist(0, 1, 4, 0)).toBe(-1);
    expect(slideDist(1, 1, 4, 1)).toBe(0);
  });

  it('pone la categoría oculta del lado por el que venía', () => {
    expect(slideDist(3, 1, 4, -1)).toBe(-2); // salía por la izquierda
    expect(slideDist(1, 3, 4, 1)).toBe(2); // salía por la derecha
    expect(slideDist(2, 0, 4, 0)).toBe(2); // inicial: derecha
  });
});
