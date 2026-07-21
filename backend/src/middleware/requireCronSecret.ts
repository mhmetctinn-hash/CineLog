import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

// Guards the external job-trigger endpoint. Not tied to a user session — the
// caller is a scheduled pinger (GitHub Actions), not a logged-in browser.
export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  const provided = req.header("x-cron-secret");
  if (!env.cronSecret || !provided || provided !== env.cronSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
