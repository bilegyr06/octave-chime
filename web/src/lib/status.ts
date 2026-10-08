export type NoticeTone = "ok" | "whatsapp" | "danger" | "warn" | "mute";

export const serviceStatusMap: Record<
  string,
  { label: string; tone: NoticeTone }
> = {
  pending_link: { label: "Pending link", tone: "mute" },
  active: { label: "Active", tone: "ok" },
  paused: { label: "Paused", tone: "warn" },
  opted_out: { label: "Opted out", tone: "danger" },
  link_expired: { label: "Link expired", tone: "warn" },
};

export const notificationStatusMap: Record<
  string,
  { label: string; tone: NoticeTone }
> = {
  queued: { label: "Queued", tone: "mute" },
  sent: { label: "Delivered", tone: "whatsapp" },
  failed: { label: "Failed", tone: "danger" },
  skipped: { label: "Skipped", tone: "warn" },
};

export const notificationTypeLabel: Record<string, string> = {
  transaction_alert: "Txn alert",
  daily_summary: "Daily summary",
};

export const enrollmentStatusLabel: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Enrolled",
};

export const consentStatusLabel: Record<string, string> = {
  granted: "Consent granted",
  withdrawn: "Consent withdrawn",
};

export const serviceStatusTone = (status: string): NoticeTone =>
  serviceStatusMap[status]?.tone ?? "mute";

export const notificationStatusTone = (status: string): NoticeTone =>
  notificationStatusMap[status]?.tone ?? "mute";