import type { Request, Response } from "express";
import { z } from "zod";
import { getTvShowDetails, searchTvShows, TmdbRequestError } from "../services/tmdb.service";
import { createTvLog, deleteTvLog, listTvLogs, listTvLogsPage, updateTvLog } from "../services/tvLog.service";
import { AlreadyOnWatchlistError, addTvToWatchlist, listTvWatchlist, removeFromTvWatchlist } from "../services/tvWatchlist.service";

const logStatusSchema = z.enum(["watched", "dropped"]);

const searchSchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
});

const detailsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be numeric"),
});

export async function search(req: Request, res: Response) {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const data = await searchTvShows(parsed.data.query, parsed.data.page);
    return res.json(data);
  } catch (err) {
    if (err instanceof TmdbRequestError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

export async function details(req: Request, res: Response) {
  const parsed = detailsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const data = await getTvShowDetails(parsed.data.id);
    return res.json(data);
  } catch (err) {
    if (err instanceof TmdbRequestError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

const createLogSchema = z.object({
  tmdbId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10).optional(),
  review: z.string().max(5000).optional(),
  watchedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: logStatusSchema.optional(),
  hasSpoilers: z.boolean().optional(),
  lastWatchedSeason: z.number().int().min(0).optional(),
  lastWatchedEpisode: z.number().int().min(1).optional(),
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
  lastWatchedSeason: z.number().int().min(0).optional(),
  lastWatchedEpisode: z.number().int().min(1).optional(),
});

export async function createLog(req: Request, res: Response) {
  const parsed = createLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await createTvLog({ userId: req.auth!.userId, ...parsed.data });
  return res.status(201).json(log);
}

export async function listLogs(req: Request, res: Response) {
  const parsed = listLogsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const logs = await listTvLogs(req.auth!.userId, parsed.data.tmdbId);
  return res.json(logs);
}

export async function listLogsPage(req: Request, res: Response) {
  const parsed = listLogsPageSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const page = await listTvLogsPage({ userId: req.auth!.userId, ...parsed.data });
  return res.json(page);
}

export async function updateLog(req: Request, res: Response) {
  const parsed = updateLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await updateTvLog(req.auth!.userId, req.params.id, parsed.data);
  if (!log) {
    return res.status(404).json({ error: "Log not found" });
  }
  return res.json(log);
}

export async function removeLog(req: Request, res: Response) {
  const deleted = await deleteTvLog(req.auth!.userId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Log not found" });
  }
  return res.status(204).send();
}

const addWatchlistSchema = z.object({
  tmdbId: z.number().int().positive(),
});

const listWatchlistSchema = z.object({
  tmdbId: z.coerce.number().int().positive().optional(),
});

export async function addWatchlist(req: Request, res: Response) {
  const parsed = addWatchlistSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const entry = await addTvToWatchlist(req.auth!.userId, parsed.data.tmdbId);
    return res.status(201).json(entry);
  } catch (err) {
    if (err instanceof AlreadyOnWatchlistError) {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

export async function listWatchlist(req: Request, res: Response) {
  const parsed = listWatchlistSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const entries = await listTvWatchlist(req.auth!.userId, parsed.data.tmdbId);
  return res.json(entries);
}

export async function removeWatchlist(req: Request, res: Response) {
  const deleted = await removeFromTvWatchlist(req.auth!.userId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Watchlist entry not found" });
  }
  return res.status(204).send();
}
