import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/overview");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card className="overflow-hidden">
          <div className="h-1 bg-brand" />
          <div className="px-7 pb-8 pt-7">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-mono text-sm font-medium text-paper">
                ⇄
              </div>
              <div className="leading-tight">
                <p className="text-[15px] font-semibold tracking-tight text-ink">
                  Octave Chime
                </p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-mute">
                  Bank console
                </p>
              </div>
            </div>
            <h1 className="mt-8 text-xl font-semibold tracking-tight text-ink">
              Sign in to your workspace
            </h1>
            <p className="mt-1.5 text-sm text-mute">
              Manage customers, alerts and daily summaries for your bank.
            </p>
            <LoginForm />
          </div>
        </Card>
        <p className="mt-6 text-center font-mono text-xs text-mute">
          WhatsApp transaction alerts for Nigerian banks
        </p>
      </div>
    </div>
  );
}