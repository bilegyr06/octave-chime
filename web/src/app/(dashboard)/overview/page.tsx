import type { Metadata } from "next";
import { OverviewData } from "@/components/overview-data";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <OverviewData />;
}