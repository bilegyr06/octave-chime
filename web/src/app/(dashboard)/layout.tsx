import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getBankProfile, safeGetSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await safeGetSession();
  if (session.status === "expired") redirect("/login");
  // A transient service blip must not look like a logout - let the segment's
  // error boundary (error.tsx) render a retryable tile instead.
  if (session.status === "unreachable") throw new Error("service_unreachable");
  const admin = session.admin!;

  const tenant = await getBankProfile(admin.bankId);

  return (
    <DashboardShell admin={admin} tenant={tenant?.name ? tenant : undefined}>
      {children}
    </DashboardShell>
  );
}