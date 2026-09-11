import { Link, useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { Card, CardTitle } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton, BarList } from "../../components/ui/States";
import { Badge } from "../../components/ui/Badge";
import { useApi } from "../../hooks/useApi";
import { adminService } from "../../services";
import { formatDate } from "../../utils/format";

export default function AdminStudentDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(() => adminService.studentDetail(id!), [id]);
  const d = data as unknown as null | {
    name: string; email: string;
    profile: { cgpa: number | null; branch: string | null; year: number | null; skills: string[]; phone: string | null; college: string | null } | null;
    readiness: { score: number; grade: string; breakdown: { label: string; value: number; max: number }[]; weakAreas: string[] };
    completeness: { score: number; missing: string[] };
    resumeStrength: { score: number; suggestions: string[] };
    stats: { codingSolved: number; codingTotal: number; aptitudeAvg: number | null; quizCount: number; applicationsCount: number; interviewPracticed: number; selected: boolean };
    applications: { id: string; status: string; appliedAt: string; drive: { title: string; company: { name: string } } }[];
    quizAttempts: { id: string; category: string; score: number; total: number; takenAt: string }[];
    codingProgress: { problem: { title: string; difficulty: string }; solved: boolean }[];
    interviewProgress: { status: string; question: { category: string } }[];
    snapshots: { score: number; createdAt: string }[];
  };

  const isNotFound = error && (error.toLowerCase().includes("not found") || error.includes("404"));

  return (
    <AppLayout>
      <Link to="/admin/students" className="mb-4 inline-block text-sm font-semibold text-indigo-600">← Back to students</Link>
      {loading && <Skeleton lines={5} />}
      {error && (
        isNotFound ? (
          <EmptyState
            title="Student not found"
            hint="The student you are looking for does not exist or may have been removed."
            action={
              <Link to="/admin/students" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                Back to students list
              </Link>
            }
          />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )
      )}
      {d && (
        <>
          <PageHeader
            title={d.name}
            subtitle={d.email}
            action={d.stats.selected ? <Badge value="SELECTED" /> : <Badge value={`${d.stats.applicationsCount} applications`} />}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { t: "Readiness", v: `${d.readiness.score}/100`, s: d.readiness.grade },
              { t: "Profile", v: `${d.completeness.score}%`, s: "complete" },
              { t: "Coding", v: `${d.stats.codingSolved}/${d.stats.codingTotal}`, s: "solved" },
              { t: "Aptitude", v: d.stats.aptitudeAvg != null ? `${d.stats.aptitudeAvg}%` : "—", s: `${d.stats.quizCount} quizzes` },
            ].map((s) => (
              <Card key={s.t}><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{s.t}</p><p className="mt-1 text-3xl font-bold">{s.v}</p><p className="mt-1 text-xs text-slate-500">{s.s}</p></Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle title="Profile snapshot" />
              <dl className="mt-3 space-y-2 text-sm">
                {[["CGPA", d.profile?.cgpa ?? "—"], ["Branch", d.profile?.branch ?? "—"], ["Year", d.profile?.year ?? "—"], ["College", d.profile?.college ?? "—"], ["Phone", d.profile?.phone ?? "—"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-100 pb-1.5"><dt className="text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">{(d.profile?.skills ?? []).map((s) => <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{s}</span>)}</div>
              {d.completeness.missing.length > 0 && <p className="mt-3 text-xs text-amber-700">Missing: {d.completeness.missing.slice(0, 2).join(" · ")}</p>}
              <p className="mt-2 text-xs text-slate-500">Resume strength: <b>{d.resumeStrength.score}/100</b></p>
            </Card>
            <Card>
              <CardTitle title="Readiness breakdown" />
              <div className="mt-3"><BarList rows={d.readiness.breakdown.map((b) => ({ label: `${b.label} (${b.value}/${b.max})`, count: b.max ? Math.round((b.value / b.max) * 100) : 0 }))} max={100} /></div>
              {d.readiness.weakAreas.length > 0 && <p className="mt-3 text-xs text-amber-700">Weak: {d.readiness.weakAreas[0]}</p>}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle title={`Applications (${d.applications.length})`} />
              <div className="mt-3 space-y-2">
                {d.applications.length === 0 && <p className="text-sm text-slate-400">No applications yet.</p>}
                {d.applications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                    <span><b>{a.drive.title}</b> <span className="text-xs text-slate-400">· {a.drive.company.name} · {formatDate(a.appliedAt)}</span></span>
                    <Badge value={a.status} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardTitle title="Preparation" subtitle={`${d.codingProgress.filter((c) => c.solved).length} solved · ${d.quizAttempts.length} quizzes · ${d.interviewProgress.length} interview practiced`} />
              <div className="mt-3 space-y-1.5 text-sm">
                {d.quizAttempts.slice(0, 4).map((q) => (
                  <div key={q.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span>{q.category}</span><b>{q.score}/{q.total}</b></div>
                ))}
                {d.quizAttempts.length === 0 && <p className="text-sm text-slate-400">No quiz attempts.</p>}
              </div>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
}
