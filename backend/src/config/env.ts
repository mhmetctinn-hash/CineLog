import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  tmdbApiKey: process.env.TMDB_API_KEY ?? "",
  tmdbBaseUrl: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "Cinelog <no-reply@cinelog.app>",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:no-reply@cinelog.app",
  enableScheduledJobs: process.env.ENABLE_SCHEDULED_JOBS !== "false",
  cronSecret: process.env.CRON_SECRET ?? "",
};
