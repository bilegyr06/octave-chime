export interface MonoDemoAccount {
  institutionName: string;
  accountNumber: string;
  accountName: string;
  balance: number;
}

export const MONO_DEMO_ACCOUNTS: MonoDemoAccount[] = [
  {
    institutionName: "Zenith Bank",
    accountNumber: "0493141029",
    accountName: "Savings Account",
    balance: 100_000,
  },
  {
    institutionName: "Access Bank",
    accountNumber: "0690004421",
    accountName: "Savings Account",
    balance: 250_000,
  },
  {
    institutionName: "GTBank",
    accountNumber: "0122348810",
    accountName: "Savings Account",
    balance: 75_000,
  },
  {
    institutionName: "UBA",
    accountNumber: "0012342104",
    accountName: "Savings Account",
    balance: 180_000,
  },
];

/** Match a bank by name against the demo catalog. Returns null when unmatched. */
export function demoAccountForBank(bankName: string): MonoDemoAccount | null {
  const lower = bankName.toLowerCase();
  return (
    MONO_DEMO_ACCOUNTS.find((a) => lower.includes(a.institutionName.toLowerCase())) ?? null
  );
}

export function demoAccountByNumber(accountNumber: string): MonoDemoAccount | null {
  return MONO_DEMO_ACCOUNTS.find((a) => a.accountNumber === accountNumber) ?? null;
}