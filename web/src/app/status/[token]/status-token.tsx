"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { Spinner } from "@/components/ui";
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
      className: "bg-ok-soft text-ok",
    };
  }
  if (key === "withdrawn") {
    return {
      label: consentStatusLabel.withdrawn,
      className: "bg-danger-soft text-danger",
    };
  }
  const service = serviceStatusMap[key];
  if (service) {
    const tones: Record<string, string> = {
      ok: "bg-ok-soft text-ok",
      whatsapp: "bg-ok-soft text-ok",
      warn: "bg-warn-soft text-warn",
      danger: "bg-danger-soft text-danger",
      mute: "bg-canvas text-mute",
    };
    return { label: service.label, className: tones[service.tone] };
  }
  return { label: fallback, className: "bg-canvas text-mute" };
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
    <div className="flex min-h-dvh flex-col bg-reed font-sans">
      <header className="border-b border-line bg-paper px-6 py-4">
        <div className="mx-auto flex w-full max-w-md items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/octave-logo.png" alt="Octave Chime" className="h-7 w-auto object-contain" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Octave Chime
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-12">
        {phase === "loading" && <Spinner label="Loading your status" />}

        {phase === "ready" && error && (
          <section className="rounded-[3px] border border-line bg-paper p-6 text-center">
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{error.message}</h1>
            <p className="mt-2 text-sm text-mute">
              Return to WhatsApp and start again if you need a fresh link.
            </p>
          </section>
        )}

        {phase === "ready" && !error && context && (
          <section className="rounded-[3px] border border-line bg-paper p-6">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Account status</h1>
              {context.bank?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={context.bank.logoUrl}
                  alt=""
                  className="h-8 w-8 rounded-[3px] object-contain"
                />
              )}
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Bank</dt>
                <dd className="font-medium text-ink">
                  {context.bank?.name ?? "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Name</dt>
                <dd className="font-medium text-ink">
                  {context.customer.fullName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">WhatsApp</dt>
                <dd className="font-medium text-ink">
                  {context.customer.phoneMasked ?? "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Linked account</dt>
                <dd className="font-medium text-ink">
                  {context.account ? (
                    <span>
                      {context.account.accountName}, ending{" "}
                      {tail(context.account.accountNumberMasked)}
                    </span>
                  ) : (
                    <span className="text-mute">None yet</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Enrollment</dt>
                <dd>
                  <span className="rounded-[3px] bg-canvas px-2 py-0.5 text-xs font-medium text-ink">
                    {enrollmentStatusLabel[context.customer.enrollmentStatus] ??
                      context.customer.enrollmentStatus}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Consent</dt>
                <dd>
                  {(() => {
                    const pill = statusPill(context.customer.consentStatus, "Unknown");
                    return pill ? (
                      <span
                        className={`rounded-[3px] px-2 py-0.5 text-xs font-medium ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    ) : null;
                  })()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Service</dt>
                <dd>
                  {(() => {
                    const pill = statusPill(context.customer.serviceStatus, "Unknown");
                    return pill ? (
                      <span
                        className={`rounded-[3px] px-2 py-0.5 text-xs font-medium ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    ) : null;
                  })()}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-1.5 text-sm text-mute">
              <p>
                WhatsApp alerts:{" "}
                <span
                  className={context.customer.whatsappAlertsEnabled ? "font-medium text-ok" : "font-medium text-mute"}
                >
                  {context.customer.whatsappAlertsEnabled ? "On" : "Off"}
                </span>
              </p>
              <p>
                Daily summaries:{" "}
                <span
                  className={context.customer.dailySummaryEnabled ? "font-medium text-ok" : "font-medium text-mute"}
                >
                  {context.customer.dailySummaryEnabled ? "On" : "Off"}
                </span>
              </p>
            </div>

            <button
              onClick={() => setPhase("confirmed")}
              className="mt-6 h-11 w-full rounded-[3px] bg-brand text-sm font-medium text-paper transition-colors hover:bg-brand-strong active:translate-y-px"
            >
              Everything looks right
            </button>
          </section>
        )}

        {phase === "confirmed" && (
          <section className="rounded-[3px] border border-ok/30 bg-paper p-6 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[3px] bg-ok-soft text-ok">
              <CheckIcon className="h-5 w-5" />
            </div>
            <h1 className="mt-3 font-display text-xl font-semibold tracking-tight text-ok">All set</h1>
            <p className="mt-1 text-sm text-mute">
              Your alerts and daily summary preferences are saved exactly as
              shown. You can close this page.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}