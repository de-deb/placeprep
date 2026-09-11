import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorState, PageHeader, Skeleton } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { settingsService } from "../services";
import { getErrorMessage } from "../services/api";

const PREF_LABELS: { key: "notifyDeadlines" | "notifyStatus" | "notifyAnnouncements" | "notifyPreparation"; label: string; hint: string }[] = [
  { key: "notifyDeadlines", label: "Drive deadlines", hint: "Reminders for closing drives" },
  { key: "notifyStatus", label: "Application updates", hint: "Shortlist / interview / selection changes" },
  { key: "notifyAnnouncements", label: "Announcements", hint: "Placement-cell notices" },
  { key: "notifyPreparation", label: "Preparation nudges", hint: "Occasional study reminders" },
];

export default function SettingsPage() {
  const { user, demoMode } = useAuth();
  const prefsApi = useApi(() => (demoMode ? Promise.resolve({ notifyDeadlines: true, notifyStatus: true, notifyAnnouncements: true, notifyPreparation: true }) : settingsService.prefs()), [demoMode]);
  const [name, setName] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (ok: boolean, text: string) => setMsg({ ok, text });

  const saveName = async () => {
    if (name == null || name.trim().length < 2) return flash(false, "Name must be at least 2 characters.");
    if (demoMode) return flash(false, "Demo mode — log in to change your account.");
    setBusy(true);
    try {
      await settingsService.updateAccount(name.trim());
      flash(true, "Name updated. It will refresh on next login.");
    } catch (e) {
      flash(false, getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (next.length < 8) return flash(false, "New password must be at least 8 characters with a letter and a number.");
    if (demoMode) return flash(false, "Demo mode — log in to change your password.");
    setBusy(true);
    try {
      await settingsService.changePassword(current, next);
      setCurrent("");
      setNext("");
      flash(true, "Password changed successfully.");
    } catch (e) {
      flash(false, getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const togglePref = async (key: (typeof PREF_LABELS)[number]["key"], value: boolean) => {
    if (demoMode) return flash(false, "Demo mode — preferences apply to real accounts.");
    try {
      await settingsService.updatePrefs({ [key]: value });
      prefsApi.reload();
    } catch (e) {
      flash(false, getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Settings" subtitle="Account, security and notification preferences." />
      {msg && <p className={`mb-4 rounded-xl px-4 py-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle title="Account" subtitle={user?.email} />
          <div className="mt-4 space-y-3">
            <Input label="Display name" defaultValue={user?.name ?? ""} onChange={(e) => setName(e.target.value)} />
            <Button onClick={saveName} disabled={busy}>Save name</Button>
          </div>
        </Card>
        <Card>
          <CardTitle title="Security" subtitle="Change your password" />
          <div className="mt-4 space-y-3">
            <Input label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            <Input label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 chars, letter + number" autoComplete="new-password" />
            <Button onClick={savePassword} disabled={busy}>Change password</Button>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle title="Notification preferences" subtitle="Choose what reaches your inbox bell" />
        {prefsApi.loading && <Skeleton lines={3} />}
        {prefsApi.error && <ErrorState message={prefsApi.error} onRetry={prefsApi.reload} />}
        {prefsApi.data && (
          <div className="mt-4 divide-y divide-slate-100">
            {PREF_LABELS.map((p) => (
              <label key={p.key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{p.label}</span>
                  <span className="block text-xs text-slate-500">{p.hint}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={prefsApi.data![p.key]}
                  checked={prefsApi.data![p.key]}
                  onChange={(e) => togglePref(p.key, e.target.checked)}
                  className="h-5 w-5 accent-indigo-600"
                />
              </label>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
