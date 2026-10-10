import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Base>
  );
}

export function CustomersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5a3.25 3.25 0 0 1 0 6" />
      <path d="M17 14.5a5.5 5.5 0 0 1 3.5 5.5" />
    </Base>
  );
}

export function TransactionsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4 3.5 7.5 7 11" />
      <path d="M3.5 7.5H15" />
      <path d="M17 13l3.5 3.5L17 20" />
      <path d="M20.5 16.5H9" />
    </Base>
  );
}

export function NotificationsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Base>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="8" cy="17" r="2" />
    </Base>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </Base>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12.5 9 17l11-11" />
    </Base>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 5 7 7-7 7" />
    </Base>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 8 3 4-3 4" />
      <path d="M12 16h6" />
    </Base>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Base>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15.03L2 22l5.14-1.5A9.92 9.92 0 1 0 12.04 2Zm0 18.1a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.05.89.9-2.97-.2-.3a8.15 8.15 0 1 1 6.81 3.7Zm4.48-6.1c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.16.25-.63.8-.77.97-.14.16-.28.18-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43l-.47-.01a.9.9 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.24 3.75.6.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.67-1.18.2-.57.2-1.06.14-1.16-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}