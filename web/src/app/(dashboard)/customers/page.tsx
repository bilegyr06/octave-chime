import type { Metadata } from "next";
import { CustomersData } from "@/components/customers-data";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return <CustomersData />;
}