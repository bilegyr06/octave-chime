import { Router } from "express";
import { prisma } from "../db/prisma";
import { config, isMockMode } from "../core/config";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let db: string = "not_configured";
  if (config.databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch {
      db = "error";
    }
  }
  res.json({
    ok: true,
    db,
    termiiMode: isMockMode() ? "mock" : "live",
    time: new Date().toISOString(),
  });
});
