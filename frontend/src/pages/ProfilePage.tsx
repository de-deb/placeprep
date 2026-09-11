import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { profileService } from "../services";
import { getErrorMessage } from "../services/api";

const EMPTY = {
  cgpa: "", branch: "", year: "", skills: "", phone: "", resumeHeadline: "",
  location: "", college: "", degree: "", graduationYear: "", github: "", linkedin: "", portfolio: "",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => profileService.get(), []);
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const profile = data;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const startEdit = () => {
    if (!profile) return;
    setForm({
      cgpa: profile.cgpa?.toString() ?? "",
      branch: profile.branch ?? "",
      year: profile.year?.toString() ?? "",
      skills: (profile.skills ?? []).join(", "),
      phone: profile.phone ?? "",
      resumeHeadline: profile.resumeHeadline ?? "",
      location: profile.location ?? "",
      college: profile.college ?? "",
      degree: profile.degree ?? "",
      graduationYear: profile.graduationYear?.toString() ?? "",
      github: profile.github ?? "",
      linkedin: profile.linkedin ?? "",
      portfolio: profile.portfolio ?? "",
    });
    setTouched(true);
    setMessage(null);
  };

  const onSave = async () => {
    setSaveError(null);
    const cgpa = form.cgpa === "" ? null : Number(form.cgpa);
    if (form.cgpa !== "" && (Number.isNaN(cgpa!) || cgpa! < 0 || cgpa! > 10)) {
      setSaveError("CGPA must be between 0 and 10.");
      return;
    }
    const year = form.year === "" ? null : Number(form.year);
    if (form.year !== "" && (!Number.isInteger(year!) || year! < 1 || year! > 5)) {
      setSaveError("Year must be between 1 and 5.");
      return;
    }
    for (const [k, label] of [["github", "GitHub"], ["linkedin", "LinkedIn"], ["portfolio", "Portfolio"]] as const) {
      const v = form[k].trim();
      if (v && !/^https?:\/\/.+\..+/.test(v)) {
        setSaveError(`${label} must be a valid URL starting with http(s)://.`);
        return;
      }
    }
    setSaving(true);
    try {
      await profileService.update({
        cgpa, year,
        branch: form.branch.trim() || null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        phone: form.phone.trim() || null,
        resumeHeadline: form.resumeHeadline.trim() || null,
        location: form.location.trim() || null,
        college: form.college.trim() || null,
        degree: form.degree.trim() || null,
        graduationYear: form.graduationYear === "" ? null : Number(form.graduationYear),
        github: form.github.trim() || null,
        linkedin: form.linkedin.trim() || null,
        portfolio: form.portfolio.trim() || null,
      });
      setMessage("Profile saved successfully.");
      setTouched(false);
      reload();
    } catch (e) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Profile"
        subtitle="Academics, contact and links — drives and resume both read from here."
        action={<Link to="/resume" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">Open Resume Center →</Link>}
      />
      {loading && <Spinner label="Loading profile…" />}
      {error && !loading && <ErrorState message={error} onRetry={reload} />}
      {profile && !loading && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                {(user?.name ?? "S").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <p className="mt-1 text-xs font-semibold text-indigo-600">{user?.role}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2"><dt className="text-slate-500">CGPA</dt><dd className="font-semibold">{profile.cgpa ?? "—"}</dd></div>
              <div className="flex justify-between border-b border-slate-100 pb-2"><dt className="text-slate-500">Branch</dt><dd className="font-semibold">{profile.branch ?? "—"}</dd></div>
              <div className="flex justify-between border-b border-slate-100 pb-2"><dt className="text-slate-500">Year</dt><dd className="font-semibold">{profile.year ?? "—"}</dd></div>
              <div className="flex justify-between border-b border-slate-100 pb-2"><dt className="text-slate-500">College</dt><dd className="font-semibold">{profile.college ?? "—"}</dd></div>
              <div className="flex justify-between border-b border-slate-100 pb-2"><dt className="text-slate-500">Phone</dt><dd className="font-semibold">{profile.phone ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-semibold">{profile.location ?? "—"}</dd></div>
            </dl>
            {(profile.skills ?? []).length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((s) => <span key={s} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{s}</span>)}
              </div>
            ) : (
              <div className="mt-4"><EmptyState title="No skills added" hint="Add skills so readiness and weak-area detection work." /></div>
            )}
            {(profile.github || profile.linkedin || profile.portfolio) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600 hover:bg-slate-200">GitHub ↗</a>}
                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600 hover:bg-slate-200">LinkedIn ↗</a>}
                {profile.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600 hover:bg-slate-200">Portfolio ↗</a>}
              </div>
            )}
          </Card>

          <Card>
            {!touched ? (
              <div>
                <p className="text-sm text-slate-500">Headline</p>
                <p className="mt-1 font-medium text-slate-800">{profile.resumeHeadline ?? "—"}</p>
                <p className="mt-4 text-sm text-slate-500">Education</p>
                <p className="mt-1 font-medium text-slate-800">{[profile.degree, profile.branch, profile.college].filter(Boolean).join(" · ") || "—"}{profile.graduationYear ? ` (${profile.graduationYear})` : ""}</p>
                <Button onClick={startEdit} className="mt-5">Edit profile</Button>
                {message && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Academics</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="College" value={form.college} onChange={set("college")} placeholder="VIT Chennai" />
                    <Input label="Degree" value={form.degree} onChange={set("degree")} placeholder="B.Tech" />
                    <Input label="Branch" value={form.branch} onChange={set("branch")} placeholder="Computer Science" />
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Year" value={form.year} onChange={set("year")}>
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}</option>)}
                      </Select>
                      <Input label="Grad. year" value={form.graduationYear} onChange={set("graduationYear")} placeholder="2027" inputMode="numeric" />
                    </div>
                    <Input label="CGPA (0–10)" value={form.cgpa} onChange={set("cgpa")} placeholder="8.4" inputMode="decimal" />
                    <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="98765 43210" />
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Contact & links</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Location" value={form.location} onChange={set("location")} placeholder="Chennai" />
                    <div />
                    <Input label="GitHub URL" value={form.github} onChange={set("github")} placeholder="https://github.com/you" inputMode="url" />
                    <Input label="LinkedIn URL" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/you" inputMode="url" />
                    <Input label="Portfolio URL" value={form.portfolio} onChange={set("portfolio")} placeholder="https://you.dev" inputMode="url" />
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Skills & headline</p>
                  <div className="space-y-4">
                    <Input label="Skills (comma separated)" value={form.skills} onChange={set("skills")} placeholder="JavaScript, React, SQL" />
                    <Textarea label="Resume headline" value={form.resumeHeadline} onChange={set("resumeHeadline")} placeholder="B.Tech CSE '27 | Full-stack learner" />
                  </div>
                </div>
                {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
                <div className="flex gap-3">
                  <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                  <Button variant="secondary" onClick={() => setTouched(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
