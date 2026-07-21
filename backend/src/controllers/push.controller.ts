import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { removeSubscription, saveSubscription } from "../services/push.service";

export async function vapidPublicKey(_req: Request, res: Response) {
  return res.json({ publicKey: env.vapidPublicKey || null });
}

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function subscribe(req: Request, res: Response) {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await saveSubscription(req.auth!.userId, parsed.data);
  return res.status(204).send();
}

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function unsubscribe(req: Request, res: Response) {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await removeSubscription(parsed.data.endpoint);
  return res.status(204).send();
}
