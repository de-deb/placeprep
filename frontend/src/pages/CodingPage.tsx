import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ExternalLink } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { codingService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockProblems } from "../data/mockData";
import type { CodingProblem } from "../types";

type SortKey = "recommended" | "difficulty" | "newest";

const DIFF_RANK: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

export default function CodingPage() {
  const { demoMode } = useAuth();
  const [difficulty, setDifficulty] = useState("");
  const [source, setSource] = useState("");
  const [company, setCompany] = useState("");
  const [solvedFilter, setSolvedFilter] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [execOnly, setExecOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data, loading, error, reload } = useApi(
    () =>
      demoMode
        ? Promise.resolve(mockProblems)
        : codingService.problems({
            difficulty: difficulty || undefined,
            search: query || undefined,
            source: source || undefined,
          }),
    [difficulty, query, source, demoMode]
  );
  const summaryApi = useApi(() => (demoMode ? Promise.resolve(null) : codingService.summary()), [demoMode, data]);
  const streakApi = useApi(() => (demoMode ? Promise.resolve({ streak: 2, activeDays: 5 }) : codingService.streak()), [demoMode]);
  const dailyApi = useApi(() => (demoMode ? Promise.resolve(null) : codingService.daily()), [demoMode]);

  const [local, setLocal] = useState<Record<string, { solved?: boolean; bookmarked?: boolean }>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const problems = useMemo(() => {
    let list: CodingProblem[] = (data ?? []).map((p) => ({ ...p, ...(local[p.id] ?? {}) }));
    if (demoMode) {
      list = list.filter(
        (p) =>
          (!difficulty || p.difficulty === difficulty) &&
          (!query || p.title.toLowerCase().includes(query.toLowerCase()))
      );
    }
    if (company) list = list.filter((p) => (p.companies ?? []).some((c) => c.toLowerCase().includes(company.toLowerCase())));
    if (solvedFilter === "solved") list = list.filter((p) => p.solved);
    if (solvedFilter === "unsolved") list = list.filter((p) => !p.solved);
    if (savedOnly) list = list.filter((p) => p.bookmarked);
    if (execOnly) list = list.filter((p) => (p.source ?? "INTERNAL") === "INTERNAL" && p.executionSupported !== false);
    const weakTags = new Set([...(summaryApi.data?.weakestTags ?? []).map((t) => t.tag)]);
    const score = (p: CodingProblem) =>
      (p.tags.some((t) => weakTags.has(t)) ? 0 : 10) + (DIFF_RANK[p.difficulty] ?? 1);
    if (sort === "recommended") list = [...list].sort((a, b) => Number(b.solved ?? false) - Number(a.solved ?? false) || score(a) - score(b));
    else if (sort === "difficulty") list = [...list].sort((a, b) => (DIFF_RANK[a.difficulty] ?? 1) - (DIFF_RANK[b.difficulty] ?? 1));
    return list;
  }, [data, local, difficulty, query, company, solvedFilter, savedOnly, execOnly, sort, demoMode, summaryApi.data]);

  const solvedCount = (data ?? []).filter((p) => p.solved ?? local[p.id]?.solved).length;

  const toggle = async (id: string, field: "solved" | "bookmarked") => {
    const current = problems.find((p) => p.id === id);
    const next = !current?.[field];
    setLocal((m) => ({ ...m, [id]: { ...m[id], [field]: next } }));
    if (demoMode) {
      setNotice("Demo mode — progress saved locally only.");
      return;
    }
    try {
      await codingService.setProgress(id, { [field]: next });
    } catch (e) {
      setNotice(getErrorMessage(e));
      setLocal((m) => ({ ...m, [id]: { ...m[id], [field]: !next } }));
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Coding Practice"
        subtitle={`${solvedCount} solved · ${(streakApi.data?.streak ?? 0) > 0 ? `${streakApi.data!.streak}-day streak 🔥 · ` : ""}real judge for internal problems, honest external tracking for the rest.`}
        action={
          <Link to="/coding/progress" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">
            My progress →
          </Link>
        }
      />

      {dailyApi.data && (
        <Link to={`/coding/${dailyApi.data.id}`} className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 transition hover:border-amber-300">
          <CalendarCheck size={20} className="shrink-0 text-amber-600" />
          <span className="text-sm text-amber-900">
            <b>Daily problem:</b> {dailyApi.data.title} ({dailyApi.data.difficulty}) — {dailyApi.data.reason}
          </span>
        </Link>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All levels</option><option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All sources</option><option value="INTERNAL">Solve here</option><option value="CODEFORCES">Codeforces</option>
        </select>
        <select value={solvedFilter} onChange={(e) => setSolvedFilter(e.target.value)} aria-label="Solved filter" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Solved + unsolved</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="recommended">Recommended</option><option value="difficulty">Difficulty</option><option value="newest">Newest</option>
        </select>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company…" aria-label="Filter by company" className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300" />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
          <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} className="accent-indigo-600" /> Saved
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
          <input type="checkbox" checked={execOnly} onChange={(e) => setExecOnly(e.target.checked)} className="accent-indigo-600" /> Runnable here
        </label>
      </div>
      <div className="mb-5 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setQuery(search.trim()); }}
          onBlur={() => setQuery(search.trim())}
          placeholder="Search 300+ problems… (Enter)"
          aria-label="Search problems"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
        />
      </div>

      {notice && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{notice}</p>}
      {loading && <SkeletonCards count={5} />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && problems.length === 0 && <EmptyState title="No problems match" hint="Loosen the filters or try another search." />}
      <div className="space-y-3">
        {problems.slice(0, 60).map((p) => {
          const internal = (p.source ?? "INTERNAL") === "INTERNAL" && p.executionSupported !== false;
          return (
            <Card key={p.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {internal ? (
                      <Link to={`/coding/${p.id}`} className="font-bold text-slate-900 hover:text-indigo-700">{p.title}</Link>
                    ) : (
                      <span className="font-bold text-slate-900">{p.title}</span>
                    )}
                    <Badge value={p.difficulty} />
                    {p.source !== "INTERNAL" ? <Badge value={p.source ?? "EXTERNAL"} /> : <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Solve here</span>}
                    {p.solved ? <span className="text-sm font-bold text-emerald-600">✓</span> : null}
                    {p.estimatedMinutes ? <span className="text-xs text-slate-400">~{p.estimatedMinutes} min</span> : null}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.slice(0, 5).map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{t}</span>)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {internal ? (
                    <Link to={`/coding/${p.id}`} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700">
                      {p.solved ? "Review / Re-solve" : "Solve here →"}
                    </Link>
                  ) : (
                    <>
                      {p.externalUrl && (
                        <a href={p.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50">
                          Practice externally <ExternalLink size={12} />
                        </a>
                      )}
                      <button onClick={() => toggle(p.id, "solved")} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${p.solved ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                        {p.solved ? "✓ Solved" : "Mark as solved"}
                      </button>
                    </>
                  )}
                  <button onClick={() => toggle(p.id, "bookmarked")} aria-label={p.bookmarked ? `Unsave ${p.title}` : `Save ${p.title}`} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${p.bookmarked ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    {p.bookmarked ? "★" : "☆"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {problems.length > 60 && <p className="mt-4 text-center text-sm text-slate-400">Showing 60 of {problems.length} — narrow filters to find more.</p>}
    </AppLayout>
  );
}
