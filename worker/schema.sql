-- Per-lesson best/cumulative progress, keyed by Telegram user id.
CREATE TABLE IF NOT EXISTS lesson_progress (
  telegram_id INTEGER NOT NULL,
  lesson_id TEXT NOT NULL,
  best INTEGER NOT NULL,
  total INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  sum_correct INTEGER NOT NULL,
  sum_total INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  last_at TEXT NOT NULL,
  PRIMARY KEY (telegram_id, lesson_id)
);

-- One row per completed quiz attempt — feeds "recent attempts" and the
-- activity/streak calendar (distinct day of `at` per user).
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  lesson_id TEXT NOT NULL,
  at TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attempts_telegram_id_at ON attempts (telegram_id, at DESC);
