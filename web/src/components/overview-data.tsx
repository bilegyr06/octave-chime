"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  notificationStatusMap,
  notificationTypeLabel,
  serviceStatusMap,
} from "@/lib/status";
import { Badge, Card, EmptyState, ErrorState, Led, Spinner } from "./ui";
import { ChevronRightIcon } from "./icons";

interface RecentEnrollment {
  id: string;
  fullName: string;
  whatsappPhone: string | null;
  serviceStatus: string;
  createdAt: string;
}

interface DeliveryRow {
  id: string;
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
  failedAlertsToday: number;
  dailySummariesToday: number;
  recentEnrollments: RecentEnrollment[];
  recentDeliveryLog: DeliveryRow[];
  generatedAt: string;
}

function PanelHeader({ title, href, led = "brand" }: { title: string; href?: string; led?: "brand" | "signal" | "danger" }) {
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
        {value}
      </p>
    </div>
  );
}

function SignalBar({ metrics }: { metrics: DashboardMetrics }) {
  const attempts = metrics.alertsSentToday + metrics.failedAlertsToday;
  const rate = attempts > 0 ? metrics.alertsSentToday / attempts : 0;
  const filled = attempts > 0 ? Math.max(1, Math.min(8, Math.round(rate * 8))) : 0;
  const liveEdge = attempts > 0 && metrics.failedAlertsToday > 0;
  return (
    <Card className="px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <p className="flex items-center gap-2 text-sm text-mute">
            <Led tone={metrics.failedAlertsToday > 0 ? "danger" : "whatsapp"} />
            Alerts delivered today
          </p>
          <p className="mt-1 font-display text-[44px] font-semibold leading-none tracking-tight tabular text-ink">
            {metrics.alertsSentToday}
          </p>
          <p className="mt-2 text-sm text-mute">
            {attempts === 0
              ? "Nothing sent yet today"
              : metrics.failedAlertsToday > 0
                ? `${metrics.failedAlertsToday} failed to send`
                : "All delivering clean"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
          <MiniStat label="Enrolled customers" value={metrics.enrolledCustomers} />
          <MiniStat label="Linked accounts" value={metrics.linkedAccounts} />
          <MiniStat label="WhatsApp enabled" value={metrics.whatsappEnabledCustomers} />
          <MiniStat label="Daily summaries" value={metrics.dailySummariesToday} />
        </div>
      </div>
      <div
        aria-hidden
        className="mt-6 flex items-end gap-1"
      >
        {Array.from({ length: 8 }, (_, i) => i < filled).map((on, i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 45}ms` }}
            className={`h-7 flex-1 origin-bottom rounded-[2px] motion-safe:animate-[meter-in_0.45s_ease-out_both] ${
              on ? (liveEdge && i === filled - 1 ? "bg-signal" : "bg-brand") : "bg-line/60"
            }`}
          />
        ))}
      </div>
    </Card>
  );
}

export function OverviewData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<DashboardMetrics>("/api/dashboard/metrics")
      .then((m) => {
        if (!cancelled) setMetrics(m);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load metrics");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <ErrorState
        title="Metrics failed to load"
        hint={error}
        onRetry={() => {
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }
  if (!metrics) {
    return <Spinner label="Loading metrics" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-sm text-mute">{metrics.bank?.name ?? "Platform"}</p>
        </div>
        <p className="text-xs text-mute">updated {formatDate(metrics.generatedAt)}</p>
      </div>

      <SignalBar metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <PanelHeader title="Recent enrollments" href="/customers" />
          {metrics.recentEnrollments.length === 0 ? (
            <EmptyState title="No enrollments yet" hint="New sign-ups will appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {metrics.recentEnrollments.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{c.fullName}</p>
                    {c.whatsappPhone ? (
                      <p className="font-mono text-xs text-mute">{c.whatsappPhone}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={serviceStatusMap[c.serviceStatus]?.tone ?? "mute"}>
                      {serviceStatusMap[c.serviceStatus]?.label ?? c.serviceStatus}
                    </Badge>
                    <span className="w-16 text-right font-mono text-xs text-mute">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <PanelHeader title="Recent delivery log" href="/notifications" />
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
                      <p className="truncate text-sm font-medium text-ink">{n.customerName}</p>
                      <p className="truncate font-mono text-xs text-mute">{n.recipient}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone="brand">{notificationTypeLabel[n.type] ?? n.type}</Badge>
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            { ok: "bg-ok", whatsapp: "bg-whatsapp", danger: "bg-danger", warn: "bg-warn", mute: "bg-line-strong" }[status.tone]
                          }`}
                        />
                        {status.label}
                      </span>
                      <span className="w-16 text-right font-mono text-xs text-mute">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}