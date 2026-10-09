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
        <Card className="px-7 pb-8 pt-9">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/octave-logo.png" alt="Octave Chime" className="h-9 w-auto object-contain" />
            <span className="font-display text-[19px] font-semibold tracking-tight text-ink">
              Octave Chime
            </span>
          </div>
          <h1 className="mt-8 font-display text-[26px] font-semibold tracking-tight text-ink">
            Sign in to your workspace
          </h1>
          <p className="mt-1.5 text-sm text-mute">
            Manage customers, alerts and daily summaries for your bank.
          </p>
          <LoginForm />
        </Card>
        <p className="mt-5 text-center text-sm text-mute">
          WhatsApp transaction alerts for Nigerian banks
        </p>
      </div>
    </div>
  );
}