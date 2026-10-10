import type { NotificationDomain } from "./notification";

export interface DashboardMetrics {
  bank: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  enrolledCustomers: number;
  linkedAccounts: number;
  whatsappEnabledCustomers: number;
  alertsSentToday: number;
  queuedAlertsToday: number;
  failedAlertsToday: number;
  dailySummariesToday: number;
  recentEnrollments: {
    id: string;
    fullName: string;
    whatsappPhone: string | null;
    serviceStatus: string;
    createdAt: Date;
  }[];
  recentDeliveryLog: NotificationDomain[];
  generatedAt: string;
}