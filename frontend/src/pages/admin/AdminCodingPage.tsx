import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { Modal, useConfirm } from "../../components/ui/Modal";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/States";
import { Badge } from "../../components/ui/Badge";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface AdminProblem {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  source: string;
  executionSupported: boolean;
  _count: { testCases: number; submissions: number };
}

interface Lang {
  code: string;
  name: string;
  active: boolean;
}

function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return p.then((r) => r.data.data);
}
const adminCoding = {
  list: (params: Record<string, string>) => unwrap<AdminProblem[]>(api.get("/api/admin/coding/problems", { params })),
  create: (input: Record<string, unknown>) => unwrap<unknown>(api.post("/api/admin/coding/problems", input)),
  update: (id: string, input: Record<string, unknown>) => unwrap<unknown>(api.put(`/api/admin/coding/problems/${id}`, input)),
  replaceTests: (id: string, testCases: unknown[]) => unwrap<unknown>(api.put(`/api/admin/coding/problems/${id}/test-cases`, { testCases })),
  remove: (id: string) => unwrap<unknown>(api.delete(`/api/admin/coding/problems/${id}`)),
  toggleLang: (code: string, active: boolean) => unwrap<unknown>(api.put(`/api/admin/coding/languages/${code}`, { active })),
};

const EMPTY = {
  title: "", difficulty: "Easy", tags: "", description: "", constraints: "", inputFormat: "",
  outputFormat: "", explanation: "", hint: "", estimatedMinutes: "", companies: "",
  expectedTimeComplexity: "", expectedSpaceComplexity: "",
  starterPython: "", starterCpp: "", starterJava: "",
  sampleInput: "", sampleExpected: "", hiddenInput: "", hiddenExpected: "",
};

export default function AdminCodingPage() {
  const { demoMode } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve([] as AdminProblem[]) : adminCoding.list({ search: query, source })),
    [query, source, demoMode]
  );
  const langsApi = useApi(() => (demoMode ? Promise.resolve([] as Lang[]) : api.get("/api/coding/languages").then((r) => r.data.data as Lang[])), [demoMode]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProblem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  };

  const startEdit = async (p: AdminProblem) => {
    setEditing(p);
    setFormError(null);
    try {
      const detail = await unwrap<{
        title: string;
        difficulty: string;
        tags?: string[];
        description?: string;
        constraints?: string | null;
        inputFormat?: string | null;
        outputFormat?: string | null;
        explanation?: string | null;
        hint?: string | null;
        estimatedMinutes?: number | null;
        companies?: string[];
        expectedTimeComplexity?: string | null;
        expectedSpaceComplexity?: string | null;
        starterCode?: { python?: string; cpp?: string; java?: string } | null;
        sampleInput?: string | null;
        sampleOutput?: string | null;
      }>(api.get(`/api/coding/problems/${p.id}`));

      setForm({
        title: detail.title ?? p.title,
        difficulty: detail.difficulty ?? p.difficulty,
        tags: (detail.tags ?? p.tags ?? []).join(", "),
        description: detail.description ?? "",
        constraints: detail.constraints ?? "",
        inputFormat: detail.inputFormat ?? "",
        outputFormat: detail.outputFormat ?? "",
        explanation: detail.explanation ?? "",
        hint: detail.hint ?? "",
        estimatedMinutes: detail.estimatedMinutes?.toString() ?? "",
        companies: (detail.companies ?? []).join(", "),
        expectedTimeComplexity: detail.expectedTimeComplexity ?? "",
        expectedSpaceComplexity: detail.expectedSpaceComplexity ?? "",
        starterPython: detail.starterCode?.python ?? "",
        starterCpp: detail.starterCode?.cpp ?? "",
        starterJava: detail.starterCode?.java ?? "",
        sampleInput: detail.sampleInput ?? "",
        sampleExpected: detail.sampleOutput ?? "",
        hiddenInput: "",
        hiddenExpected: "",
      });
      setOpen(true);
    } catch {
      setForm({
        ...EMPTY,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags.join(", "),
      });
      setOpen(true);
    }
  };

  const save = async () => {
    setFormError(null);
    if (form.title.trim().length < 3) return setFormError("Title is required.");
    if (form.description.trim().length < 10) return setFormError("Description must be at least 10 characters.");
    if (demoMode) return setFormError("Demo mode — log in as a real admin to save.");

    setBusy(true);
    try {
      if (editing) {
        await adminCoding.update(editing.id, {
          title: form.title.trim(),
          difficulty: form.difficulty,
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          description: form.description.trim(),
          constraints: form.constraints.trim() || null,
          inputFormat: form.inputFormat.trim() || null,
          outputFormat: form.outputFormat.trim() || null,
          explanation: form.explanation.trim() || null,
          hint: form.hint.trim() || null,
          estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
          companies: form.companies.split(",").map((s) => s.trim()).filter(Boolean),
          expectedTimeComplexity: form.expectedTimeComplexity.trim() || null,
          expectedSpaceComplexity: form.expectedSpaceComplexity.trim() || null,
          starterCode: {
            ...(form.starterPython.trim() ? { python: form.starterPython } : {}),
            ...(form.starterCpp.trim() ? { cpp: form.starterCpp } : {}),
            ...(form.starterJava.trim() ? { java: form.starterJava } : {}),
          },
        });
      } else {
        const testCases = [
          { input: form.sampleInput, expectedOutput: form.sampleExpected.trim(), isSample: true, order: 0 },
          ...(form.hiddenInput || form.hiddenExpected
            ? [{ input: form.hiddenInput, expectedOutput: form.hiddenExpected.trim(), isSample: false, order: 1 }]
            : []),
        ];
        if (!testCases[0].expectedOutput) return setFormError("Sample expected output is required.");

        await adminCoding.create({
          title: form.title.trim(),
          difficulty: form.difficulty,
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          description: form.description.trim(),
          constraints: form.constraints.trim() || null,
          inputFormat: form.inputFormat.trim() || null,
          outputFormat: form.outputFormat.trim() || null,
          explanation: form.explanation.trim() || null,
          hint: form.hint.trim() || null,
          estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
          companies: form.companies.split(",").map((s) => s.trim()).filter(Boolean),
          expectedTimeComplexity: form.expectedTimeComplexity.trim() || null,
          expectedSpaceComplexity: form.expectedSpaceComplexity.trim() || null,
          starterCode: {
            ...(form.starterPython.trim() ? { python: form.starterPython } : {}),
            ...(form.starterCpp.trim() ? { cpp: form.starterCpp } : {}),
            ...(form.starterJava.trim() ? { java: form.starterJava } : {}),
          },
          executionSupported: true,
          testCases,
        });
      }
      setOpen(false);
      setForm(EMPTY);
      setEditing(null);
      reload();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleExec = async (p: AdminProblem) => {
    if (demoMode) return setMsg("Demo mode — log in as a real admin.");
    try {
      await adminCoding.update(p.id, { executionSupported: !p.executionSupported });
      reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  const remove = async (p: AdminProblem) => {
    if (!(await confirm(`Delete "${p.title}"? Blocked automatically if it has submissions or attempts.`, { title: "Delete problem" }))) return;
    if (demoMode) return setMsg("Demo mode — log in as a real admin.");
    try {
      await adminCoding.remove(p.id);
      reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  const toggleLang = async (l: Lang) => {
    if (demoMode) return setMsg("Demo mode — log in as a real admin.");
    try {
      await adminCoding.toggleLang(l.code, !l.active);
      langsApi.reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = search.trim();
    if (trimmed !== query) {
      setQuery(trimmed);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (!val && query) {
      setQuery("");
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Coding Catalog"
        subtitle={`${data?.length ?? 0} problems · internal run on the judge, external link out`}
        action={
          <>
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search title… (Enter)"
                aria-label="Search problems"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300"
              />
            </form>
            <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source filter" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All sources</option><option value="INTERNAL">Internal</option><option value="CODEFORCES">Codeforces</option>
            </select>
            <Button onClick={startCreate}>+ Add problem</Button>
          </>
        }
      />
      {msg && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{msg}</p>}
      {loading && <Skeleton lines={5} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (data ?? []).length === 0 && (
        <EmptyState title={demoMode ? "Demo mode" : "No problems found"} hint={demoMode ? "Log in as a real admin to manage the catalog." : "Add an internal problem or run the Codeforces ingestion."} />
      )}
      {!loading && !error && (data ?? []).length > 0 && (
        <DataTable<AdminProblem & { id: string }>
          rows={(data ?? []) as (AdminProblem & { id: string })[]}
          emptyTitle="No problems match"
          columns={[
            { key: "title", header: "Title", render: (p) => (<span><b>{p.title}</b><span className="block text-xs text-slate-400">{p.source} · {p.tags.slice(0, 3).join(", ")}</span></span>), sortValue: (p) => p.title.toLowerCase() },
            { key: "diff", header: "Level", render: (p) => <Badge value={p.difficulty} />, sortValue: (p) => p.difficulty },
            { key: "tests", header: "Tests", render: (p) => <span className="text-slate-600">{p._count.testCases} cases</span>, sortValue: (p) => p._count.testCases },
            { key: "subs", header: "Submissions", render: (p) => <span className="text-slate-600">{p._count.submissions}</span>, sortValue: (p) => p._count.submissions },
            {
              key: "exec", header: "Execution",
              render: (p) => (
                <button onClick={() => toggleExec(p)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${p.executionSupported ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
                  {p.executionSupported ? "On" : "Off"}
                </button>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (p) => (
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="font-semibold text-indigo-600 hover:text-indigo-700">Edit</button>
                  <button onClick={() => remove(p)} className="font-semibold text-red-600 hover:text-red-700">Delete</button>
                </div>
              ),
            },
          ]}
        />
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900">Execution languages</h3>
        <p className="mt-1 text-sm text-slate-500">Toggling off rejects new runs/submits with a clear message.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(langsApi.data ?? []).length === 0 && <span className="text-sm text-slate-400">Loading…</span>}
          {(langsApi.data ?? []).map((l) => (
            <button key={l.code} onClick={() => toggleLang(l)} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${l.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-400"}`}>
              {l.name}: {l.active ? "On" : "Off"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Runtimes run on the self-hosted Piston sandbox (python, gcc, java). See README for setup.</p>
      </div>

      {open && (
        <Modal title={editing ? "Edit problem" : "Add internal problem"} onClose={() => setOpen(false)} wide>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </Select>
            </div>
            <Textarea label="Description * (include I/O format)" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Arrays, HashMap" />
              <Input label="Companies (comma separated)" value={form.companies} onChange={(e) => setForm({ ...form, companies: e.target.value })} placeholder="Amazon, TCS" />
              <Input label="Constraints" value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} />
              <Input label="Estimated minutes" value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })} inputMode="numeric" />
              {!editing && (
                <>
                  <Input label="Sample input" value={form.sampleInput} onChange={(e) => setForm({ ...form, sampleInput: e.target.value })} />
                  <Input label="Sample expected output *" value={form.sampleExpected} onChange={(e) => setForm({ ...form, sampleExpected: e.target.value })} />
                  <Input label="Hidden input" value={form.hiddenInput} onChange={(e) => setForm({ ...form, hiddenInput: e.target.value })} />
                  <Input label="Hidden expected output" value={form.hiddenExpected} onChange={(e) => setForm({ ...form, hiddenExpected: e.target.value })} />
                </>
              )}
            </div>
            <Textarea label="Hint" value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} rows={2} />
            <Textarea label="Explanation" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} />
            {formError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create problem"}</Button>
            </div>
          </div>
        </Modal>
      )}
      {dialog}
    </AppLayout>
  );
}
