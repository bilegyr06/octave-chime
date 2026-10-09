import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getDevSession } from "@/lib/session";
import { DevLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Dev console · Sign in" };

export default async function DevLoginPage() {
  const session = await getDevSession();
  if (session) redirect("/dev");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card className="overflow-hidden">
          <div className="px-7 pb-8 pt-7">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-brand-strong font-semibold text-lg text-paper">
                ⌘
              </div>
              <div className="leading-tight">
                <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
                  Octave Chime
                </p>
                <p className="text-xs text-mute">Dev console</p>
              </div>
            </div>
            <h1 className="mt-8 font-display text-xl font-semibold tracking-tight text-ink">
              Operator sign-in
            </h1>
            <p className="mt-1.5 text-sm text-mute">
              Simulation controls, WhatsApp mock inbound, and cross-bank tooling.
              This zone is separate from bank and platform admins.
            </p>
            <DevLoginForm />
          </div>
        </Card>
        <p className="mt-6 text-center font-mono text-xs text-mute">
          dev@octavechime.test, not linked from the admin console
        </p>
      </div>
    </div>
  );
}