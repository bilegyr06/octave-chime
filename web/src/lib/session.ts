export const SESSION_COOKIE = "oc_admin_session";
export const DEV_SESSION_COOKIE = "oc_dev_session";

export interface SessionAdmin {
  id: string;
  name: string;
  email: string;
  role: "bank_admin" | "platform_admin" | "dev";
  bankId: string | null;
  createdAt: string;
}

export interface BankProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  supportEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Server-side session lookup used by layouts/pages to guard routes. */
export async function getSession(): Promise<SessionAdmin | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE);
  if (!token) return null;

  const res = await fetch(`${apiBase()}/api/auth/me`, {
    headers: { cookie: `${token.name}=${token.value}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.admin ?? null;
}

/** Dev-console session guard — reads `oc_dev_session`, distinct from admins. */
export async function getDevSession(): Promise<SessionAdmin | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(DEV_SESSION_COOKIE);
  if (!token) return null;

  const res = await fetch(`${apiBase()}/api/dev/auth/me`, {
    headers: { cookie: `${token.name}=${token.value}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.admin ?? null;
}

/** Tenant profile for the dashboard sidebar (bank name + logoUrl). */
export async function getBankProfile(bankId: string | null): Promise<BankProfile | null> {
  if (!bankId) return null;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE);
  if (!token) return null;

  const res = await fetch(`${apiBase()}/api/bank/profile?bankId=${bankId}`, {
    headers: { cookie: `${token.name}=${token.value}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}