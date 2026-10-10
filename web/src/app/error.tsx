"use client";

import { ServiceUnavailable } from "@/components/service-unavailable";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error; // Next.js error-boundary contract requires the prop.
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <ServiceUnavailable onRetry={() => reset()} />
    </div>
  );
}