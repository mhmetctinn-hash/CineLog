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
    `SELECT movie_logs.*, movies.title, movies.poster_path, movies.tmdb_id,
            movies.genre_ids, movies.collection_id, movies.collection_name
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

interface StatsRow {
  rating: number | null;
  watched_date: string;
  genre_ids: number[];
  title: string;
  poster_path: string | null;
  tmdb_id: number;
}

export async function getStats(userId: string) {
  const result = await pool.query<StatsRow>(
    `SELECT movie_logs.rating, movie_logs.watched_date, movies.genre_ids, movies.title, movies.poster_path, movies.tmdb_id
     FROM movie_logs
     JOIN movies ON movies.id = movie_logs.movie_id
     WHERE movie_logs.user_id = $1
     ORDER BY movie_logs.watched_date ASC`,
    [userId],
  );
  const rows = result.rows;

  const ratedRows = rows.filter((r) => r.rating != null);
  const averageRating = ratedRows.length > 0 ? ratedRows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedRows.length : null;

  const genreCountMap = new Map<number, number>();
  for (const row of rows) {
    for (const genreId of row.genre_ids ?? []) {
      genreCountMap.set(genreId, (genreCountMap.get(genreId) ?? 0) + 1);
    }
  }
  const genreCounts = [...genreCountMap.entries()]
    .map(([genreId, count]) => ({ genreId, count }))
    .sort((a, b) => b.count - a.count);

  const monthlyCountMap = new Map<string, number>();
  for (const row of rows) {
    const month = row.watched_date.slice(0, 7);
    monthlyCountMap.set(month, (monthlyCountMap.get(month) ?? 0) + 1);
  }
  const monthlyCounts = [...monthlyCountMap.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const topRated = [...ratedRows]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5)
    .map((r) => ({ tmdbId: r.tmdb_id, title: r.title, posterPath: r.poster_path, rating: r.rating }));

  return {
    totalLogs: rows.length,
    averageRating,
    genreCounts,
    monthlyCounts,
    topRated,
  };
}
