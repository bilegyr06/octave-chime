import type { TransactionType } from "@prisma/client";

export function formatNGN(amount: number): string {
  return amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface TransactionAlertFields {
  bankName: string;
  accountLast4: string;
  amount: number;
  balanceAfter: number;
  reference: string;
}

/** Spec §12 Debit/Credit alert templates. */
export function transactionAlert(
  type: TransactionType,
  f: TransactionAlertFields,
): string {
  const amount = formatNGN(f.amount);
  const balance = formatNGN(f.balanceAfter);
  const account = `${f.bankName} account ending ${f.accountLast4}`;
  return type === "debit"
    ? [
        "Debit Alert",
        `NGN ${amount} left your ${account}.`,
        `Balance: NGN ${balance}`,
        `Ref: ${f.reference}`,
      ].join("\n")
    : [
        "Credit Alert",
        `NGN ${amount} entered your ${account}.`,
        `Balance: NGN ${balance}`,
        `Ref: ${f.reference}`,
      ].join("\n");
}

export interface LinkSuccessFields {
  firstName: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  balance: number;
}

/** Confirmation sent over WhatsApp after a bank account is linked. */
export function linkSuccess(f: LinkSuccessFields): string {
  return [
    `Hi ${f.firstName},`,
    "",
    `Your ${f.bankName} account (${f.accountName} ending ${f.accountLast4}) is now linked to Octave Chime.`,
    `Current balance: NGN ${formatNGN(f.balance)}`,
    "",
    "Your WhatsApp transaction alerts are ACTIVE.",
    "Reply HELP for commands, or PAUSE to pause alerts.",
  ].join("\n");
}