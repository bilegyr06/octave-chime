import { prisma } from "../db/prisma";
import { AppError } from "../core/errors";
import type { AdminPrincipal } from "../models/admin";

/**
 * Tenant scope resolution:
 * - `bank_admin` → always their own bank (a requested `bankId` must match, else 403).
 * - `platform_admin` → the requested `bankId`, or `undefined` = all banks.
 * Returns `undefined` only for an unscoped platform query.
 */
export async function resolveBankScope(
  actor: AdminPrincipal,
  requestedBankId?: string,
): Promise<string | undefined> {
  if (actor.role === "bank_admin") {
    if (requestedBankId && requestedBankId !== actor.bankId) {
      throw new AppError("You cannot query another bank", 403, "forbidden");
    }
    if (!actor.bankId) {
      throw new AppError("Admin has no bank assigned", 403, "forbidden");
    }
    return actor.bankId;
  }

  if (requestedBankId) {
    const bank = await prisma.bank.findUnique({ where: { id: requestedBankId } });
    if (!bank) throw new AppError("Bank not found", 404, "not_found");
    return bank.id;
  }
  return undefined;
}