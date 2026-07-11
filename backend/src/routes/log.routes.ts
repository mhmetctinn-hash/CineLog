import { Router } from "express";
import { create, list, listPage, remove, stats, update } from "../controllers/log.controller";
import { requireAuth } from "../middleware/requireAuth";

export const logRouter = Router();

logRouter.use(requireAuth);
logRouter.post("/", create);
logRouter.get("/", list);
logRouter.get("/page", listPage);
logRouter.get("/stats", stats);
logRouter.put("/:id", update);
logRouter.delete("/:id", remove);
