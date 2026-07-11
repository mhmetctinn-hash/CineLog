import type { Request, Response } from "express";
import { z } from "zod";
import { AlreadyOnWatchlistError, addToWatchlist, listWatchlist, removeFromWatchlist } from "../services/watchlist.service";

const addSchema = z.object({
  tmdbId: z.number().int().positive(),
});

const listSchema = z.object({
  tmdbId: z.coerce.number().int().positive().optional(),
});

export async function add(req: Request, res: Response) {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const entry = await addToWatchlist(req.auth!.userId, parsed.data.tmdbId);
    return res.status(201).json(entry);
  } catch (err) {
    if (err instanceof AlreadyOnWatchlistError) {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

export async function list(req: Request, res: Response) {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const entries = await listWatchlist(req.auth!.userId, parsed.data.tmdbId);
  return res.json(entries);
}

export async function remove(req: Request, res: Response) {
  const deleted = await removeFromWatchlist(req.auth!.userId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Watchlist entry not found" });
  }
  return res.status(204).send();
}
