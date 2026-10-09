import type { Metadata } from "next";
import { TransactionsData } from "@/components/transactions-data";

export const metadata: Metadata = { title: "Transactions" };

export default function Page() {
  return <TransactionsData />;
}