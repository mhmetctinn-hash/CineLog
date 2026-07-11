import { pool } from "../config/db";
import type { LogStatus } from "../types/movie";
import type { TvLog } from "../types/tv";
import { getOrCreateTvShowByTmdbId } from "./tvShow.service";

interface CreateTvLogInput {
  userId: string;
  tmdbId: number;
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export async function createTvLog(input: CreateTvLogInput): Promise<TvLog> {
  const show = await getOrCreateTvShowByTmdbId(input.tmdbId);

  const result = await pool.query<TvLog>(
    `INSERT INTO tv_logs (user_id, tv_show_id, rating, review, watched_date, status, has_spoilers)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), COALESCE($6, 'watched'), COALESCE($7, false))
     RETURNING *`,
    [
      input.userId,
      show.id,
      input.rating ?? null,
      input.review ?? null,
      input.watchedDate ?? null,
      input.status ?? null,
      input.hasSpoilers ?? null,
    ],
  );

  return result.rows[0];
}

export async function listTvLogs(userId: string, tmdbId?: number) {
  const result = await pool.query(
    `SELECT tv_logs.*, tv_shows.name, tv_shows.poster_path, tv_shows.tmdb_id, tv_shows.genre_ids
     FROM tv_logs
     JOIN tv_shows ON tv_shows.id = tv_logs.tv_show_id
     WHERE tv_logs.user_id = $1 AND ($2::INTEGER IS NULL OR tv_shows.tmdb_id = $2)
     ORDER BY tv_logs.watched_date DESC, tv_logs.created_at DESC`,
    [userId, tmdbId ?? null],
  );
  return result.rows;
}

interface TvLogCursor {
  watchedDate: string;
  createdAt: string;
  id: string;
}

export function encodeTvLogCursor(cursor: TvLogCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeTvLogCursor(cursor: string): TvLogCursor {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}

interface ListTvLogsPageInput {
  userId: string;
  status?: LogStatus;
  cursor?: string;
  limit?: number;
}

export async function listTvLogsPage(input: ListTvLogsPageInput) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const cursor = input.cursor ? decodeTvLogCursor(input.cursor) : null;

  const result = await pool.query(
    `SELECT tv_logs.*, tv_shows.name, tv_shows.poster_path, tv_shows.tmdb_id, tv_shows.genre_ids
     FROM tv_logs
     JOIN tv_shows ON tv_shows.id = tv_logs.tv_show_id
     WHERE tv_logs.user_id = $1
       AND ($2::TEXT IS NULL OR tv_logs.status = $2)
       AND (
         $3::DATE IS NULL
         OR (tv_logs.watched_date, tv_logs.created_at, tv_logs.id) < ($3, $4, $5)
       )
     ORDER BY tv_logs.watched_date DESC, tv_logs.created_at DESC, tv_logs.id DESC
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
    hasMore && last ? encodeTvLogCursor({ watchedDate: last.watched_date, createdAt: last.created_at, id: last.id }) : null;

  return { items, nextCursor };
}

interface UpdateTvLogInput {
  rating?: number;
  review?: string;
  watchedDate?: string;
  status?: LogStatus;
  hasSpoilers?: boolean;
}

export async function updateTvLog(userId: string, logId: string, input: UpdateTvLogInput): Promise<TvLog | undefined> {
  const result = await pool.query<TvLog>(
    `UPDATE tv_logs
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

export async function deleteTvLog(userId: string, logId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM tv_logs WHERE id = $1 AND user_id = $2", [logId, userId]);
  return (result.rowCount ?? 0) > 0;
}
