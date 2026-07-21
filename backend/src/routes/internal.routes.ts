import { Router } from "express";
import { runJobs } from "../controllers/internal.controller";
import { requireCronSecret } from "../middleware/requireCronSecret";

export const internalRouter = Router();

internalRouter.post("/run-jobs", requireCronSecret, runJobs);
