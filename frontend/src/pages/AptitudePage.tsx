import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { PageHeader, Skeleton, BarList, Sparkline } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { useConfirm } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { aptitudeService } from "../services";
import { getErrorMessage } from "../services/api";
import type { AptitudeQuestion, QuizResult } from "../types";
import { formatDate, formatSeconds } from "../utils/format";

const LOCAL = [
  { id: "l1", category: "Quantitative", topic: "Percentages", difficulty: "Easy", question: "If 15% of x is 45, what is x?", options: ["250", "300", "320", "280"], answerIndex: 1, explanation: "x = 45 / 0.15 = 300." },
  { id: "l2", category: "Quantitative", topic: "Speed & Distance", difficulty: "Easy", question: "A train 240m long crosses a pole in 12s. Speed in km/h?", options: ["54", "60", "72", "48"], answerIndex: 2, explanation: "20 m/s = 72 km/h." },
  { id: "l3", category: "Logical", topic: "Odd One Out", difficulty: "Easy", question: "Odd one out: Apple, Mango, Banana, Potato", options: ["Apple", "Mango", "Banana", "Potato"], answerIndex: 3, explanation: "Potato is a vegetable." },
  { id: "l4", category: "Verbal", topic: "Synonyms", difficulty: "Easy", question: "Synonym of 'Abundant'?", options: ["Scarce", "Plentiful", "Rare", "Meagre"], answerIndex: 1, explanation: "Abundant = plentiful." },
  { id: "l5", category: "Quantitative", topic: "Time & Work", difficulty: "Medium", question: "A does a job in 12 days, B in 15 days. Together?", options: ["6.67 days", "7 days", "6 days", "7.5 days"], answerIndex: 0, explanation: "1/(1/12+1/15) = 20/3." },
];

type Phase = "config" | "running" | "result";

export default function AptitudePage() {
  const { demoMode } = useAuth();
  const [phase, setPhase] = useState<Phase>("config");
  // config
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(15);
  // run
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  const metaApi = useApi(() => (demoMode ? Promise.resolve({ categories: [], difficulties: [], topics: [] }) : aptitudeService.meta()), [demoMode]);
  const attemptsApi = useApi(() => (demoMode ? Promise.resolve([] as never[]) : aptitudeService.attempts()), [demoMode, phase]);
  const analyticsApi = useApi(() => (demoMode ? Promise.resolve(null) : aptitudeService.analytics()), [demoMode, phase]);

  const start = async () => {
    setErr(null);
    setBusy(true);
    try {
      const qs = demoMode
        ? LOCAL.filter((q) => (!category || q.category === category)).slice(0, count)
        : await aptitudeService.questions({
            category: category || undefined,
            difficulty: difficulty || undefined,
            take: count,
          });
      if (qs.length === 0) {
        setErr("No questions match this configuration — try fewer questions or another category.");
        return;
      }
      setQuestions(qs);
      setAnswers({});
      setFlagged(new Set());
      setIdx(0);
      setLeft(minutes * 60);
      setResult(null);
      setPhase("running");
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // countdown
  useEffect(() => {
    if (phase !== "running") return;
    if (left <= 0) {
      submit(true);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left]);

  const submit = async (auto = false) => {
    if (!auto) {
      const unanswered = questions.filter((q) => answers[q.id] == null).length;
      const ok = await confirm(
        unanswered > 0 ? `${unanswered} unanswered. Submit anyway?` : "Submit your answers?",
        { title: "Submit quiz", confirmLabel: "Submit" }
      );
      if (!ok) return;
    }
    setBusy(true);
    const payload = questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1 }));
    const taken = minutes * 60 - left;
    try {
      if (demoMode) {
        let score = 0;
        const review = payload.map((a) => {
          const q = LOCAL.find((x) => x.id === a.questionId)!;
          const correct = q.answerIndex === a.selectedIndex;
          if (correct) score += 1;
          return { questionId: a.questionId, question: q.question, category: q.category, topic: q.topic, options: q.options, selectedIndex: a.selectedIndex, answerIndex: q.answerIndex, correct, explanation: q.explanation };
        });
        const un = review.filter((r) => r.selectedIndex < 0).length;
        setResult({ attemptId: "demo", score, total: review.length, percentage: Math.round((score / review.length) * 100), correct: score, incorrect: review.length - score - un, unanswered: un, timeTakenSeconds: taken, topics: [], review });
      } else {
        const graded = await aptitudeService.submit(payload, { timeTakenSeconds: taken, difficulty: difficulty || undefined });
        setResult(graded);
      }
      setPhase("result");
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const answered = useMemo(() => questions.filter((q) => answers[q.id] != null).length, [questions, answers]);

  return (
    <AppLayout>
      <PageHeader
        title="Aptitude Practice"
        subtitle={phase === "running" ? `Question ${idx + 1} of ${questions.length} · ${answered} answered` : "Configure a timed quiz, review every answer afterwards."}
      />
      {err && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{err}</p>}

      {phase === "config" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardTitle title="New quiz" subtitle="Answers are graded server-side after submit" />
            <div className="mt-4 space-y-4">
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {(metaApi.data?.categories ?? [{ name: "Quantitative" }, { name: "Logical" }, { name: "Verbal" }]).map((c) => (
                  <option key={c.name} value={c.name}>{c.name}{"count" in c ? ` (${(c as { count: number }).count})` : ""}</option>
                ))}
              </Select>
              <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">All levels</option>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Questions" value={String(count)} onChange={(e) => setCount(Number(e.target.value))}>
                  {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
                </Select>
                <Select label="Timer" value={String(minutes)} onChange={(e) => setMinutes(Number(e.target.value))}>
                  {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} minutes</option>)}
                </Select>
              </div>
              <Button onClick={start} disabled={busy} className="w-full">
                {busy ? "Preparing…" : `Start quiz · ${count} questions · ${minutes} min`}
              </Button>
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardTitle title="Your analytics" subtitle={demoMode ? "Log in for saved analytics" : "Across all attempts"} />
              {analyticsApi.loading && <Skeleton lines={3} />}
              {analyticsApi.data && (
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-bold">{analyticsApi.data.average ?? "—"}{analyticsApi.data.average != null ? "%" : ""}</p><p className="text-xs text-slate-500">Average</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-bold">{analyticsApi.data.best ?? "—"}{analyticsApi.data.best != null ? "%" : ""}</p><p className="text-xs text-slate-500">Best</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-bold">{analyticsApi.data.attempts}</p><p className="text-xs text-slate-500">Attempts</p></div>
                  </div>
                  <div className="mt-4"><BarList rows={analyticsApi.data.byCategory.map((c) => ({ label: `${c.category} (${c.attempts})`, count: c.average }))} max={100} /></div>
                  {analyticsApi.data.trend.length > 1 && (
                    <div className="mt-4"><Sparkline points={analyticsApi.data.trend.map((t) => t.pct)} /></div>
                  )}
                </div>
              )}
              {!analyticsApi.data && !analyticsApi.loading && <p className="mt-3 text-sm text-slate-400">No attempts yet — your first quiz starts the trend.</p>}
            </Card>
            <Card>
              <CardTitle title="Recent attempts" />
              {attemptsApi.loading && <p className="mt-3 text-sm text-slate-400">Loading history…</p>}
              {attemptsApi.error && (
                <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  Couldn't load history: {attemptsApi.error}{" "}
                  <button onClick={attemptsApi.reload} className="font-semibold underline">Retry</button>
                </div>
              )}
              <div className="mt-3 space-y-2 text-sm">
                {(attemptsApi.data as { id: string; category: string; score: number; total: number; takenAt?: string; timeTakenSeconds?: number | null }[] ?? []).length === 0 && (
                  <p className="text-sm text-slate-400">Nothing here yet.</p>
                )}
                {((attemptsApi.data as { id: string; category: string; score: number; total: number; takenAt?: string; timeTakenSeconds?: number | null }[] ?? []).slice(0, 6)).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>{a.category} <span className="text-xs text-slate-400">{a.takenAt ? formatDate(a.takenAt) : ""}{a.timeTakenSeconds != null ? ` · ${formatSeconds(a.timeTakenSeconds)}` : ""}</span></span>
                    <b>{a.score}/{a.total}</b>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {phase === "running" && questions[idx] && (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Q{idx + 1}/{questions.length}</span>
                <Badge value={questions[idx].category} />
                {questions[idx].difficulty ? <Badge value={questions[idx].difficulty!} /> : null}
              </div>
              <span className={`rounded-xl px-3 py-1.5 font-mono text-sm font-bold ${left < 60 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`} role="timer" aria-label={`${formatSeconds(left)} remaining`}>
                ⏱ {formatSeconds(left)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
            </div>
            <p className="mt-4 text-lg font-medium leading-relaxed text-slate-900">{questions[idx].question}</p>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label={`Question ${idx + 1} options`}>
              {questions[idx].options.map((opt, oi) => (
                <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${answers[questions[idx].id] === oi ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-800" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" name={questions[idx].id} checked={answers[questions[idx].id] === oi} onChange={() => setAnswers({ ...answers, [questions[idx].id]: oi })} className="accent-indigo-600" />
                  {opt}
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← Previous</Button>
              <button
                onClick={() => setFlagged((s) => { const n = new Set(s); if (n.has(questions[idx].id)) n.delete(questions[idx].id); else n.add(questions[idx].id); return n; })}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${flagged.has(questions[idx].id) ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              >
                {flagged.has(questions[idx].id) ? "⚑ Marked for review" : "⚐ Mark for review"}
              </button>
              {idx < questions.length - 1
                ? <Button onClick={() => setIdx(idx + 1)}>Next →</Button>
                : <Button onClick={() => submit(false)} disabled={busy}>{busy ? "Submitting…" : "Submit quiz"}</Button>}
            </div>
          </Card>
          <Card>
            <CardTitle title="Navigator" subtitle={`${answered}/${questions.length} answered · ${flagged.size} flagged`} />
            <div className="mt-3 grid grid-cols-5 gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to question ${i + 1}${answers[q.id] != null ? ", answered" : ""}${flagged.has(q.id) ? ", flagged" : ""}`}
                  className={`flex h-10 items-center justify-center rounded-xl text-sm font-bold transition ${i === idx ? "bg-indigo-600 text-white" : answers[q.id] != null ? "bg-emerald-100 text-emerald-700" : flagged.has(q.id) ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={() => submit(false)} disabled={busy} className="mt-4 w-full">Submit quiz</Button>
          </Card>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 text-center sm:grid-cols-5">
              <div><p className="text-3xl font-bold text-slate-900">{result.score}/{result.total}</p><p className="text-xs text-slate-500">Score</p></div>
              <div><p className="text-3xl font-bold text-indigo-600">{result.percentage}%</p><p className="text-xs text-slate-500">Percentage</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">{result.correct}</p><p className="text-xs text-slate-500">Correct</p></div>
              <div><p className="text-3xl font-bold text-red-500">{result.incorrect}</p><p className="text-xs text-slate-500">Incorrect</p></div>
              <div><p className="text-3xl font-bold text-slate-500">{result.unanswered}</p><p className="text-xs text-slate-500">Unanswered</p></div>
            </div>
            <p className="mt-3 text-center text-sm text-slate-500">Time taken: <b>{formatSeconds(result.timeTakenSeconds)}</b></p>
            {result.topics.length > 0 && (
              <div className="mx-auto mt-4 max-w-md"><BarList rows={result.topics.map((t) => ({ label: `${t.topic} (${t.correct}/${t.total})`, count: t.pct }))} max={100} /></div>
            )}
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => { setPhase("config"); setResult(null); }}>Back to setup</Button>
              <Button onClick={() => { setPhase("config"); setResult(null); }}>Take another quiz</Button>
            </div>
          </Card>
          {result.review.map((r, i) => (
            <Card key={r.questionId}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                {r.correct
                  ? <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Correct ✓</span>
                  : <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">{r.selectedIndex < 0 ? "Unanswered" : "Incorrect"}</span>}
                <span className="text-xs text-slate-400">{r.category}{r.topic ? ` · ${r.topic}` : ""}</span>
              </div>
              <p className="mt-2 font-medium text-slate-900">{r.question}</p>
              <div className="mt-3 space-y-1.5">
                {r.options.map((opt, oi) => {
                  const isAnswer = oi === r.answerIndex;
                  const isMine = oi === r.selectedIndex;
                  return (
                    <div key={oi} className={`rounded-xl border px-3.5 py-2 text-sm ${isAnswer ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800" : isMine ? "border-red-300 bg-red-50 text-red-700" : "border-slate-100 text-slate-500"}`}>
                      {opt} {isAnswer ? "✓ correct" : isMine ? "✕ your answer" : ""}
                    </div>
                  );
                })}
                {r.selectedIndex < 0 && <p className="text-xs text-slate-400">You left this unanswered.</p>}
              </div>
              {r.explanation && <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">💡 {r.explanation}</p>}
            </Card>
          ))}
        </div>
      )}

      {dialog}
    </AppLayout>
  );
}
