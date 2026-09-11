import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal, useConfirm } from "../../components/ui/Modal";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { resourceService } from "../../services";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { mockResources } from "../../data/mockData";
import type { Resource } from "../../types";

export default function AdminResourcesPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(mockResources) : resourceService.list()),
    [demoMode]
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState({ title: "", category: "Coding", type: "LINK", url: "", description: "", level: "Beginner", tags: "", company: "", featured: false });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const startCreate = () => { setEditing(null); setForm({ title: "", category: "Coding", type: "LINK", url: "", description: "", level: "Beginner", tags: "", company: "", featured: false }); setFormError(null); setOpen(true); };
  const startEdit = (r: Resource) => { setEditing(r); setForm({ title: r.title, category: r.category, type: r.type, url: r.url ?? "", description: r.description ?? "", level: r.level ?? "Beginner", tags: (r.tags ?? []).join(", "), company: r.company ?? "", featured: r.featured ?? false }); setFormError(null); setOpen(true); };

  const save = async () => {
    setFormError(null);
    if (form.title.trim().length < 3) return setFormError("Title is required.");
    if (demoMode) return setFormError("Demo mode — log in as a real admin to save.");
    setBusy(true);
    try {
      const payload = { title: form.title.trim(), category: form.category, type: form.type, url: form.url.trim() || null, description: form.description.trim() || null, level: form.level, tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean), company: form.company.trim() || null, featured: form.featured };
      if (editing) await resourceService.update(editing.id, payload);
      else await resourceService.create(payload);
      setOpen(false);
      reload();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Resource) => {
    setDeleteError(null);
    if (!(await confirm(`Delete resource "${r.title}"?`))) return;
    if (demoMode) return;
    try {
      await resourceService.remove(r.id);
      reload();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Manage Resources" subtitle="Curated preparation material for students." action={<Button onClick={startCreate}>+ Add resource</Button>} />
      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="font-semibold text-red-800 hover:text-red-900">Dismiss</button>
        </div>
      )}
      {loading && <Spinner label="Loading resources…" />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && (data ?? []).length === 0 && <EmptyState title="No resources yet" />}
      {!loading && (data ?? []).length > 0 && (
        <Table headers={["Title", "Category", "Type", "Level", "Actions"]}>
          {(data ?? []).map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold">{r.title}</td>
              <td className="px-4 py-3">{r.category}</td>
              <td className="px-4 py-3">{r.type}</td>
              <td className="px-4 py-3">{r.level ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => startEdit(r)} className="font-semibold text-indigo-600">Edit</button>
                  <button onClick={() => remove(r)} className="font-semibold text-red-600">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {open && (
        <Modal title={editing ? "Edit resource" : "Add resource"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["Coding", "Aptitude", "Interview", "Company", "Resume"].map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {["LINK", "VIDEO", "ARTICLE", "DOC", "QUIZ"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <Input label="URL (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {["Beginner", "Intermediate", "Advanced"].map((c) => <option key={c}>{c}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              <Input label="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Amazon" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
              Featured resource
            </label>
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
