"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import type { BankProfile, SessionAdmin } from "@/lib/session";
import { primaryNav } from "./nav";
import { SignOutButton } from "./sign-out-button";
import { TermiiChip } from "./termii-chip";
import { CloseIcon, MenuIcon } from "./icons";

function isActive(pathname: string, href: string): boolean {
  return href === "/overview" ? pathname === href : pathname.startsWith(href);
}

function BrandLockup({ big = false }: { big?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${big ? "" : ""}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-mono text-sm font-medium text-paper">
        ⇄
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight text-ink">Octave Chime</p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-mute">Bank messenger</p>
      </div>
    </div>
  );
}

function TenantBlock({ admin, tenant }: { admin: SessionAdmin; tenant?: BankProfile }) {
  const name = tenant?.name ?? "Octave Chime";
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2.5">
      {tenant?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-soft font-mono text-xs font-medium text-brand">
          {initials(name)}
        </div>
      )}
      <div className="mt-2">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="text-xs text-mute">
          {admin.role === "platform_admin" ? "Platform workspace" : "Bank workspace"}
        </p>
      </div>
    </div>
  );
}

function SidebarContent({ admin, tenant }: { admin: SessionAdmin; tenant?: BankProfile }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <BrandLockup />
      </div>

      <div className="px-4">
        <TenantBlock admin={admin} tenant={tenant} />
      </div>

      <nav className="mt-5 flex-1 space-y-0.5 px-3" aria-label="Primary">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium ${
                active
                  ? "bg-brand text-paper"
                  : "text-ink hover:bg-paper"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-2.5 px-1.5 pb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-medium text-paper">
            {initials(admin.name)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-ink">{admin.name}</p>
            <p className="truncate text-xs text-mute">{admin.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}

export function DashboardShell({
  admin,
  tenant,
  children,
}: {
  admin: SessionAdmin;
  tenant?: BankProfile;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const date = new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-canvas lg:block">
        <SidebarContent admin={admin} tenant={tenant} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-canvas shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-mute hover:bg-paper hover:text-ink"
              aria-label="Close navigation"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent admin={admin} tenant={tenant} />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-md p-2 text-mute hover:bg-paper hover:text-ink lg:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <p className="font-mono text-xs text-mute">{date}</p>
            </div>
            <TermiiChip />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}