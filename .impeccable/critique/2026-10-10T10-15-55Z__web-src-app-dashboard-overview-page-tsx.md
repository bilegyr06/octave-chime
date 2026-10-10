---
target: web/src/app/(dashboard)/overview/page.tsx
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 5
target_identity: "file:C:\\Users\\Deji\\Documents\\Coding\\WEB APPS\\Built with JS backend\\octave chime docs\\web\\src\\app\\(dashboard)\\overview\\page.tsx"
target_fingerprint: "sha256:2795b7c4606a81f002ef9ff8c4e90ccbe51e7363bf2bc50f132ac6a4502cf484"
target_path: "C:\\Users\\Deji\\Documents\\Coding\\WEB APPS\\Built with JS backend\\octave chime docs\\web\\src\\app\\(dashboard)\\overview\\page.tsx"
timestamp: 2026-10-10T10-15-55Z
slug: web-src-app-dashboard-overview-page-tsx
---
---
target: the bank-admin Overview
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 5
---
# Critique — bank-admin Overview

## Method: dual-agent (A: design review · B: detector evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live region, stale stamp, aria-busy refresh, LED tone, 45s poll; recovered data hidden behind a stale error; resumed tab can show stale up to 45s |
| 2 | Match System / Real World | 3 | WhatsApp-handoff language, en-NG formatting; today un-anchored, Daily summaries is today-scoped beside all-time tiles |
| 3 | User Control and Freedom | 3 | Refresh, retry, View all, deep-linked filters, pagination; /notifications filter state never reaches the URL |
| 4 | Consistency and Standards | 3 | Shared row-link grammar and status vocabulary; overview rows lack mobile column labels; dot uses whatsapp green, label uses ok green |
| 5 | Error Prevention | 3 | Read-only surface, refresh disabled in-flight; error+data render contradiction |
| 6 | Recognition Rather Than Recall | 4 | Inline legend, every number labeled, hero counts visibly clickable |
| 7 | Flexibility and Efficiency | 3 | Deep links, whole-row links, one-tap failed/queued triage; no in-place filtering, no failure reason exposed |
| 8 | Aesthetic and Minimalist Design | 3 | Calm single hero; failure count stated twice (band + hero) |
| 9 | Error Recovery | 3 | ErrorState+retry, FailureBand CTA, stall+stale affordances; stall has no what-to-do, recovery hidden behind stale error |
| 10 | Help and Documentation | 3 | Inline legend is real micro-documentation; no explanation of stale threshold or stall remediation |
| **Total** | | **31/40** | **Good** (was 29) |

## Priority Issues

### [P1] A background poll that succeeds never clears a prior load error
Initial fetch fails, error set; the 45s poll calls only setMetrics, so the render keeps the error branch, hiding live data under an aging Try again. Fix: clear error when a poll resolves with metrics. Command: harden.

### [P1] Daily summaries is a today-scoped count sitting unlabeled beside all-time totals
Equating Daily summaries (64) with Enrolled customers (12,480) implies a cumulative count. Fix: label the period on each tile or split today vs cumulative. Command: clarify.

### [P1] Returning to a hidden tab shows stale for up to 45s
Polling is gated on document.hidden and nothing reacts to visibilitychange. Fix: refetch immediately on visible and reset the interval. Command: harden.

### [P2] Overview rows lack mobile column labels; the fixed right cluster squeezes the name
At 360px the shrink-0 badge+StatusDot+w-24 date leaves ~80px for the customer name. Fix: stack meta beneath the name below sm. Command: layout.

### [P2] No date or timezone anchor for today
H1/subline mention no date while formatDate uses an unstated zone; UTC server vs Lagos admin blurs the boundary. Fix: surface the resolved date + zone by the hero. Command: clarify.

### [P2] Failure count and CTA are duplicated
FailureBand Review failed and the hero failed-to-send link both target ?status=failed on every failure. Fix: keep one primary failure surface. Command: distill.

### [P2] lastAlertReceivedAt null disables stall detection entirely
A webhook broken since day one shows a calm neutral state forever. Fix: escalate on a backend anchor (installedAt) when the timestamp is absent. Command: harden.

### [P2] /notifications filter changes never reach the URL
changeFilter only sets state; only inbound status is honored (keyed remount). Fix: push searchParams on change. Command: adapt.

## Persona Red Flags

**Alex (power user):** cannot triage failure reasons from the Overview (errorMessage one click away, and there only in a title tooltip); cannot bookmark/share a filtered delivery view; today has no date to reconcile against a report.

**Sam (accessibility):** proportion meter aria-hidden with only the sent percentage in caption; hero metric has no H2 so heading navigation skips the primary content; live region re-announces on every poll and never surfaces failures; whatsapp dot ~2.98:1 just under the 3:1 non-text threshold.

## Design Specificity Verdict

**LLM assessment (A):** Authored for this product — WhatsApp-handoff language, Txn alert vs Daily summary vocabulary, en-NG/NGN, stall semantics tied to a real bank pipeline, deep links carrying failure into a filtered log. Two seams remain: the four-tile stats band is a periodless, comparisonless generic row, and the undated today assumes viewer day equals server day.

**Deterministic scan (B):** CLEAN — detect 0 findings (exit 0). Contrast audit all pass AA: ok 5.35/6.14, warn 5.78/5.95, failure link 6.44, mute 6.27, brand 8.66. Reduced motion handled twice-over; focus-visible outline global.
