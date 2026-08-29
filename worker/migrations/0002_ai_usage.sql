-- Global daily request counter for the AI tutor endpoint — a real API with a real (small)
-- budget sits behind it, so this is a blunt but simple safety net against a runaway
-- loop/bug/abuse burning through the balance, independent of the per-IP rate limit.
CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL
);
