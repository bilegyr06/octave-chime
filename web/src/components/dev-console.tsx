"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { notificationStatusMap, notificationStatusTone } from "@/lib/status";
import { Badge, Card, ErrorState, Spinner, inputClass } from "@/components/ui";

interface CustomerOption {
  id: string;
  fullName: string;
  whatsappPhone: string | null;
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

interface BankRow {
  id: string;
  name: string;
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

export function DevConsole() {
  const [isPlatform, setIsPlatform] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  const [sim, setSim] = useState({
    customerId: "",
    type: "credit" as "credit" | "debit",
    amount: "",
    narration: "",
  });
  const [simBusy, setSimBusy] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const [runBusy, setRunBusy] = useState(false);
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [platformMetrics, setPlatformMetrics] = useState<BankMetrics[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let sawPlatform = false;
      try {
        const banks = await api<BankRow[]>("/api/banks");
        sawPlatform = true;
        if (cancelled) return;
        setIsPlatform(true);
        const rows = await Promise.all(
          banks.map((b) =>
            api<BankMetrics>(`/api/dashboard/metrics?bankId=${b.id}`).catch(() => null),
          ),
        );
        if (!cancelled) setPlatformMetrics(rows.filter((r): r is BankMetrics => r !== null));
      } catch {
        if (!cancelled) setIsPlatform(sawPlatform);
      }
      try {
        const page = await api<{ items: CustomerOption[] }>("/api/customers?page=1&pageSize=100");
        if (!cancelled) setCustomers(page.items);
      } catch (e) {
        if (!cancelled) setInitError(e instanceof Error ? e.message : "Failed to load customers");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const customer = customers.find((c) => c.id === sim.customerId);

  async function runSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!sim.customerId) return;
    setSimBusy(true);
    setSimResult(null);
    setSimError(null);
    try {
      const result = await api<SimulateResult>("/api/transactions/simulate", {
        method: "POST",
        body: JSON.stringify({
          customerId: sim.customerId,
          type: sim.type,
          amount: Number(sim.amount),
          narration: sim.narration.trim() ? sim.narration.trim() : undefined,
        }),
      });
      setSimResult(result);
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
      setReport(await api<SummaryReport>("/api/dashboard/summary/run", { method: "POST" }));
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Summary run failed");
    } finally {
      setRunBusy(false);
    }
  }

  async function loadPlatform() {
    setInitError(null);
    try {
      const banks = await api<BankRow[]>("/api/banks");
      const rows = await Promise.all(
        banks.map((b) =>
          api<BankMetrics>(`/api/dashboard/metrics?bankId=${b.id}`).catch(() => null),
        ),
      );
      setPlatformMetrics(rows.filter((r): r is BankMetrics => r !== null));
    } catch (err) {
      setInitError(err instanceof Error ? err.message : "Failed to load platform metrics");
    }
  }

  if (initError && !customers.length) {
    return <ErrorState title="Dev console failed to load" hint={initError} onRetry={loadPlatform} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dev console</h1>
        <p className="mt-1 text-sm text-mute">
          Simulation controls mirroring the inbound bot and cron jobs. Not linked in the sidebar.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Simulate a transaction</h2>
            <p className="mt-0.5 text-xs text-mute">
              Posts a verified ledger entry and runs the real WhatsApp alert pipeline.
            </p>
          </div>
          <form onSubmit={runSimulate} className="space-y-4 px-5 py-5">
            <label className="block">
              <span className="text-sm font-medium text-ink">Customer</span>
              <select
                className={`${inputClass} mt-1`}
                value={sim.customerId}
                onChange={(e) => setSim({ ...sim, customerId: e.target.value })}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.whatsappPhone ?? "no phone"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <label className="block">
                <span className="text-sm font-medium text-ink">Type</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={sim.type}
                  onChange={(e) => setSim({ ...sim, type: e.target.value as "credit" | "debit" })}
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
                  onChange={(e) => setSim({ ...sim, amount: e.target.value })}
                  placeholder="5000.00"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-ink">Narration</span>
              <input
                className={`${inputClass} mt-1`}
                value={sim.narration}
                onChange={(e) => setSim({ ...sim, narration: e.target.value })}
                placeholder="POS withdrawal"
              />
            </label>

            {simError ? <p className="text-sm font-medium text-danger">{simError}</p> : null}

            <button
              type="submit"
              disabled={simBusy || !sim.customerId || !Number(sim.amount)}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {simBusy ? "Posting…" : "Post simulated transaction"}
            </button>

            {simResult ? (
              <div className="rounded-md border border-line bg-canvas px-4 py-3 text-sm">
                <p className="font-medium text-ink">
                  {simResult.transaction.type === "credit" ? "+" : "−"}
                  {money(simResult.transaction.amount, simResult.transaction.currency)} ·{" "}
                  {customer?.fullName ?? "customer"}
                </p>
                <p className="mt-1 font-mono text-xs text-mute">
                  {simResult.transaction.reference} · balance{" "}
                  {money(simResult.transaction.balanceAfter, simResult.transaction.currency)}
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-ink">
                  <Badge tone={notificationStatusTone(simResult.notificationStatus)}>
                    {notificationStatusMap[simResult.notificationStatus]?.label ??
                      simResult.notificationStatus}
                  </Badge>
                  WhatsApp delivery
                </p>
              </div>
            ) : null}
          </form>
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Daily summary run</h2>
            <p className="mt-0.5 text-xs text-mute">
              Equivalent of the 21:00 Lagos cron — generates and delivers end-of-day briefings now.
            </p>
          </div>
          <div className="px-5 py-5">
            <button
              type="button"
              onClick={runSummary}
              disabled={runBusy}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runBusy ? "Running…" : "Run now"}
            </button>

            {runError ? <p className="mt-4 text-sm font-medium text-danger">{runError}</p> : null}

            {report ? (
              <div className="mt-4 rounded-md border border-line bg-canvas px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {report.dateLabel} · {report.generated} generated
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
                    <div key={key} className="rounded-md bg-paper px-3 py-2">
                      <dt className="text-xs text-mute">{label}</dt>
                      <dd
                        className={`font-mono text-lg font-medium tabular ${
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
      </div>

      {isPlatform ? (
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Cross-bank metrics</h2>
              <p className="mt-0.5 text-xs text-mute">
                Platform view — live dashboard figures per tenant bank.
              </p>
            </div>
            <button
              type="button"
              onClick={loadPlatform}
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:border-line-strong"
            >
              Refresh
            </button>
          </div>
          {initError ? <p className="px-5 py-3 text-sm text-danger">{initError}</p> : null}
          {platformMetrics === null ? (
            <Spinner label="Loading metrics" />
          ) : (
            <div className="divide-y divide-line">
              <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium uppercase text-mute sm:grid sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr]">
                <span>Bank</span>
                <span className="text-right">Enrolled</span>
                <span className="text-right">Linked</span>
                <span className="text-right">Enabled</span>
                <span className="text-right">Sent today</span>
              </div>
              {platformMetrics.map((m) => (
                <div
                  key={m.bank?.id ?? m.failedAlertsToday}
                  className="grid items-center gap-4 px-5 py-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr]"
                >
                  <span className="text-sm font-medium text-ink">{m.bank?.name ?? "—"}</span>
                  <span className="text-right font-mono text-sm tabular text-ink">
                    {m.enrolledCustomers}
                  </span>
                  <span className="text-right font-mono text-sm tabular text-ink">
                    {m.linkedAccounts}
                  </span>
                  <span className="text-right font-mono text-sm tabular text-ink">
                    {m.whatsappEnabledCustomers}
                  </span>
                  <span className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-sm tabular ${
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
      ) : null}
    </div>
  );
}