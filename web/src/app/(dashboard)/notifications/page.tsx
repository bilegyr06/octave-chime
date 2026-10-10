import type { Metadata } from "next";
import { NotificationsData } from "@/components/notifications-data";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page(props: PageProps<"/notifications">) {
  const { status } = await props.searchParams;
  const initialStatus = typeof status === "string" ? status : "";
  return <NotificationsData key={initialStatus} initialStatus={initialStatus} />;
}