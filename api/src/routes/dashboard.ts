import { Router } from "express";
import { getDashboardMetrics } from "../services/dashboard";
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