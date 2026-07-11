import type { Request, Response } from "express";
import { z } from "zod";
import { createLog, deleteLog, getStats, listLogs, listLogsPage, updateLog } from "../services/log.service";

const logStatusSchema = z.enum(["watched", "dropped"]);

const createLogSchema = z.object({
  tmdbId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10).optional(),
  review: z.string().max(5000).optional(),
  watchedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: logStatusSchema.optional(),
  hasSpoilers: z.boolean().optional(),
});

const listLogsSchema = z.object({
  tmdbId: z.coerce.number().int().positive().optional(),
});

const listLogsPageSchema = z.object({
  status: logStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const updateLogSchema = z.object({
  rating: z.number().int().min(1).max(10).optional(),
  review: z.string().max(5000).optional(),
  watchedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: logStatusSchema.optional(),
  hasSpoilers: z.boolean().optional(),
});

export async function create(req: Request, res: Response) {
  const parsed = createLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await createLog({ userId: req.auth!.userId, ...parsed.data });
  return res.status(201).json(log);
}

export async function list(req: Request, res: Response) {
  const parsed = listLogsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const logs = await listLogs(req.auth!.userId, parsed.data.tmdbId);
  return res.json(logs);
}

export async function listPage(req: Request, res: Response) {
  const parsed = listLogsPageSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const page = await listLogsPage({ userId: req.auth!.userId, ...parsed.data });
  return res.json(page);
}

export async function update(req: Request, res: Response) {
  const parsed = updateLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await updateLog(req.auth!.userId, req.params.id, parsed.data);
  if (!log) {
    return res.status(404).json({ error: "Log not found" });
  }
  return res.json(log);
}

export async function stats(req: Request, res: Response) {
  const data = await getStats(req.auth!.userId);
  return res.json(data);
}

export async function remove(req: Request, res: Response) {
  const deleted = await deleteLog(req.auth!.userId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Log not found" });
  }
  return res.status(204).send();
}
