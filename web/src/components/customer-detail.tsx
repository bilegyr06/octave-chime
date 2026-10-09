"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate, initials, money } from "@/lib/format";
import {
  consentStatusLabel,
  enrollmentStatusLabel,
  notificationStatusMap,
  notificationTypeLabel,
  serviceStatusMap,
  serviceStatusTone,
} from "@/lib/status";
import { Badge, Card, EmptyState, ErrorState, Spinner } from "@/components/ui";

interface CustomerDetail {
  id: string;
  bankId: string;
  bankName: string;
  fullName: string;
  email: string | null;
  whatsappPhone: string | null;
  consentStatus: string;
  enrollmentStatus: string;
  serviceStatus: string;
  whatsappAlertsEnabled: boolean;
  dailySummaryEnabled: boolean;
  preferredSummaryTime: string;
  createdAt: string;
  linkedAccounts: {
    id: string;
    provider: string;
    accountName: string;
    accountNumberMasked: string;
    accountType: string;
    currency: string;
    currentBalance: string;
    status: string;
    linkedAt: string;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: string;
    currency: string;
    balanceAfter: string;
    narration: string | null;
    reference: string;
    transactionDate: string;
  }[];
  recentNotifications: {
    id: string;
    type: string;
    status: string;
    recipient: string;
    createdAt: string;
  }[];
}

export function CustomerDetail({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<CustomerDetail>(`/api/customers/${id}`)
      .then((d) => {
        if (cancelled) return;
        setCustomer(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load customer");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  if (loading) return <Spinner label="Loading customer" />;
  if (error) return <ErrorState title="Customer failed to load" hint={error} onRetry={retry} />;
  if (!customer) return null;

  const status = serviceStatusMap[customer.serviceStatus] ?? { label: customer.serviceStatus };

  return (
    <div className="space-y-5">
      <Link href="/customers" className="text-sm font-medium text-brand hover:text-brand-strong">
        ← Customers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft font-mono text-sm font-medium text-brand">
            {initials(customer.fullName)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">{customer.fullName}</h1>
            <p className="mt-0.5 text-sm text-mute">
              {customer.bankName} · {customer.whatsappPhone ?? customer.email ?? "No contact"}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tone={serviceStatusTone(customer.serviceStatus)}>{status.label}</Badge>
              <Badge tone={enrollmentStatusLabel[customer.enrollmentStatus] === "Enrolled" ? "brand" : "mute"}>
                {enrollmentStatusLabel[customer.enrollmentStatus] ?? customer.enrollmentStatus}
              </Badge>
              <Badge tone={customer.consentStatus === "granted" ? "ok" : "danger"}>
                {consentStatusLabel[customer.consentStatus] ?? customer.consentStatus}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-mute">Customer since {formatDate(customer.createdAt)}</p>
      </div>

      <Card>
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Alert preferences</h2>
        </div>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span>
              <span className="block text-sm font-medium text-ink">WhatsApp alerts</span>
              <span className="block text-xs text-mute">Transaction alerts to this customer</span>
            </span>
            <Badge tone={customer.whatsappAlertsEnabled ? "ok" : "mute"}>
              {customer.whatsappAlertsEnabled ? "On" : "Off"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span>
              <span className="block text-sm font-medium text-ink">Daily summary</span>
              <span className="block text-xs text-mute">End-of-day balance briefing</span>
            </span>
            <Badge tone={customer.dailySummaryEnabled ? "ok" : "mute"}>
              {customer.dailySummaryEnabled ? "On" : "Off"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span>
              <span className="block text-sm font-medium text-ink">Summary time</span>
              <span className="block text-xs text-mute">Local time the briefing is sent</span>
            </span>
            <span className="font-mono text-sm text-ink">{customer.preferredSummaryTime}</span>
          </div>
          <p className="px-5 py-3 text-xs text-mute">
            These are set by the customer through the WhatsApp bot. To pause alerts
            for everyone at this bank, use the bank settings.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Linked accounts</h2>
          <span className="text-xs text-mute">
            {customer.linkedAccounts.length} of 5 shown
          </span>
        </div>
        {customer.linkedAccounts.length === 0 ? (
          <EmptyState
            title="No linked accounts"
            hint="Once the customer completes the bank's enrollment link on WhatsApp, their account appears here."
          />
        ) : (
          <div className="divide-y divide-line">
            <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium uppercase text-mute sm:grid sm:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.6fr]">
              <span>Account</span>
              <span>Account number</span>
              <span>Type</span>
              <span className="text-right">Balance</span>
              <span>Status</span>
            </div>
            {customer.linkedAccounts.map((a) => (
              <div
                key={a.id}
                className="grid items-center gap-4 px-5 py-3 sm:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.6fr]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{a.accountName}</span>
                  <span className="block text-xs text-mute">
                    {a.provider} · linked {formatDate(a.linkedAt)}
                  </span>
                </span>
                <span className="font-mono text-sm text-ink">{a.accountNumberMasked}</span>
                <span className="text-sm text-ink">{a.accountType}</span>
                <span className="text-right font-mono text-sm tabular text-ink">
                  {money(Number(a.currentBalance), a.currency)}
                </span>
                <Badge tone={a.status === "active" ? "ok" : a.status === "revoked" ? "danger" : "mute"}>
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Recent transactions</h2>
        </div>
        {customer.recentTransactions.length === 0 ? (
          <EmptyState title="No recent transactions" hint="Transactions appear once the bank sends them." />
        ) : (
          <div className="divide-y divide-line">
            <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium uppercase text-mute sm:grid sm:grid-cols-[1.4fr_2fr_0.9fr_0.9fr]">
              <span>Date</span>
              <span>Narration</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Balance</span>
            </div>
            {customer.recentTransactions.map((t) => (
              <div
                key={t.id}
                className="grid items-center gap-4 px-5 py-3 sm:grid-cols-[1.4fr_2fr_0.9fr_0.9fr]"
              >
                <span className="text-xs text-mute">{formatDate(t.transactionDate)}</span>
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
                  {money(Number(t.amount), t.currency)}
                </span>
                <span className="text-right font-mono text-sm tabular text-mute">
                  {money(Number(t.balanceAfter), t.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Recent notifications</h2>
        </div>
        {customer.recentNotifications.length === 0 ? (
          <EmptyState title="No notifications yet" />
        ) : (
          <div className="divide-y divide-line">
            {customer.recentNotifications.map((n) => {
              const note = notificationStatusMap[n.status];
              return (
                <div key={n.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Badge tone="brand">{notificationTypeLabel[n.type] ?? n.type}</Badge>
                    <span className="truncate text-sm text-ink">{n.recipient}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-medium text-ink ${
                        note?.tone === "whatsapp" ? "text-[#0b7a3d]" : ""
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          note?.tone === "whatsapp"
                            ? "bg-whatsapp"
                            : note?.tone === "danger"
                              ? "bg-danger"
                              : note?.tone === "warn"
                                ? "bg-warn"
                                : "bg-line-strong"
                        }`}
                      />
                      {note?.label ?? n.status}
                    </span>
                    <span className="hidden text-xs text-mute sm:block">
                      {formatDate(n.createdAt)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}