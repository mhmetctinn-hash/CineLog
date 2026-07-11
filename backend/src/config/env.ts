import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  tmdbApiKey: process.env.TMDB_API_KEY ?? "",
  tmdbBaseUrl: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
  sentryDsn: process.env.SENTRY_DSN ?? "",
};
