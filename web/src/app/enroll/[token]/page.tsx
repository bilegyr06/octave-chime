import { Suspense } from "react";
import { EnrollLink } from "./enroll-link";

export default function Page(_props: PageProps<"/enroll/[token]">) {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
      }
    >
      <EnrollLink />
    </Suspense>
  );
}