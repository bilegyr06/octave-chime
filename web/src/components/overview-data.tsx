"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  notificationStatusMap,
  notificationTypeLabel,
  serviceStatusMap,
} from "@/lib/status";
import { Badge, Card, EmptyState, ErrorState, Spinner, StatTile } from "./ui";
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

function PanelHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
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

export function OverviewData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setMetrics(null);
    api<DashboardMetrics>("/api/dashboard/metrics")
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load metrics"));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return <ErrorState title="Metrics failed to load" hint={error} onRetry={load} />;
  }
  if (!metrics) {
    return <Spinner label="Loading metrics" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Overview</h1>
          <p className="mt-1 text-sm text-mute">
            {metrics.bank?.name ?? "Platform"} · WhatsApp transaction alerts
          </p>
        </div>
        <p className="font-mono text-xs text-mute">
          updated {formatDate(metrics.generatedAt)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Enrolled customers" value={metrics.enrolledCustomers} sub="completed enrollment" />
        <StatTile label="Linked accounts" value={metrics.linkedAccounts} sub="active bank connections" />
        <StatTile
          label="WhatsApp-enabled"
          value={metrics.whatsappEnabledCustomers}
          sub="alerts switched on"
        />
        <StatTile label="Alerts sent today" value={metrics.alertsSentToday} sub="transaction alerts" />
        <StatTile
          label="Failed alerts today"
          value={metrics.failedAlertsToday}
          sub="delivery errors"
          emphasis={metrics.failedAlertsToday > 0 ? "danger" : "neutral"}
        />
        <StatTile label="Daily summaries sent" value={metrics.dailySummariesToday} sub="end-of-day briefing" />
      </div>

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