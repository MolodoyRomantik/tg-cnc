import { describe, expect, it } from 'vitest';
import { answerTerm, mergeMemory, parseMemory } from './termReview';
describe('term repetition', () => {
  it('schedules 1, 3, 7, 21 days and caps the interval', () => {
    let now = 100000000; let state;
    for (const days of [1, 3, 7, 21, 21]) {
      state = answerTerm(state, 'term-blank', true, now);
      expect(state.due - now).toBe(days * 86400000); now = state.due;
    }
  });
  it('resets errors and does not let early practice skip intervals', () => {
    const first = answerTerm(undefined, 'term-blank', true, 100);
    expect(answerTerm(first, first.id, true, 200).due).toBe(first.due);
    const wrong = answerTerm(first, first.id, false, 200);
    expect(wrong.step).toBe(-1);
    expect(answerTerm(wrong, first.id, true, wrong.due).step).toBe(0);
  });
  it('preserves newer local answers when a server load finishes late', () => {
    const old = answerTerm(undefined, 'term-blank', true, 10);
    const fresh = answerTerm(old, old.id, false, 20);
    expect(mergeMemory({ [fresh.id]: fresh }, { [old.id]: old })[old.id]).toEqual(fresh);
  });
  it('ignores corrupt storage and unknown terms', () => {
    expect(parseMemory({ 'term-blank': { id: 'term-blank', step: 99 }, bogus: {} })).toEqual({});
  });
});
