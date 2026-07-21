import { Router } from "express";
import { list, read, readAll, unreadCount } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/requireAuth";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get("/", list);
notificationRouter.get("/unread-count", unreadCount);
notificationRouter.post("/:id/read", read);
notificationRouter.post("/read-all", readAll);
