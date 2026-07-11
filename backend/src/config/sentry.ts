import * as Sentry from "@sentry/node";
import { env } from "./env";

export function initSentry() {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.nodeEnv === "production" ? 0.2 : 0,
  });
}

export { Sentry };
