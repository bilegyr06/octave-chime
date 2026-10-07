import { Router } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../core/errors";
import { consumeLinkToken, verifyLinkToken } from "../services/linkToken";

export const enrollRouter = Router();

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

/** Public validation for secure /enroll/[token] links (UI page is Phase 6). */
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