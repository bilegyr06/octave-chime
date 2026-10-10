import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusToken } from "./status-token";

export const metadata: Metadata = { title: "Account status" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-dvh items-center justify-center text-sm text-mute">
          Loading…
        </p>
      }
    >
      <StatusToken />
    </Suspense>
  );
}
