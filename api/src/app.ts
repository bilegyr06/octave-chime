import express from "express";
import cors from "cors";
import { config } from "./core/config";
import { routes } from "./routes";
import { webhooksRouter } from "./routes/webhooks";
import { enrollRouter } from "./routes/enroll";
import { cronRouter } from "./routes/cron";
import { errorHandler, notFoundHandler } from "./core/errors";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [config.appUrl, "http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/webhooks", webhooksRouter);
  app.use("/api", routes);
  app.use("/api/enroll", enrollRouter);
  app.use("/cron", cronRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
