import { Router } from "express";
import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import { consumeLinkToken, verifyLinkToken } from "../services/linkToken";
import { parseOrThrow } from "../schemas/parse";
import { consentSchema } from "../schemas/enroll";
import { config, isMonoSimulated } from "../core/config";
import { demoAccountForBank } from "../models/monoDemo";

export const enrollRouter = Router();

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

/** Public validation for secure /enroll/[token] links. */
enrollRouter.get("/:token", async (req, res, next) => {
  try {
    const verification = await verifyLinkToken(req.params.token);
    if (!verification.valid) {
      throw new AppError(
        "Link not found",
        verification.reason === "not_found" ? 404 : 410,
        verification.reason === "not_found" ? "link_not_found" : "link_expired",
      );
    }
    const customer = await prisma.customer.findUnique({
      where: { id: verification.payload.customerId },
      include: { bank: { select: { id: true, name: true, logoUrl: true } } },
    });
    if (!customer) throw new AppError("Customer not found", 404, "customer_not_found");

    res.json({
      valid: true,
      mode: verification.payload.mode,
      expiresAt: verification.payload.expiresAt,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phoneMasked: customer.whatsappPhone ? maskPhone(customer.whatsappPhone) : null,
      },
      bank: customer.bank,
      mono: {
        mode: config.mono.mode,
        demoAccount: isMonoSimulated()
          ? demoAccountForBank(customer.bank?.name ?? "")
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Secure status surface (build plan §4): token-gated linking/consent snapshot. */
enrollRouter.get("/:token/status", async (req, res, next) => {
  try {
    const verification = await verifyLinkToken(req.params.token);
    if (!verification.valid) {
      throw new AppError(
        "Link not found",
        verification.reason === "not_found" ? 404 : 410,
        verification.reason === "not_found" ? "link_not_found" : "link_expired",
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: verification.payload.customerId },
      include: {
        bank: { select: { id: true, name: true, logoUrl: true } },
        linkedAccounts: {
          orderBy: { linkedAt: "desc" },
          take: 1,
          select: {
            id: true,
            provider: true,
            accountName: true,
            accountNumberMasked: true,
            currency: true,
            status: true,
            linkedAt: true,
          },
        },
      },
    });
    if (!customer) throw new AppError("Customer not found", 404, "customer_not_found");

    res.json({
      valid: true,
      mode: verification.payload.mode,
      expiresAt: verification.payload.expiresAt,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phoneMasked: customer.whatsappPhone ? maskPhone(customer.whatsappPhone) : null,
        consentStatus: customer.consentStatus,
        serviceStatus: customer.serviceStatus,
        enrollmentStatus: customer.enrollmentStatus,
        whatsappAlertsEnabled: customer.whatsappAlertsEnabled,
        dailySummaryEnabled: customer.dailySummaryEnabled,
      },
      bank: customer.bank,
      account: customer.linkedAccounts[0] ?? null,
    });
  } catch (err) {
    next(err);
  }
});

/** Consumption happens when account linking completes (Phase 4). */
enrollRouter.post("/:token/consume", async (req, res, next) => {
  try {
    const payload = await consumeLinkToken(req.params.token);
    res.json({ consumed: true, mode: payload.mode, customerId: payload.customerId });
  } catch (err) {
    next(err);
  }
});

/**
 * Re-consent confirmation for opted-out customers (Phase 5). Consumes the
 * token ONLY when no fresh link is needed so an unconsumed token can still be
 * driven through the Mono exchange when the previous account is gone.
 */
enrollRouter.post("/:token/consent", async (req, res, next) => {
  try {
    parseOrThrow(consentSchema, req.body ?? {});

    const verification = await verifyLinkToken(req.params.token);
    if (!verification.valid) {
      throw new AppError(
        "Link not found",
        verification.reason === "not_found" ? 404 : 410,
        verification.reason === "not_found" ? "link_not_found" : "link_expired",
      );
    }
    if (verification.payload.mode !== "reconsent") {
      throw new AppError("This link does not support consent confirmation", 400, "invalid_link_mode");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: verification.payload.customerId },
      include: {
        linkedAccounts: { where: { status: "active" }, take: 1, select: { id: true } },
      },
    });
    if (!customer) throw new AppError("Customer not found", 404, "customer_not_found");

    if (customer.linkedAccounts.length > 0) {
      await consumeLinkToken(req.params.token);
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          consentStatus: "granted",
          serviceStatus: "active",
          whatsappAlertsEnabled: true,
        },
      });
      await logAudit({
        bankId: customer.bankId,
        actorType: "customer",
        actorId: customer.id,
        action: "customer.reconsent_completed",
        metadata: { reactivated: true },
      });
      res.json({ confirmed: true, needsLink: false, serviceStatus: "active" });
      return;
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { consentStatus: "granted" },
    });
    // Token intentionally left unconsumed so the web flow can complete the link.
    res.json({ confirmed: true, needsLink: true, serviceStatus: "pending_link" });
  } catch (err) {
    next(err);
  }
});