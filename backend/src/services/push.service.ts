import webpush from "web-push";
import { pool } from "../config/db";
import { env } from "../config/env";

const pushConfigured = Boolean(env.vapidPublicKey && env.vapidPrivateKey);

if (pushConfigured) {
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function saveSubscription(userId: string, sub: PushSubscriptionInput): Promise<void> {
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
    [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth],
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
}

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushConfigured) return;

  const result = await pool.query<{ endpoint: string; p256dh: string; auth: string }>(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
    [userId],
  );

  await Promise.all(
    result.rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removeSubscription(row.endpoint);
        }
      }
    }),
  );
}

export function isPushConfigured(): boolean {
  return pushConfigured;
}
