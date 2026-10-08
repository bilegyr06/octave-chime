import { Prisma, type NotificationType, type NotificationStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AppError } from "../core/errors";
import { toNotificationDomain, type NotificationDomain } from "../models/notification";
import type { AdminPrincipal } from "../models/admin";
import type { Page } from "../schemas/query";
import { resolveBankScope } from "./scope";

export interface DeliveryDecision {
  eligible: boolean;
  reason?: string;
}

/**
 * Phase 5 gate: whether a customer should receive outbound alerts on their
 * linked phone. Applied to transaction alerts and daily summaries alike.
 */
export function decideDelivery(
  customer: Pick<
    import("@prisma/client").Customer,
    "whatsappPhone" | "serviceStatus" | "consentStatus" | "whatsappAlertsEnabled"
  >,
): DeliveryDecision {
  if (!customer.whatsappPhone) return { eligible: false, reason: "no recipient phone on record" };
  if (customer.serviceStatus !== "active")
    return { eligible: false, reason: `service ${customer.serviceStatus}` };
  if (customer.consentStatus !== "granted")
    return { eligible: false, reason: `consent ${customer.consentStatus}` };
  if (!customer.whatsappAlertsEnabled)
    return { eligible: false, reason: "whatsapp alerts disabled" };
  return { eligible: true };
}

export interface NotificationListInput {
  page: number;
  pageSize: number;
  type?: string;
  status?: string;
  customerId?: string;
  requestedBankId?: string;
}

export async function listNotifications(
  actor: AdminPrincipal,
  input: NotificationListInput,
): Promise<Page<NotificationDomain>> {
  const bankId = await resolveBankScope(actor, input.requestedBankId);

  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, ...(bankId ? { bankId } : {}) },
      select: { id: true },
    });
    if (!customer) throw new AppError("Customer not found", 404, "not_found");
  }

  const where: Prisma.NotificationWhereInput = {
    ...(bankId ? { bankId } : {}),
    ...(input.type ? { type: input.type as NotificationType } : {}),
    ...(input.status ? { status: input.status as NotificationStatus } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { customer: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: items.map(toNotificationDomain),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}