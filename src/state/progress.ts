import { useState } from 'react';

export const PASS = 0.7;
const STORAGE_KEY = 'tg-cnc:progress:v1';
const XP_PER_CORRECT = 5;
const XP_PASS_BONUS = 10;
const XP_PER_LEVEL = 200;
const RECENT_ATTEMPTS_LIMIT = 10;

export interface LessonProgress {
  best: number;
  total: number;
  attempts: number;
  sumCorrect: number;
  sumTotal: number;
  lastAt: string;
  passed: boolean;
}

export interface AttemptRecord {
  lessonId: string;
  at: string;
  score: number;
  total: number;
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
  activityDays: string[];
  recentAttempts: AttemptRecord[];
}

function emptyState(): ProgressState {
  return { lessons: {}, activityDays: [], recentAttempts: [] };
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      lessons: parsed.lessons ?? {},
      activityDays: parsed.activityDays ?? [],
      recentAttempts: parsed.recentAttempts ?? [],
    };
  } catch {
    return emptyState();
  }
}

function saveState(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota) — progress just won't persist.
  }
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function applyAttempt(
  state: ProgressState,
  lessonId: string,
  score: number,
  total: number,
): ProgressState {
  const prev = state.lessons[lessonId];
  const passed = total > 0 && score / total >= PASS;
  const next: LessonProgress = {
    best: Math.max(prev?.best ?? 0, score),
    total,
    attempts: (prev?.attempts ?? 0) + 1,
    sumCorrect: (prev?.sumCorrect ?? 0) + score,
    sumTotal: (prev?.sumTotal ?? 0) + total,
    lastAt: new Date().toISOString(),
    passed: (prev?.passed ?? false) || passed,
  };

  const today = todayKey();
  const activityDays = state.activityDays.includes(today)
    ? state.activityDays
    : [...state.activityDays, today];

  const attempt: AttemptRecord = { lessonId, at: next.lastAt, score, total };
  const recentAttempts = [attempt, ...state.recentAttempts].slice(0, RECENT_ATTEMPTS_LIMIT);

  return {
    lessons: { ...state.lessons, [lessonId]: next },
    activityDays,
    recentAttempts,
  };
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(loadState);

  function recordAttempt(lessonId: string, score: number, total: number) {
    setState((prev) => {
      const next = applyAttempt(prev, lessonId, score, total);
      saveState(next);
      return next;
    });
  }

  return { state, recordAttempt };
}

export function computeXp(state: ProgressState): number {
  let xp = 0;
  for (const lesson of Object.values(state.lessons)) {
    xp += lesson.best * XP_PER_CORRECT;
    if (lesson.passed) xp += XP_PASS_BONUS;
  }
  return xp;
}

export function computeLevel(xp: number): { level: number; into: number; goal: number } {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL, goal: XP_PER_LEVEL };
}

export function computeAccuracy(state: ProgressState): number | null {
  let correct = 0;
  let total = 0;
  for (const lesson of Object.values(state.lessons)) {
    correct += lesson.sumCorrect;
    total += lesson.sumTotal;
  }
  if (total === 0) return null;
  return Math.round((correct / total) * 100);
}

export function computeSolved(state: ProgressState): number {
  let solved = 0;
  for (const lesson of Object.values(state.lessons)) solved += lesson.sumCorrect;
  return solved;
}

export function computeStreak(state: ProgressState): number {
  const set = new Set(state.activityDays);
  let cursor = new Date();
  if (!set.has(todayKey(cursor))) cursor = new Date(cursor.getTime() - 86_400_000);
  let streak = 0;
  while (set.has(todayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

/** Last 7 days (oldest→newest), each with whether the user practiced that day. */
export function computeWeekActivity(state: ProgressState): { key: string; active: boolean }[] {
  const set = new Set(state.activityDays);
  const days: { key: string; active: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = todayKey(d);
    days.push({ key, active: set.has(key) });
  }
  return days;
}
