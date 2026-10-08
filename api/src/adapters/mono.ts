import { config, isMonoSimulated } from "../core/config";
import { logger } from "../core/logger";
import { demoAccountByNumber, MONO_DEMO_ACCOUNTS } from "../models/monoDemo";

export class MonoProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonoProviderError";
  }
}

export interface MonoAccount {
  providerAccountId: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  balance: number;
  institutionName: string;
}

export interface MonoTransaction {
  reference: string;
  type: "debit" | "credit";
  amount: number;
  narration: string | null;
  date: string;
}

export interface MonoAdapter {
  /** Exchange a Connect widget auth code for a permanent account ID. */
  exchangeCode(code: string): Promise<string>;
  getAccount(providerAccountId: string): Promise<MonoAccount>;
  getRecentTransactions(providerAccountId: string): Promise<MonoTransaction[]>;
}

function maskAccount(number: string): string {
  return `*${number.slice(-4)}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.mono.baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "mono-sec-key": config.mono.secretKey,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new MonoProviderError(`Mono API ${path}: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Tolerates `{ data: { id } }`, `{ id }` and a bare string code payloads. */
function readId(payload: { data?: unknown; id?: unknown }): string {
  if (typeof payload === "object" && payload !== null) {
    const data = payload.data as { id?: unknown } | null;
    const raw = data?.id ?? payload.id;
    if (typeof raw === "string" && raw.length > 0) return raw;
  }
  throw new MonoProviderError("Mono exchange returned no account id");
}

function realAdapter(): MonoAdapter {
  if (!config.mono.secretKey) {
    throw new MonoProviderError("MONO_SECRET_KEY is not configured");
  }
  return {
    async exchangeCode(code) {
      const body = await request<{ data?: { id?: unknown }; id?: unknown }>(
        "/v2/accounts/auth",
        { method: "POST", body: JSON.stringify({ code }) },
      );
      return readId(body);
    },
    async getAccount(providerAccountId) {
      type AccountPayload = {
        id?: string;
        account_name?: string;
        account_number?: string;
        currency?: string;
        balance?: number | string;
        institution?: { name?: string };
      };
      const body = await request<{ data?: AccountPayload }>(`/v2/accounts/${providerAccountId}`);
      const account: AccountPayload = body.data ?? {};
      const number = String(account.account_number ?? "");
      return {
        providerAccountId: String(account.id ?? providerAccountId),
        accountName: account.account_name ?? "Linked account",
        accountNumber: number,
        currency: account.currency ?? "NGN",
        balance: Number(account.balance ?? 0),
        institutionName: account.institution?.name ?? "",
      };
    },
    async getRecentTransactions(providerAccountId) {
      const body = await request<{
        data?: { transactions?: unknown[] } | unknown[];
      }>(`/v2/accounts/${providerAccountId}/transactions`);
      const items = Array.isArray(body.data)
        ? body.data
        : ((body.data as { transactions?: unknown[] } | null)?.transactions ?? []);
      return items.map((raw) => {
        const t = raw as {
          id?: string;
          reference?: string;
          type?: string;
          amount?: number | string;
          narration?: string | null;
          date?: string;
        };
        return {
          reference: String(t.reference ?? t.id ?? `MONO-${Date.now()}`),
          type: t.type === "credit" ? ("credit" as const) : ("debit" as const),
          amount: Math.abs(Number(t.amount ?? 0)),
          narration: t.narration ?? null,
          date: t.date ?? new Date().toISOString(),
        };
      });
    },
  };
}

function mockAdapter(): MonoAdapter {
  return {
    async exchangeCode(code) {
      const match = /^demo:\/\/(\d{10})$/.exec(code);
      if (!match) throw new MonoProviderError("Invalid demo code");
      const account = demoAccountByNumber(match[1]);
      if (!account) throw new MonoProviderError("Unknown demo account");
      logger.info(`[mono:mock] exchange demo code -> ${account.institutionName} ${maskAccount(account.accountNumber)}`);
      return `sim_${account.accountNumber}`;
    },
    async getAccount(providerAccountId) {
      const account = MONO_DEMO_ACCOUNTS.find(
        (a) => providerAccountId === `sim_${a.accountNumber}`,
      );
      if (!account) throw new MonoProviderError("Unknown simulated account");
      return {
        providerAccountId,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        currency: "NGN",
        balance: account.balance,
        institutionName: account.institutionName,
      };
    },
    async getRecentTransactions() {
      return [];
    },
  };
}

export function createMonoAdapter(): MonoAdapter {
  return isMonoSimulated() ? mockAdapter() : realAdapter();
}