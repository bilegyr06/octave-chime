"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  consentStatusLabel,
  enrollmentStatusLabel,
  serviceStatusMap,
} from "@/lib/status";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface StatusContext {
  valid: boolean;
  mode: "enroll" | "reconsent" | "relink";
  expiresAt: string;
  customer: {
    id: string;
    fullName: string;
    phoneMasked: string | null;
    consentStatus: string;
    serviceStatus: string;
    enrollmentStatus: string;
    whatsappAlertsEnabled: boolean;
    dailySummaryEnabled: boolean;
  };
  bank: { id: string; name: string; logoUrl: string | null } | null;
  account: {
    provider: string;
    accountName: string;
    accountNumberMasked: string;
    currency: string;
    status: string;
  } | null;
}

type Phase = "loading" | "ready" | "confirmed";

function statusPill(key: string, fallback: string): {
  label: string;
  className: string;
} | null {
  if (key === "granted") {
    return {
      label: consentStatusLabel.granted,
      className: "bg-emerald-100 text-emerald-800",
    };
  }
  if (key === "withdrawn") {
    return {
      label: consentStatusLabel.withdrawn,
      className: "bg-red-100 text-red-700",
    };
  }
  const service = serviceStatusMap[key];
  if (service) {
    const tones: Record<string, string> = {
      ok: "bg-emerald-100 text-emerald-800",
      whatsapp: "bg-emerald-100 text-emerald-800",
      warn: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-700",
      mute: "bg-zinc-100 text-zinc-600",
    };
    return { label: service.label, className: tones[service.tone] };
  }
  return { label: fallback, className: "bg-zinc-100 text-zinc-600" };
}

export function StatusToken() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [phase, setPhase] = useState<Phase>("loading");
  const [context, setContext] = useState<StatusContext | null>(null);
  const [error, setError] = useState<{ message: string; expired: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/enroll/${encodeURIComponent(token)}/status`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as StatusContext & {
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          throw {
            status: res.status,
            code: body.error,
            message: body.message,
          };
        }
        return body;
      })
      .then((ctx) => {
        if (cancelled) return;
        if (!ctx.valid) {
          setError({ message: "This link is not valid.", expired: false });
          setPhase("ready");
          return;
        }
        setContext(ctx);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { status?: number; message?: string };
        const expired = e.status === 410 || e.status === 404;
        setError({
          message: expired
            ? "This link has expired or already been used."
            : e.message ?? "Something went wrong loading this page.",
          expired,
        });
        setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tail = (accountNumber: string) => accountNumber.replace(/^\*+/, "").slice(-4);

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans">
      <header className="border-b border-zinc-200 bg-white px-6 py-5">
        <span className="text-sm font-semibold text-zinc-900">
          Octave&nbsp;Chime
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-12">
        {phase === "loading" && <p className="text-zinc-500">Loading…</p>}

        {phase === "ready" && error && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">{error.message}</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Return to WhatsApp and start again if you need a fresh link.
            </p>
          </section>
        )}

        {phase === "ready" && !error && context && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-zinc-900">Account status</h1>
              {context.bank?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={context.bank.logoUrl}
                  alt=""
                  className="h-8 w-8 rounded-md object-contain"
                />
              )}
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Bank</dt>
                <dd className="font-medium text-zinc-900">
                  {context.bank?.name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Name</dt>
                <dd className="font-medium text-zinc-900">
                  {context.customer.fullName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">WhatsApp</dt>
                <dd className="font-medium text-zinc-900">
                  {context.customer.phoneMasked ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Linked account</dt>
                <dd className="font-medium text-zinc-900">
                  {context.account ? (
                    <span>
                      {context.account.accountName} · ending{" "}
                      {tail(context.account.accountNumberMasked)}
                    </span>
                  ) : (
                    <span className="text-zinc-500">None yet</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Enrollment</dt>
                <dd>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {enrollmentStatusLabel[context.customer.enrollmentStatus] ??
                      context.customer.enrollmentStatus}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Consent</dt>
                <dd>
                  {(() => {
                    const pill = statusPill(context.customer.consentStatus, "Unknown");
                    return pill ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    ) : null;
                  })()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Service</dt>
                <dd>
                  {(() => {
                    const pill = statusPill(context.customer.serviceStatus, "Unknown");
                    return pill ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    ) : null;
                  })()}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-1.5 text-sm text-zinc-600">
              <p>
                WhatsApp alerts:{" "}
                <span
                  className={context.customer.whatsappAlertsEnabled ? "font-medium text-emerald-700" : "font-medium text-zinc-500"}
                >
                  {context.customer.whatsappAlertsEnabled ? "On" : "Off"}
                </span>
              </p>
              <p>
                Daily summaries:{" "}
                <span
                  className={context.customer.dailySummaryEnabled ? "font-medium text-emerald-700" : "font-medium text-zinc-500"}
                >
                  {context.customer.dailySummaryEnabled ? "On" : "Off"}
                </span>
              </p>
            </div>

            <button
              onClick={() => setPhase("confirmed")}
              className="mt-6 h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Everything looks right
            </button>
          </section>
        )}

        {phase === "confirmed" && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-emerald-700">All set</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Your alerts and daily summary preferences are saved exactly as
              shown. You can close this page.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}