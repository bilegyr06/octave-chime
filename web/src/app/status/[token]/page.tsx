import { Suspense } from "react";
import { StatusToken } from "./status-token";

export default function Page(_props: PageProps<"/status/[token]">) {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
      }
    >
      <StatusToken />
    </Suspense>
  );
}