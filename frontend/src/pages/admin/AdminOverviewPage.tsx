import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import StatCard from "../../components/dashboard/StatCard";
import { Card, CardTitle } from "../../components/ui/Card";
import { ErrorState, PageHeader, Skeleton, BarList } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { adminService } from "../../services";
import { Building2, Users, BriefcaseBusiness, Target, Trophy, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { AdminOverview } from "../../types";

function demoOverview(): AdminOverview {
  return {
    students: 11, companies: 9, openDrives: 5, applications: 16, resources: 10, announcements: 3,
    avgCgpa: 8.1, byBranch: { "Computer Science": 5, AIDS: 2, ECE: 2, Mechanical: 1, Civil: 1 },
    avgReadiness: 58,
    readinessDistribution: [
      { label: "Excellent (80+)", count: 1 }, { label: "Good (60–79)", count: 3 },
      { label: "Developing (40–59)", count: 4 }, { label: "Starting (<40)", count: 3 },
    ],
    applicationsByStatus: { APPLIED: 7, SHORTLISTED: 4, ONLINE_ASSESSMENT: 1, INTERVIEW: 1, SELECTED: 2, REJECTED: 1 },
    applicationsByCompany: { TCS: 6, Amazon: 4, Infosys: 2, Flipkart: 2, Cognizant: 1, Zoho: 1 },
    placed: 2, placementRate: 18.2, codingSolved: 5, aptitudeAvg: 68,
  };
}

export default function AdminOverviewPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(demoOverview()) : adminService.overview()),
    [demoMode]
  );

  return (
    <AppLayout>
      <PageHeader
        title="Placement Cell Command Center"
        subtitle={demoMode ? "Sample analytics (demo mode)" : "Students, funnel, readiness and prep at a glance"}
        action={
          !demoMode ? (
            <button
              onClick={reload}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          ) : undefined
        }
      />
      {loading && (
        <>
          <Skeleton lines={2} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} lines={2} />)}</div>
        </>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Students" value={String(data.students)} description={`Avg CGPA ${data.avgCgpa ?? "—"} · readiness ${data.avgReadiness ?? "—"}`} icon={Users} iconClassName="bg-indigo-50 text-indigo-600" />
            <StatCard title="Placement rate" value={`${data.placementRate}%`} description={`${data.placed} placed`} icon={Trophy} iconClassName="bg-emerald-50 text-emerald-600" />
            <StatCard title="Open Drives" value={String(data.openDrives)} description={`${data.applications} applications`} icon={BriefcaseBusiness} iconClassName="bg-amber-50 text-amber-600" />
            <StatCard title="Prep health" value={`${data.codingSolved} solves`} description={`Aptitude avg ${data.aptitudeAvg ?? "—"}%`} icon={Target} iconClassName="bg-blue-50 text-blue-600" />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle title="Application funnel" subtitle="Where every application stands" right={<Link to="/admin/drives" className="text-sm font-semibold text-indigo-600">Drives →</Link>} />
              <div className="mt-4">
                <BarList
                  rows={["APPLIED", "SHORTLISTED", "ONLINE_ASSESSMENT", "INTERVIEW", "SELECTED", "REJECTED", "WITHDRAWN"]
                    .map((s) => ({ label: s.replace(/_/g, " "), count: data.applicationsByStatus[s] ?? 0 }))
                    .filter((r) => r.count > 0)}
                />
              </div>
            </Card>
            <Card>
              <CardTitle title="Readiness distribution" subtitle={`Average ${data.avgReadiness ?? "—"}/100`} right={<Link to="/admin/students" className="text-sm font-semibold text-indigo-600">Students →</Link>} />
              <div className="mt-4">
                <BarList rows={data.readinessDistribution.map((r, i) => ({ label: r.label, count: r.count, tone: ["bg-emerald-500", "bg-indigo-500", "bg-amber-500", "bg-slate-300"][i % 4] }))} />
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card>
              <CardTitle title="By branch" />
              <div className="mt-4"><BarList rows={Object.entries(data.byBranch).map(([label, count]) => ({ label, count }))} /></div>
            </Card>
            <Card>
              <CardTitle title="Applications by company" />
              <div className="mt-4">
                <BarList rows={Object.entries(data.applicationsByCompany).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, count }))} />
              </div>
            </Card>
            <Card>
              <CardTitle title="Manage" subtitle="Jump to a workspace" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { to: "/admin/students", label: "Students" },
                  { to: "/admin/companies", label: "Companies" },
                  { to: "/admin/drives", label: "Drives" },
                  { to: "/admin/resources", label: "Resources" },
                  { to: "/admin/announcements", label: "Announcements" },
                  { to: "/dashboard?demo=admin", label: "Student view" },
                ].map((l) => (
                  <Link key={l.to + l.label} to={l.to} className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50">
                    {l.label} →
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {data.companies} companies · {data.resources} resources · {data.announcements} announcements live
              </div>
            </Card>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Building2 size={14} /> Analytics recompute live from student profiles, applications and attempts.
          </p>
        </>
      )}
    </AppLayout>
  );
}
