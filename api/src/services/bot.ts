import { prisma } from "../db/prisma";
import { logAudit } from "../db/audit";
import { config } from "../core/config";
import { issueLinkToken } from "./linkToken";
import {
  balanceText,
  HELP_TEXT,
  NOT_LINKED_YET,
  PAUSE_CANCELLED,
  PAUSE_CONFIRM_PROMPT,
  PAUSE_DONE,
  PRIVACY_TEXT,
  RECONSENT_INTRO,
  RELINK_INTRO,
  RESUME_DONE,
  STOP_CANCELLED,
  STOP_CONFIRM_PROMPT,
  STOP_DONE,
} from "./templates";

/** Normalize a Termii-style sender into E.164 (11-digit NGN or full intl). */
export function normalizePhone(raw: string): string {
  const clean = raw.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) return clean;
  // Nigerian numbers arrive as 2348..., 08... or 8...
  if (clean.startsWith("234") || clean.startsWith("2340")) return `+${clean}`;
  if (clean.startsWith("0")) return `+234${clean.slice(1)}`;
  return `+${clean}`;
}

type BotStep =
  | "idle"
  | "choose_bank"
  | "confirm_consent"
  | "enter_name"
  | "confirm_pause"
  | "confirm_stop";

interface BotSession {
  step: BotStep;
  bankId: string | null;
}

export interface BotReply {
  text: string;
}

export interface HandleResult {
  replies: BotReply[];
  /** Customer id when the conversation resolved to one. */
  customerId?: string;
}

const WELCOME = [
  "Welcome to Octave Chime - WhatsApp alerts for your bank account.",
  "",
  "🔒 Safety: We will NEVER ask for your PIN, BVN, OTP, card details, or banking password on WhatsApp.",
  "Account linking always happens on a secure web page.",
].join("\n");

function bankMenu(banks: { name: string }[]): string {
  if (banks.length === 0) return "No banks are available right now.";
  return `Choose your bank:\n${banks.map((b, i) => `${i + 1}) ${b.name}`).join("\n")}\n\nReply with 1, 2, 3 or 4.`;
}

const CONSENT_TEXT = [
  "Almost done - please confirm your consent:",
  "",
  "1. You agree to receive transaction alerts and daily balance summaries on WhatsApp.",
  "2. You understand that sensitive credentials must never be shared on WhatsApp.",
  "3. Account linking happens on a secure web page, never inside WhatsApp.",
  "4. You can pause or revoke alerts at any time by replying PAUSE or STOP.",
  "",
  "Reply YES to continue.",
].join("\n");

const NAME_RE = /^[A-Za-z][A-Za-z' .-]{1,60}$/;

const sessions = new Map<string, BotSession>();

export function resetSession(phone: string): void {
  sessions.delete(phone);
}

async function activeBanks(): Promise<{ id: string; name: string }[]> {
  return prisma.bank.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Fire-and-forget audit for control changes — never throws into the reply path. */
function auditCustomer(action: string, customer: { id: string; bankId: string }, extra?: object): void {
  void logAudit({
    bankId: customer.bankId,
    actorType: "customer",
    actorId: customer.id,
    action,
    metadata: extra ?? undefined,
  });
}

interface ExistingCustomerRow {
  id: string;
  bankId: string;
  fullName: string;
  serviceStatus: string;
  bank: { name: string } | null;
  linkedAccounts: { id: string; currentBalance: unknown; accountNumberMasked: string }[];
}

/** Handles a control keyword for an already-enrolled customer. Returns null when it is not a control command. */
async function handleExistingCommand(
  upper: string,
  existing: ExistingCustomerRow,
  phone: string,
): Promise<HandleResult | null> {
  const id = existing.id;
  const firstName = existing.fullName.split(" ")[0];
  const account = existing.linkedAccounts[0];

  switch (upper) {
    case "HELP":
      return { replies: [{ text: HELP_TEXT }], customerId: id };
    case "PRIVACY":
      return { replies: [{ text: PRIVACY_TEXT }], customerId: id };
    case "BALANCE": {
      if (!account) return { replies: [{ text: NOT_LINKED_YET }], customerId: id };
      const last4 = account.accountNumberMasked.replace(/^\*+/, "").slice(-4);
      auditCustomer("customer.balance_checked", existing);
      return {
        replies: [{ text: balanceText(Number(account.currentBalance), last4) }],
        customerId: id,
      };
    }
    case "PAUSE": {
      if (existing.serviceStatus === "paused") return { replies: [{ text: PAUSE_DONE }], customerId: id };
      if (existing.serviceStatus === "opted_out") {
        return {
          replies: [{ text: "You have opted out of Octave Chime. Reply START to re-opt in." }],
          customerId: id,
        };
      }
      if (existing.serviceStatus !== "active") {
        return { replies: [{ text: NOT_LINKED_YET }], customerId: id };
      }
      sessions.set(phone, { step: "confirm_pause", bankId: null });
      return { replies: [{ text: PAUSE_CONFIRM_PROMPT }], customerId: id };
    }
    case "RESUME": {
      if (existing.serviceStatus === "paused") {
        await prisma.customer.update({
          where: { id },
          data: { serviceStatus: "active", whatsappAlertsEnabled: true },
        });
        auditCustomer("customer.control_resumed", existing);
        return { replies: [{ text: RESUME_DONE }], customerId: id };
      }
      if (existing.serviceStatus === "active") {
        return { replies: [{ text: "Your WhatsApp alerts are already active." }], customerId: id };
      }
      if (existing.serviceStatus === "opted_out") {
        const token = await issueLinkToken(id, "reconsent");
        auditCustomer("customer.reconsent_requested", existing, { mode: "reconsent" });
        return {
          replies: [{ text: RECONSENT_INTRO(firstName, `${config.appUrl}/enroll/${token}`) }],
          customerId: id,
        };
      }
      const token = await issueLinkToken(id, "enroll");
      auditCustomer("customer.link_reissued", existing, { mode: "enroll" });
      return {
        replies: [
          {
            text: `${NOT_LINKED_YET}\n\nHere is a fresh secure link within 30 minutes:\n${config.appUrl}/enroll/${token}\n\n🔒 The link is single-use. We never ask for your PIN or password.`,
          },
        ],
        customerId: id,
      };
    }
    case "STOP": {
      if (existing.serviceStatus === "opted_out") {
        return {
          replies: [{ text: "You have already opted out of Octave Chime. Reply START to re-opt in." }],
          customerId: id,
        };
      }
      if (existing.serviceStatus !== "active" && existing.serviceStatus !== "paused") {
        return { replies: [{ text: NOT_LINKED_YET }], customerId: id };
      }
      sessions.set(phone, { step: "confirm_stop", bankId: null });
      return { replies: [{ text: STOP_CONFIRM_PROMPT }], customerId: id };
    }
    case "RELINK": {
      if (existing.serviceStatus === "opted_out") {
        return {
          replies: [{ text: "You have opted out of Octave Chime. Reply START to re-opt in." }],
          customerId: id,
        };
      }
      const token = await issueLinkToken(id, "relink");
      auditCustomer("customer.relink_requested", existing, { mode: "relink" });
      return {
        replies: [{ text: RELINK_INTRO(`${config.appUrl}/enroll/${token}`) }],
        customerId: id,
      };
    }
    case "START": {
      if (existing.serviceStatus === "active") {
        return {
          replies: [
            {
              text: `You are already enrolled with Octave Chime at ${existing.bank?.name ?? "your bank"}. Your alerts are active.\n\nReply HELP for commands.`,
            },
          ],
          customerId: id,
        };
      }
      if (existing.serviceStatus === "paused") {
        return {
          replies: [
            {
              text: "Your WhatsApp alerts are paused. Reply RESUME to turn them back on.\n\nReply HELP for commands.",
            },
          ],
          customerId: id,
        };
      }
      if (existing.serviceStatus === "opted_out") {
        const token = await issueLinkToken(id, "reconsent");
        auditCustomer("customer.reconsent_requested", existing, { mode: "reconsent" });
        return {
          replies: [{ text: RECONSENT_INTRO(firstName, `${config.appUrl}/enroll/${token}`) }],
          customerId: id,
        };
      }
      const token = await issueLinkToken(id, "enroll");
      auditCustomer("customer.link_reissued", existing, { mode: "enroll" });
      return {
        replies: [
          {
            text: `Your enrollment is still in progress. Open this secure link within 30 minutes to link your bank account:\n${config.appUrl}/enroll/${token}\n\n🔒 The link is single-use and expires in 30 minutes. We never ask for your PIN or password.`,
          },
        ],
        customerId: id,
      };
    }
    default:
      return null;
  }
}

export async function handleInbound(text: string, senderRaw: string): Promise<HandleResult> {
  const phone = normalizePhone(senderRaw);
  const norm = text.trim();
  const upper = norm.toUpperCase();

  const existing = await prisma.customer.findUnique({
    where: { whatsappPhone: phone },
    include: {
      bank: { select: { name: true } },
      linkedAccounts: {
        where: { status: "active" },
        orderBy: { linkedAt: "desc" },
        take: 1,
      },
    },
  });

  if (existing) {
    const handled = await handleExistingCommand(upper, existing, phone);
    if (handled) return handled;
  }

  const session = sessions.get(phone) ?? { step: "idle" as BotStep, bankId: null };

  // Confirmation steps for existing customers (PAUSE / STOP).
  if (existing && session.step === "confirm_pause") {
    if (/^(yes|y|pause|ok|okay)$/i.test(norm)) {
      resetSession(phone);
      await prisma.customer.update({
        where: { id: existing.id },
        data: { serviceStatus: "paused", whatsappAlertsEnabled: false },
      });
      auditCustomer("customer.control_paused", existing);
      return { replies: [{ text: PAUSE_DONE }], customerId: existing.id };
    }
    if (/^(no|n|cancel)$/i.test(norm)) {
      resetSession(phone);
      return { replies: [{ text: PAUSE_CANCELLED }], customerId: existing.id };
    }
    return { replies: [{ text: `Please reply YES or NO.\n\n${PAUSE_CONFIRM_PROMPT}` }], customerId: existing.id };
  }

  if (existing && session.step === "confirm_stop") {
    if (/^(yes|y|stop|ok|okay)$/i.test(norm)) {
      resetSession(phone);
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          serviceStatus: "opted_out",
          consentStatus: "revoked",
          whatsappAlertsEnabled: false,
        },
      });
      auditCustomer("customer.opted_out", existing);
      return { replies: [{ text: STOP_DONE }], customerId: existing.id };
    }
    if (/^(no|n|cancel)$/i.test(norm)) {
      resetSession(phone);
      return { replies: [{ text: STOP_CANCELLED }], customerId: existing.id };
    }
    return { replies: [{ text: `Please reply YES or NO.\n\n${STOP_CONFIRM_PROMPT}` }], customerId: existing.id };
  }

  if (session.step === "idle") {
    if (upper === "START") {
      const banks = await activeBanks();
      if (banks.length === 0) {
        return { replies: [{ text: "No banks are available right now. Please try again later." }] };
      }
      sessions.set(phone, { step: "choose_bank", bankId: null });
      return { replies: [{ text: `${WELCOME}\n\n${bankMenu(banks)}` }] };
    }
    if (upper === "HELP") {
      return { replies: [{ text: HELP_TEXT }] };
    }
    if (upper === "PRIVACY") {
      return { replies: [{ text: PRIVACY_TEXT }] };
    }
    return {
      replies: [
        {
          text: "Welcome to Octave Chime. Reply START to begin WhatsApp alert enrollment, or HELP for commands.",
        },
      ],
    };
  }

  if (session.step === "choose_bank") {
    const banks = await activeBanks();
    const pick = banks[Number(norm) - 1];
    if (!pick) {
      return { replies: [{ text: bankMenu(banks) }] };
    }
    sessions.set(phone, { step: "confirm_consent", bankId: pick.id });
    return {
      replies: [
        {
          text: `${pick.name} selected.\n\nThe phone number we will use is ${phone}.\n\n${CONSENT_TEXT}`,
        },
      ],
    };
  }

  if (session.step === "confirm_consent") {
    if (/^(yes|y|agree|accept)$/i.test(norm)) {
      sessions.set(phone, { step: "enter_name", bankId: session.bankId });
      return {
        replies: [{ text: "Thank you. Please type your full name (as it appears on your bank account)." }],
      };
    }
    if (/^(no|n|decline|cancel)$/i.test(norm)) {
      resetSession(phone);
      return { replies: [{ text: "No problem. Your data has not been stored. Reply START anytime to try again." }] };
    }
    return { replies: [{ text: `Please reply YES to accept consent, or NO to cancel.\n\n${CONSENT_TEXT}` }] };
  }

  // enter_name (new enrollment only)
  if (!existing && !session.bankId) {
    resetSession(phone);
    return { replies: [{ text: bankMenu(await activeBanks()) }] };
  }
  const name = norm.replace(/\s{2,}/g, " ").trim();
  if (!NAME_RE.test(name)) {
    return {
      replies: [{ text: "That does not look like a name. Please enter your full name using letters (e.g. Ada Okafor)." }],
    };
  }

  const bank = await prisma.bank.findUnique({ where: { id: session.bankId! } });
  if (!bank) {
    resetSession(phone);
    return { replies: [{ text: "That bank is no longer available. Reply START to begin again." }] };
  }

  const customer = await prisma.customer.create({
    data: {
      bankId: bank.id,
      fullName: name,
      whatsappPhone: phone,
      consentStatus: "granted",
      enrollmentStatus: "in_progress",
      serviceStatus: "pending_link",
      whatsappAlertsEnabled: true,
      dailySummaryEnabled: true,
      preferredSummaryTime: "21:00",
    },
  });

  const token = await issueLinkToken(customer.id, "enroll");
  const enrollUrl = `${config.appUrl}/enroll/${token}`;
  resetSession(phone);

  await logAudit({
    bankId: bank.id,
    actorType: "customer",
    actorId: customer.id,
    action: "customer.enroll_requested",
    metadata: { mode: "enroll", sourcedFrom: "whatsapp", phone },
  });

  return {
    customerId: customer.id,
    replies: [
      {
        text: [
          `Received, ${name.split(" ")[0]}.`,
          "",
          "Your account is almost set up. Open this secure enrollment link within 30 minutes to link your bank account:",
          enrollUrl,
          "",
          "🔒 The link is single-use and expires in 30 minutes. We will never ask for your PIN or password.",
        ].join("\n"),
      },
    ],
  };
}

/** Binds external reply sending via the adapter. Throws only on hard failures. */
export async function deliverReplies(
  senderRaw: string,
  customerId: string | undefined,
  replies: BotReply[],
  send: (to: string, text: string) => Promise<unknown>,
): Promise<void> {
  const phone = normalizePhone(senderRaw);
  for (const reply of replies) {
    await send(phone, reply.text);
    await prisma.botMessage.create({
      data: {
        direction: "outbound",
        sender: phone,
        recipient: phone,
        text: reply.text,
        customerId: customerId ?? null,
      },
    });
  }
}