import type { Customer, Transaction } from "@prisma/client";

export interface TransactionDomain {
  id: string;
  customerId: string;
  linkedAccountId: string;
  type: Transaction["type"];
  amount: number;
  currency: string;
  balanceAfter: number;
  narration: string | null;
  reference: string;
  transactionDate: Date;
  source: Transaction["source"];
}

export function toTransactionDomain(t: Transaction): TransactionDomain {
  return {
    id: t.id,
    customerId: t.customerId,
    linkedAccountId: t.linkedAccountId,
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency,
    balanceAfter: Number(t.balanceAfter),
    narration: t.narration,
    reference: t.reference,
    transactionDate: t.transactionDate,
    source: t.source,
  };
}

export interface TransactionListItemDomain extends TransactionDomain {
  customerName: string;
}

export type TransactionListRow = Transaction & {
  customer?: Pick<Customer, "fullName"> | null;
};

export function toTransactionListItemDomain(t: TransactionListRow): TransactionListItemDomain {
  return { ...toTransactionDomain(t), customerName: t.customer?.fullName ?? "" };
}