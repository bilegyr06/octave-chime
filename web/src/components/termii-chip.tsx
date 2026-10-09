"use client";

import { useEffect, useState } from "react";

export function TermiiChip() {
  const [mode, setMode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled && body?.termiiMode) setMode(body.termiiMode);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mode) return null;
  const live = mode === "live";

  return (
    <span
      title="Delivery adapter mode"
      className="inline-flex items-center gap-2 rounded-[3px] border border-line bg-paper px-2.5 py-1 text-xs font-medium text-mute"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-whatsapp" : "bg-line-strong"}`} />
      {mode}
    </span>
  );
}