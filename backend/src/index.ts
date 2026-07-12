import { initSentry, Sentry } from "./config/sentry";

initSentry();

import { app } from "./app";
import { env } from "./config/env";

process.on("unhandledRejection", (reason) => {
  Sentry.captureException(reason);
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  Sentry.captureException(err);
  console.error("Uncaught exception:", err);
});

app.listen(env.port, () => {
  console.log(`SineVA backend listening on port ${env.port}`);
});
