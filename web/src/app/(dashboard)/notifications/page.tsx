import type { Metadata } from "next";
import { Suspense } from "react";
import { NotificationsData } from "@/components/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NotificationsData />
    </Suspense>
  );
}