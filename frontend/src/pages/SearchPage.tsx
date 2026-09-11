import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { useApi } from "../hooks/useApi";
import { searchService } from "../services";
import { useAuth } from "../context/AuthContext";
import type { SearchResults } from "../types";

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <Card>
      <CardTitle title={title} subtitle={`${count} result${count === 1 ? "" : "s"}`} />
      <div className="mt-3 space-y-2">{children}</div>
    </Card>
  );
}

export default function SearchPage() {
  const { demoMode } = useAuth();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, loading, error, reload } = useApi(
    () =>
      demoMode
        ? Promise.resolve({
            query: q, companies: [], drives: [], problems: [], resources: [], interview: [], announcements: [],
          } as SearchResults)
        : searchService.query(q),
    [q, demoMode]
  );

  return (
    <AppLayout>
      <PageHeader title={`Results for “${q}”`} subtitle="Across companies, drives, coding, resources, interview and announcements." />
      {loading && <Skeleton lines={5} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {demoMode && !loading && (
        <EmptyState title="Search needs the backend" hint="Log in with a real account to search across all modules." />
      )}
      {!demoMode && data && !loading && !error && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Group title="Companies" count={data.companies.length}>
            {data.companies.map((c) => (
              <Link key={c.id} to={`/companies/${c.id}`} className="block rounded-xl bg-slate-50 px-3.5 py-2.5 transition hover:bg-indigo-50">
                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.industry} {c.packageLpa != null ? `· ${c.packageLpa} LPA` : ""}</p>
              </Link>
            ))}
          </Group>
          <Group title="Drives" count={data.drives.length}>
            {data.drives.map((d) => (
              <Link key={d.id} to="/drives" className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 transition hover:bg-indigo-50">
                <span><span className="block text-sm font-bold text-slate-900">{d.title}</span><span className="text-xs text-slate-500">{d.company?.name}</span></span>
                <Badge value={d.status} />
              </Link>
            ))}
          </Group>
          <Group title="Coding problems" count={data.problems.length}>
            {data.problems.map((p) => (
              <Link key={p.id} to="/coding" className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 transition hover:bg-indigo-50">
                <span className="text-sm font-bold text-slate-900">{p.title}</span>
                <Badge value={p.difficulty} />
              </Link>
            ))}
          </Group>
          <Group title="Interview questions" count={data.interview.length}>
            {data.interview.map((iq) => (
              <Link key={iq.id} to="/interview" className="block rounded-xl bg-slate-50 px-3.5 py-2.5 transition hover:bg-indigo-50">
                <p className="text-sm font-bold text-slate-900">{iq.question}</p>
                <p className="text-xs text-slate-500">{iq.category} · {iq.difficulty}</p>
              </Link>
            ))}
          </Group>
          <Group title="Resources" count={data.resources.length}>
            {data.resources.map((r) => (
              <Link key={r.id} to="/resources" className="block rounded-xl bg-slate-50 px-3.5 py-2.5 transition hover:bg-indigo-50">
                <p className="text-sm font-bold text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-500">{r.category} · {r.type}</p>
              </Link>
            ))}
          </Group>
          <Group title="Announcements" count={data.announcements.length}>
            {data.announcements.map((a) => (
              <Link key={a.id} to="/announcements" className="block rounded-xl bg-slate-50 px-3.5 py-2.5 transition hover:bg-indigo-50">
                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                <p className="line-clamp-1 text-xs text-slate-500">{a.body}</p>
              </Link>
            ))}
          </Group>
        </div>
      )}
      {!demoMode && data && !loading && !error &&
        data.companies.length + data.drives.length + data.problems.length + data.resources.length + data.interview.length + data.announcements.length === 0 && (
          <EmptyState title="Nothing found" hint="Try different keywords — e.g. a company, topic or skill." />
        )}
    </AppLayout>
  );
}
