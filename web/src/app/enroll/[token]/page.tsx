import type { Metadata } from "next";
import { Suspense } from "react";
import { EnrollLink } from "./enroll-link";

export const metadata: Metadata = { title: "Link your account" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-dvh items-center justify-center text-sm text-mute">
          Loading…
        </p>
      }
    >
      <EnrollLink />
    </Suspense>
  );
}
