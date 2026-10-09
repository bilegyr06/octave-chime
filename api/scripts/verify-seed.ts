import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const counts = {
    banks: await p.bank.count(),
    admins: await p.bankAdmin.count(),
    customers: await p.customer.count(),
    accounts: await p.linkedAccount.count(),
    transactions: await p.transaction.count(),
    notifications: await p.notification.count(),
    summaries: await p.dailySummary.count(),
    auditLogs: await p.auditLog.count(),
  };
  console.log("COUNTS", JSON.stringify(counts));

  const sample = await p.transaction.findFirst({
    include: { customer: { select: { fullName: true } }, bank: { select: { name: true } } },
    orderBy: { transactionDate: "desc" },
  });
  console.log("SAMPLE_TX", JSON.stringify(sample));

  const perBank = await p.customer.groupBy({ by: ["bankId"], _count: { _all: true } });
  console.log("CUSTOMERS_BY_BANK", JSON.stringify(perBank.map((r) => ({ bankId: r.bankId, n: r._count._all }))));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());