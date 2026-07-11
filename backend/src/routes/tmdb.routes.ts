import { Router } from "express";
import { details, recommendations, search } from "../controllers/tmdb.controller";
import { requireAuth } from "../middleware/requireAuth";

export const tmdbRouter = Router();

tmdbRouter.use(requireAuth);
tmdbRouter.get("/search", search);
tmdbRouter.get("/recommendations", recommendations);
tmdbRouter.get("/movie/:id", details);
