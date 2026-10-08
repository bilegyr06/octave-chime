import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import { config, isMonoSimulated } from "../core/config";
import { createMonoAdapter, MonoProviderError, type MonoAccount } from "../adapters/mono";
import { createTermiiAdapter } from "../adapters/termii";
import { verifyLinkToken } from "./linkToken";
import { linkSuccess } from "./templates";
import { toLinkedAccountDomain, type LinkedAccountDomain } from "../models/linkedAccount";
import type { Prisma, TransactionType } from "@prisma/client";

export interface LinkResult {
  linkedAccount: LinkedAccountDomain;
  serviceStatus: "active";
  mode: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface SeedRow {
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  narration: string;
  reference: string;
  transactionDate: Date;
}

/**
 * Build a balance-consistent transaction chain from the account's current
 * balance and (optionally) recent provider transactions: walking newest →
 * oldest records each balanceAfter and reveals the pre-history balance.
 */
function buildSeedRows(account: MonoAccount, recent: SeedRow[]): SeedRow[] {
  if (recent.length === 0) {
    if (account.balance <= 0) return [];
    const reference = `LINK-${Date.now()}-${randomBytes(3).toString("hex")}`;
    return [
      {
        type: "credit",
        amount: round2(account.balance),
        balanceAfter: round2(account.balance),
        narration: "Opening balance at account link",
        reference,
        transactionDate: new Date(),
      },
    ];
  }

  const sorted = [...recent].sort(
    (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
  );
  const rows: SeedRow[] = [];
  let running = round2(account.balance);
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const t = sorted[i];
    rows[i] = { ...t, amount: round2(t.amount), balanceAfter: round2(running) };
    running = round2(running + (t.type === "credit" ? -t.amount : t.amount));
  }
  if (running > 0.01) {
    const reference = `LINK-${Date.now()}-${randomBytes(3).toString("hex")}`;
    rows.unshift({
      type: "credit",
      amount: round2(running),
      balanceAfter: round2(running),
      narration: "Opening balance at account link",
      reference,
      transactionDate: new Date(),
    });
  }
  return rows;
}

/**
 * Complete account linking for an enroll token by exchanging the Mono Connect
 * auth code. The token is consumed only on success so failures can be retried.
 */
export async function linkAccountByCode(token: string, code: string): Promise<LinkResult> {
  const verification = await verifyLinkToken(token);
  if (!verification.valid) {
    throw new AppError(
      verification.reason === "not_found" ? "Link not found" : "Link expired or already used",
      verification.reason === "not_found" ? 404 : 410,
      "link_invalid",
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: verification.payload.customerId },
    include: { bank: { select: { name: true } } },
  });
  if (!customer) throw new AppError("Customer not found", 404, "customer_not_found");

  const adapter = createMonoAdapter();

  let providerAccountId: string;
  let account: MonoAccount;
  try {
    providerAccountId = await adapter.exchangeCode(code);
    account = await adapter.getAccount(providerAccountId);
  } catch (err) {
    if (err instanceof MonoProviderError) {
      logger.warn("mono link failed", { error: err.message });
      throw new AppError(
        "Account linking failed with the provider. Please try again.",
        502,
        "mono_provider_error",
      );
    }
    throw err;
  }

  let recent: SeedRow[] = [];
  try {
    const txns = await adapter.getRecentTransactions(providerAccountId);
    recent = txns.map((t) => ({
      type: t.type,
      amount: t.amount,
      balanceAfter: 0,
      narration: t.narration ?? "Bank transaction",
      reference: t.reference,
      transactionDate: new Date(t.date),
    }));
  } catch (err) {
    logger.warn("mono recent transactions unavailable", { error: String(err) });
  }

  const seedRows = buildSeedRows(account, recent);
  const last4 = account.accountNumber.slice(-4);

  const linkedAccount = await prisma.$transaction(async (tx) => {
    await tx.linkToken.update({
      where: { token },
      data: { consumedAt: new Date() },
    });

    const created = await tx.linkedAccount.create({
      data: {
        customerId: customer.id,
        bankId: customer.bankId,
        provider: isMonoSimulated() ? "mono_simulated" : "mono_live",
        providerAccountId,
        accountName: account.accountName,
        accountNumberMasked: `*${last4}`,
        accountType: "savings",
        currency: account.currency || "NGN",
        currentBalance: round2(account.balance),
        openingBalanceToday: round2(account.balance),
        status: "active",
      },
    });

    if (seedRows.length > 0) {
      await tx.transaction.createMany({
        data: seedRows.map((row) => ({
          bankId: customer.bankId,
          customerId: customer.id,
          linkedAccountId: created.id,
          type: row.type,
          amount: round2(row.amount),
          currency: account.currency || "NGN",
          balanceAfter: round2(row.balanceAfter),
          narration: row.narration,
          reference: row.reference,
          transactionDate: row.transactionDate,
          source: isMonoSimulated() ? "simulated" : "mono",
        })),
      });
    }

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        consentStatus: "granted",
        enrollmentStatus: "completed",
        serviceStatus: "active",
      },
    });

    return created;
  });

  const phone = customer.whatsappPhone;
  if (phone) {
    const text = linkSuccess({
      firstName: customer.fullName.split(" ")[0],
      bankName: customer.bank?.name ?? "bank",
      accountName: account.accountName,
      accountLast4: last4,
      balance: round2(account.balance),
    });
    const result = await createTermiiAdapter().send(phone, text);
    await prisma.botMessage.create({
      data: {
        direction: "outbound",
        sender: phone,
        recipient: phone,
        text,
        customerId: customer.id,
      },
    });
    if (result.status !== "sent") {
      logger.warn("link confirmation not delivered", { status: result.status });
    }
  }

  await logAudit({
    bankId: customer.bankId,
    actorType: "customer",
    actorId: customer.id,
    action: "customer.link_completed",
    metadata: {
      mode: verification.payload.mode,
      provider: isMonoSimulated() ? "mono_simulated" : "mono_live",
      providerAccountId,
    },
  });

  return {
    linkedAccount: toLinkedAccountDomain(linkedAccount),
    serviceStatus: "active",
    mode: config.mono.mode,
  };
}