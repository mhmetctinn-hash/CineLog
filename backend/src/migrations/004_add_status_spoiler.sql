ALTER TABLE movie_logs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'watched' CHECK (status IN ('watched', 'dropped'));
ALTER TABLE movie_logs ADD COLUMN IF NOT EXISTS has_spoilers BOOLEAN NOT NULL DEFAULT false;
