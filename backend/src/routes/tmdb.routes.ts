import { Router } from "express";
import { details, discover, recommendations, search } from "../controllers/tmdb.controller";
import { requireAuth } from "../middleware/requireAuth";

export const tmdbRouter = Router();

tmdbRouter.use(requireAuth);
tmdbRouter.get("/search", search);
tmdbRouter.get("/discover", discover);
tmdbRouter.get("/recommendations", recommendations);
tmdbRouter.get("/movie/:id", details);
