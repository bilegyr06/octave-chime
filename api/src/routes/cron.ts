import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { config } from "../core/config";
import { runDailySummaries } from "../services/summary";

export const cronRouter = Router();

/** Phase 5 scheduled job: POST /cron/daily-summary with Bearer CRON_SECRET. */
cronRouter.post("/daily-summary", async (req, res, next) => {
  try {
    if (!config.cronSecret) {
      res.status(501).json({
        error: "cron_secret_not_configured",
        message: "CRON_SECRET is not set on this instance.",
      });
      return;
    }
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    const expected = Buffer.from(config.cronSecret);
    const received = Buffer.from(token);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      res.status(403).json({ error: "forbidden", message: "Invalid cron secret." });
      return;
    }
    const report = await runDailySummaries();
    res.json({ ok: true, report });
  } catch (err) {
    next(err);
  }
});