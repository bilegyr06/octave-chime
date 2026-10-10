import { prisma } from "../db/prisma";
import { toNotificationDomain } from "../models/notification";
import type { DashboardMetrics } from "../models/dashboard";
import type { AdminPrincipal } from "../models/admin";
import { resolveBankScope } from "./scope";
import { lagosDayRange } from "../core/time";

export async function getDashboardMetrics(
  actor: AdminPrincipal,
  requestedBankId?: string,
): Promise<DashboardMetrics> {
  const bankId = await resolveBankScope(actor, requestedBankId);
  const { start } = lagosDayRange();

  const base = bankId ? { bankId } : {};

  const [bank, enrolledCustomers, linkedAccounts, whatsappEnabledCustomers, alertsSentToday, queuedAlertsToday, failedAlertsToday, dailySummariesToday, lastAlert, firstCustomer, firstNotification, recentEnrollments, deliveryLog] =
    await Promise.all([
      bankId ? prisma.bank.findUnique({ where: { id: bankId } }) : null,
      prisma.customer.count({ where: { ...base, enrollmentStatus: "completed" } }),
      prisma.linkedAccount.count({ where: base }),
      prisma.customer.count({
        where: { ...base, enrollmentStatus: "completed", whatsappAlertsEnabled: true },
      }),
      prisma.notification.count({
        where: { ...base, type: "transaction_alert", status: "sent", createdAt: { gte: start } },
      }),
      prisma.notification.count({
        where: { ...base, type: "transaction_alert", status: "queued", createdAt: { gte: start } },
      }),
      prisma.notification.count({
        where: { ...base, type: "transaction_alert", status: "failed", createdAt: { gte: start } },
      }),
      prisma.notification.count({
        where: { ...base, type: "daily_summary", status: "sent", createdAt: { gte: start } },
      }),
      prisma.notification.findFirst({
        where: { ...base, type: "transaction_alert" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.customer.findFirst({
        where: base,
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.notification.findFirst({
        where: base,
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.customer.findMany({
        where: base,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          whatsappPhone: true,
          serviceStatus: true,
          createdAt: true,
        },
      }),
      prisma.notification.findMany({
        where: base,
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { fullName: true } } },
      }),
    ]);

  return {
    bank: bank ? { id: bank.id, name: bank.name, slug: bank.slug, logoUrl: bank.logoUrl } : null,
    enrolledCustomers,
    linkedAccounts,
    whatsappEnabledCustomers,
    alertsSentToday,
    queuedAlertsToday,
    failedAlertsToday,
    dailySummariesToday,
    lastAlertReceivedAt: lastAlert?.createdAt.toISOString() ?? null,
    firstActivityAt: (() => {
      const seen = [firstCustomer?.createdAt, firstNotification?.createdAt].filter(
        (d): d is Date => d instanceof Date,
      );
      return seen.length > 0
        ? new Date(Math.min(...seen.map((d) => d.getTime()))).toISOString()
        : null;
    })(),
    recentEnrollments,
    recentDeliveryLog: deliveryLog.map(toNotificationDomain),
    generatedAt: new Date().toISOString(),
  };
}