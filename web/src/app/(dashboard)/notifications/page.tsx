import type { Metadata } from "next";
import { NotificationsData } from "@/components/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <NotificationsData />;
}