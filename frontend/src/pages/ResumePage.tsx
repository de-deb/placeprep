import { useState } from "react";
import { Plus, Printer } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { Modal, useConfirm } from "../components/ui/Modal";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { resumeService } from "../services";
import { getErrorMessage } from "../services/api";
import type { ResumeEntry, ResumeFull } from "../types";

type Kind = "experience" | "project" | "achievement" | "certification";

const KIND_LABEL: Record<Kind, string> = {
  experience: "Experience",
  project: "Projects",
  achievement: "Achievements",
  certification: "Certifications",
};

const KIND_FIELDS: Record<Kind, { key: string; label: string; multiline?: boolean; placeholder?: string }[]> = {
  experience: [
    { key: "company", label: "Company *" }, { key: "role", label: "Role *" },
    { key: "startDate", label: "Start (e.g. May 2025)" }, { key: "endDate", label: "End (or Present)" },
    { key: "description", label: "Description", multiline: true },
    { key: "technologies", label: "Technologies (comma separated)" },
  ],
  project: [
    { key: "title", label: "Title *" }, { key: "description", label: "Description", multiline: true },
    { key: "technologies", label: "Technologies (comma separated)" },
    { key: "githubUrl", label: "GitHub URL" }, { key: "liveUrl", label: "Live URL" },
    { key: "startDate", label: "Start" }, { key: "endDate", label: "End" },
  ],
  achievement: [
    { key: "title", label: "Title *" }, { key: "date", label: "Date" },
    { key: "description", label: "Description", multiline: true },
  ],
  certification: [
    { key: "name", label: "Name *" }, { key: "issuer", label: "Issuer" },
    { key: "date", label: "Date" }, { key: "credentialUrl", label: "Credential URL" },
  ],
};

export default function ResumePage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(() => resumeService.get(), [demoMode]);
  const [tab, setTab] = useState<"build" | "preview">("build");

  return (
    <AppLayout>
      <div className="no-print">
        <PageHeader
          title="Resume Center"
          subtitle={data ? `Resume strength: ${data.strength.score}/100` : "Build a placement-ready resume from your profile."}
          action={
            <div className="flex gap-2">
              <Button variant={tab === "build" ? "primary" : "secondary"} onClick={() => setTab("build")}>Build</Button>
              <Button variant={tab === "preview" ? "primary" : "secondary"} onClick={() => setTab("preview")}>Preview</Button>
              <Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print / PDF</Button>
            </div>
          }
        />
      </div>
      {loading && <Skeleton lines={5} />}
      {error && <div className="no-print"><ErrorState message={demoMode ? "Demo mode — showing sample resume." : error} onRetry={reload} /></div>}
      {(data || (demoMode && error)) && (
        <ResumeBody data={data ?? demoResume()} demo={demoMode && !data} reload={reload} tab={tab} />
      )}
      <div className="no-print mt-4 text-xs text-slate-400">
        Print tip: use Preview, then Print / PDF → Save as PDF. Personal data lives in <a className="font-semibold text-indigo-600" href="/profile">Profile</a>.
      </div>
    </AppLayout>
  );
}

function demoResume(): ResumeFull {
  return {
    user: { id: "demo", name: "Devananda", email: "student@placeprep.local", role: "STUDENT" },
    profile: {
      id: "p1", userId: "demo", cgpa: 8.4, branch: "Computer Science", year: 3,
      skills: ["JavaScript", "TypeScript", "React", "DSA", "SQL"], phone: "98765 43210",
      resumeHeadline: "B.Tech CSE '27 | Full-stack learner", location: "Chennai",
      college: "VIT Chennai", degree: "B.Tech", graduationYear: 2027,
      github: "https://github.com/devananda", linkedin: "https://linkedin.com/in/devananda", portfolio: null,
    },
    resume: {
      id: "r1", userId: "demo", summary: "B.Tech CSE student focused on full-stack development and DSA.",
      experiences: [{ id: "e1", company: "Startup XYZ", role: "Frontend Intern", startDate: "May 2025", endDate: "Jul 2025", description: "Shipped dashboard features.", technologies: ["React"] }],
      projects: [
        { id: "p1", title: "PlacePrep Tracker", description: "Readiness analytics dashboard.", technologies: ["React", "Node.js"], githubUrl: "https://github.com/devananda/placeprep", liveUrl: null },
        { id: "p2", title: "Campus Eats", description: "Food ordering app.", technologies: ["React", "Express"], githubUrl: null, liveUrl: null },
      ],
      achievements: [{ id: "a1", title: "SIH Finalist", description: "Top 10 of 300 teams.", date: "2025" }],
      certifications: [],
    },
    strength: { score: 72, suggestions: ["Link GitHub/live URLs on every project", "Add an achievement or certification"] },
  };
}

function ResumeBody({ data, demo, reload, tab }: { data: ResumeFull; demo: boolean; reload: () => void; tab: "build" | "preview" }) {
  const { confirm, dialog } = useConfirm();
  const [modal, setModal] = useState<null | { kind: Kind; entry?: ResumeEntry }>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const saveSummary = async () => {
    if (demo) return setMsg("Demo mode — log in to save.");
    try {
      await resumeService.update({ summary });
      setMsg("Summary saved.");
      setSummary(null);
      reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  const remove = async (kind: Kind, id: string) => {
    if (!(await confirm(`Delete this ${KIND_LABEL[kind].toLowerCase().slice(0, -1)} entry?`))) return;
    if (demo) return;
    try {
      await resumeService.removeEntry(kind, id);
      reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  if (tab === "preview") return <ResumePreview data={data} />;

  const sections: { kind: Kind; entries: ResumeEntry[] }[] = [
    { kind: "experience", entries: data.resume.experiences },
    { kind: "project", entries: data.resume.projects },
    { kind: "achievement", entries: data.resume.achievements },
    { kind: "certification", entries: data.resume.certifications },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <div className="space-y-6">
        <Card>
          <CardTitle title="Resume strength" subtitle={`${data.strength.score}/100`} />
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${data.strength.score >= 70 ? "bg-emerald-500" : data.strength.score >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${data.strength.score}%` }} />
          </div>
          <ul className="mt-4 space-y-2">
            {data.strength.suggestions.length === 0 && <li className="text-sm font-semibold text-emerald-700">Strong resume — keep it updated! 🎉</li>}
            {data.strength.suggestions.map((s) => (
              <li key={s} className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">• {s}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle title="Professional summary" subtitle="2–3 lines, shown at the top" />
          <Textarea label="Summary" rows={4} defaultValue={data.resume.summary ?? ""} onChange={(e) => setSummary(e.target.value)} placeholder="B.Tech CSE student focused on…" />
          <Button onClick={saveSummary} className="mt-3">Save summary</Button>
          {msg && <p className="mt-2 text-sm text-slate-500">{msg}</p>}
        </Card>
      </div>

      <div className="space-y-6">
        {sections.map(({ kind, entries }) => (
          <Card key={kind}>
            <CardTitle
              title={KIND_LABEL[kind]}
              subtitle={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
              right={
                <button onClick={() => setModal({ kind })} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                  <Plus size={14} /> Add
                </button>
              }
            />
            <div className="mt-3 space-y-2.5">
              {entries.length === 0 && <EmptyState title={`No ${KIND_LABEL[kind].toLowerCase()} yet`} hint={`Add your first ${kind} entry.`} />}
              {entries.map((en) => (
                <div key={String(en.id)} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {String(en.title ?? en.role ?? en.name ?? en.company ?? "Entry")}
                      {en.company && en.role ? ` · ${String(en.company)}` : ""}
                    </p>
                    {en.description ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{String(en.description)}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs font-semibold">
                    <button onClick={() => setModal({ kind, entry: en })} className="text-indigo-600 hover:text-indigo-700">Edit</button>
                    <button onClick={() => remove(kind, String(en.id))} className="text-red-600 hover:text-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {modal && <EntryModal kind={modal.kind} entry={modal.entry} demo={demo} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {dialog}
    </div>
  );
}

function EntryModal({ kind, entry, demo, onClose, onSaved }: { kind: Kind; entry?: ResumeEntry; demo: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const f of KIND_FIELDS[kind]) {
      const v = entry?.[f.key];
      base[f.key] = Array.isArray(v) ? (v as string[]).join(", ") : ((v as string) ?? "");
    }
    return base;
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr(null);
    const payload: Record<string, unknown> = {};
    for (const f of KIND_FIELDS[kind]) {
      const v = form[f.key].trim();
      payload[f.key] = f.key === "technologies" ? (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []) : v || null;
    }
    if (demo) return setErr("Demo mode — log in to save.");
    setBusy(true);
    try {
      if (entry) await resumeService.updateEntry(kind, String(entry.id), payload);
      else await resumeService.add(kind, payload);
      onSaved();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${entry ? "Edit" : "Add"} ${KIND_LABEL[kind].slice(0, -1).toLowerCase()}`} onClose={onClose}>
      <div className="space-y-3">
        {KIND_FIELDS[kind].map((f) =>
          f.multiline ? (
            <Textarea key={f.key} label={f.label} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
          ) : (
            <Input key={f.key} label={f.label} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
          )
        )}
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Clean one-page resume. Print CSS (index.css) hides app chrome on paper. */
export function ResumePreview({ data }: { data: ResumeFull }) {
  const p = data.profile;
  const link = (href: string | null | undefined, label: string) =>
    href ? <a href={href} target="_blank" rel="noreferrer" className="text-indigo-700 underline">{label}</a> : null;
  return (
    <Card className="print-card mx-auto max-w-3xl">
      <div className="border-b-2 border-slate-900 pb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{data.user.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{p?.resumeHeadline ?? `${p?.degree ?? ""} ${p?.branch ?? ""}`.trim()}</p>
        <p className="mt-1.5 text-xs text-slate-500">
          {[data.user.email, p?.phone, p?.location].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-xs">
          {link(p?.github, "GitHub")} {link(p?.linkedin, "LinkedIn")} {link(p?.portfolio, "Portfolio")}
        </p>
      </div>

      {data.resume.summary && (
        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Summary</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{data.resume.summary}</p>
        </section>
      )}

      <section className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Education</h3>
        <p className="mt-1 text-sm text-slate-800">
          <b>{p?.degree ?? "B.Tech"} {p?.branch ? `· ${p.branch}` : ""}</b> — {p?.college ?? "—"}
          <span className="text-slate-500"> ({p?.graduationYear ?? "—"}) · CGPA {p?.cgpa ?? "—"}</span>
        </p>
      </section>

      {(p?.skills?.length ?? 0) > 0 && (
        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Skills</h3>
          <p className="mt-1 text-sm text-slate-700">{p!.skills.join(" · ")}</p>
        </section>
      )}

      {data.resume.experiences.length > 0 && (
        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Experience</h3>
          {data.resume.experiences.map((e) => (
            <div key={String(e.id)} className="mt-2">
              <p className="text-sm font-bold text-slate-900">{String(e.role)} — {String(e.company)} <span className="font-normal text-slate-500">({String(e.startDate ?? "")} – {String(e.endDate ?? "")})</span></p>
              {e.description ? <p className="text-sm text-slate-600">{String(e.description)}</p> : null}
              {Array.isArray(e.technologies) && e.technologies.length > 0 ? <p className="text-xs text-slate-500">{(e.technologies as string[]).join(", ")}</p> : null}
            </div>
          ))}
        </section>
      )}

      {data.resume.projects.length > 0 && (
        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Projects</h3>
          {data.resume.projects.map((pr) => (
            <div key={String(pr.id)} className="mt-2">
              <p className="text-sm font-bold text-slate-900">{String(pr.title)}</p>
              {pr.description ? <p className="text-sm text-slate-600">{String(pr.description)}</p> : null}
              <p className="text-xs text-slate-500">
                {Array.isArray(pr.technologies) ? (pr.technologies as string[]).join(", ") : ""}
                {pr.githubUrl ? <> · <a className="underline" href={String(pr.githubUrl)}>GitHub</a></> : null}
                {pr.liveUrl ? <> · <a className="underline" href={String(pr.liveUrl)}>Live</a></> : null}
              </p>
            </div>
          ))}
        </section>
      )}

      {(data.resume.achievements.length > 0 || data.resume.certifications.length > 0) && (
        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Achievements & Certifications</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {data.resume.achievements.map((a) => <li key={String(a.id)}><b>{String(a.title)}</b>{a.date ? ` (${String(a.date)})` : ""}{a.description ? ` — ${String(a.description)}` : ""}</li>)}
            {data.resume.certifications.map((c) => <li key={String(c.id)}><b>{String(c.name)}</b>{c.issuer ? ` — ${String(c.issuer)}` : ""}{c.date ? ` (${String(c.date)})` : ""}</li>)}
          </ul>
        </section>
      )}
    </Card>
  );
}
