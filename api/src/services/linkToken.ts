import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { AppError } from "../core/errors";
import type { LinkTokenMode } from "@prisma/client";

export const LINK_TOKEN_TTL_MS = 30 * 60 * 1000;

export interface LinkTokenPayload {
  mode: LinkTokenMode;
  customerId: string;
  expiresAt: Date;
}

export type LinkTokenVerification =
  | { valid: true; payload: LinkTokenPayload }
  | { valid: false; reason: "not_found" | "consumed" | "expired" };

function generateToken(): string {
  return `oc_${randomBytes(24).toString("hex")}`;
}

/**
 * Issue a signed, single-purpose, short-lived, one-time-use link token.
 * Issuing a new token for the same customer invalidates older unconsumed ones.
 */
export async function issueLinkToken(
  customerId: string,
  mode: LinkTokenMode,
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);

  await prisma.$transaction([
    // Revoke earlier unconsumed tokens so at most one link is live per customer.
    prisma.linkToken.updateMany({
      where: { customerId, mode, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.linkToken.create({ data: { token, mode, customerId, expiresAt } }),
  ]);

  return token;
}

export async function verifyLinkToken(token: string): Promise<LinkTokenVerification> {
  const row = await prisma.linkToken.findUnique({ where: { token } });
  if (!row) return { valid: false, reason: "not_found" };
  if (row.consumedAt) return { valid: false, reason: "consumed" };
  if (row.expiresAt.getTime() < Date.now()) return { valid: false, reason: "expired" };
  return {
    valid: true,
    payload: { mode: row.mode, customerId: row.customerId, expiresAt: row.expiresAt },
  };
}

/** Marks a token as used. Throws 410/404 when no longer usable. */
export async function consumeLinkToken(token: string): Promise<LinkTokenPayload> {
  const verification = await verifyLinkToken(token);
  if (!verification.valid) {
    throw new AppError(
      verification.reason === "not_found" ? "Link not found" : "Link expired or already used",
      verification.reason === "not_found" ? 404 : 410,
      "link_invalid",
    );
  }
  await prisma.linkToken.update({
    where: { token },
    data: { consumedAt: new Date() },
  });
  return verification.payload;
}