import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { Sentry } from "./config/sentry";
import { requireAuth } from "./middleware/requireAuth";
import { apiLimiter, authLimiter } from "./middleware/rateLimit";
import { authRouter } from "./routes/auth.routes";
import { logRouter } from "./routes/log.routes";
import { tmdbRouter } from "./routes/tmdb.routes";
import { tvRouter } from "./routes/tv.routes";
import { watchlistRouter } from "./routes/watchlist.routes";

export const app = express();

// Render (and most PaaS) sit the app behind a reverse proxy; trusting the
// first hop gives express-rate-limit and req.ip the real client IP from
// X-Forwarded-For instead of the proxy's.
app.set("trust proxy", 1);

app.use(cors({ credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/tmdb", tmdbRouter);
app.use("/api/logs", logRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/tv", tvRouter);

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ email: req.auth?.email });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err);
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
