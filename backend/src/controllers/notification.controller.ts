import type { Request, Response } from "express";
import { getUnreadCount, listNotifications, markAllRead, markRead } from "../services/notification.service";

export async function list(req: Request, res: Response) {
  const data = await listNotifications(req.auth!.userId);
  return res.json(data);
}

export async function unreadCount(req: Request, res: Response) {
  const count = await getUnreadCount(req.auth!.userId);
  return res.json({ count });
}

export async function read(req: Request, res: Response) {
  const ok = await markRead(req.auth!.userId, req.params.id);
  if (!ok) {
    return res.status(404).json({ error: "Notification not found" });
  }
  return res.status(204).send();
}

export async function readAll(req: Request, res: Response) {
  await markAllRead(req.auth!.userId);
  return res.status(204).send();
}
