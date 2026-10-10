// Dev helper: insert today's transaction_alert Notification rows in a chosen
// sent/queued/failed mix so the Overview SignalBar can be seen rendering each
// state. There is no app path that produces `queued`, so these are injected
// directly. Rows are tagged "Simulated" and removable with --clear.
//
// Usage (from the api/ directory):
//   pnpm tsx scripts/simulate-alert-states.ts
//   pnpm tsx scripts/simulate-alert-states.ts --sent 4 --queued 2 --failed 2
//   pnpm tsx scripts/simulate-alert-states.ts --customer <id> --sent 6 --failed 2
//   pnpm tsx scripts/simulate-alert-states.ts --clear
import "dotenv/config";
import { PrismaClient, type NotificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SIM_TAG = "Simulated";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function numArg(name: string, fallback: number): number {
  const raw = arg(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`--${name} must be a non-negative integer`);
    process.exit(1);
  }
  return n;
}

async function main() {
  if (process.argv.includes("--clear")) {
    const { count } = await prisma.notification.deleteMany({
      where: { messageBody: { startsWith: SIM_TAG } },
    });
    console.log(`Cleared ${count} simulated notification(s).`);
    return;
  }

  const customerId = arg("customer");
  const customer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : await prisma.customer.findFirst({ orderBy: { createdAt: "asc" } });

  if (!customer) {
    console.error(
      customerId
        ? `No customer with id ${customerId}`
        : "No customers found — run `pnpm db:seed` or enroll one first.",
    );
    process.exit(1);
  }

  const mix: { status: NotificationStatus; n: number }[] = [
    { status: "sent", n: numArg("sent", 4) },
    { status: "queued", n: numArg("queued", 2) },
    { status: "failed", n: numArg("failed", 2) },
  ];

  const recipient = customer.whatsappPhone ?? "2348000000000";
  const now = new Date();

  let created = 0;
  for (const { status, n } of mix) {
    for (let i = 0; i < n; i += 1) {
      await prisma.notification.create({
        data: {
          bankId: customer.bankId,
          customerId: customer.id,
          type: "transaction_alert",
          channel: "whatsapp",
          status,
          recipient,
          messageBody: `${SIM_TAG} ${status} alert #${i + 1}`,
          sentAt: status === "sent" ? now : null,
        },
      });
      created += 1;
    }
  }

  const summary = mix.map((m) => `${m.n} ${m.status}`).join(", ");
  console.log(
    `Inserted ${created} simulated alerts (${summary}) for ${customer.fullName} (bank ${customer.bankId}).`,
  );
  console.log("Refresh the Overview page to see the SignalBar. Clear with --clear.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
