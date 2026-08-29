import { describe, expect, it } from 'vitest';
import {
  computeAccuracy,
  computeLevel,
  computeSolved,
  computeStreak,
  computeWeekActivity,
  computeXp,
  type ProgressState,
} from './progress';

function state(overrides: Partial<ProgressState> = {}): ProgressState {
  return { lessons: {}, activityDays: [], recentAttempts: [], ...overrides };
}

describe('computeXp', () => {
  it('is 0 for no progress', () => {
    expect(computeXp(state())).toBe(0);
  });

  it('adds 5 per best-correct-answer plus a 10 bonus for passed lessons', () => {
    const s = state({
      lessons: {
        '1.1': { best: 6, total: 8, attempts: 1, sumCorrect: 6, sumTotal: 8, passed: true, lastAt: '' },
        '1.2': { best: 3, total: 8, attempts: 1, sumCorrect: 3, sumTotal: 8, passed: false, lastAt: '' },
      },
    });
    // 6*5 + 10 (passed) + 3*5 (not passed, no bonus) = 30 + 10 + 15
    expect(computeXp(s)).toBe(55);
  });
});

describe('computeLevel', () => {
  it('level 1 at 0 XP', () => {
    expect(computeLevel(0)).toEqual({ level: 1, into: 0, goal: 200 });
  });

  it('rolls over to the next level every 200 XP', () => {
    expect(computeLevel(199)).toEqual({ level: 1, into: 199, goal: 200 });
    expect(computeLevel(200)).toEqual({ level: 2, into: 0, goal: 200 });
    expect(computeLevel(450)).toEqual({ level: 3, into: 50, goal: 200 });
  });
});

describe('computeAccuracy', () => {
  it('is null with no attempts at all', () => {
    expect(computeAccuracy(state())).toBeNull();
  });

  it('averages sumCorrect/sumTotal across all lessons', () => {
    const s = state({
      lessons: {
        '1.1': { best: 6, total: 8, attempts: 1, sumCorrect: 6, sumTotal: 8, passed: true, lastAt: '' },
        '1.2': { best: 4, total: 8, attempts: 1, sumCorrect: 4, sumTotal: 8, passed: false, lastAt: '' },
      },
    });
    expect(computeAccuracy(s)).toBe(63); // 10/16 = 62.5% -> rounds to 63
  });
});

describe('computeSolved', () => {
  it('sums sumCorrect across lessons', () => {
    const s = state({
      lessons: {
        '1.1': { best: 6, total: 8, attempts: 1, sumCorrect: 6, sumTotal: 8, passed: true, lastAt: '' },
        '1.2': { best: 4, total: 8, attempts: 2, sumCorrect: 7, sumTotal: 16, passed: false, lastAt: '' },
      },
    });
    expect(computeSolved(s)).toBe(13);
  });
});

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

describe('computeStreak', () => {
  it('is 0 with no activity', () => {
    expect(computeStreak(state())).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const s = state({ activityDays: [daysAgo(0), daysAgo(1), daysAgo(2)] });
    expect(computeStreak(s)).toBe(3);
  });

  it('still counts yesterday-ending streaks (today not practiced yet)', () => {
    const s = state({ activityDays: [daysAgo(1), daysAgo(2)] });
    expect(computeStreak(s)).toBe(2);
  });

  it('stops at the first gap', () => {
    const s = state({ activityDays: [daysAgo(0), daysAgo(1), daysAgo(3)] });
    expect(computeStreak(s)).toBe(2);
  });
});

describe('computeWeekActivity', () => {
  it('returns exactly 7 days, oldest first, ending today', () => {
    const s = state({ activityDays: [daysAgo(0), daysAgo(2)] });
    const week = computeWeekActivity(s);
    expect(week).toHaveLength(7);
    expect(week[6].key).toBe(daysAgo(0));
    expect(week[6].active).toBe(true);
    expect(week[4].key).toBe(daysAgo(2));
    expect(week[4].active).toBe(true);
    expect(week[5].active).toBe(false);
  });
});
