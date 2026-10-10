---
target: Bank-Admin Overview
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\Deji\\Documents\\Coding\\WEB APPS\\Built with JS backend\\octave chime docs\\web\\src\\app\\(dashboard)\\overview\\page.tsx"
target_fingerprint: "sha256:2795b7c4606a81f002ef9ff8c4e90ccbe51e7363bf2bc50f132ac6a4502cf484"
target_path: "C:\\Users\\Deji\\Documents\\Coding\\WEB APPS\\Built with JS backend\\octave chime docs\\web\\src\\app\\(dashboard)\\overview\\page.tsx"
timestamp: 2026-10-10T08-27-09Z
slug: web-src-app-dashboard-overview-page-tsx
---
# Critique — Bank-Admin Overview

Target: `web/src/app/(dashboard)/overview/page.tsx` (slug `web-src-app-dashboard-overview-page-tsx`)
Method: dual-agent (A: `ses_edb262468ffedxJv3PE2gNvdPt` design review · B: `ses_edb25388cffe0DXSOVo5I7KoR8` detector). Re-run after the layout/clarify/harden/polish pass; previous run scored 24/40. Code-only review: no live server (no dev server running) and the route sits behind a JWT session, so browser visualization was skipped; the deterministic scan is the fallback signal.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live region, updated stamp, LED states exist, but nothing moves after first load — the control room goes silent when it renders. |
| 2 | Match System / Real World | 3 | Plain, Nigerian-grounded copy (en-NG), but "attempted", "held back", "queued" are pipeline jargon, and the glossary defines states the page never displays. |
| 3 | User Control and Freedom | 2 | No refresh, no time range, no dismiss/snooze on the failure band; both primary CTAs are one-way trips with no filter carried. |
| 4 | Consistency and Standards | 3 | Token discipline is exemplary; dead `StatTile` vs the bespoke `MiniStat` at an undocumented 20px figure scale; type badge always `brand` here vs `mute` for summaries on Notifications. |
| 5 | Error Prevention | 3 | Read-only + retry/backoff is sound; "Review failed" silently drops you on an unfiltered list, and the log's all-time scope invites miscounting. |
| 6 | Recognition Rather Than Recall | 3 | Labels and LEDs are all named; the amber live edge and the queue's absence from the meter demand recall. |
| 7 | Flexibility and Efficiency | 2 | No polling, no Refresh, no filter/sort/range, no deep links — the dev console has all three and the admin surface has none. |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained, tonal, hairline-clean; the only blemish is the dense four-term glossary line under the meter. |
| 9 | Error Recovery | 2 | Counts the failure, never the cause — `errorMessage` is in every delivery payload and `DeliveryRow` drops it. |
| 10 | Help and Documentation | 2 | The glossary is the only help on the page; no explanation of the rate formula, the amber edge, or what "review" will show. |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment (authored, not borrowed):** The surface could not ship in another product unchanged. The copy is domain-locked ("handed to WhatsApp", "held back", "failed to send today"), and the token implementation is literal rather than approximate: 3px radii, 2px LEDs, zero shadows (the app's only shadow is the Settings switch knob), WhatsApp green quarantined to delivery status, amber appearing only twice (meter live edge + active nav LED). The language is unmistakably Octave Chime's. Where it falls short of its own DESIGN.md: the signature `StatTile` is dead code (zero usages) while a bespoke `MiniStat` introduces an undocumented third figure scale (44/20/15px vs the system's two); the meter — DESIGN.md's "clearest expression of the Control Room" — encodes only sent-vs-failed and never renders queued; and `Badge` invents `text-[#14733f]`, a green outside the palette.

**Deterministic scan:** `impeccable detect --json web/src` and a targeted scan of `web/src/components/overview-data.tsx` + the overview page → exit 0, `[]`, zero findings. No false positives. Caveat unchanged: detector TSX regex-mode coverage is narrower than HTML/CSS mode.

**Visual overlays:** none. Browser visualization was skipped because no live dev server is running and the dashboard route requires an authenticated JWT session; the deterministic scan stands as the fallback signal.

## Overall Impression

Arrival is calm and the failure band spikes concern with a verb attached — the right beat. Then the meter reassures, the glossary reads like API docs, and the log hands you rows you can't click: the arc goes alert → reassurance → mild helplessness. The `updated` stamp goes stale within a minute with no way to refresh, so a control room you can't refresh starts to feel like a screenshot. The single biggest opportunity: make the one conversion (Review failed) actually land on the failures, and let the surface keep flowing.

## What's Working

1. **Metric honesty is genuinely good.** `{rate}% of {attempts} attempted` plus "Sent — handed to WhatsApp" plus a sub-line that names failed and queued distinguishes handed-off from delivered and stops overstating what the system knows.
2. **The accessibility work is structural, not cosmetic.** Skip link, `inert` modal background, hand-rolled focus trap with return-focus cleanup, one close label, a polite live region, and the h1 mounted through error and spinner.
3. **Failure prominence with restraint.** The FailureBand is the only tinted non-paper surface, sits above the hero in DOM order, carries icon + count + forward action, and never tips into alarmism — the Control Room idea working as written.

## Priority Issues

- **[P0] The failure path dead-ends at its first click.** `Review failed` links to bare `/notifications` (`overview-data.tsx:85-91`); the notifications surface seeds filters from empty state and the repo has no `useSearchParams` usage, so the user lands on page 1 of everything and must re-select "Failed". Overview delivery/enrollment rows are also non-interactive `<li>`s while the visually identical Customers rows are full-row links. Fix: `href="/notifications?status=failed"` with the notifications client seeded via `useSearchParams` (default `""`), and make each delivery row a link (status → filtered log, name → `/customers/[id]`). Command: **adapt**
- **[P1] The percentage and the band are computed over different populations.** `alertsSentToday` and `queuedAlertsToday` filter `type:"transaction_alert"`, but `failedAlertsToday` counts all types including daily summaries; `attempts = sent + failed` therefore mixes a txn-only numerator with an all-types denominator, and a fully stalled queue renders as 8/8 green printing "100% of N attempted". Fix: scope all three counts identically (or expose an `attemptsToday` tuple from the API) and render queued as a distinct segment state so the bar can go amber when the backlog grows. Command: **audit**
- **[P1] A control room with no live feed and no refresh.** A single fetch keyed on `reloadKey` incremented only by ErrorState's retry (`overview-data.tsx:171-185`); no interval, no Refresh, no relative staleness. The dev console polls at 2.5s and has a Refresh button; the Bank Admin has fewer controls than the operator toy. Fix: 30-60s polling gated on `document.hidden`, a Refresh control beside the `updated` stamp, and relative time ("12s ago") that turns warn-toned past ~2 minutes. Command: **harden**
- **[P2] It shows that it broke, never why.** `errorMessage` is returned on every delivery row but the Overview's `DeliveryRow` omits it, and the log is latest-10-all-time so it can show none of the failures the band just announced. Fix: render `errorMessage` as a second line on failed rows, scope the log to Lagos-today with a "Today" chip, and have the failure band link straight to that scope. Command: **clarify**
- **[P3] The glossary explains the wrong things.** The four-term legend prints every load — including "Skipped", which appears in no metric here — while the amber live edge and the rate formula stay unexplained, and the meter is `aria-hidden`. Fix: drop the inline glossary, mirror only the states the meter can actually show with swatch-prefixed terms, and put full definitions behind a single `?` on the panel header. Command: **distill**

## Persona Red Flags

**Alex (Power User):** No refresh, no poll, no range — must reload the document to see a new failure while the dev console has a Refresh button. MiniStat tiles and the hero figure are dead numbers (no door to `/customers`). Rows are read-only `<li>`s with no hover/cursor/sort/filter. "View all" and "Review failed" both strip context on arrival. `messageBody` is fetched and discarded.

**Sam (Accessibility):** The one state worth announcing — N alerts failed — never fires: the live region only emits "Loading metrics./Metrics updated./Metrics failed to load." and there's no `role="alert"` on the band. The tenant (bank) name vanishes during load and error, exactly when orientation matters. `truncate` with no `title`/`aria-label` silently cuts long names and phones. `w-24` timestamps (13 mono chars ≈ 93.6px vs 96px box) have no `whitespace-nowrap` guard. The hero LED's mute→whatsapp→danger flip is color-only on a 6px aria-hidden dot. Mobile touch targets run 32-36px (close 32px, hamburger 36px) — under the 44px target.

## Minor Observations

- `formatDate` has no `timeZone` while the API counts a Lagos day — an admin outside WAT sees local-time stamps against a Lagos-scoped "today".
- Type badge is always `tone="brand"` on Overview vs `mute` for daily summaries on Notifications — same vocabulary, two skins.
- `Math.max(1, …)` means an all-failed day still paints one amber segment, reading as partial success.
- `Spinner` with no skeleton → visible layout shift when the SignalBar arrives; no `loading.tsx` route.
- Overview timestamps are mono (correct per Mono-for-Numerals); Customers/Notifications set them in body sans.
- `role="status"` + `aria-live="polite"` stacked is redundant but harmless.
- `PanelHeader` `py-3.5` vs DESIGN.md's `py-3` list rhythm.

## Questions to Consider

1. If the queue stalls completely, does this control room ever go amber? A green meter while nothing is moving — is that the honest reading of "is delivery flowing"?
2. Why does the internal dev console have a Refresh button and live polling while the bank's control surface has neither — is the Overview built for an operator watching, or for a screenshot in the demo script?
3. The API hands you `errorMessage` on every row — how many screens must fail before diagnosis happens? If "where did it break" is the North Star, isn't a red dot labeled "Failed" still just the question restated in color?
