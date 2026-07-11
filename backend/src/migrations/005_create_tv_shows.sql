CREATE TABLE IF NOT EXISTS tv_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  poster_path TEXT,
  first_air_date DATE,
  overview TEXT,
  genre_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tv_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tv_show_id UUID NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
  review TEXT,
  watched_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'watched' CHECK (status IN ('watched', 'dropped')),
  has_spoilers BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tv_show_id, watched_date)
);

CREATE TABLE IF NOT EXISTS tv_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tv_show_id UUID NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tv_show_id)
);
