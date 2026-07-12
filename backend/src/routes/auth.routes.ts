import { Router } from "express";
import { deleteAvatar, login, logout, me, register, setAvatar } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.put("/avatar", requireAuth, setAvatar);
authRouter.delete("/avatar", requireAuth, deleteAvatar);
