"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  notificationStatusMap,
  notificationTypeLabel,
} from "@/lib/status";
import { Badge, Card, EmptyState, ErrorState, Pagination, Spinner, inputClass } from "@/components/ui";

interface NotificationRow {
  id: string;
  bankId: string;
  customerId: string;
  customerName: string;
  transactionId: string | null;
  type: string;
  channel: string;
  status: string;
  recipient: string;
  messageBody: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 25;
const TYPE_FILTERS = ["", "transaction_alert", "daily_summary"];
const STATUS_FILTERS = ["", ...Object.keys(notificationStatusMap)];

const DOT_CLASS: Record<string, string> = {
  ok: "bg-ok",
  whatsapp: "bg-whatsapp",
  danger: "bg-danger",
  warn: "bg-warn",
  mute: "bg-line-strong",
};

export function NotificationsData({ initialStatus = "" }: { initialStatus?: string }) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (type) params.set("type", type);
    if (status) params.set("status", status);

    api<PageResult<NotificationRow>>(`/api/notifications?${params}`)
      .then((data) => {
        if (cancelled) return;
        setRows(data.items);
        setTotal(data.total);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load notifications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, type, status, reloadKey]);

  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setPage(1);
    setLoading(true);
    setError(null);
    setter(value);
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
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-mute">
          Delivery log for every WhatsApp alert and daily summary we attempted.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <select
            className={`${inputClass} w-auto`}
            value={type}
            onChange={(e) => changeFilter(setType)(e.target.value)}
          >
            <option value="">All types</option>
            {TYPE_FILTERS.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {notificationTypeLabel[t]}
              </option>
            ))}
          </select>
          <select
            className={`${inputClass} w-auto`}
            value={status}
            onChange={(e) => changeFilter(setStatus)(e.target.value)}
          >
            <option value="">All status</option>
            {STATUS_FILTERS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {notificationStatusMap[s].label}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm tabular text-mute">
            {!loading ? total : "…"}
          </span>
        </div>

        {loading ? (
          <Spinner label="Loading notifications" />
        ) : error ? (
          <ErrorState title="Notifications failed to load" hint={error} onRetry={retry} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No notifications found"
            hint={
              type || status
                ? "Try adjusting the filters."
                : "Messages appear here once alerts are sent."
            }
          />
        ) : (
          <div className="divide-y divide-line">
            <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium text-mute sm:grid sm:grid-cols-[1fr_0.8fr_1.4fr_1.1fr_2.4fr_0.9fr]">
              <span>Time</span>
              <span>Type</span>
              <span>Customer</span>
              <span>Recipient</span>
              <span>Message</span>
              <span>Status</span>
            </div>
            {rows.map((n) => {
              const note = notificationStatusMap[n.status] ?? { label: n.status };
              return (
                <div
                  key={n.id}
                  className="grid items-center gap-1 px-5 py-3 sm:gap-4 sm:grid-cols-[1fr_0.8fr_1.4fr_1.1fr_2.4fr_0.9fr]"
                >
                  <span className="text-xs text-mute">
                    <span className="mr-2 text-xs font-medium text-mute sm:hidden">Time</span>
                    {formatDate(n.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-mute sm:hidden">Type</span>
                    <Badge tone={n.type === "daily_summary" ? "mute" : "brand"}>
                      {notificationTypeLabel[n.type] ?? n.type}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <span className="mr-2 text-xs font-medium text-mute sm:hidden">Customer</span>
                    <Link
                      href={`/customers/${n.customerId}`}
                      className="truncate text-sm font-medium text-ink hover:text-brand"
                    >
                      {n.customerName}
                    </Link>
                  </div>
                  <div className="min-w-0 truncate font-mono text-xs text-ink">
                    <span className="mr-2 font-sans text-xs font-medium text-mute sm:hidden">
                      Recipient
                    </span>
                    {n.recipient}
                  </div>
                  <div className="min-w-0" title={n.errorMessage ?? undefined}>
                    <span className="mr-2 text-xs font-medium text-mute sm:hidden">Message</span>
                    <span className="block truncate text-sm text-ink">{n.messageBody}</span>
                    {n.errorMessage ? (
                      <span className="block truncate text-xs text-danger">{n.errorMessage}</span>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-medium text-ink ${
                      note.tone === "whatsapp" ? "text-ok" : ""
                    }`}
                  >
                    <span className="text-xs font-medium text-mute sm:hidden">Status</span>
                    <span className={`h-2 w-2 rounded-full ${DOT_CLASS[note.tone] ?? "bg-line-strong"}`} />
                    {note.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && total > 0 ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={gotoPage} />
        ) : null}
      </Card>
    </div>
  );
}