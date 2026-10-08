"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { LogOutIcon } from "./icons";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-mute hover:bg-canvas hover:text-ink disabled:opacity-60"
    >
      <LogOutIcon className="h-4 w-4" />
      Sign out
    </button>
  );
}