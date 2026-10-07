#!/usr/bin/env node
/**
 * Simulate a customer sending a WhatsApp message to the bot.
 *
 * Usage:
 *   node scripts/mock-inbound.js "START"
 *   node scripts/mock-inbound.js "START" 2348030000000
 *   node scripts/mock-inbound.js "2" 2348030000000
 *
 * Posts Termii's exact inbound webhook JSON to the local server, so the
 * same code path a live Termii device would hit is exercised. Sends the same
 * payload twice to prove idempotency when RUN_TWICE=1.
 */
const input = process.argv[2] ?? "START";
const sender = process.argv[3] ?? "2348030000000";
const receiver = process.env.TERMII_DEVICE_ID ?? "12022214836";
const apiUrl = process.env.API_URL ?? "http://localhost:4000";

function payload() {
  return {
    type: "inbound",
    id: process.env.MOCK_MESSAGE_ID ?? `8248611476370959318-${Date.now()}`,
    message_id: process.env.MOCK_MESSAGE_ID ?? `3905204342778053556-${Date.now()}`,
    receiver,
    sender,
    message: input,
    received_at: new Date().toISOString(),
    cost: null,
    command: "Received",
    status: "Received",
    channel: "whatsapp",
  };
}

async function post() {
  const res = await fetch(`${apiUrl}/webhooks/termii`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload()),
  });
  const body = await res.text();
  console.log(`POST ${apiUrl}/webhooks/termii  <- "${input}"  ->  ${res.status} ${body}`);
}

(async () => {
  try {
    await post();
    if (process.env.RUN_TWICE === "1") {
      await post(); // same message id -> must be a duplicate no-op
    }
  } catch (err) {
    console.error("mock-inbound failed:", err.message);
    process.exit(1);
  }
})();