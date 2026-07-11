import { Router } from "express";
import {
  addWatchlist,
  createLog,
  details,
  listLogs,
  listLogsPage,
  listWatchlist,
  removeLog,
  removeWatchlist,
  search,
  updateLog,
} from "../controllers/tv.controller";
import { requireAuth } from "../middleware/requireAuth";

export const tvRouter = Router();

tvRouter.use(requireAuth);

tvRouter.get("/search", search);

tvRouter.post("/logs", createLog);
tvRouter.get("/logs", listLogs);
tvRouter.get("/logs/page", listLogsPage);
tvRouter.put("/logs/:id", updateLog);
tvRouter.delete("/logs/:id", removeLog);

tvRouter.post("/watchlist", addWatchlist);
tvRouter.get("/watchlist", listWatchlist);
tvRouter.delete("/watchlist/:id", removeWatchlist);

// catch-all single-segment param route must come last, after the fixed
// /search, /logs, /watchlist paths above
tvRouter.get("/:id", details);
