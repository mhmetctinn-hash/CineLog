import { Router } from "express";
import { create, list, remove, update } from "../controllers/log.controller";
import { requireAuth } from "../middleware/requireAuth";

export const logRouter = Router();

logRouter.use(requireAuth);
logRouter.post("/", create);
logRouter.get("/", list);
logRouter.put("/:id", update);
logRouter.delete("/:id", remove);
