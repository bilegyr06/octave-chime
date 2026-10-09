"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Card, ErrorState, Spinner, Switch, inputClass } from "@/components/ui";

interface BankProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  supportEmail: string | null;
  whatsappAlertsPaused: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedProfile {
  name: string;
  logoUrl: string;
  supportEmail: string;
  whatsappAlertsPaused: boolean;
}

export function SettingsData() {
  const router = useRouter();
  const [profile, setProfile] = useState<BankProfile | null>(null);
  const [banks, setBanks] = useState<BankProfile[] | null>(null);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const snapshot = (p: BankProfile): SavedProfile => ({
    name: p.name,
    logoUrl: p.logoUrl ?? "",
    supportEmail: p.supportEmail ?? "",
    whatsappAlertsPaused: p.whatsappAlertsPaused,
  });

  const [draft, setDraft] = useState<SavedProfile>({
    name: "",
    logoUrl: "",
    supportEmail: "",
    whatsappAlertsPaused: false,
  });
  const [saved, setSaved] = useState<SavedProfile>({
    name: "",
    logoUrl: "",
    supportEmail: "",
    whatsappAlertsPaused: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api<BankProfile>("/api/bank/profile");
        if (cancelled) return;
        setProfile(profile);
        const next = snapshot(profile);
        setDraft(next);
        setSaved(next);
        setLoading(false);
        return;
      } catch (e) {
        const isPlatform =
          e instanceof ApiError && e.status === 400 && e.code === "validation_error";
        if (!isPlatform) {
          if (!cancelled) {
            setLoadError(e instanceof Error ? e.message : "Failed to load bank profile");
            setLoading(false);
          }
          return;
        }
      }
      try {
        const list = await api<BankProfile[]>("/api/banks");
        if (cancelled) return;
        setBanks(list);
        if (list[0]) setSelectedBankId(list[0].id);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load banks");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedBankId) return;
    let cancelled = false;
    api<BankProfile>(`/api/bank/profile?bankId=${selectedBankId}`)
      .then((profile) => {
        if (cancelled) return;
        setProfile(profile);
        const next = snapshot(profile);
        setDraft(next);
        setSaved(next);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load bank profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBankId]);

  const dirty =
    draft.name !== saved.name ||
    draft.logoUrl !== saved.logoUrl ||
    draft.supportEmail !== saved.supportEmail ||
    draft.whatsappAlertsPaused !== saved.whatsappAlertsPaused;

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {
        name: draft.name,
        logoUrl: draft.logoUrl.trim() === "" ? null : draft.logoUrl.trim(),
        supportEmail: draft.supportEmail.trim() === "" ? null : draft.supportEmail.trim(),
        whatsappAlertsPaused: draft.whatsappAlertsPaused,
      };
      if (banks) payload.bankId = selectedBankId;
      const updated = await api<BankProfile>("/api/bank/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setProfile(updated);
      const next = snapshot(updated);
      setDraft(next);
      setSaved(next);
      setSavedAt(updated.updatedAt);
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save bank profile");
    } finally {
      setSaving(false);
    }
  }

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <Spinner label="Loading settings" />;
  if (loadError) return <ErrorState title="Settings failed to load" hint={loadError} onRetry={retry} />;
  if (!profile) return null;

  const logoUrl = draft.logoUrl.trim();

  return (
    <div className="space-y-5">
<div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-sm text-mute">
            Tenant identity, the support contact shown on alerts, and the bank-wide
            WhatsApp pause.
          </p>
        </div>

      {banks ? (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-ink">Bank</label>
          <select
            className={`${inputClass} w-auto`}
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
          >
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <Card>
        <div className="flex items-center gap-4 border-b border-line px-5 py-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="h-10 w-10 rounded-[3px] border border-line bg-canvas object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-brand-soft font-display text-sm font-semibold text-brand">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-display text-[15px] font-semibold text-ink">{profile.name}</h2>
            <p className="text-xs text-mute">
              {profile.slug}, {profile.status}
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="block">
            <span className="text-sm font-medium text-ink">Bank name</span>
            <input
              className={`${inputClass} mt-1`}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Logo URL</span>
            <input
              className={`${inputClass} mt-1 font-mono`}
              value={draft.logoUrl}
              onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <span className="mt-1 block text-xs text-mute">Used in the sidebar and customer-facing pages.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Support email</span>
            <input
              className={`${inputClass} mt-1`}
              type="email"
              value={draft.supportEmail}
              onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })}
              placeholder="support@bank.example"
            />
            <span className="mt-1 block text-xs text-mute">Included on alerts so customers can reach you.</span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[3px] border border-line bg-canvas px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Pause all WhatsApp alerts</span>
              <span className="block text-xs text-mute">
                Temporarily stop transaction alerts and daily summaries for every customer at
                this bank. Customer-facing statuses are not changed.
              </span>
            </span>
            <Switch
              checked={draft.whatsappAlertsPaused}
              onChange={(v) => setDraft({ ...draft, whatsappAlertsPaused: v })}
              label="Pause all WhatsApp alerts"
            />
          </div>

          {saveError ? <p className="text-sm font-medium text-danger">{saveError}</p> : null}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={saving || !dirty || !draft.name.trim()}
              onClick={save}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-paper hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                setDraft(saved);
                setSaveError(null);
              }}
              className="rounded-[3px] border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
            {savedAt ? (
              <span className="text-xs text-mute">Saved {formatDate(savedAt)}</span>
            ) : null}
          </div>
          <p className="text-xs text-mute">
            Profile id <span className="font-mono">{profile.id}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}