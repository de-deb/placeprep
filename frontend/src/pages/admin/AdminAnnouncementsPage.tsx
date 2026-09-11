import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal, useConfirm } from "../../components/ui/Modal";
import { Input, Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { announcementService } from "../../services";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { mockAnnouncements } from "../../data/mockData";
import { formatDate } from "../../utils/format";
import type { Announcement } from "../../types";

export default function AdminAnnouncementsPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(mockAnnouncements) : announcementService.list()),
    [demoMode]
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", body: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const startCreate = () => { setEditing(null); setForm({ title: "", body: "" }); setFormError(null); setOpen(true); };
  const startEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, body: a.body }); setFormError(null); setOpen(true); };

  const save = async () => {
    setFormError(null);
    if (form.title.trim().length < 3) return setFormError("Title is required.");
    if (!form.body.trim()) return setFormError("Body is required.");
    if (demoMode) return setFormError("Demo mode — log in as a real admin to save.");
    setBusy(true);
    try {
      if (editing) await announcementService.update(editing.id, form);
      else await announcementService.create(form);
      setOpen(false);
      reload();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: Announcement) => {
    setDeleteError(null);
    if (!(await confirm(`Delete announcement "${a.title}"?`))) return;
    if (demoMode) return;
    try {
      await announcementService.remove(a.id);
      reload();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Manage Announcements" subtitle="Official updates visible to all students." action={<Button onClick={startCreate}>+ Add announcement</Button>} />
      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="font-semibold text-red-800 hover:text-red-900">Dismiss</button>
        </div>
      )}
      {loading && <Spinner label="Loading announcements…" />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && (data ?? []).length === 0 && <EmptyState title="No announcements yet" />}
      {!loading && (data ?? []).length > 0 && (
        <Table headers={["Title", "Body", "Date", "Actions"]}>
          {(data ?? []).map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold">{a.title}</td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-500">{a.body}</td>
              <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => startEdit(a)} className="font-semibold text-indigo-600">Edit</button>
                  <button onClick={() => remove(a)} className="font-semibold text-red-600">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {open && (
        <Modal title={editing ? "Edit announcement" : "Add announcement"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Body *" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
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
