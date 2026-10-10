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

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

export type SessionLookupStatus = "ok" | "expired" | "unreachable";

export interface SessionLookup<T> {
  admin: T | null;
  status: SessionLookupStatus;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Server-side fetch used by session lookups. Retries transient failures
 * (network drops, 5xx) with backoff and NEVER throws on them - callers get a
 * resolved Response or a throw only after exhausting retries.
 */
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 2,
  baseDelayMs = 250,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(baseDelayMs * 2 ** (attempt - 1));
    try {
      const res = await fetch(url, init);
      if (res.status >= 500 && attempt < retries) continue;
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
  throw new Error("fetch failed");
}

async function lookupSession<T>(path: string, cookieName: string): Promise<SessionLookup<T>> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(cookieName);
  if (!token) return { admin: null, status: "expired" };

  try {
    const res = await fetchWithRetry(`${apiBase()}${path}`, {
      headers: { cookie: `${token.name}=${token.value}` },
      cache: "no-store",
    });
    if (res.status === 401) return { admin: null, status: "expired" };
    if (!res.ok) return { admin: null, status: "unreachable" };
    const body = await res.json().catch(() => null);
    if (!body?.admin) return { admin: null, status: "expired" };
    return { admin: body.admin as T, status: "ok" };
  } catch {
    // Transient network failure only - the admin is still signed in. Let the
    // caller render a retryable state instead of bouncing to the login page.
    return { admin: null, status: "unreachable" };
  }
}

/** Server-side session lookup used by layouts/pages to guard routes. */
export async function getSession(): Promise<SessionAdmin | null> {
  const result = await lookupSession<SessionAdmin>("/api/auth/me", SESSION_COOKIE);
  return result.admin;
}

/** Guard variant that distinguishes 'signed out' from 'service unreachable'. */
export async function safeGetSession(): Promise<SessionLookup<SessionAdmin>> {
  return lookupSession<SessionAdmin>("/api/auth/me", SESSION_COOKIE);
}

/** Dev-console session guard - reads `oc_dev_session`, distinct from admins. */
export async function getDevSession(): Promise<SessionAdmin | null> {
  const result = await lookupSession<SessionAdmin>("/api/dev/auth/me", DEV_SESSION_COOKIE);
  return result.admin;
}

/** Dev-console guard variant that distinguishes 'signed out' from 'unreachable'. */
export async function safeGetDevSession(): Promise<SessionLookup<SessionAdmin>> {
  return lookupSession<SessionAdmin>("/api/dev/auth/me", DEV_SESSION_COOKIE);
}

/** Tenant profile for the dashboard sidebar (bank name + logoUrl). */
export async function getBankProfile(bankId: string | null): Promise<BankProfile | null> {
  if (!bankId) return null;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE);
  if (!token) return null;

  try {
    const res = await fetchWithRetry(
      `${apiBase()}/api/bank/profile?bankId=${encodeURIComponent(bankId)}`,
      { headers: { cookie: `${token.name}=${token.value}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}