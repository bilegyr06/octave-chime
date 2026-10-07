import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

// Demo password for every seeded admin: "Password123!"
// Stored as scrypt digest: `<saltHex>:<hashHex>` (160000 N, r=8, p=1).
const DEMO_PASSWORD = "Password123!";
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
  return `${salt}:${hash}`;
}

const fmt = (n: number) => n.toFixed(2);

const banks = [
  { name: "Zenith Bank", slug: "zenith", supportEmail: "support@zenith.example" },
  { name: "Access Bank", slug: "access", supportEmail: "support@access.example" },
  { name: "GTBank", slug: "gtbank", supportEmail: "support@gtbank.example" },
  { name: "UBA", slug: "uba", supportEmail: "support@uba.example" },
] as const;

const admins = [
  { name: "Zenith Platform", email: "platform@octavechime.test" },
  { name: "Adaeze Admin", email: "admin@zenith.test" },
  { name: "Tunde Admin", email: "admin@access.test" },
  { name: "Chiamaka Admin", email: "admin@gtbank.test" },
  { name: "Ibrahim Admin", email: "admin@uba.test" },
] as const;

// Each customer: seeded account + 3 days of demo activity (oldest first).
interface SeedCustomer {
  bankSlug: string;
  fullName: string;
  email: string;
  whatsappPhone: string;
  accountName: string;
  accountNumberMasked: string;
  accountType: string;
  openingBalance: number; // opening balance on day 1
  days: {
    transactions: { type: "debit" | "credit"; amount: number; narration: string }[];
  }[];
}

const customers: SeedCustomer[] = [
  {
    bankSlug: "zenith",
    fullName: "Adaeze Okafor",
    email: "adaeze.okafor@example.com",
    whatsappPhone: "+2348012345601",
    accountName: "Adaeze Okafor",
    accountNumberMasked: "****1201",
    accountType: "current",
    openingBalance: 500000,
    days: [
      {
        transactions: [
          { type: "credit", amount: 250000, narration: "Salary Payment" },
          { type: "debit", amount: 12000, narration: "POS - ShopRite Ikeja" },
        ],
      },
      {
        transactions: [
          { type: "debit", amount: 45000, narration: "Transfer to Tunde Balogun" },
          { type: "credit", amount: 8500, narration: "Refund - Jumia Order 4471" },
        ],
      },
      {
        transactions: [
          { type: "debit", amount: 3100, narration: "Airtime Recharge" },
          { type: "credit", amount: 15000, narration: "Venmo-style Transfer" },
        ],
      },
    ],
  },
  {
    bankSlug: "access",
    fullName: "Tunde Balogun",
    email: "tunde.balogun@example.com",
    whatsappPhone: "+2348012345602",
    accountName: "Tunde Balogun",
    accountNumberMasked: "****1202",
    accountType: "savings",
    openingBalance: 180000,
    days: [
      {
        transactions: [
          { type: "debit", amount: 32000, narration: "Rent Payment" },
          { type: "credit", amount: 98000, narration: "Freelance Payout" },
        ],
      },
      {
        transactions: [
          { type: "debit", amount: 8200, narration: "Uber Trip" },
          { type: "credit", amount: 1200, narration: "Interest Credit" },
        ],
      },
      {
        transactions: [
          { type: "debit", amount: 14500, narration: "POS - Shoprite Surulere" },
        ],
      },
    ],
  },
  {
    bankSlug: "gtbank",
    fullName: "Chiamaka Eze",
    email: "chiamaka.eze@example.com",
    whatsappPhone: "+2348012345603",
    accountName: "Chiamaka Eze",
    accountNumberMasked: "****1203",
    accountType: "current",
    openingBalance: 750000,
    days: [
      {
        transactions: [
          { type: "credit", amount: 600000, narration: "Business Payment" },
          { type: "debit", amount: 210000, narration: "Transfer to Supplier" },
        ],
      },
      {
        transactions: [
          { type: "credit", amount: 40000, narration: "Invoice #2301 Settlement" },
          { type: "debit", amount: 18000, narration: "Flight Booking" },
        ],
      },
      {
        transactions: [
          { type: "debit", amount: 5250, narration: "Airtime Recharge" },
          { type: "debit", amount: 12200, narration: "POS - SPAR Gbagada" },
        ],
      },
    ],
  },
  {
    bankSlug: "uba",
    fullName: "Ibrahim Musa",
    email: "ibrahim.musa@example.com",
    whatsappPhone: "+2348012345604",
    accountName: "Ibrahim Musa",
    accountNumberMasked: "****1204",
    accountType: "savings",
    openingBalance: 95000,
    days: [
      {
        transactions: [
          { type: "credit", amount: 20000, narration: "Cash Deposit" },
          { type: "debit", amount: 4500, narration: "Fuel Purchase" },
        ],
      },
      {
        transactions: [
          { type: "debit", amount: 7500, narration: "Groceries - Justfresh" },
          { type: "credit", amount: 55000, narration: "Gift Received" },
        ],
      },
      {
        transactions: [
          { type: "credit", amount: 23500, narration: "Transfer from Mom" },
          { type: "debit", amount: 1500, narration: "Data Bundle" },
        ],
      },
    ],
  },
];

function messageBodyFor(
  type: "debit" | "credit",
  amount: number,
  bankName: string,
  last4: string,
  balanceAfter: number,
  reference: string,
): string {
  const line = type === "debit" ? "left" : "entered";
  return [
    `${type === "debit" ? "Debit" : "Credit"} Alert`,
    `NGN ${fmt(amount)} ${line} your ${bankName} account ending ${last4}.`,
    `Balance: NGN ${fmt(balanceAfter)}`,
    `Ref: ${reference}`,
  ].join("\n");
}

function summaryMessageFor(
  summaryDate: Date,
  opening: number,
  credits: number,
  debits: number,
  closing: number,
  count: number,
): string {
  return [
    `Daily Summary - ${summaryDate.toLocaleDateString("en-GB")}`,
    `Opening balance: NGN ${fmt(opening)}`,
    `Total credits: NGN ${fmt(credits)}`,
    `Total debits: NGN ${fmt(debits)}`,
    `Closing balance: NGN ${fmt(closing)}`,
    `Transactions: ${count}`,
  ].join("\n");
}

async function main() {
  console.log("Seeding database...");

  const createdBanks = new Map<string, { id: string; name: string }>();
  for (const b of banks) {
    const bank = await prisma.bank.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        name: b.name,
        slug: b.slug,
        supportEmail: b.supportEmail,
        status: "active",
      },
    });
    createdBanks.set(b.slug, bank);
  }

  const passwordHash = hashPassword(DEMO_PASSWORD);
  // platform admin has no bank
  await prisma.bankAdmin.create({
    data: { name: admins[0].name, email: admins[0].email, passwordHash, role: "platform_admin" },
  });
  for (let i = 1; i < admins.length; i++) {
    const bank = banks[i - 1];
    await prisma.bankAdmin.upsert({
      where: { email: admins[i].email },
      update: {},
      create: {
        bankId: createdBanks.get(bank.slug)?.id,
        name: admins[i].name,
        email: admins[i].email,
        passwordHash,
        role: "bank_admin",
      },
    });
  }

  for (const c of customers) {
    const bank = createdBanks.get(c.bankSlug)!;
    const customer = await prisma.customer.upsert({
      where: { whatsappPhone: c.whatsappPhone },
      update: {},
      create: {
        bankId: bank.id,
        fullName: c.fullName,
        email: c.email,
        whatsappPhone: c.whatsappPhone,
        consentStatus: "granted",
        enrollmentStatus: "completed",
        serviceStatus: "active",
        whatsappAlertsEnabled: true,
        dailySummaryEnabled: true,
        preferredSummaryTime: "21:00",
      },
    });

    console.log(`  customer: ${c.fullName}`);

    const account = await prisma.linkedAccount.create({
      data: {
        customerId: customer.id,
        bankId: bank.id,
        provider: "mono_simulated",
        providerAccountId: `mono-demo-${c.accountNumberMasked.replaceAll("*", "x")}`,
        accountName: c.accountName,
        accountNumberMasked: c.accountNumberMasked,
        accountType: c.accountType,
        currency: "NGN",
        currentBalance: fmt(c.openingBalance),
        openingBalanceToday: fmt(c.openingBalance),
        status: "active",
      },
    });

    // Walk the 3 demo days keeping a running balance.
    let running = c.openingBalance;
    const days = [new Date(), new Date(Date.now() - 86_400_000), new Date(Date.now() - 2 * 86_400_000)].reverse();

    for (let d = 0; d < c.days.length; d++) {
      const day = days[d];
      const txs = c.days[d].transactions;
      for (const t of txs) {
        const balanceAfter = t.type === "credit" ? running + t.amount : running - t.amount;
        const reference = `OC-${c.bankSlug.toUpperCase().slice(0, 3)}-${d + 1}${t.type === "credit" ? "C" : "D"}${Math.floor(t.amount)}`;
        const transaction = await prisma.transaction.create({
          data: {
            bankId: bank.id,
            customerId: customer.id,
            linkedAccountId: account.id,
            type: t.type,
            amount: fmt(t.amount),
            currency: "NGN",
            balanceAfter: fmt(balanceAfter),
            narration: t.narration,
            reference,
            transactionDate: day,
            source: "simulated",
          },
        });

        const last4 = c.accountNumberMasked.replace("*", "").replace("*", "").replace("*", "").replace("*", "");
        const body = messageBodyFor(t.type, t.amount, bank.name, last4, balanceAfter, reference);
        await prisma.notification.create({
          data: {
            bankId: bank.id,
            customerId: customer.id,
            transactionId: transaction.id,
            type: "transaction_alert",
            channel: "whatsapp",
            status: "sent",
            recipient: c.whatsappPhone,
            messageBody: body,
            sentAt: day,
          },
        });

        running = balanceAfter;
      }
    }

    // Yesterday's daily summary (for demo freshness).
    const yesterday = new Date(Date.now() - 86_400_000);
    const day1txs = c.days[0].transactions; // oldest day
    const opening = c.openingBalance;
    const credits = day1txs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debits = day1txs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const closing = opening + credits - debits;
    const summaryBody = summaryMessageFor(yesterday, opening, credits, debits, closing, day1txs.length);
    const notification = await prisma.notification.create({
      data: {
        bankId: bank.id,
        customerId: customer.id,
        type: "daily_summary",
        channel: "whatsapp",
        status: "sent",
        recipient: c.whatsappPhone,
        messageBody: summaryBody,
        sentAt: yesterday,
      },
    });

    const summaryDate = new Date(yesterday);
    summaryDate.setHours(0, 0, 0, 0);
    await prisma.dailySummary.create({
      data: {
        bankId: bank.id,
        customerId: customer.id,
        linkedAccountId: account.id,
        summaryDate,
        openingBalance: fmt(opening),
        totalCredits: fmt(credits),
        totalDebits: fmt(debits),
        closingBalance: fmt(closing),
        transactionCount: day1txs.length,
        notificationId: notification.id,
      },
    });

    // Current daily summary for today (so admin dashboards reflect today).
    const todaysTxs = c.days[2].transactions;
    const open = opening;
    const cred = todaysTxs.filter((x) => x.type === "credit").reduce((s, x) => s + x.amount, 0);
    const deb = todaysTxs.filter((x) => x.type === "debit").reduce((s, x) => s + x.amount, 0);
    const close = running;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailySummary.create({
      data: {
        bankId: bank.id,
        customerId: customer.id,
        linkedAccountId: account.id,
        summaryDate: today,
        openingBalance: fmt(open),
        totalCredits: fmt(cred),
        totalDebits: fmt(deb),
        closingBalance: fmt(close),
        transactionCount: todaysTxs.length,
      },
    });
  }

  // A few audit log entries for context.
  for (const bank of createdBanks.values()) {
    await prisma.auditLog.createMany({
      data: [
        { bankId: bank.id, actorType: "system", actorId: "seed", action: "demo_data_seeded", metadata: { source: "seeded" } },
        { bankId: bank.id, actorType: "system", actorId: "seed", action: "tenant_created", metadata: { bank: bank.name } },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });