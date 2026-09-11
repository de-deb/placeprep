import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal, useConfirm } from "../../components/ui/Modal";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { companyService, driveService } from "../../services";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { mockDrives } from "../../data/mockData";
import { formatDate } from "../../utils/format";

import type { Drive } from "../../types";

export default function AdminDrivesPage() {
  const { demoMode } = useAuth();
  const drivesApi = useApi(() => (demoMode ? Promise.resolve(mockDrives) : driveService.list()), [demoMode]);
  const companiesApi = useApi(() => (demoMode ? Promise.resolve([] as never[]) : companyService.list()), [demoMode]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", companyId: "", title: "", date: "", deadline: "", location: "", mode: "On-campus", eligibility: "", description: "", status: "OPEN", minCgpa: "", allowedBranches: "", allowedYears: "", requiredSkills: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const companies = (companiesApi.data as { id: string; name: string }[] ?? []);

  const startCreate = () => {
    setForm({ id: "", companyId: companies[0]?.id ?? "", title: "", date: "", deadline: "", location: "", mode: "On-campus", eligibility: "", description: "", status: "OPEN", minCgpa: "", allowedBranches: "", allowedYears: "", requiredSkills: "" });
    setFormError(null);
    setOpen(true);
  };
  const startEdit = (d: Drive) => {
    setForm({
      id: d.id, companyId: d.companyId, title: d.title,
      date: d.date.slice(0, 16), deadline: (d.deadline ?? "").slice(0, 16),
      location: d.location ?? "", mode: d.mode ?? "On-campus",
      eligibility: d.eligibility ?? "", description: d.description ?? "", status: d.status,
      minCgpa: d.minCgpa?.toString() ?? "", allowedBranches: (d.allowedBranches ?? []).join(", "),
      allowedYears: (d.allowedYears ?? []).join(", "), requiredSkills: (d.requiredSkills ?? []).join(", "),
    });
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setFormError(null);
    if (!form.companyId) return setFormError("Choose a company.");
    if (form.title.trim().length < 3) return setFormError("Title is required.");
    if (!form.date) return setFormError("Date is required.");
    if (demoMode) return setFormError("Demo mode — log in as a real admin to save.");
    setBusy(true);
    try {
      const payload = {
        companyId: form.companyId, title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        location: form.location.trim() || null, mode: form.mode,
        eligibility: form.eligibility.trim() || null, description: form.description.trim() || null,
        status: form.status,
        minCgpa: form.minCgpa === "" ? null : Number(form.minCgpa),
        allowedBranches: form.allowedBranches.split(",").map((s) => s.trim()).filter(Boolean),
        allowedYears: form.allowedYears.split(",").map((s) => Number(s.trim())).filter((n) => n > 0 && Number.isInteger(n)),
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (form.id) await driveService.update(form.id, payload);
      else await driveService.create(payload);
      setOpen(false);
      drivesApi.reload();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, title: string) => {
    setDeleteError(null);
    if (!(await confirm(`Delete drive "${title}"? Applications will also be removed.`))) return;
    if (demoMode) return;
    try {
      await driveService.remove(id);
      drivesApi.reload();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Manage Drives"
        subtitle="Create upcoming hiring drives and deadlines."
        action={
          <Button onClick={startCreate} disabled={companiesApi.loading}>
            + Add drive
          </Button>
        }
      />
      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="font-semibold text-red-800 hover:text-red-900">Dismiss</button>
        </div>
      )}
      {drivesApi.loading && <Spinner label="Loading drives…" />}
      {drivesApi.error && !demoMode && !drivesApi.data && <ErrorState message={drivesApi.error} onRetry={drivesApi.reload} />}
      {!drivesApi.loading && (drivesApi.data ?? []).length === 0 && <EmptyState title="No drives yet" />}
      {!drivesApi.loading && (drivesApi.data ?? []).length > 0 && (
        <Table headers={["Title", "Company", "Date", "Status", "Actions"]}>
          {(drivesApi.data ?? []).map((d) => (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold">{d.title}</td>
              <td className="px-4 py-3">{d.company?.name ?? "—"}</td>
              <td className="px-4 py-3">{formatDate(d.date)}</td>
              <td className="px-4 py-3"><Badge value={d.status} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link to={`/admin/drives/${d.id}`} className="font-semibold text-emerald-600 hover:text-emerald-700">View</Link>
                  <button onClick={() => startEdit(d)} className="font-semibold text-indigo-600">Edit</button>
                  <button onClick={() => remove(d.id, d.title)} className="font-semibold text-red-600">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {open && (
        <Modal title={form.id ? "Edit drive" : "Add drive"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Select label="Company *" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              <option value="">{companiesApi.loading ? "Loading companies…" : "Select company"}</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="TCS Ninja — 2027 Batch" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date *" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input label="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Select label="Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option>On-campus</option><option>Off-campus</option><option>Remote</option>
              </Select>
            </div>
            <Input label="Eligibility (human-readable)" value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} placeholder="CGPA ≥ 6.0" />
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Structured rules (auto-checked)</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Min CGPA" value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} placeholder="6.0" inputMode="decimal" />
                <Input label="Branches (comma separated, blank = all)" value={form.allowedBranches} onChange={(e) => setForm({ ...form, allowedBranches: e.target.value })} placeholder="Computer Science, AIDS" />
                <Input label="Years (e.g. 3, 4)" value={form.allowedYears} onChange={(e) => setForm({ ...form, allowedYears: e.target.value })} placeholder="3, 4" />
                <Input label="Required skills (comma separated)" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="DSA" />
              </div>
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>OPEN</option><option>UPCOMING</option><option>CLOSED</option>
            </Select>
            {formError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </Modal>
      )}
      {dialog}
    </AppLayout>
  );
}
