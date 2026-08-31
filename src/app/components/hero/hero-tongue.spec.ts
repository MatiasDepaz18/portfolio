import { describe, expect, it } from 'vitest';
import { generateTongueSegments } from './hero-tongue';

describe('generateTongueSegments', () => {
  it('genera la cantidad pedida de segmentos', () => {
    expect(generateTongueSegments(12)).toHaveLength(12);
  });

  it('todos los segmentos son tongueStyles/02 excepto la punta (tongueStyles/05)', () => {
    const segs = generateTongueSegments(10);
    segs.slice(0, -1).forEach((s) => {
      expect(s.src).toBe('assets/game/yoshi/tongueStyles/02.png');
      expect(s.ratio).toBe('16 / 3');
    });
    expect(segs[segs.length - 1].src).toBe('assets/game/yoshi/tongueStyles/05.png');
    expect(segs[segs.length - 1].ratio).toBe('8 / 7');
  });

  it('la punta existe solo si hay al menos un segmento', () => {
    const one = generateTongueSegments(1);
    expect(one).toHaveLength(1);
    expect(one[0].src).toBe('assets/game/yoshi/tongueStyles/05.png');
  });

  it('no usa 03 ni 04', () => {
    for (const s of generateTongueSegments(20)) {
      expect(s.src).not.toMatch(/tongueStyles\/0[34]\.png$/);
    }
  });
});
