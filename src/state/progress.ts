import { useEffect, useState } from 'react';
import { getInitDataRaw } from '../telegram';

export const PASS = 0.7;
const API_BASE = 'https://tg-cnc-api.lbvfdgfdfgdf.workers.dev';
const XP_PER_CORRECT = 5;
const XP_PASS_BONUS = 10;
const XP_PER_LEVEL = 200;

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

interface ApiProgressResponse {
  lessons: Record<string, LessonProgress>;
  recentAttempts: AttemptRecord[];
  activityDays: string[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `tma ${getInitDataRaw()}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function applyAttemptLocally(
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

  const today = next.lastAt.slice(0, 10);
  const activityDays = state.activityDays.includes(today)
    ? state.activityDays
    : [...state.activityDays, today];

  const attempt: AttemptRecord = { lessonId, at: next.lastAt, score, total };
  const recentAttempts = [attempt, ...state.recentAttempts].slice(0, 10);

  return {
    lessons: { ...state.lessons, [lessonId]: next },
    activityDays,
    recentAttempts,
  };
}

/**
 * Progress lives on the backend (Cloudflare Worker + D1), keyed by the caller's Telegram
 * user id (verified server-side from signed `initData` — see worker/src/telegramAuth.ts).
 * Outside a real Telegram client `initData` is empty, so there's nothing to authenticate
 * with — state then stays local-only for the session (no persistence), which is expected
 * for plain-browser dev/testing.
 */
export function useProgress() {
  const [state, setState] = useState<ProgressState>(emptyState);

  useEffect(() => {
    if (!getInitDataRaw()) return;
    apiFetch<ApiProgressResponse>('/api/progress')
      .then((data) =>
        setState({
          lessons: data.lessons,
          recentAttempts: data.recentAttempts,
          activityDays: data.activityDays,
        }),
      )
      .catch((err) => console.error('Failed to load progress:', err));
  }, []);

  function recordAttempt(lessonId: string, score: number, total: number) {
    setState((prev) => applyAttemptLocally(prev, lessonId, score, total));
    if (getInitDataRaw()) {
      apiFetch('/api/progress/attempt', {
        method: 'POST',
        body: JSON.stringify({ lessonId, score, total }),
      }).catch((err) => console.error('Failed to sync attempt:', err));
    }
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
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  let cursor = new Date();
  if (!set.has(toKey(cursor))) cursor = new Date(cursor.getTime() - 86_400_000);
  let streak = 0;
  while (set.has(toKey(cursor))) {
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
    const key = d.toISOString().slice(0, 10);
    days.push({ key, active: set.has(key) });
  }
  return days;
}
