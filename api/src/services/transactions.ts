import { randomBytes } from "node:crypto";
import { Prisma, type TransactionType } from "@prisma/client";
import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import { createTermiiAdapter } from "../adapters/termii";
import { resolveBankScope } from "./scope";
import { decideDelivery } from "./notifications";
import { transactionAlert } from "./templates";
import { toTransactionDomain, toTransactionListItemDomain, type TransactionDomain, type TransactionListItemDomain } from "../models/transaction";
import type { AdminPrincipal } from "../models/admin";
import type { NotificationStatus } from "@prisma/client";
import type { Page } from "../schemas/query";

export interface SimulateTxnInput {
  customerId: string;
  type: TransactionType;
  amount: number;
  narration?: string;
  bankId?: string;
}

export interface SimulateTxnResult {
  transaction: TransactionDomain;
  notificationStatus: NotificationStatus;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface TransactionListInput {
  page: number;
  pageSize: number;
  customerId?: string;
  type?: string;
  q?: string;
  requestedBankId?: string;
}

/**
 * Admin read side: paginated, tenant-scoped transactions with an optional
 * customer/type/free-text filter (matches narration or reference).
 */
export async function listTransactions(
  actor: AdminPrincipal,
  input: TransactionListInput,
): Promise<Page<TransactionListItemDomain>> {
  const bankId = await resolveBankScope(actor, input.requestedBankId);

  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, ...(bankId ? { bankId } : {}) },
      select: { id: true },
    });
    if (!customer) throw new AppError("Customer not found", 404, "not_found");
  }

  const where: Prisma.TransactionWhereInput = {
    ...(bankId ? { bankId } : {}),
    ...(input.type ? { type: input.type as TransactionType } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(input.q
      ? {
          OR: [
            { narration: { contains: input.q, mode: "insensitive" } },
            { reference: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { customer: { select: { fullName: true } } },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items: items.map(toTransactionListItemDomain),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

/**
 * Admin demo action: create a simulated debit/credit, update the linked
 * account balance, and fan out the §12 WhatsApp alert (Notification row).
 */
export async function simulateTransaction(
  actor: AdminPrincipal,
  input: SimulateTxnInput,
): Promise<SimulateTxnResult> {
  const bankId = await resolveBankScope(actor);

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, ...(bankId ? { bankId } : {}) },
    include: {
      bank: { select: { name: true, whatsappAlertsPaused: true } },
      linkedAccounts: {
        where: { status: "active" },
        orderBy: { linkedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!customer) throw new AppError("Customer not found", 404, "not_found");

  // Authoritative "which bank this belongs to": a supplied bankId must match
  // the customer's own bank so cross-bank simulation is never misattributed.
  if (input.bankId && input.bankId !== customer.bankId) {
    throw new AppError("Bank does not match the customer's bank", 400, "bank_mismatch");
  }

  const account = customer.linkedAccounts[0];
  if (!account) throw new AppError("Customer has no linked account", 400, "no_linked_account");

  const amount = round2(input.amount);
  const balance = round2(Number(account.currentBalance));
  let balanceAfter = balance;
  if (input.type === "debit") {
    if (amount > balance) throw new AppError("Insufficient funds", 400, "insufficient_funds");
    balanceAfter = round2(balance - amount);
  } else {
    balanceAfter = round2(balance + amount);
  }

  const reference = `SIM-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const narration = input.narration ?? (input.type === "debit" ? "Withdrawal" : "Deposit");

  const txn = await prisma.$transaction(async (tx) => {
    await tx.linkedAccount.update({
      where: { id: account.id },
      data: { currentBalance: balanceAfter },
    });
    return tx.transaction.create({
      data: {
        bankId: customer.bankId,
        customerId: customer.id,
        linkedAccountId: account.id,
        type: input.type,
        amount,
        currency: account.currency || "NGN",
        balanceAfter,
        narration,
        reference,
        transactionDate: new Date(),
        source: "simulated",
      },
    });
  });

  const phone = customer.whatsappPhone;
  const messageBody = transactionAlert(input.type, {
    bankName: customer.bank?.name ?? "Bank",
    accountLast4: account.accountNumberMasked.replace(/^\*+/, "").slice(-4),
    amount,
    balanceAfter,
    reference,
  });

  let status: NotificationStatus;
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  const delivery = decideDelivery(
    {
      whatsappPhone: phone,
      serviceStatus: customer.serviceStatus,
      consentStatus: customer.consentStatus,
      whatsappAlertsEnabled: customer.whatsappAlertsEnabled,
    },
    { bankAlertsPaused: customer.bank?.whatsappAlertsPaused ?? false },
  );

  if (phone && delivery.eligible) {
    const send = await createTermiiAdapter().send(phone, messageBody);
    status = send.status;
    providerMessageId = send.providerMessageId;
    errorMessage = send.errorMessage ?? null;
  } else {
    // Bank-side transaction still stands; alert suppressed with a skipped row.
    status = "skipped";
    errorMessage = delivery.reason ?? "no recipient phone on record";
  }

  const notification = await prisma.notification.create({
    data: {
      bankId: customer.bankId,
      customerId: customer.id,
      transactionId: txn.id,
      type: "transaction_alert",
      channel: "whatsapp",
      status,
      recipient: phone ?? "n/a",
      messageBody,
      providerMessageId,
      errorMessage,
      sentAt: status === "sent" ? new Date() : null,
    },
  });

  await logAudit({
    bankId: customer.bankId,
    actorType: actor.role,
    actorId: actor.id,
    action: "transaction.simulated",
    metadata: {
      customerId: customer.id,
      linkedAccountId: account.id,
      type: input.type,
      amount,
      balanceAfter,
      reference,
      notificationStatus: notification.status,
    },
  });

  logger.info("transaction simulated", {
    type: input.type,
    amount,
    balanceAfter,
    notification: notification.status,
  });

  return {
    transaction: toTransactionDomain(txn),
    notificationStatus: notification.status,
  };
}