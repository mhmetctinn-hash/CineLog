import cron from "node-cron";
import { pool } from "../config/db";
import { env } from "../config/env";
import { createNotification } from "../services/notification.service";
import { sendPushToUser } from "../services/push.service";
import { getDiceRoll } from "../services/recommendation.service";

const REMINDER_AFTER_DAYS = 14;

interface StaleWatchlistRow {
  user_id: string;
  title: string;
}

// Groups stale watchlist items per user into a single reminder notification instead of
// spamming one per movie, and stamps reminded_at so the same item won't re-fire for 14 days.
async function runWatchlistReminderJob(): Promise<void> {
  const [movieRows, tvRows] = await Promise.all([
    pool.query<StaleWatchlistRow & { id: string }>(
      `SELECT watchlist.id, watchlist.user_id, movies.title
       FROM watchlist
       JOIN movies ON movies.id = watchlist.movie_id
       WHERE watchlist.added_at < now() - interval '${REMINDER_AFTER_DAYS} days'
         AND (watchlist.reminded_at IS NULL OR watchlist.reminded_at < now() - interval '${REMINDER_AFTER_DAYS} days')`,
    ),
    pool.query<StaleWatchlistRow & { id: string }>(
      `SELECT tv_watchlist.id, tv_watchlist.user_id, tv_shows.name AS title
       FROM tv_watchlist
       JOIN tv_shows ON tv_shows.id = tv_watchlist.tv_show_id
       WHERE tv_watchlist.added_at < now() - interval '${REMINDER_AFTER_DAYS} days'
         AND (tv_watchlist.reminded_at IS NULL OR tv_watchlist.reminded_at < now() - interval '${REMINDER_AFTER_DAYS} days')`,
    ),
  ]);

  const byUser = new Map<string, string[]>();
  for (const row of [...movieRows.rows, ...tvRows.rows]) {
    const titles = byUser.get(row.user_id) ?? [];
    titles.push(row.title);
    byUser.set(row.user_id, titles);
  }

  for (const [userId, titles] of byUser) {
    const preview = titles.slice(0, 3).join(", ");
    const body = titles.length > 3 ? `${preview} ve ${titles.length - 3} film daha` : preview;

    await createNotification({
      userId,
      type: "watchlist_reminder",
      title: `İzleme listende ${titles.length} yapım seni bekliyor`,
      body,
      url: "/watchlist",
    });
    await sendPushToUser(userId, {
      title: `İzleme listende ${titles.length} yapım seni bekliyor`,
      body,
      url: "/watchlist",
    });
  }

  const movieIds = movieRows.rows.map((r) => r.id);
  const tvIds = tvRows.rows.map((r) => r.id);
  if (movieIds.length > 0) {
    await pool.query("UPDATE watchlist SET reminded_at = now() WHERE id = ANY($1::uuid[])", [movieIds]);
  }
  if (tvIds.length > 0) {
    await pool.query("UPDATE tv_watchlist SET reminded_at = now() WHERE id = ANY($1::uuid[])", [tvIds]);
  }
}

// Only nudges users who've logged at least one thing — a fresh signup with no
// history yet would just get an untargeted "popular movies" pick, which isn't
// worth a notification.
//
// Guards against double-sends with a "already notified today" check rather than
// relying on the caller to run exactly once — this job can be triggered both by
// the in-process cron.schedule below and by an external pinger (Render's free
// tier sleeps, so a GitHub Actions workflow hits /api/internal/run-jobs too).
async function runDailyRecommendationJob(): Promise<void> {
  const result = await pool.query<{ id: string }>(
    `SELECT DISTINCT users.id
     FROM users
     WHERE (EXISTS (SELECT 1 FROM movie_logs WHERE movie_logs.user_id = users.id)
        OR EXISTS (SELECT 1 FROM tv_logs WHERE tv_logs.user_id = users.id))
       AND NOT EXISTS (
         SELECT 1 FROM notifications
         WHERE notifications.user_id = users.id
           AND notifications.type = 'daily_recommendation'
           AND notifications.created_at > now() - interval '20 hours'
       )`,
  );

  for (const { id: userId } of result.rows) {
    const rec = await getDiceRoll(userId);
    if (!rec) continue;

    await createNotification({
      userId,
      type: "daily_recommendation",
      title: "Bugün ne izlesen? 🎬",
      body: rec.title,
      url: `/movie/${rec.tmdbId}`,
    });
    await sendPushToUser(userId, {
      title: "Bugün ne izlesen? 🎬",
      body: rec.title,
      url: `/movie/${rec.tmdbId}`,
    });
  }
}

export function startNotificationJobs(): void {
  if (!env.enableScheduledJobs) return;

  // 10:00 daily — watchlist reminder
  cron.schedule("0 10 * * *", () => {
    runWatchlistReminderJob().catch((err) => console.error("[jobs] watchlist reminder failed", err));
  });

  // 09:00 daily — "what should I watch today" nudge
  cron.schedule("0 9 * * *", () => {
    runDailyRecommendationJob().catch((err) => console.error("[jobs] daily recommendation failed", err));
  });
}

export async function runAllJobs(): Promise<void> {
  await runWatchlistReminderJob();
  await runDailyRecommendationJob();
}

export const __testing = { runWatchlistReminderJob, runDailyRecommendationJob };
