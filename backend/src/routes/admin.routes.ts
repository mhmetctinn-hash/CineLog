import { Router } from "express";
import { removeUser, stats, users } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/users", users);
adminRouter.delete("/users/:id", removeUser);
adminRouter.get("/stats", stats);
