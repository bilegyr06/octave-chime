import type { Bank, Customer, Notification } from "@prisma/client";

export interface NotificationDomain {
  id: string;
  bankId: string;
  customerId: string;
  customerName: string;
  transactionId: string | null;
  type: Notification["type"];
  channel: Notification["channel"];
  status: Notification["status"];
  recipient: string;
  messageBody: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export type NotificationRow = Notification & { customer?: Pick<Customer, "fullName"> | null; bank?: Pick<Bank, "name"> | null };

export function toNotificationDomain(n: NotificationRow): NotificationDomain {
  return {
    id: n.id,
    bankId: n.bankId,
    customerId: n.customerId,
    customerName: n.customer?.fullName ?? "",
    transactionId: n.transactionId,
    type: n.type,
    channel: n.channel,
    status: n.status,
    recipient: n.recipient,
    messageBody: n.messageBody,
    providerMessageId: n.providerMessageId,
    errorMessage: n.errorMessage,
    sentAt: n.sentAt,
    createdAt: n.createdAt,
  };
}