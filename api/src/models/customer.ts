import type {
  Bank,
  ConsentStatus,
  Customer,
  EnrollmentStatus,
  ServiceStatus,
} from "@prisma/client";

export interface CustomerDomain {
  id: string;
  bankId: string;
  bankName: string;
  fullName: string;
  email: string | null;
  whatsappPhone: string | null;
  consentStatus: ConsentStatus;
  enrollmentStatus: EnrollmentStatus;
  serviceStatus: ServiceStatus;
  whatsappAlertsEnabled: boolean;
  dailySummaryEnabled: boolean;
  preferredSummaryTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerRow = Customer & { bank?: Pick<Bank, "name"> | null };

export function toCustomerDomain(customer: CustomerRow): CustomerDomain {
  return {
    id: customer.id,
    bankId: customer.bankId,
    bankName: customer.bank?.name ?? "",
    fullName: customer.fullName,
    email: customer.email,
    whatsappPhone: customer.whatsappPhone,
    consentStatus: customer.consentStatus,
    enrollmentStatus: customer.enrollmentStatus,
    serviceStatus: customer.serviceStatus,
    whatsappAlertsEnabled: customer.whatsappAlertsEnabled,
    dailySummaryEnabled: customer.dailySummaryEnabled,
    preferredSummaryTime: customer.preferredSummaryTime,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}