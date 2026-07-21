import { Router } from "express";
import { subscribe, unsubscribe, vapidPublicKey } from "../controllers/push.controller";
import { requireAuth } from "../middleware/requireAuth";

export const pushRouter = Router();

pushRouter.get("/vapid-public-key", vapidPublicKey);
pushRouter.post("/subscribe", requireAuth, subscribe);
pushRouter.post("/unsubscribe", requireAuth, unsubscribe);
