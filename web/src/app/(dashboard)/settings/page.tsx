import type { Metadata } from "next";
import { SettingsData } from "@/components/settings-data";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsData />;
}