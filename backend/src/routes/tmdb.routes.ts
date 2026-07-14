import { Router } from "express";
import { details, dice, mood, recommendations, search } from "../controllers/tmdb.controller";
import { requireAuth } from "../middleware/requireAuth";

export const tmdbRouter = Router();

tmdbRouter.use(requireAuth);
tmdbRouter.get("/search", search);
tmdbRouter.get("/recommendations", recommendations);
tmdbRouter.get("/dice", dice);
tmdbRouter.get("/mood", mood);
tmdbRouter.get("/movie/:id", details);
