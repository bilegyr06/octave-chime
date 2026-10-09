import type { Bank } from "@prisma/client";

export interface BankProfileDomain {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  supportEmail: string | null;
  whatsappAlertsPaused: boolean;
  status: Bank["status"];
  createdAt: Date;
  updatedAt: Date;
}

export function toBankProfile(b: Bank): BankProfileDomain {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    supportEmail: b.supportEmail,
    whatsappAlertsPaused: b.whatsappAlertsPaused,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}