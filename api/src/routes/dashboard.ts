import { Router } from "express";
import { getDashboardMetrics } from "../services/dashboard";
import { runDailySummaries } from "../services/summary";
import { resolveBankScope } from "../services/scope";
import { requireAuth, requireBankAdmin } from "./middleware";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.use(requireBankAdmin());

dashboardRouter.get("/metrics", async (req, res, next) => {
  try {
    const bankId = typeof req.query.bankId === "string" ? req.query.bankId : undefined;
    const metrics = await getDashboardMetrics(req.admin!, bankId);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

/** Phase 5 bank-admin "Run Now": triggers a daily summary run for the day. */
dashboardRouter.post("/summary/run", async (req, res, next) => {
  try {
    const requestedBankId =
      typeof (req.body as { bankId?: unknown } | undefined)?.bankId === "string"
        ? (req.body as { bankId: string }).bankId
        : undefined;
    const forDate =
      typeof (req.body as { forDate?: unknown } | undefined)?.forDate === "string"
        ? new Date((req.body as { forDate: string }).forDate)
        : undefined;
    const bankId = await resolveBankScope(req.admin!, requestedBankId);
    const report = await runDailySummaries({ bankId: bankId ?? undefined, forDate });
    res.json(report);
  } catch (err) {
    next(err);
  }
});