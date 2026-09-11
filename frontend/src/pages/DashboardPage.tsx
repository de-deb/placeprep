import { ArrowRight, Bell, BookOpen, BriefcaseBusiness, CheckCircle2, Code2, Flame, Target, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import { Card, CardTitle } from "../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton, BarList, Sparkline } from "../components/ui/States";
import { Badge, Urgency } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { dashboardService } from "../services";
import { mockDashboard } from "../data/mockData";
import type { DashboardData } from "../types";
import { formatDate, timeAgo } from "../utils/format";

const urgencyLabel: Record<string, { level: "normal" | "soon" | "today" | "closed"; label: string }> = {
  normal: { level: "normal", label: "Open" },
  soon: { level: "soon", label: "Closing soon" },
  today: { level: "today", label: "Deadline today" },
  closed: { level: "closed", label: "Closed" },
};

export default function DashboardPage() {
  const { user, demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(mockDashboard(user?.name ?? "Student")) : dashboardService.get()),
    [demoMode]
  );

  return (
    <AppLayout>
      {loading && (
        <>
          <Skeleton lines={2} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} lines={2} />)}
          </div>
        </>
      )}
      {error && !loading && <ErrorState message={error} onRetry={reload} />}
      {data && !loading && <CommandCenter data={data} />}
    </AppLayout>
  );
}

function CommandCenter({ data }: { data: DashboardData }) {
  const first = data.user.name.split(" ")[0];
  const change = data.trend.change;
  return (
    <>
      {/* Header: greeting + grade + completeness + headline recommendation */}
      <PageHeader
        title={`Good to see you, ${first} 👋`}
        subtitle={`${data.readiness.grade} · Readiness ${data.readiness.score}/100 · Profile ${data.completeness.score}% complete`}
        action={
          <Link to="/coding" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
            Continue Preparation <ArrowRight size={17} />
          </Link>
        }
      />
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
        <Zap size={18} className="mt-0.5 shrink-0 text-indigo-600" />
        <p className="text-sm text-indigo-900"><b>Next best move:</b> {data.headline}</p>
      </div>

      {/* Readiness command card */}
      <Card className="border-indigo-100">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Readiness</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-slate-900">{data.readiness.score}<span className="text-xl text-slate-400">/100</span></p>
            <div className="mt-2 flex items-center justify-center gap-2 lg:justify-start">
              <Badge value={data.readiness.grade} />
              {change !== 0 && (
                <span className={`text-xs font-bold ${change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {change > 0 ? "▲" : "▼"} {Math.abs(change)} vs last
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="space-y-2.5">
              {data.readiness.breakdown.map((b) => (
                <div key={b.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{b.label}</span>
                    <span className="font-bold text-slate-800">{b.value}/{b.max}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${b.max ? (b.value / b.max) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {data.readiness.strongest && <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Strongest: {data.readiness.strongest.label}</span>}
              {data.readiness.weakest && <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">Weakest: {data.readiness.weakest.label}</span>}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Sparkline points={data.trend.points.map((p) => p.score)} />
            <p className="text-xs text-slate-400">14-day trend</p>
          </div>
        </div>
      </Card>

      {/* Preparation overview */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Coding" value={`${data.stats.problemsSolved}/${data.stats.problemsTotal}`} description={`${data.stats.codingPct}% complete · ${data.stats.bookmarked} saved`} icon={Code2} iconClassName="bg-emerald-50 text-emerald-600" />
        <StatCard title="Aptitude" value={data.stats.aptitudeAvg != null ? `${data.stats.aptitudeAvg}%` : "—"} description={`${data.stats.quizCount} quizzes taken`} icon={Trophy} iconClassName="bg-amber-50 text-amber-600" />
        <StatCard title="Applications" value={String(data.stats.applicationsCount)} description={`${data.stats.upcomingCount} drives open`} icon={Flame} iconClassName="bg-orange-50 text-orange-600" />
        <StatCard title="Profile" value={`${data.completeness.score}%`} description={data.completeness.missing[0] ?? "Complete"} icon={Target} iconClassName="bg-indigo-50 text-indigo-600" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        {/* Next best actions */}
        <Card>
          <CardTitle title="Your next best actions" subtitle="Generated from your actual data" />
          <div className="mt-4 space-y-2.5">
            {data.recommendations.length === 0 && <EmptyState title="All clear!" hint="You're on track in every area." />}
            {data.recommendations.map((r, i) => (
              <Link key={r.id} to={r.link} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/50">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{r.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{r.detail}</span>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Opportunities with urgency + eligibility */}
        <Card>
          <CardTitle title="Upcoming opportunities" subtitle="Eligibility checked against your profile" right={<Link to="/drives" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</Link>} />
          <div className="mt-4 space-y-3">
            {data.opportunities.length === 0 && <EmptyState title="No open drives right now" hint="Check back soon or review preparation." />}
            {data.opportunities.map((o) => {
              const u = urgencyLabel[o.urgency] ?? urgencyLabel.normal;
              return (
                <div key={o.id} className="rounded-xl border border-slate-100 p-3.5 transition hover:border-indigo-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{o.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{o.company?.name} · {o.deadline ? `Due ${formatDate(o.deadline)}` : "No deadline"}</p>
                    </div>
                    <Urgency level={u.level} label={u.label} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {o.applied
                      ? <Badge value="APPLIED" />
                      : o.eligibilityResult.eligible
                        ? <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Eligible ✓</span>
                        : <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200" title={o.eligibilityResult.reasons.join("; ")}>Not eligible</span>}
                    {!o.eligibilityResult.eligible && o.eligibilityResult.reasons[0] && (
                      <span className="text-xs text-slate-400">{o.eligibilityResult.reasons[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Activity */}
        <Card>
          <CardTitle title="Preparation activity" subtitle="Your latest moves" />
          <div className="mt-4 divide-y divide-slate-100">
            {data.activity.length === 0 && <EmptyState title="No activity yet" hint="Solve a problem or take a quiz to get started." />}
            {data.activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {a.type === "coding" ? <Code2 size={17} /> : a.type === "aptitude" ? <BookOpen size={17} /> : <BriefcaseBusiness size={17} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.detail} · {timeAgo(a.at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weak areas + announcements */}
        <div className="space-y-6">
          <Card>
            <CardTitle title="Weak areas to fix" subtitle={`${data.readiness.weakAreas.length} focus items`} />
            <div className="mt-3 space-y-2">
              {data.readiness.weakAreas.length === 0 && <p className="text-sm text-emerald-700">No weak areas — excellent balance. 🎯</p>}
              {data.readiness.weakAreas.map((w) => (
                <p key={w} className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">• {w}</p>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle title="Announcements" subtitle="From the placement cell" right={<Link to="/announcements" className="text-sm font-semibold text-indigo-600">See all</Link>} />
            <div className="mt-3 space-y-2.5">
              {data.announcements.length === 0 && <p className="text-sm text-slate-400">No announcements.</p>}
              {data.announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <Bell size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="line-clamp-1 text-xs text-slate-500">{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Readiness distribution context */}
      {data.completeness.missing.length > 0 && (
        <Card className="mt-6">
          <CardTitle title="Profile completeness" subtitle={`${data.completeness.score}% — finish these to unlock more drives`} right={<Link to="/profile" className="text-sm font-semibold text-indigo-600">Complete →</Link>} />
          <div className="mt-4">
            <BarList rows={data.completeness.sections.filter((s) => !s.done).map((s) => ({ label: s.label, count: 0 }))} />
            <div className="mt-2 flex flex-wrap gap-2">
              {data.completeness.missing.slice(0, 3).map((m) => (
                <span key={m} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{m}</span>
              ))}
            </div>
          </div>
        </Card>
      )}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <CheckCircle2 size={14} />
        Readiness updates automatically as you practice, apply and complete your profile.
      </div>
    </>
  );
}
