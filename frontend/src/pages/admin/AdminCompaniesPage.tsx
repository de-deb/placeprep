import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal, useConfirm } from "../../components/ui/Modal";
import { Input, Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { companyService } from "../../services";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { mockCompanies } from "../../data/mockData";
import type { Company } from "../../types";

const emptyForm = { name: "", industry: "", website: "", description: "", packageLpa: "", eligibilityCgpa: "", roles: "", topics: "", process: "" };

export default function AdminCompaniesPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(mockCompanies) : companyService.list()),
    [demoMode]
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const startCreate = () => { setEditing(null); setForm(emptyForm); setFormError(null); setOpen(true); };
  const startEdit = (c: Company) => {
    setEditing(c);
    setForm({
      name: c.name, industry: c.industry ?? "", website: c.website ?? "", description: c.description ?? "",
      packageLpa: c.packageLpa?.toString() ?? "", eligibilityCgpa: c.eligibilityCgpa?.toString() ?? "",
      roles: (c.roles ?? []).join(", "), topics: (c.topics ?? []).join(", "), process: c.process ?? "",
    });
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setFormError(null);
    if (form.name.trim().length < 2) return setFormError("Name is required.");
    if (demoMode) return setFormError("Demo mode — log in as a real admin to save.");
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        packageLpa: form.packageLpa === "" ? null : Number(form.packageLpa),
        eligibilityCgpa: form.eligibilityCgpa === "" ? null : Number(form.eligibilityCgpa),
        roles: form.roles.split(",").map((s) => s.trim()).filter(Boolean),
        topics: form.topics.split(",").map((s) => s.trim()).filter(Boolean),
        process: form.process.trim() || null,
      };
      if (editing) await companyService.update(editing.id, payload);
      else await companyService.create(payload);
      setOpen(false);
      reload();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Company) => {
    setDeleteError(null);
    if (!(await confirm(`Delete company "${c.name}"? This also removes its drives.`))) return;
    if (demoMode) return;
    try {
      await companyService.remove(c.id);
      reload();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Manage Companies" subtitle="Add hiring partners, eligibility and topics." action={<Button onClick={startCreate}>+ Add company</Button>} />
      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="font-semibold text-red-800 hover:text-red-900">Dismiss</button>
        </div>
      )}
      {loading && <Spinner label="Loading companies…" />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && (data ?? []).length === 0 && <EmptyState title="No companies yet" hint="Add your first hiring partner." />}
      {!loading && (data ?? []).length > 0 && (
        <Table headers={["Name", "Industry", "Package", "Eligibility", "Actions"]}>
          {(data ?? []).map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold">{c.name}</td>
              <td className="px-4 py-3 text-slate-500">{c.industry ?? "—"}</td>
              <td className="px-4 py-3">{c.packageLpa != null ? `${c.packageLpa} LPA` : "—"}</td>
              <td className="px-4 py-3">{c.eligibilityCgpa != null ? `${c.eligibilityCgpa}+` : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="font-semibold text-indigo-600 hover:text-indigo-700">Edit</button>
                  <button onClick={() => remove(c)} className="font-semibold text-red-600 hover:text-red-700">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {open && (
        <Modal title={editing ? "Edit company" : "Add company"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
              <Input label="Package (LPA)" value={form.packageLpa} onChange={(e) => setForm({ ...form, packageLpa: e.target.value })} inputMode="decimal" />
              <Input label="Eligibility CGPA" value={form.eligibilityCgpa} onChange={(e) => setForm({ ...form, eligibilityCgpa: e.target.value })} inputMode="decimal" />
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief summary about the company..." />
            <Input label="Roles (comma separated)" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />
            <Input label="Topics (comma separated)" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} />
            <Textarea label="Process" value={form.process} onChange={(e) => setForm({ ...form, process: e.target.value })} />
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
