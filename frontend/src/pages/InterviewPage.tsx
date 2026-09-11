import { useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { interviewService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockInterviewQuestions } from "../data/mockData";
import type { InterviewQuestion } from "../types";

const STATUS_LABEL: Record<string, string> = { NOT_STARTED: "Mark practiced", PRACTICED: "Mark confident", CONFIDENT: "Reset" };
const NEXT: Record<string, string> = { NOT_STARTED: "PRACTICED", PRACTICED: "CONFIDENT", CONFIDENT: "NOT_STARTED" };

export default function InterviewPage() {
  const { demoMode } = useAuth();
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [mock, setMock] = useState<null | { category: string; difficulty: string; count: number }>(null);
  const { data, loading, error, reload } = useApi(
    () =>
      demoMode
        ? Promise.resolve(mockInterviewQuestions.filter((q) => (!category || q.category === category) && (!query || q.question.toLowerCase().includes(query.toLowerCase()))))
        : interviewService.questions({ category: category || undefined, difficulty: difficulty || undefined, search: query || undefined }),
    [category, difficulty, query, demoMode]
  );
  const summaryApi = useApi(() => (demoMode ? Promise.resolve(null) : interviewService.summary()), [demoMode, data]);
  const catsApi = useApi(() => (demoMode ? Promise.resolve(["HR", "OOP", "DBMS", "OS", "Networks", "DSA", "Projects"]) : interviewService.categories()), [demoMode]);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const questions = useMemo(
    () => (data ?? []).map((q) => ({ ...q, myStatus: local[q.id] ?? q.myStatus ?? "NOT_STARTED" })),
    [data, local]
  );

  const cycle = async (q: InterviewQuestion) => {
    const next = NEXT[q.myStatus ?? "NOT_STARTED"];
    setLocal((m) => ({ ...m, [q.id]: next === "NOT_STARTED" ? "NOT_STARTED" : next }));
    if (demoMode) {
      setNotice("Demo mode — progress saved locally only.");
      return;
    }
    try {
      await interviewService.setProgress(q.id, next as "PRACTICED" | "CONFIDENT");
    } catch (e) {
      setNotice(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Interview Preparation"
        subtitle={summaryApi.data ? `${summaryApi.data.practiced}/${summaryApi.data.total} practiced · ${summaryApi.data.confident} confident` : "Structured bank + mock mode. Mark each question as you master it."}
        action={
          <>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All categories</option>
              {(catsApi.data ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Filter by difficulty" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All levels</option>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <Button onClick={() => setMock({ category, difficulty, count: 5 })}>Mock interview 🎙</Button>
          </>
        }
      />
      <div className="mb-5 max-w-md">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setQuery(search.trim()); }} onBlur={() => setQuery(search.trim())} placeholder="Search questions… (Enter)" aria-label="Search interview questions" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50" />
      </div>
      {notice && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{notice}</p>}

      {summaryApi.data && summaryApi.data.categories.length > 0 && (
        <Card className="mb-6">
          <CardTitle title="Category progress" subtitle={summaryApi.data.weakestCategory ? `Weakest: ${summaryApi.data.weakestCategory}` : "All categories practiced"} />
          <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {summaryApi.data.categories.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-700">{c.category}</span><span className="text-slate-400">{c.practiced}/{c.total}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && <SkeletonCards count={4} />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && questions.length === 0 && <EmptyState title="No questions found" hint="Try another category or search." />}
      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionCard key={q.id} q={q} onCycle={() => cycle(q)} />
        ))}
      </div>
      {mock && <MockMode config={mock} questions={questions} onClose={() => setMock(null)} onProgress={(id, s) => setLocal((m) => ({ ...m, [id]: s }))} demoMode={demoMode} />}
    </AppLayout>
  );
}

export function QuestionCard({ q, onCycle }: { q: InterviewQuestion; onCycle: () => void }) {
  const [open, setOpen] = useState(false);
  const status = q.myStatus ?? "NOT_STARTED";
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge value={q.category} />
            <Badge value={q.difficulty} />
            <Badge value={status} />
          </div>
          <p className="mt-2 font-semibold text-slate-900">{q.question}</p>
          {(q.companies ?? []).length > 0 && <p className="mt-1 text-xs text-slate-400">Asked at: {q.companies.join(", ")}</p>}
          {open && (
            <div className="mt-3 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Guidance</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{q.guidance ?? "No guidance yet."}</p>
              {(q.keyPoints ?? []).length > 0 && (
                <>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Key points</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {q.keyPoints.map((k) => <li key={k}>{k}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button variant="secondary" onClick={() => setOpen((o) => !o)}>{open ? "Hide guidance" : "View guidance"}</Button>
          <Button variant={status === "CONFIDENT" ? "secondary" : "primary"} onClick={onCycle}>{STATUS_LABEL[status]}</Button>
        </div>
      </div>
    </Card>
  );
}

/** Mock interview: one question at a time, reveal guidance, self-grade, summary. */
function MockMode({ config, questions, onClose, onProgress, demoMode }: {
  config: { category: string; difficulty: string; count: number };
  questions: InterviewQuestion[];
  onClose: () => void;
  onProgress: (id: string, s: string) => void;
  demoMode: boolean;
}) {
  const pool = useMemo(() => {
    const filtered = questions.filter(
      (q) => (!config.category || q.category === config.category) && (!config.difficulty || q.difficulty === config.difficulty)
    );
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, config.count);
  }, [questions, config]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useState<Record<string, "confident" | "needs-work">>({});

  if (pool.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <Card className="w-full max-w-md">
          <CardTitle title="No questions available" subtitle="Adjust the category filter and try again." />
          <Button onClick={onClose} className="mt-4 w-full">Close</Button>
        </Card>
      </div>
    );
  }

  if (i >= pool.length) {
    const confident = Object.values(marks).filter((m) => m === "confident").length;
    const pct = Math.round((confident / pool.length) * 100);
    const weak = pool.filter((q) => marks[q.id] !== "confident").map((q) => q.category);
    const weakTop = [...new Set(weak)].slice(0, 3);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <Card className="w-full max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Interview readiness</p>
          <p className="mt-1 text-5xl font-bold text-slate-900">{pct}%</p>
          <p className="mt-2 text-sm text-slate-500">{confident}/{pool.length} confident</p>
          {weakTop.length > 0 && <p className="mt-2 text-sm text-amber-700">Revise: {weakTop.join(", ")}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
            <Button onClick={() => { setI(0); setMarks({}); setRevealed(false); }} className="flex-1">Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const q = pool[i];
  const mark = async (m: "confident" | "needs-work") => {
    setMarks({ ...marks, [q.id]: m });
    onProgress(q.id, m === "confident" ? "CONFIDENT" : "PRACTICED");
    if (!demoMode) {
      try {
        await interviewService.setProgress(q.id, m === "confident" ? "CONFIDENT" : "PRACTICED");
      } catch { /* local state already updated */ }
    }
    setRevealed(false);
    setI(i + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Mock interview">
      <Card className="w-full max-w-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">QUESTION {i + 1} OF {pool.length}{config.category ? ` · ${config.category}` : ""}</p>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100" aria-label="End mock interview">✕</button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(i / pool.length) * 100}%` }} />
        </div>
        <p className="mt-4 text-xl font-semibold leading-relaxed text-slate-900">“{q.question}”</p>
        <p className="mt-2 text-sm text-slate-400">Answer out loud (60–90 seconds), then reveal guidance and grade yourself honestly.</p>
        {!revealed
          ? <Button variant="secondary" onClick={() => setRevealed(true)} className="mt-4">Reveal guidance</Button>
          : (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm leading-relaxed text-slate-700">{q.guidance ?? "No guidance available."}</p>
              {(q.keyPoints ?? []).length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{q.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul>
              )}
              <div className="mt-4 flex gap-2">
                <Button onClick={() => mark("confident")} className="flex-1">✓ Confident</Button>
                <Button variant="secondary" onClick={() => mark("needs-work")} className="flex-1">Needs work</Button>
              </div>
            </div>
          )}
      </Card>
    </div>
  );
}
