import type { Request, Response } from "express";
import { runAllJobs } from "../jobs/notificationJobs";

export async function runJobs(_req: Request, res: Response) {
  await runAllJobs();
  return res.json({ ok: true, ranAt: new Date().toISOString() });
}
