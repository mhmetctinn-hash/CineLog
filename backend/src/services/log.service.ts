import { pool } from "../config/db";
import type { MovieLog } from "../types/movie";
import { getOrCreateMovieByTmdbId } from "./movie.service";

interface CreateLogInput {
  userId: string;
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
}

export async function createLog(input: CreateLogInput): Promise<MovieLog> {
  const movie = await getOrCreateMovieByTmdbId(input.tmdbId);

  const result = await pool.query<MovieLog>(
    `INSERT INTO movie_logs (user_id, movie_id, rating, review, watched_date)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
     RETURNING *`,
    [input.userId, movie.id, input.rating ?? null, input.review ?? null, input.watchedDate ?? null],
  );

  return result.rows[0];
}

export async function listLogs(userId: string, tmdbId?: number) {
  const result = await pool.query(
    `SELECT movie_logs.*, movies.title, movies.poster_path, movies.tmdb_id
     FROM movie_logs
     JOIN movies ON movies.id = movie_logs.movie_id
     WHERE movie_logs.user_id = $1 AND ($2::INTEGER IS NULL OR movies.tmdb_id = $2)
     ORDER BY movie_logs.watched_date DESC, movie_logs.created_at DESC`,
    [userId, tmdbId ?? null],
  );
  return result.rows;
}

interface UpdateLogInput {
  rating?: number;
  review?: string;
  watchedDate?: string;
}

export async function updateLog(userId: string, logId: string, input: UpdateLogInput): Promise<MovieLog | undefined> {
  const result = await pool.query<MovieLog>(
    `UPDATE movie_logs
     SET rating = COALESCE($3, rating),
         review = COALESCE($4, review),
         watched_date = COALESCE($5, watched_date)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [logId, userId, input.rating ?? null, input.review ?? null, input.watchedDate ?? null],
  );
  return result.rows[0];
}

export async function deleteLog(userId: string, logId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM movie_logs WHERE id = $1 AND user_id = $2", [logId, userId]);
  return (result.rowCount ?? 0) > 0;
}
