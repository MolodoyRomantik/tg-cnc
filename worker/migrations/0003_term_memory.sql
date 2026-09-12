CREATE TABLE IF NOT EXISTS term_memory (
  telegram_id INTEGER NOT NULL,
  term_id TEXT NOT NULL,
  step INTEGER NOT NULL,
  due INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  PRIMARY KEY (telegram_id, term_id)
);
