# Octave Chime — Issue Tracker

Checklist of reported issues and agreed fixes. Tick off as each is done.
Each item ships as its own Conventional Commit on `develop` with user approval.

## Bugs

- [x] **Frontend shows nothing when the chatbot replies** — root cause: `/api/dev/messages`
      built the transcript but never sent `res.json`; fixed in `fix(api)` + `fix(web)`.
- [x] **Dev-console "Run now" produces no visible daily summary for an already-summarized
      customer (e.g. Ayodeji `+2348030000000`)** — the dedup guard (`summary.ts`) correctly
      skips customers that already have today's summary, but the demo reads as "nothing
      happened". Fix: dev-only `force` on `/api/dev/summary/run` that regenerates/replaces
      today's summary. Verify the existing summary bubble renders in the transcript.
      Verified: Ayo's transcript shows a single fresh summary; non-force runs still dedupe
      (`sent=0 duplicates=5`).
- [x] **Simulate result card re-labels after changing Bank/Customer selection** — the card
      renders `selectedCustomer` live. Fix: snapshot `customerName`/`bankName` at submit
      time (`web/src/components/dev-console.tsx`).

## Access control

- [x] **Issue 1 — Admins must not be able to add customers.** Remove `POST /api/customers` +
      `createCustomer` service + schema, and the "Add customer" form
      (`customers-data.tsx`). Enrollment is WhatsApp-bot self-service only (+ seeded data).
      Verified: `POST /api/customers` now returns 404.
- [x] **Issue 2 — Banks must not set per-customer alert preferences.** Remove the WhatsApp
      toggle / daily-summary toggle / summary-time editors from `customer-detail.tsx` and
      drop those fields from the PATCH schema. Add a bank-wide **"pause all WhatsApp
      alerts"** toggle (new `Bank.whatsappAlertsPaused` column + migration), gating
      `decideDelivery()` and daily-summary eligibility; expose it in bank settings.
      Verified: while paused, simulate returns `skipped` / "whatsapp alerts paused by bank";
      unpausing restores delivery.
- [x] **Issue 3 — Linked accounts only via customer sign-in through the bank's enroll link.**
      Audit confirms this is already true (only sites: token-gated Mono exchange in
      `accountLinking.ts` + seed fixtures). No code change needed — document compliance.
- [x] **Issue 4 — Admins must not issue enrollment invites.** Remove
      `POST /api/customers/:id/enroll-link` + `issueCustomerEnrollLink` + the
      "Enrollment invite" card. Bot-issued tokens (`bot.ts`) are unaffected.
      Verified: `POST /api/customers/:id/enroll-link` now returns 404.

## Notes

- The bank settings "pause all WhatsApp alerts" toggle affects transaction alerts and
  daily summaries for every customer at the bank; customer-facing consent/service statuses
  are untouched, and the customer's own transcript shows `status: skipped` with reason
  "whatsapp alerts paused by bank".