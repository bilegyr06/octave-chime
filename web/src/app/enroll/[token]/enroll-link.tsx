"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Connect from "@mono.co/connect.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MONO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY ?? "";

interface DemoAccount {
  institutionName: string;
  accountName: string;
  accountNumber: string;
  balance: number;
}

interface EnrollContext {
  valid: boolean;
  mode: "enroll" | "reconsent" | "relink";
  expiresAt: string;
  customer: { id: string; fullName: string; phoneMasked: string | null };
  bank: { id: string; name: string; logoUrl: string | null } | null;
  mono: {
    mode: "off" | "sandbox" | "live";
    demoAccount: DemoAccount | null;
  };
}

interface LinkResult {
  linkedAccount: {
    accountName: string;
    accountNumberMasked: string;
    currency: string;
    currentBalance: number;
    provider: string;
  };
  serviceStatus: string;
  mode: string;
}

type Phase = "loading" | "ready" | "success";
type LoadError = { code: string; message: string } | null;

interface ConsentResponse {
  confirmed: true;
  needsLink: boolean;
  serviceStatus: string;
}

function exchange(
  token: string,
  code: string,
): Promise<{ data?: LinkResult; error?: string; message?: string; status: number }> {
  return fetch(`${API_URL}/api/mono/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, code }),
  }).then(async (res) => {
    const body = (await res.json()) as Partial<LinkResult> & {
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      return { error: body.error, message: body.message, status: res.status };
    }
    return { data: body as LinkResult, status: res.status };
  });
}

export function EnrollLink() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [phase, setPhase] = useState<Phase>("loading");
  const [context, setContext] = useState<EnrollContext | null>(null);
  const [loadError, setLoadError] = useState<LoadError>(null);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [consentDone, setConsentDone] = useState(false);
  const [consenting, setConsenting] = useState(false);

  const connectRef = useRef<Connect | null>(null);

  const completeLink = useCallback(
    async (code: string) => {
      setLinking(true);
      setLinkError(null);
      const res = await exchange(token, code);
      if (res.error || !res.data) {
        const message =
          res.status === 502
            ? "We could not reach the provider. Please try again."
            : res.message ?? "Account linking failed. Please try again.";
        setLinkError(message);
        setLinking(false);
        return;
      }
      setResult(res.data);
      setPhase("success");
    },
    [token],
  );

  const confirmConsent = useCallback(async () => {
    setConsenting(true);
    setLinkError(null);
    try {
      const res = await fetch(`${API_URL}/api/enroll/${encodeURIComponent(token)}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const body = (await res.json()) as ConsentResponse & { error?: string; message?: string };
      if (!res.ok) {
        setLinkError(body.message ?? "Consent could not be confirmed. Please try again.");
        setConsenting(false);
        return;
      }
      if (body.needsLink) {
        setConsentConfirmed(true);
        setConsenting(false);
        return;
      }
      setConsentDone(true);
      setPhase("success");
    } catch {
      setLinkError("Consent could not be confirmed. Please try again.");
      setConsenting(false);
    }
  }, [token]);

  const handleLinkClick = useCallback(() => {
    if (!context) return;
    if (context.mono.mode === "off" && context.mono.demoAccount) {
      void completeLink(`demo://${context.mono.demoAccount.accountNumber}`);
      return;
    }
    if (!MONO_PUBLIC_KEY) {
      setLinkError("Account linking is not configured for this environment.");
      return;
    }
    connectRef.current?.close();
    const connect = new Connect({
      key: MONO_PUBLIC_KEY,
      scope: "auth",
      reference: token,
      onSuccess: ({ code }) => {
        if (code) void completeLink(code);
      },
      onClose: () => setLinking(false),
    });
    connectRef.current = connect;
    connect.setup();
    connect.open();
    setLinking(true);
  }, [context, token, completeLink]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/enroll/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
          };
          throw { status: res.status, code: body.error, message: body.message };
        }
        return (await res.json()) as EnrollContext;
      })
      .then((ctx) => {
        if (cancelled) return;
        if (!ctx.valid) {
          setLoadError({ code: "link_invalid", message: "This link is not valid." });
          setPhase("ready");
          return;
        }
        setContext(ctx);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { status?: number; code?: string; message?: string };
        const expired = e.status === 410 || e.status === 404;
        setLoadError({
          code: e.code ?? "link_error",
          message: expired
            ? "This link has expired or already been used."
            : e.message ?? "Something went wrong loading this link.",
        });
        setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const linked = context?.mono.demoAccount ?? null;
  const last4 = (accountNumber: string) => accountNumber.slice(-4);

  return (
    <div className="flex min-h-full flex-col bg-reed font-sans">
      <header className="border-b border-line bg-paper px-6 py-5">
        <span className="text-sm font-semibold text-ink">
          Octave&nbsp;Chime
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-12">
        {phase === "loading" && <p className="text-mute">Loading…</p>}

        {phase === "ready" &&
          context &&
          !loadError &&
          context.mode === "reconsent" &&
          !consentConfirmed && (
            <section className="rounded-[12px] border border-line bg-paper p-6 ">
              <h1 className="text-lg font-semibold text-ink">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-mute">
                To reactivate WhatsApp alerts, please confirm your consent:
              </p>
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-mute">
                <li>
                  You agree to receive transaction alerts and daily balance
                  summaries on WhatsApp.
                </li>
                <li>
                  Sensitive credentials must never be shared on WhatsApp.
                </li>
                <li>
                  Account linking happens on a secure web page, never inside
                  WhatsApp.
                </li>
              </ol>
              {linkError && (
                <p className="mt-4 rounded-[3px] bg-danger-soft px-3 py-2 text-sm text-danger">
                  {linkError}
                </p>
              )}
              <button
                onClick={() => void confirmConsent()}
                disabled={consenting}
                className="mt-6 h-11 w-full rounded-[3px] bg-brand text-sm font-medium text-paper transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {consenting ? "Confirming…" : "Confirm consent"}
              </button>
            </section>
          )}

        {phase === "ready" &&
          context &&
          !loadError &&
          !(context.mode === "reconsent" && !consentConfirmed) && (
            <section className="rounded-[12px] border border-line bg-paper p-6 ">
              <h1 className="text-lg font-semibold text-ink">
                {context.mode === "relink"
                  ? "Re-link your account"
                  : "Link your account"}
              </h1>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Bank</dt>
                <dd className="font-medium text-ink">
                  {context.bank?.name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Name</dt>
                <dd className="font-medium text-ink">
                  {context.customer.fullName}
                </dd>
              </div>
              {context.customer.phoneMasked && (
                <div className="flex justify-between gap-4">
                  <dt className="text-mute">WhatsApp</dt>
                  <dd className="font-medium text-ink">
                    {context.customer.phoneMasked}
                  </dd>
                </div>
              )}
            </dl>

            {context.mono.mode === "off" ? (
              linked ? (
                <div className="mt-6 rounded-[10px] border border-line bg-reed p-4">
                  <p className="text-xs text-mute">Demo account</p>
                  <p className="mt-1 font-medium text-ink">
                    {linked.institutionName}, {linked.accountName}
                  </p>
                  <p className="text-sm text-mute">
                    Account ending {last4(linked.accountNumber)}, balance NGN{" "}
                    {linked.balance.toLocaleString("en-NG")}
                  </p>
                </div>
              ) : (
                <p className="mt-6 text-sm text-mute">
                  No demo account is mapped to this bank.
                </p>
              )
            ) : (
              <p className="mt-4 text-sm text-mute">
                Linking runs through Mono Connect. You will be redirected to
                your bank&apos;s secure sandbox login.
              </p>
            )}

            {linkError && (
              <p className="mt-4 rounded-[3px] bg-danger-soft px-3 py-2 text-sm text-danger">
                {linkError}
              </p>
            )}

            <button
              onClick={handleLinkClick}
              disabled={linking}
              className="mt-6 h-11 w-full rounded-[3px] bg-brand text-sm font-medium text-paper transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {linking
                ? "Linking…"
                : context.mono.mode === "off"
                  ? "Link this demo account"
                  : "Link my bank account"}
            </button>
          </section>
        )}

        {phase === "ready" && loadError && (
          <section className="rounded-[12px] border border-line bg-paper p-6 text-center ">
            <h1 className="text-lg font-semibold text-ink">
              {loadError.message}
            </h1>
            <p className="mt-2 text-sm text-mute">
              Return to WhatsApp and start again if you need a fresh link.
            </p>
          </section>
        )}

        {phase === "success" && consentDone && (
          <section className="rounded-[12px] border border-ok/30 bg-paper p-6 ">
            <h1 className="text-lg font-semibold text-ok">
              Consent confirmed
            </h1>
            <p className="mt-1 text-sm text-mute">
              Your consent has been recorded and your WhatsApp transaction
              alerts and daily summaries are active again.
            </p>
            <p className="mt-4 text-sm text-mute">
              You can now close this page. A confirmation has been sent to you
              on WhatsApp.
            </p>
          </section>
        )}

        {phase === "success" && result && (
          <section className="rounded-[12px] border border-ok/30 bg-paper p-6 ">
            <h1 className="text-lg font-semibold text-ok">
              Account linked
            </h1>
            <p className="mt-1 text-sm text-mute">
              {result.linkedAccount.accountName} ending{" "}
              {result.linkedAccount.accountNumberMasked.replace(/^\*+/, "")} is
              now connected.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Balance</dt>
                <dd className="font-medium text-ink">
                  NGN{" "}
                  {result.linkedAccount.currentBalance.toLocaleString("en-NG")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mute">Status</dt>
                <dd className="font-medium text-ok">Active</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-mute">
              You can now close this page. Your WhatsApp alerts are active and a
              confirmation has been sent to you.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}