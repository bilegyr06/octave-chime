import { Suspense } from "react";
import { EnrollLink } from "./enroll-link";

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-mute">Loading…</p>
      }
    >
      <EnrollLink />
    </Suspense>
  );
}