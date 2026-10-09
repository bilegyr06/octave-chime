import { Suspense } from "react";
import { StatusToken } from "./status-token";

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-mute">Loading…</p>
      }
    >
      <StatusToken />
    </Suspense>
  );
}