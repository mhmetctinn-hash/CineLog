import { pool } from "../config/db";
import type { LogStatus, MovieLog } from "../types/movie";
import { getOrCreateMovieByTmdbId } from "./movie.service";

interface CreateLogInput {
  userId: string;
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export async function createLog(input: CreateLogInput): Promise<MovieLog> {
  const movie = await getOrCreateMovieByTmdbId(input.tmdbId);

  const result = await pool.query<MovieLog>(
    `INSERT INTO movie_logs (user_id, movie_id, rating, review, watched_date, status, has_spoilers)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), COALESCE($6, 'watched'), COALESCE($7, false))
     RETURNING *`,
    [
      input.userId,
      movie.id,
      input.rating ?? null,
      input.review ?? null,
      input.watchedDate ?? null,
      input.status ?? null,
      input.hasSpoilers ?? null,
    ],
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

interface LogCursor {
  watchedDate: string;
  createdAt: string;
  id: string;
}

export function encodeLogCursor(cursor: LogCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeLogCursor(cursor: string): LogCursor {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

interface ListLogsPageInput {
  userId: string;
  status?: LogStatus;
  cursor?: string;
  limit?: number;
}

export async function listLogsPage(input: ListLogsPageInput) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const cursor = input.cursor ? decodeLogCursor(input.cursor) : null;

  const result = await pool.query(
    `SELECT movie_logs.*, movies.title, movies.poster_path, movies.tmdb_id,
            movies.genre_ids, movies.collection_id, movies.collection_name
     FROM movie_logs
     JOIN movies ON movies.id = movie_logs.movie_id
     WHERE movie_logs.user_id = $1
       AND ($2::TEXT IS NULL OR movie_logs.status = $2)
       AND (
         $3::DATE IS NULL
         OR (movie_logs.watched_date, movie_logs.created_at, movie_logs.id) < ($3, $4, $5)
       )
     ORDER BY movie_logs.watched_date DESC, movie_logs.created_at DESC, movie_logs.id DESC
     LIMIT $6`,
    [
      input.userId,
      input.status ?? null,
      cursor?.watchedDate ?? null,
      cursor?.createdAt ?? null,
      cursor?.id ?? null,
      limit + 1,
    ],
  );

  const hasMore = result.rows.length > limit;
  const items = result.rows.slice(0, limit);
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last ? encodeLogCursor({ watchedDate: last.watched_date, createdAt: last.created_at, id: last.id }) : null;

  return { items, nextCursor };
}

interface UpdateLogInput {
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export async function updateLog(userId: string, logId: string, input: UpdateLogInput): Promise<MovieLog | undefined> {
  const result = await pool.query<MovieLog>(
    `UPDATE movie_logs
     SET rating = COALESCE($3, rating),
         review = COALESCE($4, review),
         watched_date = COALESCE($5, watched_date),
         status = COALESCE($6, status),
         has_spoilers = COALESCE($7, has_spoilers)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      logId,
      userId,
      input.rating ?? null,
      input.review ?? null,
      input.watchedDate ?? null,
      input.status ?? null,
      input.hasSpoilers ?? null,
    ],
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
  media_type: "movie" | "tv";
}

export async function getStats(userId: string) {
  const [movieResult, tvResult] = await Promise.all([
    pool.query<Omit<StatsRow, "media_type">>(
      `SELECT movie_logs.rating, movie_logs.watched_date, movies.genre_ids, movies.title, movies.poster_path, movies.tmdb_id
       FROM movie_logs
       JOIN movies ON movies.id = movie_logs.movie_id
       WHERE movie_logs.user_id = $1 AND movie_logs.status = 'watched'`,
      [userId],
    ),
    pool.query<Omit<StatsRow, "media_type" | "title"> & { name: string }>(
      `SELECT tv_logs.rating, tv_logs.watched_date, tv_shows.genre_ids, tv_shows.name, tv_shows.poster_path, tv_shows.tmdb_id
       FROM tv_logs
       JOIN tv_shows ON tv_shows.id = tv_logs.tv_show_id
       WHERE tv_logs.user_id = $1 AND tv_logs.status = 'watched'`,
      [userId],
    ),
  ]);

  const rows: StatsRow[] = [
    ...movieResult.rows.map((r) => ({ ...r, media_type: "movie" as const })),
    ...tvResult.rows.map((r) => ({ ...r, title: r.name, media_type: "tv" as const })),
  ].sort((a, b) => a.watched_date.localeCompare(b.watched_date));

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
    .map((r) => ({ tmdbId: r.tmdb_id, title: r.title, posterPath: r.poster_path, rating: r.rating, mediaType: r.media_type }));

  return {
    totalLogs: rows.length,
    averageRating,
    genreCounts,
    monthlyCounts,
    topRated,
  };
}
