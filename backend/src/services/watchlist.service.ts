import { pool } from "../config/db";
import type { WatchlistEntry } from "../types/movie";
import { getOrCreateMovieByTmdbId } from "./movie.service";

export class AlreadyOnWatchlistError extends Error {
  constructor() {
    super("Movie already on watchlist");
  }
}

export async function addToWatchlist(userId: string, tmdbId: number): Promise<WatchlistEntry> {
  const movie = await getOrCreateMovieByTmdbId(tmdbId);

  const existing = await pool.query(
    "SELECT id FROM watchlist WHERE user_id = $1 AND movie_id = $2",
    [userId, movie.id],
  );
  if (existing.rows[0]) {
    throw new AlreadyOnWatchlistError();
  }

  const result = await pool.query<WatchlistEntry>(
    "INSERT INTO watchlist (user_id, movie_id) VALUES ($1, $2) RETURNING *",
    [userId, movie.id],
  );
  return result.rows[0];
}

export async function listWatchlist(userId: string, tmdbId?: number) {
  const result = await pool.query(
    `SELECT watchlist.*, movies.title, movies.poster_path, movies.tmdb_id
     FROM watchlist
     JOIN movies ON movies.id = watchlist.movie_id
     WHERE watchlist.user_id = $1 AND ($2::INTEGER IS NULL OR movies.tmdb_id = $2)
     ORDER BY watchlist.added_at DESC`,
    [userId, tmdbId ?? null],
  );
  return result.rows;
}

export async function removeFromWatchlist(userId: string, watchlistId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM watchlist WHERE id = $1 AND user_id = $2", [watchlistId, userId]);
  return (result.rowCount ?? 0) > 0;
}
