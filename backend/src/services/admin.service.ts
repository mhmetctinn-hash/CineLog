import { pool } from "../config/db";

export interface AdminUserRow {
  id: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  movie_log_count: number;
  tv_log_count: number;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const result = await pool.query<AdminUserRow>(
    `SELECT users.id, users.email, users.avatar_url, users.created_at,
            COUNT(DISTINCT movie_logs.id)::int AS movie_log_count,
            COUNT(DISTINCT tv_logs.id)::int AS tv_log_count
     FROM users
     LEFT JOIN movie_logs ON movie_logs.user_id = users.id
     LEFT JOIN tv_logs ON tv_logs.user_id = users.id
     GROUP BY users.id
     ORDER BY users.created_at DESC`,
  );
  return result.rows;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  return (result.rowCount ?? 0) > 0;
}

export interface AdminStats {
  totalUsers: number;
  totalMovieLogs: number;
  totalTvLogs: number;
  totalWatchlistItems: number;
  signupsLast30Days: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const result = await pool.query<{
    total_users: number;
    total_movie_logs: number;
    total_tv_logs: number;
    total_watchlist_items: number;
    signups_last_30_days: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM users)::int AS total_users,
       (SELECT COUNT(*) FROM movie_logs)::int AS total_movie_logs,
       (SELECT COUNT(*) FROM tv_logs)::int AS total_tv_logs,
       (SELECT COUNT(*) FROM watchlist) + (SELECT COUNT(*) FROM tv_watchlist) AS total_watchlist_items,
       (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '30 days')::int AS signups_last_30_days`,
  );

  const row = result.rows[0];
  return {
    totalUsers: row.total_users,
    totalMovieLogs: row.total_movie_logs,
    totalTvLogs: row.total_tv_logs,
    totalWatchlistItems: Number(row.total_watchlist_items),
    signupsLast30Days: row.signups_last_30_days,
  };
}
