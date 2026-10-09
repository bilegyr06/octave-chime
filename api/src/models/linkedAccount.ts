import type { LinkedAccount } from "@prisma/client";

export interface LinkedAccountDomain {
  id: string;
  customerId: string;
  bankId: string;
  provider: LinkedAccount["provider"];
  providerAccountId: string;
  accountName: string;
  accountNumberMasked: string;
  accountType: string;
  currency: string;
  currentBalance: number;
  openingBalanceToday: number;
  linkedAt: Date;
  status: LinkedAccount["status"];
}

export function toLinkedAccountDomain(la: LinkedAccount): LinkedAccountDomain {
  return {
    id: la.id,
    customerId: la.customerId,
    bankId: la.bankId,
    provider: la.provider,
    providerAccountId: la.providerAccountId,
    accountName: la.accountName,
    accountNumberMasked: la.accountNumberMasked,
    accountType: la.accountType,
    currency: la.currency,
    currentBalance: Number(la.currentBalance),
    openingBalanceToday: Number(la.openingBalanceToday),
    linkedAt: la.linkedAt,
    status: la.status,
  };
}