import {
  CustomersIcon,
  NotificationsIcon,
  OverviewIcon,
  SettingsIcon,
  TransactionsIcon,
} from "./icons";

export const primaryNav = [
  { href: "/overview", label: "Overview", icon: OverviewIcon },
  { href: "/customers", label: "Customers", icon: CustomersIcon },
  { href: "/transactions", label: "Transactions", icon: TransactionsIcon },
  { href: "/notifications", label: "Notifications", icon: NotificationsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;