import { Router } from "express";
import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import {
  DEV_SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "../core/security";
import { parseOrThrow } from "../schemas/parse";
import { loginSchema } from "../schemas/auth";
import { customerQuerySchema } from "../schemas/query";
import { simulateTxnSchema } from "../schemas/transaction";
import { listCustomers } from "../services/customers";
import { simulateTransaction } from "../services/transactions";
import { runDailySummaries } from "../services/summary";
import { getDashboardMetrics } from "../services/dashboard";
import { resolveBankScope } from "../services/scope";
import { normalizePhone, resetSession } from "../services/bot";
import { toBankProfile } from "../models/bank";
import { toAdminDetail } from "../models/admin";
import { requireDevAuth } from "./middleware";

/**
 * Dev-console API surface (Phase 7). Every route is scoped to the `dev` role
 * and the `oc_dev_session` cookie — isolated from the admin dashboard. The
 * console simulates cross-bank transactions, runs summaries, drives the
 * WhatsApp mock inbound path, and reads the bot transcript back.
 */

/** One row of the simulator transcript: bot chat OR a delivered/skipped alert. */
interface TranscriptItem {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  createdAt: string;
  customerId: string | null;
  kind: "bot" | "alert" | "summary";
  status?: string;
  errorMessage?: string | null;
}
export const devRouter = Router();

devRouter.post("/auth/login", async (req, res, next) => {
  try {
    const input = parseOrThrow(loginSchema, req.body);
    const email = input.email.trim().toLowerCase();
    const admin = await prisma.bankAdmin.findUnique({
      where: { email },
      include: { bank: { select: { name: true } } },
    });

    if (!admin?.passwordHash || !verifyPassword(input.password, admin.passwordHash)) {
      throw new AppError("Invalid email or password", 401, "invalid_credentials");
    }
    if (admin.role !== "dev") {
      throw new AppError("Dev access only — use a dev operator account", 403, "forbidden");
    }

    const token = signSession({ id: admin.id, role: admin.role, bankId: admin.bankId });
    res.cookie(DEV_SESSION_COOKIE, token, sessionCookieOptions());

    await logAudit({
      bankId: admin.bankId,
      actorType: "dev",
      actorId: admin.id,
      action: "dev.login",
      metadata: { email: admin.email },
    });

    res.json({ admin: toAdminDetail(admin) });
  } catch (err) {
    next(err);
  }
});

devRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie(DEV_SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
});

devRouter.get("/auth/me", requireDevAuth, (req, res) => {
  res.json({ admin: req.admin ?? null });
});

/** All active banks, platform-style (the dev console is cross-bank). */
devRouter.get("/banks", requireDevAuth, async (req, res, next) => {
  try {
    const banks = await prisma.bank.findMany({ orderBy: { name: "asc" } });
    res.json(banks.map(toBankProfile));
  } catch (err) {
    next(err);
  }
});

/** Customers across banks; `bankId` narrows to one bank (both MUST be dev authed). */
devRouter.get("/customers", requireDevAuth, async (req, res, next) => {
  try {
    const query = parseOrThrow(customerQuerySchema, req.query);
    const result = await listCustomers(req.admin!, {
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      serviceStatus: query.serviceStatus,
      enrollmentStatus: query.enrollmentStatus,
      requestedBankId: query.bankId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** Cross-bank simulation with authoritative bank attribution (bankId validated). */
devRouter.post("/transactions/simulate", requireDevAuth, async (req, res, next) => {
  try {
    const input = parseOrThrow(simulateTxnSchema, req.body);
    const result = await simulateTransaction(req.admin!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/** Immediate daily-summary run, optionally narrowed to one bank. */
devRouter.post("/summary/run", requireDevAuth, async (req, res, next) => {
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

/** Platform-style metrics; `bankId` narrows the panel or omits for all banks. */
devRouter.get("/metrics", requireDevAuth, async (req, res, next) => {
  try {
    const bankId = typeof req.query.bankId === "string" ? req.query.bankId : undefined;
    const metrics = await getDashboardMetrics(req.admin!, bankId);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

/** WhatsApp simulator transcript for one sender phone (newest last, last 60).
 *  Combines bot lifecycle messages (botMessage) with outbound SMS/WhatsApp
 *  alerts and daily summaries (Notification rows) so the whole conversation -
 *  delivered or not - is visible in the simulator. */
devRouter.get("/messages", requireDevAuth, async (req, res, next) => {
  try {
    const phoneRaw = typeof req.query.phone === "string" ? req.query.phone : "";
    if (!phoneRaw) throw new AppError("phone is required", 400, "validation_error");
    const phone = normalizePhone(phoneRaw);

    const [chatRows, alertRows] = await Promise.all([
      prisma.botMessage.findMany({
        where: { sender: phone },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: { id: true, direction: true, text: true, createdAt: true, customerId: true },
      }),
      prisma.notification.findMany({
        where: { recipient: phone },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          type: true,
          status: true,
          messageBody: true,
          errorMessage: true,
          createdAt: true,
          customerId: true,
        },
      }),
    ]);

    const items: TranscriptItem[] = [];
    for (const row of chatRows) {
      items.push({
        id: row.id,
        direction: row.direction,
        text: row.text,
        createdAt: row.createdAt.toISOString(),
        customerId: row.customerId,
        kind: "bot",
      });
    }
    for (const row of alertRows) {
      items.push({
        id: row.id,
        direction: "outbound",
        text: row.messageBody,
        createdAt: row.createdAt.toISOString(),
        customerId: row.customerId,
        kind: row.type === "daily_summary" ? "summary" : "alert",
        status: row.status,
        errorMessage: row.errorMessage,
      });
    }
    items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json({ items: items.slice(-60) });
  } catch (err) {
    next(err);
  }
});

/** Drop the bot's in-memory conversation state for a sender (flubbed demo scrub). */
devRouter.post("/sessions/:phone/reset", requireDevAuth, async (req, res, next) => {
  try {
    const phoneParam = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone;
    const phone = normalizePhone(phoneParam);
    resetSession(phone);
    res.json({ reset: true, phone });
  } catch (err) {
    next(err);
  }
});