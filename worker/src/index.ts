import { Hono } from 'hono';
import { validateInitData } from './telegramAuth';

interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
  ALLOWED_ORIGIN: string;
}

const PASS = 0.7;

interface LessonProgressRow {
  lesson_id: string;
  best: number;
  total: number;
  attempts: number;
  sum_correct: number;
  sum_total: number;
  passed: number;
  last_at: string;
}

interface AttemptRow {
  lesson_id: string;
  at: string;
  score: number;
  total: number;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', c.env.ALLOWED_ORIGIN);
  c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});

async function authenticate(c: { req: { header: (name: string) => string | undefined }; env: Env }): Promise<number | null> {
  const header = c.req.header('Authorization') ?? '';
  const initData = header.startsWith('tma ') ? header.slice(4) : '';
  if (!initData) return null;
  const user = await validateInitData(initData, c.env.BOT_TOKEN);
  return user ? user.id : null;
}

app.get('/api/progress', async (c) => {
  const telegramId = await authenticate(c);
  if (!telegramId) return c.json({ error: 'unauthorized' }, 401);

  const [lessonsResult, recentResult, daysResult] = await Promise.all([
    c.env.DB.prepare(
      'SELECT lesson_id, best, total, attempts, sum_correct, sum_total, passed, last_at FROM lesson_progress WHERE telegram_id = ?',
    )
      .bind(telegramId)
      .all<LessonProgressRow>(),
    c.env.DB.prepare(
      'SELECT lesson_id, at, score, total FROM attempts WHERE telegram_id = ? ORDER BY at DESC LIMIT 10',
    )
      .bind(telegramId)
      .all<AttemptRow>(),
    c.env.DB.prepare('SELECT DISTINCT substr(at, 1, 10) AS day FROM attempts WHERE telegram_id = ?')
      .bind(telegramId)
      .all<{ day: string }>(),
  ]);

  const lessons = Object.fromEntries(
    lessonsResult.results.map((row) => [
      row.lesson_id,
      {
        best: row.best,
        total: row.total,
        attempts: row.attempts,
        sumCorrect: row.sum_correct,
        sumTotal: row.sum_total,
        passed: !!row.passed,
        lastAt: row.last_at,
      },
    ]),
  );

  return c.json({
    lessons,
    recentAttempts: recentResult.results.map((row) => ({
      lessonId: row.lesson_id,
      at: row.at,
      score: row.score,
      total: row.total,
    })),
    activityDays: daysResult.results.map((row) => row.day),
  });
});

app.post('/api/progress/attempt', async (c) => {
  const telegramId = await authenticate(c);
  if (!telegramId) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json<{ lessonId?: string; score?: number; total?: number }>().catch(() => null);
  const lessonId = body?.lessonId;
  const score = body?.score;
  const total = body?.total;
  if (!lessonId || typeof score !== 'number' || typeof total !== 'number' || total <= 0 || score < 0 || score > total) {
    return c.json({ error: 'bad request' }, 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT best, attempts, sum_correct, sum_total, passed FROM lesson_progress WHERE telegram_id = ? AND lesson_id = ?',
  )
    .bind(telegramId, lessonId)
    .first<{ best: number; attempts: number; sum_correct: number; sum_total: number; passed: number }>();

  const now = new Date().toISOString();
  const best = Math.max(existing?.best ?? 0, score);
  const attempts = (existing?.attempts ?? 0) + 1;
  const sumCorrect = (existing?.sum_correct ?? 0) + score;
  const sumTotal = (existing?.sum_total ?? 0) + total;
  const passed = !!existing?.passed || score / total >= PASS;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO lesson_progress (telegram_id, lesson_id, best, total, attempts, sum_correct, sum_total, passed, last_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (telegram_id, lesson_id) DO UPDATE SET
         best = excluded.best, total = excluded.total, attempts = excluded.attempts,
         sum_correct = excluded.sum_correct, sum_total = excluded.sum_total,
         passed = excluded.passed, last_at = excluded.last_at`,
    ).bind(telegramId, lessonId, best, total, attempts, sumCorrect, sumTotal, passed ? 1 : 0, now),
    c.env.DB.prepare('INSERT INTO attempts (telegram_id, lesson_id, at, score, total) VALUES (?, ?, ?, ?, ?)').bind(
      telegramId,
      lessonId,
      now,
      score,
      total,
    ),
  ]);

  return c.json({ ok: true, lesson: { best, total, attempts, sumCorrect, sumTotal, passed, lastAt: now } });
});

export default app;
