import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton, BarList } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { codingService } from "../services";
import { timeAgo } from "../utils/format";
import type { CodingSummary } from "../types";

export default function CodingProgressPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () =>
      demoMode
        ? Promise.resolve({
            total: 6, solved: 2, bookmarked: 2, pct: 33,
            submissions: 4, accepted: 2, acceptanceRate: 50, activeDays: 3,
            byDifficulty: [
              { difficulty: "Easy", total: 3, solved: 2, pct: 67 },
              { difficulty: "Medium", total: 2, solved: 0, pct: 0 },
              { difficulty: "Hard", total: 1, solved: 0, pct: 0 },
            ],
            strongestTags: [{ tag: "Stack", total: 1, solved: 1, pct: 100 }],
            weakestTags: [{ tag: "Graphs", total: 1, solved: 0, pct: 0 }, { tag: "Sorting", total: 1, solved: 0, pct: 0 }],
            weakestTag: "Graphs",
            recentAttempts: [],
          } as CodingSummary)
        : codingService.summary(),
    [demoMode]
  );

  return (
    <AppLayout>
      <Link to="/coding" className="mb-4 inline-block text-sm font-semibold text-indigo-600">← Back to problems</Link>
      <PageHeader title="Coding Analytics" subtitle="Difficulty breakdown, topic mastery and recent attempts." />
      {loading && <Skeleton lines={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && !data && <EmptyState title="No data yet" />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Solved</p><p className="mt-1 text-3xl font-bold">{data.solved}<span className="text-lg text-slate-400">/{data.total}</span></p></Card>
            <Card><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Acceptance</p><p className="mt-1 text-3xl font-bold">{data.acceptanceRate != null ? `${data.acceptanceRate}%` : "—"}</p><p className="mt-1 text-xs text-slate-400">{data.accepted}/{data.submissions} judged submissions</p></Card>
            <Card><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Completion</p><p className="mt-1 text-3xl font-bold">{data.pct}%</p></Card>
            <Card><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Bookmarked</p><p className="mt-1 text-3xl font-bold">{data.bookmarked}</p></Card>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle title="By difficulty" />
              <div className="mt-4">
                <BarList rows={data.byDifficulty.map((d) => ({ label: `${d.difficulty} (${d.solved}/${d.total})`, count: d.pct, tone: d.difficulty === "Easy" ? "bg-emerald-500" : d.difficulty === "Medium" ? "bg-amber-500" : "bg-red-500" }))} max={100} />
              </div>
            </Card>
            <Card>
              <CardTitle title="Topic mastery" subtitle={data.weakestTag ? `Weakest: ${data.weakestTag} — practice it next` : "All topics practiced"} />
              <div className="mt-4">
                <BarList rows={[...data.weakestTags, ...data.strongestTags].slice(0, 6).map((t) => ({ label: `${t.tag} (${t.solved}/${t.total})`, count: t.pct }))} max={100} />
              </div>
            </Card>
          </div>
          <Card className="mt-6">
            <CardTitle title="Recent attempts" subtitle="Your self-check history" />
            <div className="mt-3 space-y-2">
              {data.recentAttempts.length === 0 && <p className="text-sm text-slate-400">No attempts yet — open a problem and submit a self-check.</p>}
              {data.recentAttempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                  <span className="font-medium text-slate-700">{a.problem?.title ?? "Problem"}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                    <Badge value={a.verdict} />
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
