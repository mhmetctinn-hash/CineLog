import { Router } from "express";
import { add, list, remove } from "../controllers/watchlist.controller";
import { requireAuth } from "../middleware/requireAuth";

export const watchlistRouter = Router();

watchlistRouter.use(requireAuth);
watchlistRouter.post("/", add);
watchlistRouter.get("/", list);
watchlistRouter.delete("/:id", remove);
