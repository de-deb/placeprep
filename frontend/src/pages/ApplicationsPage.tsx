import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { Modal, useConfirm } from "../components/ui/Modal";
import { NEXT_STEP_FALLBACK, PIPELINE, terminalOf } from "../utils/applications";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { applicationService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockApplications } from "../data/mockData";
import type { Application } from "../types";
import { formatDate } from "../utils/format";

export default function ApplicationsPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(mockApplications) : applicationService.mine()),
    [demoMode]
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const withdraw = async (id: string) => {
    if (!(await confirm("Withdraw this application? The placement cell will see the withdrawal in history.", { title: "Withdraw application", confirmLabel: "Withdraw" }))) return;
    if (demoMode) {
      setMsg("Demo mode — log in to manage real applications.");
      return;
    }
    try {
      await applicationService.withdraw(id);
      setMsg("Application withdrawn.");
      reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="My Applications" subtitle="Status, timeline and next steps for every drive." />
      {msg && <p className="mb-4 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">{msg}</p>}
      {loading && <Skeleton lines={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (data ?? []).length === 0 && (
        <EmptyState
          title="No applications yet"
          hint="Browse open drives, check eligibility and apply in one click."
          action={<Link to="/drives" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Browse drives →</Link>}
        />
      )}
      <div className="space-y-3">
        {(data ?? []).map((a) => (
          <Card key={a.id}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{a.drive?.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{a.drive?.company?.name} · Applied {formatDate(a.appliedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge value={a.status} />
                <button onClick={() => setOpenId(a.id)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50">
                  Timeline
                </button>
                {!terminalOf(a.status) && (
                  <button onClick={() => withdraw(a.id)} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {openId && <TimelineModal application={(data ?? []).find((a) => a.id === openId)!} demoMode={demoMode} onClose={() => setOpenId(null)} />}
      {dialog}
    </AppLayout>
  );
}

function TimelineModal({ application, demoMode, onClose }: { application: Application; demoMode: boolean; onClose: () => void }) {
  const { data, loading } = useApi(
    () => (demoMode || application.history ? Promise.resolve(application) : applicationService.timeline(application.id)),
    [application.id]
  );
  const app = data ?? application;
  const history = app.history ?? [];
  const reached = new Set<string>(["APPLIED", ...history.map((h) => h.newStatus)]);
  if (!terminalOf(app.status)) reached.add(app.status);

  return (
    <Modal title={app.drive?.title ?? "Application"} onClose={onClose}>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{app.drive?.company?.name}</span>·<span>Applied {formatDate(app.appliedAt)}</span>·<Badge value={app.status} />
      </div>
      {/* Pipeline */}
      <ol className="mt-5 space-y-0">
        {PIPELINE.map((stage, i) => {
          const done = reached.has(stage);
          const current = app.status === stage;
          return (
            <li key={stage} className="relative flex gap-3 pb-5 last:pb-0">
              {i < PIPELINE.length - 1 && (
                <span className={`absolute left-[11px] top-6 h-full w-0.5 ${done ? "bg-emerald-400" : "bg-slate-200"}`} aria-hidden="true" />
              )}
              <span className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {done ? "✓" : i + 1}
              </span>
              <div>
                <p className={`text-sm font-semibold ${current ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"}`}>
                  {stage.replace(/_/g, " ")}{current ? " — current" : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {terminalOf(app.status) && !PIPELINE.includes(app.status as never) && (
        <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">Ended as {app.status}</p>
      )}
      <div className="mt-4 rounded-xl bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-900">
        <b>Next step:</b> {NEXT_STEP_FALLBACK[app.status] ?? "Check with the placement cell."}
      </div>
      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">History</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                <span>{h.oldStatus} → <b>{h.newStatus}</b>{h.changedBy ? ` by ${h.changedBy.name}` : ""}{h.note ? ` — ${h.note}` : ""}</span>
                <span className="shrink-0 text-xs text-slate-400">{formatDate(h.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {loading && <p className="mt-2 text-xs text-slate-400">Loading full timeline…</p>}
    </Modal>
  );
}
