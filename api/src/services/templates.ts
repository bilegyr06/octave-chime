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

/** Confirmation after a RELINK completes — the account is freshly connected. */
export function relinkSuccess(f: LinkSuccessFields): string {
  return [
    `Hi ${f.firstName},`,
    "",
    `Your ${f.bankName} account (${f.accountName} ending ${f.accountLast4}) has been re-connected to Octave Chime.`,
    `Current balance: NGN ${formatNGN(f.balance)}`,
    "",
    "Your WhatsApp transaction alerts are ACTIVE again.",
    "Reply HELP for commands.",
  ].join("\n");
}

/** Confirmation after a reconsent that needed a fresh link completes. */
export function reconsentLinked(f: LinkSuccessFields): string {
  return [
    `Hi ${f.firstName},`,
    "",
    `Consent confirmed — your ${f.bankName} account (${f.accountName} ending ${f.accountLast4}) is linked again.`,
    `Current balance: NGN ${formatNGN(f.balance)}`,
    "",
    "Your WhatsApp transaction alerts and daily summaries are ACTIVE.",
    "Reply HELP for commands.",
  ].join("\n");
}

export const HELP_TEXT = [
  "Octave Chime commands:",
  "START - begin enrollment or re-opt-in after opting out",
  "PAUSE - pause transaction alerts and daily summaries",
  "RESUME - turn alerts back on after a pause",
  "STOP - opt out of WhatsApp alerts completely",
  "RELINK - get a secure link to reconnect your bank account",
  "BALANCE - see your linked account balance",
  "PRIVACY - how your data is used",
  "HELP - show this message",
  "",
  "🔒 We never ask for your PIN, OTP, BVN, or card details on WhatsApp.",
].join("\n");

export const PRIVACY_TEXT = [
  "Privacy at Octave Chime:",
  "1. We send WhatsApp transaction alerts and daily summaries for the bank account you opt into.",
  "2. Consent is captured during enrollment and can be revoked anytime with STOP.",
  "3. Your phone number and masked account info are used only to deliver these alerts.",
  "4. We never ask for or store your PIN, password, OTP, BVN, or card details.",
  "5. Account linking happens on a secure web page, never inside WhatsApp.",
  "",
  "Reply STOP to revoke consent, or PAUSE to pause alerts temporarily.",
].join("\n");

export const PAUSE_CONFIRM_PROMPT = [
  "Pause WhatsApp transaction alerts and daily summaries for your linked account?",
  "",
  "Reply YES to pause, or NO to keep alerts active.",
].join("\n");

export const PAUSE_DONE =
  "WhatsApp alerts are currently paused for this account.\nReply RESUME on WhatsApp to turn them back on.";

export const PAUSE_CANCELLED = "OK. Your WhatsApp alerts stay active. Reply HELP for other options.";

export const RESUME_DONE = "Your WhatsApp alerts and daily summaries are active again.";

export const STOP_CONFIRM_PROMPT = [
  "Are you sure you want to stop WhatsApp transaction alerts for this linked account?",
  "This opts you out of Octave Chime completely.",
  "",
  "Reply YES to stop, or NO to keep alerts active.",
].join("\n");

export const STOP_DONE = [
  "You have opted out of Octave Chime.",
  "You will no longer receive WhatsApp transaction alerts or daily summaries.",
  "",
  "Your data remains protected. Reply START anytime to re-opt in — we will send a fresh secure consent link.",
].join("\n");

export const STOP_CANCELLED = "OK. Your WhatsApp alerts stay active. Reply HELP for other options.";

export const RECONSENT_INTRO = (firstName: string, url: string): string =>
  [
    `Hi ${firstName}, welcome back.`,
    "",
    "Reactivation requires fresh consent:",
    "1. You agree to receive transaction alerts and daily summaries on WhatsApp.",
    "2. You understand that sensitive credentials must never be shared on WhatsApp.",
    "3. Account linking happens on a secure web page, never inside WhatsApp.",
    "",
    "Open this secure consent link within 30 minutes to confirm:",
    url,
  ].join("\n");

export const RELINK_INTRO = (url: string): string =>
  [
    "Here is your secure link to reconnect your bank account.",
    "It is single-use and expires in 30 minutes.",
    url,
    "",
    "🔒 We never ask for your PIN or password.",
  ].join("\n");

export const NOT_LINKED_YET =
  "Your account is not linked yet. Open the secure link we sent to link your bank account.\nReply HELP for commands.";

export function balanceText(balance: number, accountLast4: string): string {
  return `Current balance: NGN ${formatNGN(balance)}\nAccount ending ${accountLast4}`;
}

export interface DailySummaryFields {
  date: string;
  accountLast4: string;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  closingBalance: number;
}

/** Spec §12 Daily summary template (21:00 Lagos delivery). */
export function dailySummary(f: DailySummaryFields): string {
  return [
    "Your Daily Balance Summary",
    `Date: ${f.date}`,
    `Account ending ${f.accountLast4}`,
    "",
    `Opening balance: NGN ${formatNGN(f.openingBalance)}`,
    `Credits: NGN ${formatNGN(f.totalCredits)}`,
    `Debits: NGN ${formatNGN(f.totalDebits)}`,
    `Transactions: ${f.transactionCount}`,
    "",
    `Closing balance: NGN ${formatNGN(f.closingBalance)}`,
  ].join("\n");
}