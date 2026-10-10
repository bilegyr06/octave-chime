"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertIcon } from "./icons";

/**
 * Branded fallback for a transient service blip: the admin is still signed in
 * and nothing was lost - this is NOT a logout screen.
 */
export function ServiceUnavailable({
  onRetry,
  href = "/login",
}: {
  onRetry?: () => void;
  href?: string;
}) {
  const router = useRouter();
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-[3px] bg-warn-soft text-warn">
        <AlertIcon className="h-5 w-5" />
      </div>
      <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
        Couldn&apos;t reach the service
      </h1>
      <p className="text-sm leading-relaxed text-mute">
        Octave Chime&apos;s API didn&apos;t respond while loading this page.
        Your session is still active and nothing was lost. Retry and continue.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (onRetry) onRetry();
            else router.refresh();
          }}
          className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-brand-strong"
        >
          Try again
        </button>
        <Link
          href={href}
          className="rounded-[3px] border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}