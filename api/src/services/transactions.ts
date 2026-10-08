import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import { createTermiiAdapter } from "../adapters/termii";
import { resolveBankScope } from "./scope";
import { transactionAlert } from "./templates";
import { toTransactionDomain, type TransactionDomain } from "../models/transaction";
import type { AdminPrincipal } from "../models/admin";
import type { NotificationStatus, TransactionType } from "@prisma/client";

export interface SimulateTxnInput {
  customerId: string;
  type: TransactionType;
  amount: number;
  narration?: string;
}

export interface SimulateTxnResult {
  transaction: TransactionDomain;
  notificationStatus: NotificationStatus;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
      bank: { select: { name: true } },
      linkedAccounts: {
        where: { status: "active" },
        orderBy: { linkedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!customer) throw new AppError("Customer not found", 404, "not_found");

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

  if (phone) {
    const send = await createTermiiAdapter().send(phone, messageBody);
    status = send.status;
    providerMessageId = send.providerMessageId;
    errorMessage = send.errorMessage ?? null;
  } else {
    status = "skipped";
    errorMessage = "no recipient phone on record";
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
    actorType: actor.role === "platform_admin" ? "platform_admin" : "bank_admin",
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