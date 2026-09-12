import { TERMS } from '../data/terms';
export const INTERVALS = [1, 3, 7, 21] as const;
export interface TermMemory { id: string; step: number; due: number; updated: number; correct: boolean; }
export type TermMemoryMap = Record<string, TermMemory>;
export function answerTerm(previous: TermMemory | undefined, id: string, correct: boolean, now: number): TermMemory {
  // Early practice does not accelerate the spaced repetition schedule.
  if (correct && previous?.correct && now < previous.due) return { ...previous, updated: now };
  const step = correct ? Math.min((previous?.step ?? -1) + 1, INTERVALS.length - 1) : -1;
  return { id, step, correct, updated: now, due: now + INTERVALS[Math.max(step, 0)] * 86_400_000 };
}
export function mergeMemory(a: TermMemoryMap, b: TermMemoryMap): TermMemoryMap {
  const next = { ...a };
  for (const [id, item] of Object.entries(b)) if (!next[id] || item.updated > next[id].updated) next[id] = item;
  return next;
}
export function parseMemory(value: unknown): TermMemoryMap {
  if (!value || typeof value !== 'object') return {};
  const result: TermMemoryMap = {};
  for (const t of TERMS) {
    const item = (value as Record<string, unknown>)[t.id] as TermMemory | undefined;
    if (item && item.id === t.id && Number.isInteger(item.step) && item.step >= -1 && item.step <= 3 && Number.isFinite(item.due) && Number.isFinite(item.updated) && typeof item.correct === 'boolean') result[t.id] = item;
  }
  return result;
}
