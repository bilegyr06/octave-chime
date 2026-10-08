import type { Metadata } from "next";
import { DevConsole } from "@/components/dev-console";

export const metadata: Metadata = { title: "Dev console" };

export default function Page() {
  return <DevConsole />;
}