import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { createTermiiAdapter } from "../adapters/termii";
import { lagosDayRange } from "../core/time";
import { dailySummary } from "./templates";
import type { NotificationStatus } from "@prisma/client";

export interface RunDailySummariesInput {
  bankId?: string;
  forDate?: Date;
}

export interface SummaryRunReport {
  /** Lagos day the run targets, as a UTC instant. */
  summaryDate: string;
  /** Formatted Lagos date shown in each message. */
  dateLabel: string;
  scanned: number;
  generated: number;
  duplicates: number;
  sent: number;
  failed: number;
  skipped: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Phase 5 daily summary job: for every eligible customer, derive the day's
 * transaction totals for their current account, compute the opening balance
 * (closing − net), and deliver the summary. Ineligible customers produce no
 * rows at all. Runs are idempotent per (customerId, Lagos day).
 */
export async function runDailySummaries(
  input: RunDailySummariesInput = {},
): Promise<SummaryRunReport> {
  const { start, end } = lagosDayRange(input.forDate ?? new Date());
  const summaryDate = start; // Lagos midnight; stored on the DATE column.
  const dateLabel = new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(start);

  const customers = await prisma.customer.findMany({
    where: {
      ...(input.bankId ? { bankId: input.bankId } : {}),
      whatsappPhone: { not: null },
      serviceStatus: "active",
      consentStatus: "granted",
      whatsappAlertsEnabled: true,
      dailySummaryEnabled: true,
    },
    include: {
      bank: { select: { name: true } },
      linkedAccounts: {
        where: { status: "active" },
        orderBy: { linkedAt: "desc" },
        take: 1,
      },
    },
  });

  const report: SummaryRunReport = {
    summaryDate: summaryDate.toISOString(),
    dateLabel,
    scanned: customers.length,
    generated: 0,
    duplicates: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const customer of customers) {
    const account = customer.linkedAccounts[0];
    if (!account) continue;

    const existing = await prisma.dailySummary.findUnique({
      where: { customerId_summaryDate: { customerId: customer.id, summaryDate } },
      select: { id: true },
    });
    if (existing) {
      report.duplicates += 1;
      continue;
    }

    const grouped = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        bankId: customer.bankId,
        customerId: customer.id,
        linkedAccountId: account.id,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const credits = Number(grouped.find((g) => g.type === "credit")?._sum.amount ?? 0);
    const debits = Number(grouped.find((g) => g.type === "debit")?._sum.amount ?? 0);
    const transactionCount = grouped.reduce((n, g) => n + g._count._all, 0);
    const closingBalance = round2(Number(account.currentBalance));
    const openingBalance = round2(closingBalance - credits + debits);

    const messageBody = dailySummary({
      date: dateLabel,
      accountLast4: account.accountNumberMasked.replace(/^\*+/, "").slice(-4),
      openingBalance,
      totalCredits: round2(credits),
      totalDebits: round2(debits),
      transactionCount,
      closingBalance,
    });

    const phone = customer.whatsappPhone!;
    const send = await createTermiiAdapter().send(phone, messageBody);
    const status: NotificationStatus = send.status;
    if (status === "sent") report.sent += 1;
    else if (status === "failed") report.failed += 1;
    else report.skipped += 1;

    const notification = await prisma.notification.create({
      data: {
        bankId: customer.bankId,
        customerId: customer.id,
        type: "daily_summary",
        channel: "whatsapp",
        status,
        recipient: phone,
        messageBody,
        providerMessageId: send.providerMessageId ?? null,
        errorMessage: send.errorMessage ?? null,
        sentAt: status === "sent" ? new Date() : null,
      },
    });

    await prisma.dailySummary.create({
      data: {
        bankId: customer.bankId,
        customerId: customer.id,
        linkedAccountId: account.id,
        summaryDate,
        openingBalance,
        totalCredits: round2(credits),
        totalDebits: round2(debits),
        closingBalance,
        transactionCount,
        notificationId: notification.id,
      },
    });

    await logAudit({
      bankId: customer.bankId,
      actorType: "system",
      actorId: "cron",
      action: "summary.generated",
      metadata: {
        customerId: customer.id,
        linkedAccountId: account.id,
        summaryDate: summaryDate.toISOString(),
        openingBalance,
        closingBalance,
        transactionCount,
        notificationStatus: status,
      },
    });

    report.generated += 1;
  }

  return report;
}