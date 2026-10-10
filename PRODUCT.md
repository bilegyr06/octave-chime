# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Bank Admin** — staff at a Nigerian bank that has been onboarded as a tenant. They sign in to a bank dashboard to see enrolled customers, linked-account and WhatsApp-alert status, recent transactions, and delivery logs; they trigger demo transactions and run the daily summary on demand.
- **Platform Admin** — the Octave Chime internal owner. Can create banks, view all tenants, monitor message delivery across banks, and configure integration settings. Minimal in the current build.
- **Customer** — a bank customer who opts into WhatsApp alerts. They start enrollment inside WhatsApp, complete consent and account linking on a short-lived secure web page, then receive debit/credit alerts and a daily balance summary. They pause, resume, stop, or restart the service from WhatsApp.
- **Dev/Operator** — an internal role gated behind a separate `/dev` zone (its own session), used to drive simulation and inspect the bot.

## Product Purpose

Octave Chime is a Nigerian multi-bank SaaS that lets banks offer **WhatsApp as a third transaction-notification channel alongside SMS and email**. Banks onboard as tenants; their customers enroll over WhatsApp, link a bank account through a Mono Connect consent flow, and receive WhatsApp-style transaction alerts plus an automatic daily balance summary.

Success means a bank can add a modern notification channel **without rebuilding its core banking system**, and a customer can self-serve the whole enrollment while sensitive steps stay off the chat. The build is a production-shaped MVP: demo-ready now, and architected so real Mono, WhatsApp (Termii), and direct bank integrations can replace the adapters without a rewrite.

The product currently serves **both roles: a showcase now and an intended real product later** — the same artefact is presented as a demo and is meant to grow into production.

## Positioning

A **multi-tenant, adapter-based WhatsApp notifications layer** that sits beside a bank's existing channels rather than replacing them. Two integration paths are structurally supported: **Path A**, the customer-consented aggregator model (Mono reads account/transaction data with consent — implemented in the MVP), and **Path B**, direct bank event/API integration (the stronger long-term enterprise model, kept reachable through the same adapter boundary). The distinguishing mechanism is that provider swaps (Termii mock→live, Mono off/sandbox→live) are **configuration-only, never code changes**.

## Operating Context

- **Market:** Nigerian retail banking. Currency Naira; default end-of-day summary time **21:00 Africa/Lagos**.
- **Channels:** enrollment and controls happen in WhatsApp; only secure, short-lived web pages exist for consent/linking/status.
- **Integrations behind adapters:** Termii for messaging (`TERMII_MODE=mock|live`, mock is the default and makes no network calls) and Mono for account linking (`MONO_MODE=off|sandbox|live`).
- **Communication constraint:** Termii free-form messages only work inside the 24-hour customer-service window; proactive messages outside it require an approved template (`TERMII_TEMPLATE_ID`).
- **Deployment:** web UI on Vercel, Express API/cron/webhooks on Render, managed Neon Postgres; `web/` and `api/` are independent pnpm projects in one repository.
- **Demo ritual:** a scripted 24-step presentation flow, driven end-to-end through the real bot inbound path via a hidden dev console, with seeded demo banks/customers so no screen is empty.

## Capabilities and Constraints

**Capabilities (MVP):**
- Multi-bank onboarding and tenant-scoped bank admin login (email/password, JWT httpOnly cookie); roles `platform_admin`, `bank_admin`, plus a separate `dev` role.
- WhatsApp enrollment bot (fully real inbound state machine; sequential text replies, no interactive buttons) with commands `START`, `1`–`4`, `YES`, `PAUSE`, `RESUME`, `STOP`, `NO`, `HELP`, `PRIVACY`, `RELINK`, `BALANCE`.
- Secure, signed, single-purpose, **30-minute TTL, one-time-use** links; `/enroll/[token]` covers enroll / re-consent / relink modes.
- Mono Connect account linking with an `off`-mode simulated demo-account fallback.
- Transaction ingestion → debit/credit alerts; automatic daily summary generation (deduped per customer per date) plus an admin "run now" action.
- Pause/resume/stop/restart controls, re-consent flow, and an audit-log foundation.
- Secure customer status page (bank name, masked account, service/consent/linking status) — **not** a full transaction-history dashboard.

**Constraints and terminology:**
- **No credentials ever collected** — no PIN, password, OTP, CVV, or full card/account data. Account numbers are always **masked**. No sensitive account registration inside chat.
- **No customer dashboard** — customer actions happen in WhatsApp; the only customer-facing web surface is the secure link/status page.
- **Out of scope:** money transfers, bill payments, card controls, free-form customer questions over WhatsApp, and live production banking data absent a provider grant.
- Provider behaviour is **mock-first**: the whole product is validated locally against a mocked Termii and an `off`/sandbox Mono before any live spend.
- Terminology carried in-product: "tenant bank", "enrollment link", "linked account", `serviceStatus` (`pending_link | active | paused | opted_out | link_expired`) kept distinct from `consentStatus` and `enrollmentStatus`.

## Brand Commitments

- **Name:** "Octave Chime" is **fixed** (not a placeholder).
- **Asset:** the only brand asset is the logo at `web/public/octave-logo.png`; there is no formal brand guide. Bank logos/names provide per-tenant context in the UI.
- **Committed direction (from the product spec, §15):** a **serious fintech operations product, not a marketing landing page** — restrained and professional, dashboard-first, clear hierarchy, no oversized hero sections and no decorative gradients as the design idea, with operational tables over ornament. WhatsApp green is reserved as an **accent for notification status**, not the whole theme. Recorded as a user-committed constraint; visual specifics live in DESIGN.md, not here.

## Evidence on Hand

- **Product/spec docs:** `OCTAVE_CHIME_IMPLEMENTATION_PLAN.md` (data model, message templates, security rules, 24-step demo script, §17 acceptance criteria), `OCTAVE_CHIME_BUILD_PLAN.md` (locked decisions, architecture, phase schedule, deploy runbook), `README.md` (setup, env contract, ops), `ISSUES.md` (issue tracker).
- **Design references only (not product truth):** `octave-chime-platform.html` (earlier single-bank prototype — visual/interaction reference), `octave-chime-whatsapp.zip` (prior Express WhatsApp sender — structural reference, superseded by Termii).
- **Seed/demo data:** banks Zenith, Access, GTBank, UBA; customers Adaeze Okafor (Zenith), Tunde Balogun (Access), Chiamaka Eze (GTBank), Ibrahim Musa (UBA); realistic Nigerian narrations (POS PURCHASE - SUPERMARKET, SALARY CREDIT, etc.).
- **Absences future work must not fabricate:** there are **no real customers, testimonials, case studies, benchmarks, pricing, or licenses**, and **no live production banking data**. Any proof-like content must be clearly seeded/simulated or supplied by the user.

## Product Principles

1. **WhatsApp is an added channel, not a replacement.** SMS and email stay; Octave Chime gives banks a third channel they do not have to build themselves.
2. **Sensitive actions leave the chat.** Enrollment begins in WhatsApp, but consent and account linking happen on short-lived, one-time secure web links — never as credentials in a conversation.
3. **Provider-agnostic by construction.** Termii and Mono sit behind adapters; mock/sandbox→live is a config swap, never a rewrite, and direct-bank integration stays reachable behind the same boundary.
4. **Operational truth over decoration.** The interface exists to show delivery status, account and consent state, and an auditable trail — clarity outranks expression.
5. **Production-shaped MVP.** Every demo shortcut is designed to be swapped for the real integration without disturbing the architecture.
