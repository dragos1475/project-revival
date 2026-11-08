import { describe, expect, it } from 'vitest';
import { LW_POINTS } from './lw';
import { ENTRY_DELAY, INTRO_DURATION, POINT_END, pointTime, visibleCounts, welcomeCounts, WELCOME_POINTS } from './welcome-data';

describe('welcome sequence rules', () => {
  it('lasts six seconds', () => expect(INTRO_DURATION).toBe(6000));
  it('makes entry choices available at 1.5 seconds', () => expect(ENTRY_DELAY).toBe(1500));
  it('lights every real location west to east by 4.5 seconds', () => {
    expect(WELCOME_POINTS).toHaveLength(46);
    expect(WELCOME_POINTS.every((p, i) => i === 0 || p.lon >= WELCOME_POINTS[i - 1].lon)).toBe(true);
    expect(pointTime(WELCOME_POINTS.length - 1)).toBe(4500);
    expect(visibleCounts(POINT_END).reduce((a, b) => a + b, 0)).toBe(46);
  });
  it('computes all counters from the supplied records, including both flux categories', () => {
    expect(welcomeCounts()).toEqual([4, 7, 8, 7, 20]);
    expect(welcomeCounts(LW_POINTS.filter(p => p.cat !== 'meteo'))).toEqual([4, 7, 8, 7, 0]);
    expect(visibleCounts(0)).toEqual([0, 0, 0, 0, 0]);
  });
});