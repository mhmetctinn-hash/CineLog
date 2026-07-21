import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const email = req.auth?.email?.toLowerCase();
  if (!env.adminEmail || !email || email !== env.adminEmail.toLowerCase()) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

export function isAdminEmail(email: string): boolean {
  return Boolean(env.adminEmail) && email.toLowerCase() === env.adminEmail.toLowerCase();
}
