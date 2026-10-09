"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warn-soft font-mono text-lg text-warn">
        ✕
      </div>
      <h1 className="text-lg font-semibold tracking-tight text-ink">
        Couldn&apos;t reach the service
      </h1>
      <p className="text-sm leading-relaxed text-mute">
        Octave Chime&apos;s API didn&apos;t respond while loading this page.
        Your session is still active and nothing was lost - retry and continue.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (onRetry) onRetry();
            else router.refresh();
          }}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
        >
          Try again
        </button>
        <Link
          href={href}
          className="rounded-md border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}