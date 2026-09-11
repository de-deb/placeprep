import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { Card, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { ErrorState, PageHeader, Skeleton, BarList } from "../../components/ui/States";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import { useConfirm } from "../../components/ui/Modal";
import { useApi } from "../../hooks/useApi";
import { adminService, applicationService } from "../../services";
import { getErrorMessage } from "../../services/api";
import { formatDate } from "../../utils/format";

const STATUSES = ["APPLIED", "SHORTLISTED", "ONLINE_ASSESSMENT", "INTERVIEW", "SELECTED", "REJECTED", "WITHDRAWN"];

interface Applicant {
  id: string;
  status: string;
  appliedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    profile: { cgpa: number | null; branch: string | null; year: number | null; skills: string[] } | null;
  };
}

export default function AdminDriveDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(() => adminService.driveDetail(id!), [id]);
  const d = data as unknown as null | {
    title: string; status: string; date: string; deadline: string | null; location: string | null; mode: string;
    company: { name: string };
    funnel: Record<string, number>; totalApplicants: number;
    applicants: Applicant[];
  };
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("SHORTLISTED");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (d?.applicants ?? []).filter((a) => {
      if (q && !a.student.name.toLowerCase().includes(q) && !a.student.email.toLowerCase().includes(q)) return false;
      if (branch && a.student.profile?.branch?.toLowerCase() !== branch.toLowerCase()) return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }, [d, search, branch, status]);

  const setOne = async (appId: string, to: string, studentName: string) => {
    if (!(await confirm(`Move ${studentName} to ${to}? Student will be notified.`, { title: "Update status", confirmLabel: "Update" }))) return;
    setMsg(null);
    setBusy(true);
    try {
      await applicationService.setStatus(appId, to);
      setMsg({ text: `Moved ${studentName} to ${to}. Student notified.`, type: "success" });
      reload();
    } catch (e) {
      setMsg({ text: getErrorMessage(e), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const bulk = async () => {
    if (selected.size === 0) return setMsg({ text: "Select at least one applicant.", type: "error" });
    if (!(await confirm(`Move ${selected.size} applicant(s) to ${bulkStatus}? Each student is notified.`, { title: "Bulk status update", confirmLabel: "Update" }))) return;
    setBusy(true);
    try {
      const r = await adminService.bulkStatus([...selected], bulkStatus);
      setMsg({ text: `Updated ${r.updated}${r.skipped ? `, skipped ${r.skipped} (invalid transition)` : ""}.`, type: "success" });
      setSelected(new Set());
      reload();
    } catch (e) {
      setMsg({ text: getErrorMessage(e), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  return (
    <AppLayout>
      <Link to="/admin/drives" className="mb-4 inline-block text-sm font-semibold text-indigo-600">← Back to drives</Link>
      {loading && <Skeleton lines={5} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {d && (
        <>
          <PageHeader
            title={d.title}
            subtitle={`${d.company.name} · ${d.mode} · ${d.location ?? "TBA"} · ${formatDate(d.date)}${d.deadline ? ` · Deadline ${formatDate(d.deadline)}` : ""}`}
            action={<Badge value={d.status} />}
          />
          {msg && (
            <div
              className={`mb-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                msg.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
              }`}
            >
              <span>{msg.text}</span>
              <button onClick={() => setMsg(null)} className="ml-2 font-semibold opacity-70 hover:opacity-100">Dismiss</button>
            </div>
          )}
          <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
            <Card>
              <CardTitle title="Funnel" subtitle={`${d.totalApplicants} total applicants`} />
              <div className="mt-4">
                <BarList rows={STATUSES.map((s) => ({ label: s.replace(/_/g, " "), count: d.funnel[s] ?? 0 })).filter((r) => r.count > 0)} />
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-sm">
                <p className="font-semibold text-slate-800">Bulk update</p>
                <div className="mt-2 flex gap-2">
                  <Select label="Move selected to" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </div>
                <button onClick={bulk} disabled={busy || selected.size === 0} className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {busy ? "Updating…" : `Update ${selected.size} selected`}
                </button>
              </div>
            </Card>
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setMsg(null); }}
                  placeholder="Search applicants…"
                  aria-label="Search applicants"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300"
                />
                <select
                  value={branch}
                  onChange={(e) => { setBranch(e.target.value); setMsg(null); }}
                  aria-label="Filter by branch"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All branches</option>
                  <option>Computer Science</option><option>AIDS</option><option>ECE</option><option>Mechanical</option><option>Civil</option>
                </select>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setMsg(null); }}
                  aria-label="Filter by status"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <DataTable<Applicant & { id: string }>
                rows={rows as (Applicant & { id: string })[]}
                emptyTitle="No applicants match"
                columns={[
                  {
                    key: "sel", header: "",
                    render: (a) => (
                      <input type="checkbox" aria-label={`Select ${a.student.name}`} checked={selected.has(a.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; })} className="h-4 w-4 accent-indigo-600" />
                    ),
                  },
                  {
                    key: "name", header: "Student",
                    render: (a) => (
                      <span>
                        <Link to={`/admin/students/${a.student.id}`} className="font-semibold text-indigo-700 hover:text-indigo-900">{a.student.name}</Link>
                        <span className="block text-xs text-slate-400">{a.student.email} · {a.student.profile?.branch ?? "—"} · CGPA {a.student.profile?.cgpa ?? "—"}</span>
                      </span>
                    ),
                    sortValue: (a) => a.student.name.toLowerCase(),
                  },
                  { key: "status", header: "Status", render: (a) => <Badge value={a.status} />, sortValue: (a) => a.status },
                  {
                    key: "action", header: "Move to",
                    render: (a) => (
                      <select
                        aria-label={`Change status for ${a.student.name}`}
                        value=""
                        disabled={busy}
                        onChange={(e) => {
                          const val = e.target.value;
                          e.target.value = "";
                          if (val) setOne(a.id, val, a.student.name);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                      >
                        <option value="">Set…</option>
                        {STATUSES.filter((s) => s !== a.status).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ),
                  },
                ]}
              />
              {rows.length > 0 && (
                <button onClick={toggleAll} className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  {selected.size === rows.length ? "Deselect all" : "Select all on filter"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {dialog}
    </AppLayout>
  );
}
