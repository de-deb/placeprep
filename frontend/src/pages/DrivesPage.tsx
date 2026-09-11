import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Badge, Urgency } from "../components/ui/Badge";
import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { applicationService, driveService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockDrives } from "../data/mockData";
import type { Drive } from "../types";
import { formatDate } from "../utils/format";

function urgencyOf(d: Drive): { level: "normal" | "soon" | "today" | "closed"; label: string } {
  if (d.status === "CLOSED") return { level: "closed", label: "Closed" };
  if (!d.deadline) return { level: "normal", label: "Open" };
  const ms = new Date(d.deadline).getTime() - Date.now();
  if (ms < 0) return { level: "closed", label: "Deadline passed" };
  if (ms < 86400000) return { level: "today", label: "Deadline today" };
  if (ms < 3 * 86400000) return { level: "soon", label: "Closing soon" };
  return { level: "normal", label: "Open" };
}

export default function DrivesPage() {
  const { demoMode } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const drivesApi = useApi(
    () => (demoMode ? Promise.resolve(mockDrives) : driveService.list(statusFilter || undefined)),
    [statusFilter, demoMode]
  );
  const appsApi = useApi(() => (demoMode ? Promise.resolve([] as never[]) : applicationService.mine()), [demoMode]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const drives = useMemo(() => {
    let list: Drive[] = [];
    if (drivesApi.data) list = drivesApi.data;
    else if (demoMode || drivesApi.error) {
      list = mockDrives
        .filter((d) => !statusFilter || d.status === statusFilter)
        .map((d, i) => ({
          ...d,
          applied: d.applied ?? i === 1,
          eligibilityResult: d.eligibilityResult,
        }));
    }
    if (eligibleOnly) list = list.filter((d) => d.eligibilityResult?.eligible ?? true);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivesApi.data, demoMode, drivesApi.error, statusFilter, eligibleOnly]);

  const appliedIds = useMemo(() => new Set((appsApi.data as { driveId: string }[] ?? []).map((a) => a.driveId)), [appsApi.data]);

  const apply = async (driveId: string) => {
    setActionError(null);
    if (demoMode) {
      setActionError("Demo mode — log in with a real account to apply.");
      return;
    }
    setBusyId(driveId);
    try {
      await applicationService.apply(driveId);
      appsApi.reload();
      drivesApi.reload();
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Placement Drives"
        subtitle="Eligibility is checked automatically against your profile."
        action={
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="accent-indigo-600" />
              Eligible only
            </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="CLOSED">Closed</option>
            </select>
          </>
        }
      />
      {actionError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{actionError}</p>}
      {drivesApi.loading && <SkeletonCards count={4} />}
      {drivesApi.error && !demoMode && !drivesApi.data && <ErrorState message={drivesApi.error} onRetry={drivesApi.reload} />}
      {!drivesApi.loading && drives.length === 0 && (
        <EmptyState
          title={eligibleOnly ? "No eligible drives" : "No drives found"}
          hint={eligibleOnly ? "Complete your profile (CGPA, branch, skills) to unlock more drives." : "Try a different filter."}
          action={eligibleOnly ? <Link to="/profile" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Complete profile →</Link> : undefined}
        />
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {drives.map((d) => {
          const applied = d.applied ?? appliedIds.has(d.id);
          const elig = d.eligibilityResult;
          const u = urgencyOf(d);
          return (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-900">{d.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{d.company?.name} · {d.mode} · {d.location ?? "TBA"}</p>
                </div>
                <Badge value={d.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Date: <b className="text-slate-700">{formatDate(d.date)}</b></span>
                <span>Deadline: <b className="text-slate-700">{formatDate(d.deadline)}</b></span>
                <Urgency level={u.level} label={u.label} />
              </div>
              {d.eligibility && <p className="mt-2 text-xs text-slate-500">Eligibility: {d.eligibility}</p>}
              {elig && (
                <div className="mt-2">
                  {elig.eligible
                    ? <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Eligible ✓ — you meet all criteria</span>
                    : (
                      <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                        <b>Not eligible:</b>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4">
                          {elig.reasons.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                </div>
              )}
              {d.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{d.description}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">{d._count?.applications ?? 0} applicants</span>
                {applied ? (
                  <Link to="/applications" className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">Applied ✓ — track →</Link>
                ) : (
                  <button
                    disabled={busyId === d.id || d.status === "CLOSED" || (elig != null && !elig.eligible)}
                    onClick={() => apply(d.id)}
                    title={elig != null && !elig.eligible ? "You don't meet the eligibility criteria" : undefined}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyId === d.id ? "Applying…" : d.status === "CLOSED" ? "Closed" : "Apply now"}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
