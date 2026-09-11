import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { companyService } from "../services";
import { mockCompanies } from "../data/mockData";

export default function CompaniesPage() {
  const { demoMode } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data, loading, error, reload } = useApi(() => companyService.list(debounced || undefined), [debounced]);

  const list = useMemo(() => {
    if (data) return data;
    if (demoMode || error) {
      const q = debounced.toLowerCase();
      return mockCompanies.filter((c) => !q || c.name.toLowerCase().includes(q));
    }
    return [];
  }, [data, demoMode, error, debounced]);

  return (
    <AppLayout>
      <PageHeader title="Company Preparation" subtitle="Eligibility, process, topics and drives per company." />
      <div className="mb-5 max-w-md">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") setDebounced(search.trim()); }}
          onBlur={() => setDebounced(search.trim())}
          placeholder="Search companies… (Enter to search)"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
        />
      </div>

      {loading && <Spinner label="Loading companies…" />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && list.length === 0 && <EmptyState title="No companies found" hint="Try a different search, or ask the placement cell to add companies." />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{c.industry ?? "—"} · {c.packageLpa != null ? `${c.packageLpa} LPA` : "Package TBA"}</p>
              </div>
              {c.eligibilityCgpa != null && <Badge value={`${c.eligibilityCgpa}+ CGPA`} />}
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{c.description ?? "No description yet."}</p>
            {(c.topics ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.topics.slice(0, 4).map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{t}</span>)}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">{c._count?.drives ?? c.drives?.length ?? 0} drives</span>
              <Link to={`/companies/${c.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View details →</Link>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
