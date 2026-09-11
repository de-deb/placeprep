import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { resourceService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockResources } from "../data/mockData";

const CATEGORIES = ["", "Coding", "Aptitude", "Interview", "Company", "Resume"];
const LEVELS = ["", "Beginner", "Intermediate", "Advanced"];

export default function ResourcesPage() {
  const { demoMode } = useAuth();
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const { data, loading, error, reload } = useApi(
    () =>
      demoMode
        ? Promise.resolve(mockResources.filter((r) => (!category || r.category === category) && (!query || r.title.toLowerCase().includes(query.toLowerCase())) && (!savedOnly || r.bookmarked)))
        : resourceService.list({ category: category || undefined, level: level || undefined, search: query || undefined, bookmarked: savedOnly || undefined }),
    [category, level, query, savedOnly, demoMode]
  );
  const [localSaved, setLocalSaved] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = async (id: string, current: boolean) => {
    const next = !(localSaved[id] ?? current);
    setLocalSaved((m) => ({ ...m, [id]: next }));
    if (demoMode) {
      setNotice("Demo mode — bookmarks saved locally only.");
      return;
    }
    try {
      await resourceService.toggleBookmark(id);
    } catch (e) {
      setNotice(getErrorMessage(e));
      setLocalSaved((m) => ({ ...m, [id]: current }));
    }
  };

  const featured = (data ?? []).filter((r) => r.featured);
  const rest = (data ?? []).filter((r) => !r.featured);

  const card = (r: (typeof mockResources)[number]) => {
    const saved = localSaved[r.id] ?? r.bookmarked ?? false;
    return (
      <Card key={r.id} className={r.featured ? "border-amber-200 bg-amber-50/40" : ""}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge value={r.category} />
            <span className="text-xs text-slate-400">{r.type}{r.level ? ` · ${r.level}` : ""}</span>
          </div>
          <button
            onClick={() => toggle(r.id, saved)}
            aria-label={saved ? `Remove bookmark: ${r.title}` : `Bookmark ${r.title}`}
            className={`rounded-lg px-2 py-1 text-base transition ${saved ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
          >
            {saved ? "★" : "☆"}
          </button>
        </div>
        <h3 className="mt-2 font-bold text-slate-900">{r.featured ? "⭐ " : ""}{r.title}</h3>
        {r.description && <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{r.description}</p>}
        {(r.tags ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.tags!.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{t}</span>)}
          </div>
        )}
        {r.company && <p className="mt-2 text-xs font-semibold text-indigo-600">For {r.company} aspirants</p>}
        {r.url ? (
          <a href={r.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">Open resource →</a>
        ) : (
          <p className="mt-3 text-xs text-slate-400">In-cell material — see placement notice board.</p>
        )}
      </Card>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        title="Resource Center"
        subtitle="Curated, searchable and bookmarkable preparation material."
        action={
          <>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c === "" ? "All categories" : c}</option>)}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              {LEVELS.map((c) => <option key={c} value={c}>{c === "" ? "All levels" : c}</option>)}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} className="accent-indigo-600" />
              ★ Saved
            </label>
          </>
        }
      />
      <div className="mb-5 max-w-md">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setQuery(search.trim()); }} onBlur={() => setQuery(search.trim())} placeholder="Search resources… (Enter)" aria-label="Search resources" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50" />
      </div>
      {notice && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{notice}</p>}
      {loading && <SkeletonCards count={6} />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && (data ?? []).length === 0 && <EmptyState title="No resources found" hint="Try another search, category or level." />}
      {featured.length > 0 && (
        <>
          <h2 className="mb-3 mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">⭐ Featured</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featured.map(card)}</div>
        </>
      )}
      {rest.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-widest text-slate-400">All resources</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rest.map(card)}</div>
        </>
      )}
    </AppLayout>
  );
}
