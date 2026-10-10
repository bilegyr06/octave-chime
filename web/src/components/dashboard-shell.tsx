"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import type { BankProfile, SessionAdmin } from "@/lib/session";
import { primaryNav } from "./nav";
import { SignOutButton } from "./sign-out-button";
import { TermiiChip } from "./termii-chip";
import { CloseIcon, MenuIcon } from "./icons";
import { Led } from "./ui";

function isActive(pathname: string, href: string): boolean {
  return href === "/overview" ? pathname === href : pathname.startsWith(href);
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/octave-logo.png"
        alt="Octave Chime"
        className="h-8 w-auto object-contain"
      />
      <span className="font-display text-[17px] font-semibold tracking-tight text-paper">
        Octave Chime
      </span>
    </div>
  );
}

function TenantBlock({ admin, tenant }: { admin: SessionAdmin; tenant?: BankProfile }) {
  const name = tenant?.name ?? "Octave Chime";
  return (
    <div className="rounded-[3px] border border-paper/10 bg-paper/5 px-3 py-2.5">
      {tenant?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logoUrl} alt="" className="h-8 w-8 rounded-[3px] object-contain" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-paper/10 font-mono text-xs font-medium text-paper">
          {initials(name)}
        </div>
      )}
      <div className="mt-2">
        <p className="text-sm font-semibold text-paper">{name}</p>
        <p className="text-xs text-paper/60">
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
      <div className="px-5 pb-5 pt-6">
        <BrandLockup />
      </div>

      <div className="px-4">
        <TenantBlock admin={admin} tenant={tenant} />
      </div>

      <nav className="mt-6 flex-1 space-y-0.5 px-3" aria-label="Primary">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-paper/10 text-paper"
                  : "text-paper/70 hover:bg-paper/5 hover:text-paper"
              }`}
            >
              <Led tone={active ? "signal" : "mute"} />
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-paper/10 px-3 py-3">
        <div className="flex items-center gap-2.5 px-1.5 pb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-paper/15 font-display text-xs font-semibold text-paper">
            {initials(admin.name)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-paper">{admin.name}</p>
            <p className="truncate text-xs text-paper/60">{admin.email}</p>
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
  const dialogRef = useRef<HTMLElement | null>(null);
  const date = new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const closeDrawer = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = () => {
      if (!dialog.contains(document.activeElement)) first?.focus();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      if (previouslyFocused) previouslyFocused.focus();
    };
  }, [open]);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-paper/10 bg-brand-strong lg:flex">
        <SidebarContent admin={admin} tenant={tenant} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/50"
            onClick={closeDrawer}
          />
          <aside
            ref={dialogRef}
            className="absolute inset-y-0 left-0 w-64 bg-brand-strong"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute right-3 top-4 rounded-[3px] p-1.5 text-paper/70 hover:bg-paper/10 hover:text-paper"
              aria-label="Close navigation"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent admin={admin} tenant={tenant} />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="lg:pl-60" inert={open}>
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-[3px] p-2 text-mute hover:bg-paper hover:text-ink lg:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <p className="font-display text-[15px] font-semibold tracking-tight text-ink">{date}</p>
            </div>
            <TermiiChip />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}