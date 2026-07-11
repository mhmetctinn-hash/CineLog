import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/requireAuth";
import { authRouter } from "./routes/auth.routes";
import { tmdbRouter } from "./routes/tmdb.routes";

export const app = express();

app.use(cors({ credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/tmdb", tmdbRouter);

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ email: req.auth?.email });
});
