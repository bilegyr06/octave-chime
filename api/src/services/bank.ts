import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import { toBankProfile, type BankProfileDomain } from "../models/bank";
import type { AdminPrincipal } from "../models/admin";
import { resolveBankScope } from "./scope";
import type { UpdateBankProfileInput } from "../schemas/bank";

/**
 * Resolve the bank a profile read/update targets. bank_admin → their own
 * bank; platform_admin → an explicit `bankId`, required.
 */
async function resolveBank(actor: AdminPrincipal, requestedBankId?: string): Promise<string> {
  const bankId = await resolveBankScope(actor, requestedBankId);
  if (!bankId) {
    throw new AppError("bankId is required for platform admins", 400, "validation_error");
  }
  return bankId;
}

export async function getBankProfile(
  actor: AdminPrincipal,
  requestedBankId?: string,
): Promise<BankProfileDomain> {
  const bankId = await resolveBank(actor, requestedBankId);
  const bank = await prisma.bank.findUnique({ where: { id: bankId } });
  if (!bank) throw new AppError("Bank not found", 404, "not_found");
  return toBankProfile(bank);
}

/** Platform-scoped directory of tenant banks (for cross-bank admin views). */
export async function listBanks(actor: AdminPrincipal): Promise<BankProfileDomain[]> {
  if (actor.role !== "platform_admin") {
    throw new AppError("Only platform admins can list banks", 403, "forbidden");
  }
  const banks = await prisma.bank.findMany({
    orderBy: { name: "asc" },
  });
  return banks.map(toBankProfile);
}

export async function updateBankProfile(
  actor: AdminPrincipal,
  input: UpdateBankProfileInput,
): Promise<BankProfileDomain> {
  const bankId = await resolveBank(actor, input.bankId);

  const bank = await prisma.bank.update({
    where: { id: bankId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
      ...(input.whatsappAlertsPaused !== undefined
        ? { whatsappAlertsPaused: input.whatsappAlertsPaused }
        : {}),
    },
  });

  await logAudit({
    bankId: bank.id,
    actorType: actor.role,
    actorId: actor.id,
    action: input.whatsappAlertsPaused !== undefined ? "bank.alerts_paused_toggled" : "bank.profile_updated",
    metadata: {
      name: input.name,
      logoUrl: input.logoUrl,
      supportEmail: input.supportEmail,
      whatsappAlertsPaused: input.whatsappAlertsPaused,
    },
  });

  return toBankProfile(bank);
}