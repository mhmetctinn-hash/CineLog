import { pool } from "../config/db";

export type NotificationType = "system" | "watchlist_reminder" | "daily_recommendation";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  url?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const result = await pool.query<Notification>(
    `INSERT INTO notifications (user_id, type, title, body, url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.userId, input.type, input.title, input.body ?? null, input.url ?? null],
  );
  return result.rows[0];
}

export async function listNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const result = await pool.query<Notification>(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return Number(result.rows[0].count);
}

export async function markRead(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function markAllRead(userId: string): Promise<void> {
  await pool.query(`UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`, [userId]);
}
