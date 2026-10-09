import { redirect } from "next/navigation";
import { DevConsole } from "@/components/dev-console";
import { DevSignOutButton } from "@/components/dev-sign-out-button";
import { getDevSession } from "@/lib/session";

export const metadata = { title: "Dev console" };

export default async function DevPage() {
  const session = await getDevSession();
  if (!session) redirect("/dev/login");

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 font-mono text-xs font-medium text-paper">
              ⌘
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-ink">
                Dev console
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-mute">
                Operator tools · isolated session
              </p>
            </div>
          </div>
          <DevSignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <DevConsole />
      </main>
    </div>
  );
}