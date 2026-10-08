import type { ReactNode } from "react";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-paper shadow-[0_1px_2px_rgba(19,32,38,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-ink">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
      <span className="text-sm text-mute">{label}…</span>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-mute">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({
  title,
  hint,
  onRetry,
}: {
  title: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-danger">{title}</p>
      {hint ? <p className="mt-1 text-sm text-mute">{hint}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:border-line-strong"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function StatusDot({
  tone,
  label,
}: {
  tone: "ok" | "whatsapp" | "danger" | "warn" | "mute";
  label: string;
}) {
  const toneClass: Record<string, string> = {
    ok: "bg-ok",
    whatsapp: "bg-whatsapp",
    danger: "bg-danger",
    warn: "bg-warn",
    mute: "bg-line-strong",
  };
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink">
      <span className={`h-2 w-2 rounded-full ${toneClass[tone]}`} />
      {label}
    </span>
  );
}

export function Badge({
  children,
  tone = "mute",
}: {
  children: ReactNode;
  tone?: "mute" | "brand" | "danger" | "warn" | "ok";
}) {
  const map = {
    mute: "bg-line/60 text-mute",
    brand: "bg-brand-soft text-brand",
    danger: "bg-danger-soft text-danger",
    warn: "bg-warn-soft text-warn",
    ok: "bg-ok-soft text-brand",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}