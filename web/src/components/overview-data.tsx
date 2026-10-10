"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCount, formatDate, formatGap, formatUpdated } from "@/lib/format";
import {
  notificationStatusMap,
  notificationTypeLabel,
  serviceStatusMap,
} from "@/lib/status";
import { Badge, Card, EmptyState, ErrorState, Led, Spinner, StatusDot } from "./ui";
import { AlertIcon, ChevronRightIcon, RefreshIcon } from "./icons";

interface RecentEnrollment {
  id: string;
  fullName: string;
  whatsappPhone: string | null;
  serviceStatus: string;
  createdAt: string;
}

interface DeliveryRow {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  status: string;
  recipient: string;
  messageBody: string;
  createdAt: string;
}

interface DashboardMetrics {
  bank: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  enrolledCustomers: number;
  linkedAccounts: number;
  whatsappEnabledCustomers: number;
  alertsSentToday: number;
  queuedAlertsToday: number;
  failedAlertsToday: number;
  dailySummariesToday: number;
  lastAlertReceivedAt: string | null;
  recentEnrollments: RecentEnrollment[];
  recentDeliveryLog: DeliveryRow[];
  generatedAt: string;
}

function PanelHeader({ title, href, led = "brand" }: { title: string; href?: string; led?: "brand" | "signal" | "danger" | "whatsapp" }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
      <h2 className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-ink">
        <Led tone={led} />
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-mute hover:text-ink"
        >
          View all
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold tracking-tight tabular text-ink">
        {formatCount(value)}
      </p>
    </div>
  );
}

function FailureBand({ failed }: { failed: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[3px] border border-danger/30 bg-danger-soft px-4 py-3">
      <AlertIcon className="h-5 w-5 shrink-0 text-danger" />
      <p className="text-sm font-medium text-danger">
        {formatCount(failed)} {failed === 1 ? "alert" : "alerts"} failed to send today
      </p>
      <Link
        href="/notifications?status=failed"
        className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline"
      >
        Review failed
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

const STALL_MS = 6 * 60 * 60 * 1000;

function SignalBar({
  metrics,
  now,
}: {
  metrics: DashboardMetrics;
  now: number;
}) {
  const sent = metrics.alertsSentToday;
  const queued = metrics.queuedAlertsToday;
  const failed = metrics.failedAlertsToday;
  const total = sent + queued + failed;
  const lastReceivedMs = metrics.lastAlertReceivedAt
    ? new Date(metrics.lastAlertReceivedAt).getTime()
    : null;
  const stalled =
    total === 0 && lastReceivedMs != null && now - lastReceivedMs >= STALL_MS;
  const tone =
    total === 0
      ? stalled
        ? "warn"
        : "mute"
      : failed > 0
        ? "danger"
        : "whatsapp";
  return (
    <Card className="px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <p className="flex items-center gap-2 text-sm text-mute">
            <Led tone={tone} />
            Alerts sent today
          </p>
          <p className="mt-1 font-display text-[44px] font-semibold leading-none tracking-tight tabular text-ink">
            {formatCount(sent)}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-mute">
            {failed > 0 ? (
              <span className="font-medium text-danger">
                {formatCount(failed)} failed to send
              </span>
            ) : null}
            {queued > 0 ? <span>{formatCount(queued)} queued</span> : null}
            {failed === 0 && queued === 0 ? (
              <span className={total === 0 && stalled ? "font-medium text-warn" : ""}>
                {total === 0
                  ? stalled && lastReceivedMs != null
                    ? `No transaction alerts received in ${formatGap(now - lastReceivedMs)}`
                    : "No transaction alerts yet today"
                  : "All sent"}
              </span>
            ) : null}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
          <MiniStat label="Enrolled customers" value={metrics.enrolledCustomers} />
          <MiniStat label="Linked accounts" value={metrics.linkedAccounts} />
          <MiniStat label="WhatsApp enabled" value={metrics.whatsappEnabledCustomers} />
          <MiniStat label="Daily summaries" value={metrics.dailySummariesToday} />
        </div>
      </div>
      <div aria-hidden className="mt-6 flex h-7 overflow-hidden rounded-[3px] bg-line/60">
          {total > 0 ? (
            <>
              {sent > 0 ? (
                <span
                  className="h-full origin-bottom bg-brand motion-safe:animate-[meter-in_0.45s_ease-out_both]"
                  style={{ width: `${(sent / total) * 100}%` }}
                />
              ) : null}
              {queued > 0 ? (
                <span
                  className="h-full origin-bottom bg-signal motion-safe:animate-[meter-in_0.45s_ease-out_both]"
                  style={{ width: `${(queued / total) * 100}%`, animationDelay: "90ms" }}
                />
              ) : null}
              {failed > 0 ? (
                <span
                  className="h-full origin-bottom bg-danger motion-safe:animate-[meter-in_0.45s_ease-out_both]"
                  style={{ width: `${(failed / total) * 100}%`, animationDelay: "180ms" }}
                />
              ) : null}
            </>
          ) : null}
        </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5">
        <p className="font-mono text-xs text-mute">
          {total > 0
            ? `${Math.round((sent / total) * 100)}% of ${formatCount(total)} transaction alerts sent today`
            : metrics.lastAlertReceivedAt
              ? `Last alert received ${formatDate(metrics.lastAlertReceivedAt)}`
              : "No transaction alerts yet today"}
        </p>
        <p className="text-xs text-mute">
          Sent — handed to WhatsApp · Queued — waiting · Failed — rejected
        </p>
      </div>
    </Card>
  );
}

export function OverviewData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const stale = metrics !== null && now - Date.parse(metrics.generatedAt) > 120_000;

  useEffect(() => {
    let cancelled = false;
    api<DashboardMetrics>("/api/dashboard/metrics")
      .then((m) => {
        if (!cancelled) setMetrics(m);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load metrics");
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let disposed = false;
    const id = setInterval(() => {
      if (disposed || document.hidden) return;
      api<DashboardMetrics>("/api/dashboard/metrics")
        .then((m) => {
          if (!disposed) setMetrics(m);
        })
        .catch(() => {});
    }, 45_000);
    return () => {
      disposed = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <p className="sr-only" role="status" aria-live="polite">
        {error
          ? "Metrics failed to load."
          : metrics
            ? `Metrics updated · ${formatCount(metrics.alertsSentToday)} sent today.`
            : "Loading metrics."}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-sm text-mute">{metrics?.bank?.name}</p>
        </div>
        {metrics ? (
          <div className="flex items-center gap-3">
            <p
              suppressHydrationWarning
              className={`text-xs ${
                stale ? "font-medium text-warn" : "text-mute"
              }`}
            >
              {stale ? "stale · " : ""}updated {formatUpdated(metrics.generatedAt, now)}
            </p>
            <button
              type="button"
              disabled={refreshing}
              aria-busy={refreshing}
              onClick={() => {
                setRefreshing(true);
                setError(null);
                setReloadKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshIcon className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        ) : null}
      </div>
      {error ? (
        <ErrorState
          title="Metrics failed to load"
          hint={error}
          onRetry={() => {
            setError(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : !metrics ? (
        <Spinner label="Loading metrics" />
      ) : (
        <>
      {metrics.failedAlertsToday > 0 ? (
        <FailureBand failed={metrics.failedAlertsToday} />
      ) : null}

      <SignalBar metrics={metrics} now={now} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <PanelHeader title="Recent delivery log" href="/notifications" led="whatsapp" />
          {metrics.recentDeliveryLog.length === 0 ? (
            <EmptyState title="No deliveries yet" hint="Sent alerts will show up here." />
          ) : (
            <ul className="divide-y divide-line">
              {metrics.recentDeliveryLog.map((n) => {
                const status = notificationStatusMap[n.status] ?? {
                  label: n.status,
                  tone: "mute" as const,
                };
return (
                  <li key={n.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/customers/${n.customerId}`}
                        title={n.customerName}
                        className="block truncate text-sm font-medium text-ink hover:text-brand"
                      >
                        {n.customerName}
                      </Link>
                      <p className="truncate font-mono text-xs text-mute">{n.recipient}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone="brand">{notificationTypeLabel[n.type] ?? n.type}</Badge>
                      <Link
                        href={`/notifications?status=${n.status}`}
                        aria-label={`View ${status.label} notifications`}
                      >
                        <StatusDot tone={status.tone} label={status.label} />
                      </Link>
                      <span className="w-24 text-right font-mono text-xs text-mute">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <PanelHeader title="Recent enrollments" href="/customers" />
          {metrics.recentEnrollments.length === 0 ? (
            <EmptyState title="No enrollments yet" hint="New sign-ups will appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {metrics.recentEnrollments.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-brand-soft/40"
                >
                  <Link href={`/customers/${c.id}`} title={c.fullName} className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink group-hover:text-brand">
                      {c.fullName}
                    </p>
                    {c.whatsappPhone ? (
                      <p className="font-mono text-xs text-mute">{c.whatsappPhone}</p>
                    ) : null}
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={serviceStatusMap[c.serviceStatus]?.tone ?? "mute"}>
                      {serviceStatusMap[c.serviceStatus]?.label ?? c.serviceStatus}
                    </Badge>
                    <span className="w-24 text-right font-mono text-xs text-mute">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      </>
      )}
    </div>
  );
}