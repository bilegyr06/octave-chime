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
  tone?: "mute" | "brand" | "danger" | "warn" | "ok" | "whatsapp";
}) {
  const map = {
    mute: "bg-line/60 text-mute",
    brand: "bg-brand-soft text-brand",
    danger: "bg-danger-soft text-danger",
    warn: "bg-warn-soft text-warn",
    ok: "bg-ok-soft text-brand",
    whatsapp: "bg-whatsapp/15 text-[#0b7a3d]",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  emphasis = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  emphasis?: "neutral" | "danger" | "brand";
}) {
  const valueClass =
    emphasis === "danger" ? "text-danger" : emphasis === "brand" ? "text-brand" : "text-ink";
  return (
    <Card className="p-5">
      <p className="text-sm text-mute">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-medium tracking-tight tabular ${valueClass}`}>
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-xs text-mute">{sub}</p> : null}
    </Card>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3">
      <p className="text-xs text-mute">
        {total} total · {from}–{to}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="text-xs text-mute">
          Page <span className="font-mono">{page}</span> of <span className="font-mono">{pages}</span>
        </span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}