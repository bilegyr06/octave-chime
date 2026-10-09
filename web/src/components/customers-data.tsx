"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  consentStatusLabel,
  enrollmentStatusLabel,
  serviceStatusMap,
  serviceStatusTone,
} from "@/lib/status";
import {
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Spinner,
  Badge,
  inputClass,
} from "@/components/ui";

interface CustomerRow {
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
  updatedAt: string;
}

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 10;
const SERVICE_FILTERS = ["", ...Object.keys(serviceStatusMap)];
const ENROLLMENT_FILTERS = ["", ...Object.keys(enrollmentStatusLabel)];

export function CustomersData() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
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
    if (serviceStatus) params.set("serviceStatus", serviceStatus);
    if (enrollmentStatus) params.set("enrollmentStatus", enrollmentStatus);

    api<PageResult<CustomerRow>>(`/api/customers?${params}`)
      .then((data) => {
        if (cancelled) return;
        setRows(data.items);
        setTotal(data.total);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load customers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedQ, serviceStatus, enrollmentStatus, reloadKey]);

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

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  const selectClass = `${inputClass} w-auto`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Customers</h1>
          <p className="mt-1 text-sm text-mute">
            Customers enroll themselves through the WhatsApp bot.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <input
            className={`${inputClass} max-w-xs`}
            placeholder="Search name, phone, email…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className={selectClass}
            value={serviceStatus}
            onChange={(e) => changeFilter(setServiceStatus)(e.target.value)}
          >
            <option value="">All service status</option>
            {SERVICE_FILTERS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {serviceStatusMap[s].label}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={enrollmentStatus}
            onChange={(e) => changeFilter(setEnrollmentStatus)(e.target.value)}
          >
            <option value="">All enrollment</option>
            {ENROLLMENT_FILTERS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {enrollmentStatusLabel[s]}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm text-mute">
            {!loading ? <span className="tabular">{total}</span> : "…"}
          </span>
        </div>

        {loading ? (
          <Spinner label="Loading customers" />
        ) : error ? (
          <ErrorState title="Customers failed to load" hint={error} onRetry={retry} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No customers found"
            hint={
              debouncedQ || serviceStatus || enrollmentStatus
                ? "Try adjusting the search or filters."
                : "Customers appear here once they enroll through the WhatsApp bot."
            }
          />
        ) : (
          <div className="divide-y divide-line">
            <div className="hidden items-center gap-4 px-5 py-2 text-xs font-medium text-mute sm:grid sm:grid-cols-[2fr_1fr_1fr_1.2fr_0.75fr]">
              <span>Customer</span>
              <span>Bank</span>
              <span>Status</span>
              <span>Alerts</span>
              <span className="text-right">Joined</span>
            </div>
            {rows.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="group grid gap-y-1 px-5 py-3 transition-colors hover:bg-brand-soft/40 sm:grid-cols-[2fr_1fr_1fr_1.2fr_0.75fr] sm:items-center sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink group-hover:text-brand">
                    {c.fullName}
                  </span>
                  <span className="block truncate text-xs text-mute">
                    {c.whatsappPhone ?? c.email ?? "No contact"}
                  </span>
                </span>
                <span className="truncate text-sm text-ink">{c.bankName}</span>
                <Badge tone={serviceStatusTone(c.serviceStatus)}>
                  {serviceStatusMap[c.serviceStatus]?.label ?? c.serviceStatus}
                </Badge>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      c.whatsappAlertsEnabled ? "text-ok" : ""
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        c.whatsappAlertsEnabled ? "bg-whatsapp" : "bg-line-strong"
                      }`}
                    />
                    WhatsApp {c.whatsappAlertsEnabled ? "on" : "off"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        c.dailySummaryEnabled ? "bg-whatsapp" : "bg-line-strong"
                      }`}
                    />
                    Summary {c.dailySummaryEnabled ? "on" : "off"}
                  </span>
                </span>
                <span className="text-right text-xs text-mute">{formatDate(c.createdAt)}</span>
              </Link>
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

export function consentLabel(status: string) {
  return consentStatusLabel[status] ?? status;
}

export function enrollmentLabel(status: string) {
  return enrollmentStatusLabel[status] ?? status;
}