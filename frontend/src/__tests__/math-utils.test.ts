import {
  clampAccuracy,
  formatAccuracy,
  computeStreak,
} from '../lib/math-utils';

describe('clampAccuracy', () => {
  it('returns the value unchanged when in range', () => {
    expect(clampAccuracy(75)).toBe(75);
    expect(clampAccuracy(0)).toBe(0);
    expect(clampAccuracy(100)).toBe(100);
  });
  it('clamps negative values to 0', () => {
    expect(clampAccuracy(-10)).toBe(0);
  });
  it('clamps values over 100 to 100', () => {
    expect(clampAccuracy(150)).toBe(100);
  });
});

describe('formatAccuracy', () => {
  it('formats a normal value with a % sign', () => {
    expect(formatAccuracy(85)).toBe('85%');
  });
  it('rounds fractional values', () => {
    expect(formatAccuracy(85.6)).toBe('86%');
  });
  it('clamps and formats out-of-range values', () => {
    expect(formatAccuracy(-5)).toBe('0%');
    expect(formatAccuracy(110)).toBe('100%');
  });
});

describe('computeStreak', () => {
  it('returns 0 for an empty list', () => {
    expect(computeStreak([])).toBe(0);
  });
  it('counts trailing scores at or above threshold', () => {
    expect(computeStreak([50, 90, 80])).toBe(2);
  });
  it('returns 0 when last score is below threshold', () => {
    expect(computeStreak([90, 80, 60])).toBe(0);
  });
  it('returns full length when all scores qualify', () => {
    expect(computeStreak([70, 80, 90])).toBe(3);
  });
  it('respects a custom threshold', () => {
    expect(computeStreak([90, 50, 80], 60)).toBe(1);
  });
});
