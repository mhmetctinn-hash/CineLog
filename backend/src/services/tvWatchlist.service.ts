import { pool } from "../config/db";
import type { TvWatchlistEntry } from "../types/tv";
import { getOrCreateTvShowByTmdbId } from "./tvShow.service";

export class AlreadyOnWatchlistError extends Error {
  constructor() {
    super("TV show already on watchlist");
  }
}

export async function addTvToWatchlist(userId: string, tmdbId: number): Promise<TvWatchlistEntry> {
  const show = await getOrCreateTvShowByTmdbId(tmdbId);

  const existing = await pool.query(
    "SELECT id FROM tv_watchlist WHERE user_id = $1 AND tv_show_id = $2",
    [userId, show.id],
  );
  if (existing.rows[0]) {
    throw new AlreadyOnWatchlistError();
  }

  const result = await pool.query<TvWatchlistEntry>(
    "INSERT INTO tv_watchlist (user_id, tv_show_id) VALUES ($1, $2) RETURNING *",
    [userId, show.id],
  );
  return result.rows[0];
}

export async function listTvWatchlist(userId: string, tmdbId?: number) {
  const result = await pool.query(
    `SELECT tv_watchlist.*, tv_shows.name, tv_shows.poster_path, tv_shows.tmdb_id
     FROM tv_watchlist
     JOIN tv_shows ON tv_shows.id = tv_watchlist.tv_show_id
     WHERE tv_watchlist.user_id = $1 AND ($2::INTEGER IS NULL OR tv_shows.tmdb_id = $2)
     ORDER BY tv_watchlist.added_at DESC`,
    [userId, tmdbId ?? null],
  );
  return result.rows;
}

export async function removeFromTvWatchlist(userId: string, watchlistId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM tv_watchlist WHERE id = $1 AND user_id = $2", [watchlistId, userId]);
  return (result.rowCount ?? 0) > 0;
}
