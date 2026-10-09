"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { notificationStatusMap, notificationStatusTone } from "@/lib/status";
import { Badge, Card, ErrorState, Led, Spinner, inputClass } from "@/components/ui";

const DEV = "/api/dev";

const WEBHOOK_PHONE = "12022214836";

const QUICK_CHIPS = ["START", "1", "2", "3", "4", "YES", "PAUSE", "RESUME", "STOP", "NO", "HELP"];

interface BankOption {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface CustomerOption {
  id: string;
  fullName: string;
  whatsappPhone: string | null;
  bankId: string;
  bankName: string;
}

interface SimulateResult {
  transaction: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    balanceAfter: number;
    narration: string | null;
    reference: string;
    transactionDate: string;
  };
  notificationStatus: string;
  /** Snapshot of the customer/bank this result was posted for. */
  customerName?: string | null;
  bankName?: string | null;
}

interface SummaryReport {
  summaryDate: string;
  dateLabel: string;
  scanned: number;
  generated: number;
  duplicates: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface BankMetrics {
  bank: { id: string; name: string; slug: string } | null;
  enrolledCustomers: number;
  linkedAccounts: number;
  whatsappEnabledCustomers: number;
  alertsSentToday: number;
  failedAlertsToday: number;
  dailySummariesToday: number;
}

interface TranscriptMsg {
  id: string;
  kind?: "bot" | "alert" | "summary";
  direction: "inbound" | "outbound";
  text: string;
  createdAt: string;
  /** Delivery status for alert/summary rows (notification.status). */
  status?: string;
  /** Skip/failure reason recorded by the delivery pipeline. */
  errorMessage?: string | null;
}

function notificationBadgeLabel(m: TranscriptMsg): string {
  if (m.status === "sent") return "Delivered";
  if (m.status === "queued") return "Queued";
  return `Not delivered: ${m.errorMessage ?? m.status ?? "unknown"}`;
}

const URL_RE = /(https?:\/\/\S+)/g;

function withLinks(text: string): ReactNode {
  return text.split(URL_RE).map((part, i) =>
    /^https?:/.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="break-all text-brand underline transition-colors hover:text-brand-strong"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function DevConsole() {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  const [sim, setSim] = useState({
    bankId: "",
    customerId: "",
    type: "credit" as "credit" | "debit",
    amount: "",
    narration: "",
  });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [simBusy, setSimBusy] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const [runBusy, setRunBusy] = useState(false);
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [metricsBankId, setMetricsBankId] = useState("");
  const [metrics, setMetrics] = useState<BankMetrics[] | null>(null);
  const [metricsKey, setMetricsKey] = useState(0);

  const [waPhone, setWaPhone] = useState("2348030000000");
  const [waMessage, setWaMessage] = useState("");
  const [waBusy, setWaBusy] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waMode, setWaMode] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMsg[]>([]);
  const [waReload, setWaReload] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<BankOption[]>(`${DEV}/banks`).catch((err: unknown) => {
        if (!cancelled) setInitError(err instanceof Error ? err.message : "Failed to load banks");
        return null;
      }),
      api<{ termiiMode?: string }>("/api/health").catch(() => ({ termiiMode: null })),
    ]).then(([bankRows, health]) => {
      if (cancelled) return;
      if (bankRows) setBanks(bankRows);
      setWaMode(health.termiiMode ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ page: "1", pageSize: "100" });
    if (sim.bankId) qs.set("bankId", sim.bankId);
    api<{ items: CustomerOption[] }>(`${DEV}/customers?${qs.toString()}`)
      .then((page) => {
        if (!cancelled) setCustomers(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setInitError(err instanceof Error ? err.message : "Failed to load customers");
      });
    return () => {
      cancelled = true;
    };
  }, [sim.bankId]);

  useEffect(() => {
    let cancelled = false;
    if (banks.length === 0) return;
    const targets = metricsBankId ? [metricsBankId] : banks.map((b) => b.id);
    Promise.all(
      targets.map((id) =>
        api<BankMetrics>(`${DEV}/metrics?bankId=${id}`).catch(() => null),
      ),
    )
      .then((rows) => {
        if (!cancelled) setMetrics(rows.filter((r): r is BankMetrics => r !== null));
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [metricsBankId, banks, metricsKey]);

  useEffect(() => {
    let cancelled = false;
    if (!waPhone.trim()) return;
    const load = () =>
      api<{ items: TranscriptMsg[] }>(
        `${DEV}/messages?phone=${encodeURIComponent(waPhone.trim())}`,
      )
        .then((r) => {
          if (!cancelled) setTranscript(r.items);
        })
        .catch(() => {
          if (!cancelled) setTranscript([]);
        });
    void load();
    const id = window.setInterval(load, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [waPhone, waReload]);

  // Pin to the latest message only on user send, phone switch, or when already
  // at the bottom — never yank the reader away from older history.
  const forceScrollRef = useRef(false);
  const lastPhoneRef = useRef(waPhone);

  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    const phoneChanged = lastPhoneRef.current !== waPhone;
    lastPhoneRef.current = waPhone;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (forceScrollRef.current || phoneChanged || nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
    forceScrollRef.current = false;
  }, [transcript, waPhone]);

  const selectedCustomer = customers.find((c) => c.id === sim.customerId) ?? null;

  async function runSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!sim.customerId) return;
    setSimBusy(true);
    setSimResult(null);
    setSimError(null);
    try {
      const result = await api<SimulateResult>(`${DEV}/transactions/simulate`, {
        method: "POST",
        body: JSON.stringify({
          customerId: sim.customerId,
          bankId: sim.bankId || selectedCustomer?.bankId || undefined,
          type: sim.type,
          amount: Number(sim.amount),
          narration: sim.narration.trim() ? sim.narration.trim() : undefined,
        }),
      });
      setSimResult({
        ...result,
        customerName: selectedCustomer?.fullName ?? null,
        bankName: selectedCustomer?.bankName ?? null,
      });
      setWaReload((n) => n + 1);
    } catch (err) {
      setSimError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimBusy(false);
    }
  }

  async function runSummary() {
    setRunBusy(true);
    setReport(null);
    setRunError(null);
    try {
      setReport(
        await api<SummaryReport>(`${DEV}/summary/run`, {
          method: "POST",
          body: JSON.stringify({ force: true }),
        }),
      );
      setWaReload((n) => n + 1);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Summary run failed");
    } finally {
      setRunBusy(false);
    }
  }

  async function sendWa() {
    const phone = waPhone.trim();
    const message = waMessage.trim();
    if (!phone || !message) return;
    setWaBusy(true);
    setWaError(null);
    try {
      const res = await fetch("/webhooks/termii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "inbound",
          id: `sim-${Date.now()}`,
          message_id: `msg-${Date.now()}`,
          receiver: WEBHOOK_PHONE,
          sender: phone,
          message,
          received_at: new Date().toISOString(),
          cost: null,
          command: "Received",
          status: "Received",
          channel: "whatsapp",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `Webhook failed (${res.status})`);
      }
      setWaMessage("");
      forceScrollRef.current = true;
      setWaReload((n) => n + 1);
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Message could not be sent");
    } finally {
      setWaBusy(false);
    }
  }

  function chip(text: string) {
    setWaMessage((prev) => (prev ? `${prev} ${text}` : text));
  }

  if (initError && banks.length === 0) {
    return (
      <ErrorState
        title="Dev console failed to load"
        hint={initError}
        onRetry={() => {
          setInitError(null);
          setMetricsKey((n) => n + 1);
        }}
      />
    );
  }

  const simDisabled = waMode === "live";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Demo controls</h1>
        <p className="mt-1 text-sm text-mute">
          Simulated transactions, daily summary runs, and the WhatsApp mock inbound —
          all cross-bank through the dev operator session.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-ink">
              <Led tone="signal" />
              Simulate a transaction
            </h2>
            <p className="mt-0.5 text-xs text-mute">
              Posts a verified ledger entry and runs the real WhatsApp alert pipeline.
            </p>
          </div>
          <form onSubmit={runSimulate} className="space-y-4 px-5 py-5">
            <label className="block">
              <span className="text-sm font-medium text-ink">Bank</span>
              <select
                className={`${inputClass} mt-1`}
                value={sim.bankId}
                onChange={(e) =>
                  setSim((s) => ({ ...s, bankId: e.target.value, customerId: "" }))
                }
              >
                <option value="">All banks</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-mute">
                Narrows the customer list to that bank&apos;s customers.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Customer</span>
              <select
                className={`${inputClass} mt-1`}
                value={sim.customerId}
                onChange={(e) => {
                  const cid = e.target.value;
                  const c = customers.find((x) => x.id === cid);
                  setSim((s) => ({ ...s, customerId: cid, bankId: c ? c.bankId : s.bankId }));
                }}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}, {c.bankName}
                    {c.whatsappPhone ? `, ${c.whatsappPhone}` : ""}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-mute">
                Picking a customer locks Bank to their own bank.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Type</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={sim.type}
                  onChange={(e) =>
                    setSim((s) => ({ ...s, type: e.target.value as "credit" | "debit" }))
                  }
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Amount</span>
                <input
                  className={`${inputClass} mt-1`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={sim.amount}
                  onChange={(e) => setSim((s) => ({ ...s, amount: e.target.value }))}
                  placeholder="5000.00"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-ink">Narration</span>
              <input
                className={`${inputClass} mt-1`}
                value={sim.narration}
                onChange={(e) => setSim((s) => ({ ...s, narration: e.target.value }))}
                placeholder="POS withdrawal"
              />
            </label>

            {simError ? <p className="text-sm font-medium text-danger">{simError}</p> : null}

            <button
              type="submit"
              disabled={simBusy || !sim.customerId || !Number(sim.amount)}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-paper hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {simBusy ? "Posting…" : "Post simulated transaction"}
            </button>

            {simResult ? (
              <div className="rounded-[3px] border border-line bg-canvas px-4 py-3 text-sm">
                <p className="flex items-center justify-between gap-3 font-medium text-ink">
                  <span>
                    {simResult.transaction.type === "credit" ? "+" : "−"}
                    {money(simResult.transaction.amount, simResult.transaction.currency)}
                  </span>
                  <span className="truncate text-xs text-mute">
                    {simResult.customerName ?? "customer"}, {simResult.bankName ?? ""}
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-mute">
                  {simResult.transaction.reference}
                </p>
                <p className="text-xs text-mute">
                  Balance {money(simResult.transaction.balanceAfter, simResult.transaction.currency)}
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-ink">
                  <Badge tone={notificationStatusTone(simResult.notificationStatus)}>
                    {notificationStatusMap[simResult.notificationStatus]?.label ??
                      simResult.notificationStatus}
                  </Badge>
                </p>
              </div>
            ) : null}
          </form>
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-ink">
              <Led tone="brand" />
              Daily summary run
            </h2>
            <p className="mt-0.5 text-xs text-mute">
              Equivalent of the 21:00 Lagos cron — generates and delivers end-of-day briefings now.
            </p>
          </div>
          <div className="px-5 py-5">
            <button
              type="button"
              onClick={runSummary}
              disabled={runBusy}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-paper hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runBusy ? "Running…" : "Run now"}
            </button>

            {runError ? <p className="mt-4 text-sm font-medium text-danger">{runError}</p> : null}

            {report ? (
              <div className="mt-4 rounded-[3px] border border-line bg-canvas px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {report.dateLabel}, {report.generated} generated
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-3">
                  {(
                    [
                      ["scanned", "Scanned"],
                      ["generated", "Generated"],
                      ["duplicates", "Duplicates"],
                      ["sent", "Sent"],
                      ["failed", "Failed"],
                      ["skipped", "Skipped"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="rounded-[3px] bg-paper px-3 py-2">
                      <dt className="text-xs text-mute">{label}</dt>
                      <dd
                        className={`font-display text-lg font-semibold tabular ${
                          key === "failed" && report.failed > 0 ? "text-danger" : "text-ink"
                        }`}
                      >
                        {report[key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="mt-4 text-sm text-mute">
                No run yet this session — run to deliver briefings for today.
              </p>
            )}
          </div>
        </Card>

        <Card className="grid max-h-[690px] grid-rows-[auto_1fr]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-ink">
                <Led tone={simDisabled ? "danger" : "whatsapp"} />
                WhatsApp simulator
              </h2>
              <p className="mt-0.5 text-xs text-mute">
                Drives the real <span className="font-mono">/webhooks/termii</span> inbound path.
              </p>
            </div>
            <Badge tone={simDisabled ? "warn" : waMode === "mock" ? "whatsapp" : "mute"}>
              {simDisabled
                ? "live, simulator off"
                : waMode === "mock"
                  ? "offline mock"
                  : `termii ${waMode ?? "offline"}`}
            </Badge>
          </div>

          <div className="flex min-h-0 flex-col gap-3 px-5 py-5">
            {simDisabled ? (
              <p className="rounded-[3px] border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
                Termii is in live mode — the simulator is disabled so it cannot
                message real WhatsApp numbers.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Sender phone</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="2348030000000"
                  disabled={simDisabled}
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setWaPhone("2348030000000")}
                  disabled={simDisabled}
                  className="flex-1 rounded-[3px] border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:border-line-strong disabled:opacity-50"
                  title="Fresh phone for a clean new-customer enrollment"
                >
                  Fresh number
                </button>
                <button
                  type="button"
                  onClick={() => setWaPhone("+2348012345604")}
                  disabled={simDisabled}
                  className="flex-1 rounded-[3px] border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:border-line-strong disabled:opacity-50"
                  title="Quick-fill the seeded customer to demo PAUSE/STOP/re-consent"
                >
                  Seeded customer
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => chip(c)}
                  disabled={simDisabled}
                  className="rounded-[3px] border border-line bg-canvas px-2 py-1 text-xs font-medium text-ink transition-colors hover:border-line-strong hover:bg-paper disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendWa();
                  }
                }}
                placeholder="Message as the customer…"
                disabled={simDisabled}
              />
              <button
                type="button"
                onClick={() => void sendWa()}
                disabled={simDisabled || waBusy || !waMessage.trim() || !waPhone.trim()}
                className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-paper hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                {waBusy ? "Sending…" : "Send"}
              </button>
            </div>

            {waError ? <p className="text-sm font-medium text-danger">{waError}</p> : null}

            <div
              ref={transcriptRef}
              className="mt-1 min-h-0 flex-1 space-y-2.5 overflow-x-hidden overflow-y-auto rounded-[3px] border border-line bg-canvas p-3"
            >
              {transcript.length === 0 ? (
                <p className="text-center text-xs text-mute">
                  No conversation yet for this sender.
                </p>
              ) : (
                transcript.map((m) => {
                  const senderLabel =
                    m.direction === "inbound"
                      ? "You"
                      : m.kind === "summary"
                        ? "Daily summary"
                        : m.kind === "alert"
                          ? "Alert"
                          : "Bot";
                  const isNotification = m.kind === "alert" || m.kind === "summary";
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] break-words rounded-[4px] px-3 py-2 text-sm whitespace-pre-wrap ${
                        m.direction === "inbound"
                          ? "ml-auto bg-brand-soft text-ink"
                          : "mr-auto border border-line bg-paper text-ink"
                      }`}
                    >
                      <p className="mb-0.5 text-[11px] font-medium text-mute">
                        {senderLabel}
                      </p>
                      {withLinks(m.text)}
                      {isNotification ? (
                        <p className="mt-1.5">
                          <Badge tone={notificationStatusTone(m.status ?? "")}>
                            {notificationBadgeLabel(m)}
                          </Badge>
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-ink">
              <Led tone="ok" />
              Cross-bank metrics
            </h2>
            <p className="mt-0.5 text-xs text-mute">
              Live dashboard figures per tenant bank — all accessible to the dev operator.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className={`${inputClass} w-auto`}
              value={metricsBankId}
              onChange={(e) => setMetricsBankId(e.target.value)}
            >
              <option value="">All banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMetricsKey((n) => n + 1)}
              className="rounded-[3px] border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:border-line-strong"
            >
              Refresh
            </button>
          </div>
        </div>
        {metrics === null ? (
          <Spinner label="Loading metrics" />
        ) : (
          <div className="divide-y divide-line">
            <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium text-mute sm:grid sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr]">
              <span>Bank</span>
              <span className="text-right">Enrolled</span>
              <span className="text-right">Linked</span>
              <span className="text-right">Enabled</span>
              <span className="text-right">Sent today</span>
            </div>
            {metrics.map((m) => (
              <div
                key={m.bank?.id ?? m.failedAlertsToday}
                className="grid items-center gap-4 px-5 py-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr]"
              >
                <span className="text-sm font-medium text-ink">{m.bank?.name ?? "—"}</span>
                <span className="text-right text-sm tabular text-ink">
                  {m.enrolledCustomers}
                </span>
                <span className="text-right text-sm tabular text-ink">
                  {m.linkedAccounts}
                </span>
                <span className="text-right text-sm tabular text-ink">
                  {m.whatsappEnabledCustomers}
                </span>
                <span className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm tabular ${
                      m.alertsSentToday > 0 ? "text-brand" : "text-mute"
                    }`}
                  >
                    {m.alertsSentToday}
                    {m.failedAlertsToday > 0 ? (
                      <Badge tone="danger">{m.failedAlertsToday} failed</Badge>
                    ) : null}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}