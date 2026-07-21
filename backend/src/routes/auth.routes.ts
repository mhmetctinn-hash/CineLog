import { Router } from "express";
import {
  deleteAvatar,
  forgotPassword,
  login,
  logout,
  me,
  performPasswordReset,
  register,
  setAvatar,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", performPasswordReset);
authRouter.get("/me", requireAuth, me);
authRouter.put("/avatar", requireAuth, setAvatar);
authRouter.delete("/avatar", requireAuth, deleteAvatar);
