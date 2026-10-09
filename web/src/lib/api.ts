export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Statuses that are safe to retry for reads (represents an upstream blip). */
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 250;

function isRead(init?: RequestInit): boolean {
  const method = (init?.method ?? "GET").toUpperCase();
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

/**
 * Transient-failure tolerant fetch. Reads (GET/HEAD/OPTIONS) are retried up to
 * 2 extra times with backoff on network errors and gateway statuses. Writes
 * stay single-shot so we never double-submit.
 */
async function fetchRetry(path: string, init?: RequestInit): Promise<Response> {
  const attempts = isRead(init) ? MAX_RETRIES + 1 : 1;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
    let res: Response;
    try {
      res = await fetch(path, init);
    } catch (err) {
      lastError = err;
      if (attempt === attempts - 1) break;
      continue;
    }
    if (RETRYABLE_STATUS.has(res.status) && attempt < attempts - 1) {
      lastError = new ApiError(`Request failed (${res.status})`, res.status);
      continue;
    }
    return res;
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError("Request failed", 0);
}

/** Thin fetch wrapper for browser-origin API calls (same-host via the dev/prod proxy). */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("content-type", "application/json");

  const res = await fetchRetry(path, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      body?.message ?? `Request failed (${res.status})`,
      res.status,
      body?.error,
    );
  }
  return body as T;
}