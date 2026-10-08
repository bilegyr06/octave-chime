import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getBankProfile, getSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getSession();
  if (!admin) redirect("/login");

  const tenant = await getBankProfile(admin.bankId);

  return (
    <DashboardShell admin={admin} tenant={tenant?.name ? tenant : undefined}>
      {children}
    </DashboardShell>
  );
}