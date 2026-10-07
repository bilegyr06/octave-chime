import { Prisma, type EnrollmentStatus, type ServiceStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { AppError } from "../core/errors";
import { toCustomerDomain, type CustomerDomain } from "../models/customer";
import type { AdminPrincipal } from "../models/admin";
import type { CreateCustomerInput, UpdateCustomerInput } from "../schemas/customer";
import type { Page } from "../schemas/query";
import { resolveBankScope } from "./scope";

export interface CustomerListInput {
  page: number;
  pageSize: number;
  q?: string;
  serviceStatus?: string;
  enrollmentStatus?: string;
  requestedBankId?: string;
}

export interface CustomerDetail extends CustomerDomain {
  linkedAccounts: {
    id: string;
    provider: string;
    accountName: string;
    accountNumberMasked: string;
    accountType: string;
    currency: string;
    currentBalance: string;
    status: string;
    linkedAt: Date;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: string;
    currency: string;
    balanceAfter: string;
    narration: string | null;
    reference: string;
    transactionDate: Date;
  }[];
  recentNotifications: {
    id: string;
    type: string;
    status: string;
    recipient: string;
    createdAt: Date;
  }[];
}

export async function listCustomers(
  actor: AdminPrincipal,
  input: CustomerListInput,
): Promise<Page<CustomerDomain>> {
  const bankId = await resolveBankScope(actor, input.requestedBankId);

  const hasQ = input.q && input.q.length > 0;
  const where: Prisma.CustomerWhereInput = {
    ...(bankId ? { bankId } : {}),
    ...(input.serviceStatus ? { serviceStatus: input.serviceStatus as ServiceStatus } : {}),
    ...(input.enrollmentStatus ? { enrollmentStatus: input.enrollmentStatus as EnrollmentStatus } : {}),
    ...(hasQ
      ? {
          OR: [
            { fullName: { contains: input.q, mode: "insensitive" as const } },
            { whatsappPhone: { contains: input.q } },
            { email: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { bank: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items: items.map(toCustomerDomain),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getCustomer(
  actor: AdminPrincipal,
  customerId: string,
): Promise<CustomerDetail> {
  const bankId = await resolveBankScope(actor);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...(bankId ? { bankId } : {}) },
    include: {
      bank: { select: { name: true } },
      linkedAccounts: {
        orderBy: { linkedAt: "desc" },
        take: 5,
        select: {
          id: true,
          provider: true,
          accountName: true,
          accountNumberMasked: true,
          accountType: true,
          currency: true,
          currentBalance: true,
          status: true,
          linkedAt: true,
        },
      },
      transactions: {
        orderBy: { transactionDate: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          balanceAfter: true,
          narration: true,
          reference: true,
          transactionDate: true,
        },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, type: true, status: true, recipient: true, createdAt: true },
      },
    },
  });

  if (!customer) throw new AppError("Customer not found", 404, "not_found");
  return {
    ...toCustomerDomain(customer),
    linkedAccounts: customer.linkedAccounts.map((a) => ({ ...a, provider: a.provider, currentBalance: a.currentBalance.toFixed(2) })),
    recentTransactions: customer.transactions.map((t) => ({
      ...t,
      amount: t.amount.toFixed(2),
      balanceAfter: t.balanceAfter.toFixed(2),
    })),
    recentNotifications: customer.notifications,
  };
}

export async function createCustomer(
  actor: AdminPrincipal,
  input: CreateCustomerInput,
): Promise<CustomerDomain> {
  const bankId = await resolveBankScope(actor, input.bankId);
  if (!bankId) {
    throw new AppError("bankId is required for platform admins", 400, "validation_error");
  }

  const customer = await prisma.customer.create({
    data: {
      bankId,
      fullName: input.fullName,
      email: input.email ?? null,
      whatsappPhone: input.whatsappPhone ?? null,
      consentStatus: "pending",
      enrollmentStatus: "not_started",
      serviceStatus: "pending_link",
      whatsappAlertsEnabled: input.whatsappAlertsEnabled,
      dailySummaryEnabled: input.dailySummaryEnabled,
      preferredSummaryTime: input.preferredSummaryTime,
    },
    include: { bank: { select: { name: true } } },
  });

  await logAudit({
    bankId: customer.bankId,
    actorType: actor.role,
    actorId: actor.id,
    action: "customer.create",
    metadata: { customerId: customer.id, fullName: customer.fullName },
  });

  return toCustomerDomain(customer);
}

export async function updateCustomer(
  actor: AdminPrincipal,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<CustomerDomain> {
  const bankId = await resolveBankScope(actor);
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, ...(bankId ? { bankId } : {}) },
  });
  if (!existing) throw new AppError("Customer not found", 404, "not_found");

  const updated = await prisma.customer.update({
    where: { id: existing.id },
    data: {
      fullName: input.fullName,
      email: input.email !== undefined ? input.email : undefined,
      whatsappPhone: input.whatsappPhone,
      whatsappAlertsEnabled: input.whatsappAlertsEnabled,
      dailySummaryEnabled: input.dailySummaryEnabled,
      preferredSummaryTime: input.preferredSummaryTime,
      serviceStatus: input.serviceStatus,
      consentStatus: input.consentStatus,
    },
    include: { bank: { select: { name: true } } },
  });

  await logAudit({
    bankId: updated.bankId,
    actorType: actor.role,
    actorId: actor.id,
    action: `customer.${input.serviceStatus ? "set_status" : "update"}`,
    metadata: {
      customerId: updated.id,
      ...(input.serviceStatus ? { serviceStatus: input.serviceStatus } : {}),
    },
  });

  return toCustomerDomain(updated);
}