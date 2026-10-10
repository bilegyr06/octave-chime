"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate, money } from "@/lib/format";
import { Badge, Card, EmptyState, ErrorState, Pagination, Spinner, inputClass } from "@/components/ui";

interface TransactionRow {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  amount: number;
  currency: string;
  balanceAfter: number;
  narration: string | null;
  reference: string;
  transactionDate: string;
  source: string;
}

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;
const TYPE_FILTERS = ["", "debit", "credit"];
const SOURCE_LABEL: Record<string, string> = {
  simulated: "Simulated",
  mono: "Mono",
  direct_bank: "Bank",
};
const SOURCE_TONE: Record<string, "mute" | "brand" | "ok"> = {
  simulated: "mute",
  mono: "ok",
  direct_bank: "brand",
};

export function TransactionsData() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (type) params.set("type", type);

    api<PageResult<TransactionRow>>(`/api/transactions?${params}`)
      .then((data) => {
        if (cancelled) return;
        setRows(data.items);
        setTotal(data.total);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load transactions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, type, reloadKey]);

  const changeType = (value: string) => {
    setPage(1);
    setLoading(true);
    setError(null);
    setType(value);
  };

  const gotoPage = (p: number) => {
    setLoading(true);
    setError(null);
    setPage(p);
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Transactions</h1>
        <p className="mt-1 text-sm text-mute">
          Verified ledger entries that produced WhatsApp alerts for your customers.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <input
            className={`${inputClass} max-w-xs`}
            placeholder="Search narration or reference…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select className={`${inputClass} w-auto`} value={type} onChange={(e) => changeType(e.target.value)}>
            <option value="">All types</option>
            {TYPE_FILTERS.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t === "debit" ? "Debit" : "Credit"}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm tabular text-mute">
            {!loading ? total : "…"}
          </span>
        </div>

        {loading ? (
          <Spinner label="Loading transactions" />
        ) : error ? (
          <ErrorState title="Transactions failed to load" hint={error} onRetry={retry} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No transactions found"
            hint={
              debouncedQ || type
                ? "Try adjusting the search or filters."
                : "Run a simulate action from the Dev console to create a transaction."
            }
          />
        ) : (
          <div className="divide-y divide-line">
            <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium text-mute sm:grid sm:grid-cols-[1fr_1.6fr_1.8fr_0.9fr_1fr_0.7fr]">
              <span>Date</span>
              <span>Customer</span>
              <span>Narration</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Balance</span>
              <span>Source</span>
            </div>
            {rows.map((t) => (
              <div
                key={t.id}
                className="grid items-center gap-4 px-5 py-3 sm:grid-cols-[1fr_1.6fr_1.8fr_0.9fr_1fr_0.7fr]"
              >
                <span className="text-xs text-mute">{formatDate(t.transactionDate)}</span>
                <Link
                  href={`/customers/${t.customerId}`}
                  className="truncate text-sm font-medium text-ink hover:text-brand"
                >
                  {t.customerName}
                </Link>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">
                    {t.narration ?? "Bank transfer"}
                  </span>
                  <span className="block truncate font-mono text-xs text-mute">{t.reference}</span>
                </span>
                <span
                  className={`text-right font-mono text-sm tabular ${
                    t.type === "credit" ? "text-brand" : "text-ink"
                  }`}
                >
                  {t.type === "credit" ? "+" : "−"}
                  {money(t.amount, t.currency)}
                </span>
                <span className="text-right font-mono text-sm tabular text-mute">
                  {money(t.balanceAfter, t.currency)}
                </span>
                <Badge tone={SOURCE_TONE[t.source] ?? "mute"}>
                  {SOURCE_LABEL[t.source] ?? t.source}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {!loading && total > 0 ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={gotoPage} />
        ) : null}
      </Card>
    </div>
  );
}