import type { Request, Response } from "express";
import { z } from "zod";
import { getMovieDetails, searchMovies, TmdbRequestError } from "../services/tmdb.service";
import {
  getDiceRoll,
  getMoodRecommendations,
  getRecommendationsForUser,
  MOOD_OPTIONS,
  PACE_OPTIONS,
} from "../services/recommendation.service";

const searchSchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
});

const detailsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be numeric"),
});

const moodSchema = z.object({
  mood: z.enum(MOOD_OPTIONS as [string, ...string[]]),
  pace: z.enum(PACE_OPTIONS as [string, ...string[]]).optional(),
});

export async function search(req: Request, res: Response) {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const data = await searchMovies(parsed.data.query, parsed.data.page);
    return res.json(data);
  } catch (err) {
    if (err instanceof TmdbRequestError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

export async function recommendations(req: Request, res: Response) {
  const data = await getRecommendationsForUser(req.auth!.userId);
  return res.json(data);
}

export async function dice(req: Request, res: Response) {
  const result = await getDiceRoll(req.auth!.userId);
  if (!result) {
    return res.status(404).json({ error: "Şu an öneri bulunamadı, önce birkaç film logla veya listene ekle." });
  }
  return res.json(result);
}

export async function mood(req: Request, res: Response) {
  const parsed = moodSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = await getMoodRecommendations(req.auth!.userId, parsed.data.mood, parsed.data.pace);
  return res.json(data);
}

export async function details(req: Request, res: Response) {
  const parsed = detailsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const data = await getMovieDetails(parsed.data.id);
    return res.json(data);
  } catch (err) {
    if (err instanceof TmdbRequestError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}
