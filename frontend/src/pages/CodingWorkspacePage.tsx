import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Maximize2, Minimize2, Play, RotateCcw, Send } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Input";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { CodeEditor } from "../components/coding/CodeEditor";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { codingService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockProblems } from "../data/mockData";
import type { CodingProblem, JudgeSubmission, JudgeTestResult, JudgeVerdict } from "../types";

type Detail = CodingProblem & {
  attempts: { id: string; verdict: string; note?: string | null; createdAt: string }[];
  relevant: { id: string; title: string; difficulty: string; tags: string[] }[];
};

const VERDICT_STYLE: Record<string, string> = {
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  WRONG_ANSWER: "bg-red-50 text-red-700 ring-red-200",
  COMPILATION_ERROR: "bg-amber-50 text-amber-700 ring-amber-200",
  RUNTIME_ERROR: "bg-orange-50 text-orange-700 ring-orange-200",
  TIME_LIMIT_EXCEEDED: "bg-purple-50 text-purple-700 ring-purple-200",
};

function draftKey(problemId: string, lang: string) {
  return `placeprep:code:${problemId}:${lang}`;
}

export default function CodingWorkspacePage() {
  const { problemId } = useParams();
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => {
      if (demoMode) {
        const m = mockProblems.find((p) => p.id === problemId);
        if (!m) return Promise.resolve(null);
        return Promise.resolve({ ...m, attempts: [], relevant: [] });
      }
      return codingService.detail(problemId!);
    },
    [problemId, demoMode]
  );
  const langsApi = useApi(
    () => (demoMode ? Promise.resolve([] as { code: string; name: string }[]) : codingService.languages()),
    [demoMode]
  );
  const subsApi = useApi(
    () => (demoMode || !problemId ? Promise.resolve([]) : codingService.submissions(problemId)),
    [problemId, demoMode]
  );

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [codeInit, setCodeInit] = useState(false);
  const [stdinMode, setStdinMode] = useState(false);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runOut, setRunOut] = useState<{ mode: string; results?: JudgeTestResult[]; result?: JudgeTestResult } | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [opError, setOpError] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [viewCode, setViewCode] = useState<null | { status: string; code: string; createdAt: string }>(null);

  const problem = data as Detail | null;  const languages = useMemo(
    () => langsApi.data ?? [{ code: "python", name: "Python" }, { code: "cpp", name: "C++" }, { code: "java", name: "Java" }],
    [langsApi.data]
  );
  const source = problem?.source ?? "INTERNAL";
  const runnable = !!problem && source === "INTERNAL" && problem.executionSupported !== false && !demoMode;

  // Load starter/draft when problem or language changes.
  useEffect(() => {
    if (!problem) return;
    const saved = localStorage.getItem(draftKey(problem.id, language));
    const starter = (problem.starterCode as Record<string, string> | null)?.[language];
    setCode(saved ?? starter ?? defaultStarter(language));
    setCodeInit(true);
    setRunOut(null);
    setVerdict(null);
    setOpError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, language]);

  useEffect(() => {
    if (problem && codeInit) localStorage.setItem(draftKey(problem.id, language), code);
  }, [code, codeInit, language, problem]);

  const reset = useCallback(() => {
    if (!problem) return;
    const starter = (problem.starterCode as Record<string, string> | null)?.[language] ?? defaultStarter(language);
    setCode(starter);
    localStorage.removeItem(draftKey(problem.id, language));
  }, [problem, language]);

  const run = async () => {
    if (!problem || running) return;
    setOpError(null);
    setVerdict(null);
    setRunning(true);
    try {
      const out = await codingService.run(problem.id, { language, code, stdin: stdinMode ? stdin : undefined });
      setRunOut(out);
    } catch (e) {
      setOpError(getErrorMessage(e));
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    if (!problem || submitting) return;
    setOpError(null);
    setRunOut(null);
    setSubmitting(true);
    try {
      const v = await codingService.submit(problem.id, { language, code });
      setVerdict(v);
      subsApi.reload();
      reload();
    } catch (e) {
      setOpError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmission = async (id: string) => {
    try {
      const s = await codingService.submission(id);
      setViewCode({ status: s.status, code: s.sourceCode, createdAt: s.createdAt });
    } catch (e) {
      setOpError(getErrorMessage(e));
    }
  };

  return (
    <AppLayout>
      <Link to="/coding" className="no-print mb-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Back to problems</Link>
      {loading && <Skeleton lines={6} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !problem && !error && <EmptyState title="Problem not found" />}
      {problem && (
        <div className={full ? "fixed inset-0 z-50 overflow-y-auto bg-slate-50 p-4" : ""}>
          <div className="grid gap-6 xl:grid-cols-2">
            {/* LEFT: statement */}
            <div className={full ? "hidden xl:block" : ""}>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{problem.title}</h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge value={problem.difficulty} />
                {source !== "INTERNAL" ? <Badge value={source} /> : <Badge value="Solve here" />}
                {problem.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{t}</span>)}
              </div>
              {(problem.companies ?? []).length > 0 && (
                <p className="mt-2 text-xs text-slate-400">Asked by: {problem.companies!.join(", ")}{problem.expectedTimeComplexity ? ` · Expected ${problem.expectedTimeComplexity} time, ${problem.expectedSpaceComplexity ?? "?"} space` : ""}</p>
              )}
              <Card className="mt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{problem.description}</p>
                {(problem.sampleInput || problem.sampleOutput) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample input</p><pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-100">{problem.sampleInput}</pre></div>
                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample output</p><pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-100">{problem.sampleOutput}</pre></div>
                  </div>
                )}
                {problem.constraints && <><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Constraints</p><p className="mt-1 text-sm text-slate-600">{problem.constraints}</p></>}
                {(problem.inputFormat || problem.outputFormat) && (
                  <p className="mt-3 text-sm text-slate-600"><b>In:</b> {problem.inputFormat ?? "—"} · <b>Out:</b> {problem.outputFormat ?? "—"}</p>
                )}
                {problem.hint && <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">💡 {problem.hint}</p>}
                {problem.explanation && (
                  <details className="mt-3 rounded-xl bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-900">
                    <summary className="cursor-pointer font-semibold">Solution explanation</summary>
                    <p className="mt-2 leading-relaxed">{problem.explanation}</p>
                  </details>
                )}
                {problem.externalUrl && (
                  <a href={problem.externalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">
                    Practice on {problem.source === "CODEFORCES" ? "Codeforces" : "external site"} ↗
                  </a>
                )}
              </Card>
              {problem.relevant.length > 0 && (
                <Card className="mt-4">
                  <CardTitle title="Practice next" subtitle="Same topics" />
                  <div className="mt-2 space-y-1.5">
                    {problem.relevant.map((r) => (
                      <Link key={r.id} to={`/coding/${r.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-indigo-50">
                        <span className="font-medium text-slate-700">{r.title}</span><Badge value={r.difficulty} />
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* RIGHT: editor + results */}
            <div>
              {!runnable ? (
                <Card>
                  <CardTitle title={demoMode ? "Demo mode" : "External practice"} subtitle={demoMode ? "Log in to execute code." : "This problem links out — execution runs on internal problems."} />
                  {problem.externalUrl && (
                    <a href={problem.externalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                      Practice externally ↗
                    </a>
                  )}
                  <p className="mt-3 text-sm text-slate-500">Solved it outside? Track it from the <Link to="/coding" className="font-semibold text-indigo-600">problem list → Mark solved</Link>.</p>
                </Card>
              ) : (
                <>
                  <div className="no-print mb-3 flex flex-wrap items-center gap-2">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold">
                      {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <Button variant="secondary" onClick={reset}><RotateCcw size={15} /> Reset</Button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
                      <input type="checkbox" checked={stdinMode} onChange={(e) => setStdinMode(e.target.checked)} className="accent-indigo-600" />
                      Custom input
                    </label>
                    <span className="flex-1" />
                    <button onClick={() => setFull((f) => !f)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50" aria-label={full ? "Exit fullscreen" : "Fullscreen editor"}>
                      {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <Button variant="secondary" onClick={run} disabled={running || submitting}>
                      <Play size={15} /> {running ? "Running…" : "Run"}
                    </Button>
                    <Button onClick={submit} disabled={running || submitting}>
                      <Send size={15} /> {submitting ? "Judging…" : "Submit"}
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <CodeEditor language={language} code={code} onChange={setCode} onRun={run} height={full ? "60vh" : 420} />
                  </div>
                  {stdinMode && (
                    <div className="mt-3">
                      <Textarea label="Custom stdin" rows={3} value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="Input fed to your program on Run" />
                    </div>
                  )}
                  {opError && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{opError}</p>}

                  {verdict && (
                    <div className={`mt-3 rounded-2xl border p-4 ${verdict.verdict === "ACCEPTED" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${VERDICT_STYLE[verdict.verdict]}`}>
                          {verdict.verdict === "ACCEPTED" ? "Accepted 🎉" : verdict.verdict.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-slate-600">{verdict.passedTests}/{verdict.totalTests} tests passed</span>
                        {verdict.runtimeMs != null && <span className="text-xs text-slate-500">{verdict.runtimeMs}ms · {verdict.memoryKb}KB</span>}
                      </div>
                      {verdict.verdict === "ACCEPTED" && <p className="mt-2 text-sm text-emerald-700">Progress updated — check <Link to="/coding/progress" className="font-semibold underline">My progress</Link> and your dashboard.</p>}
                      {verdict.verdict === "WRONG_ANSWER" && <p className="mt-2 text-sm text-slate-600">A hidden test failed. Re-check edge cases (empty input, boundaries) — hidden cases stay hidden.</p>}
                    </div>
                  )}

                  {runOut && <RunResults out={runOut} />}

                  <Card className="mt-4">
                    <CardTitle title="Submission history" subtitle="Click to view your code" />
                    <SubmissionList problemId={problem.id} tick={subsApi.data} onOpen={openSubmission} />
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {viewCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setViewCode(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Submitted code">
            <div className="mb-3 flex items-center justify-between">
              <Badge value={viewCode.status} />
              <button onClick={() => setViewCode(null)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100" aria-label="Close">✕</button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">{viewCode.code}</pre>
            <p className="mt-2 text-xs text-slate-400">{new Date(viewCode.createdAt).toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function defaultStarter(lang: string): string {
  if (lang === "cpp") return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // TODO\n    return 0;\n}\n';
  if (lang === "java") return 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // TODO\n    }\n}\n';
  return '# TODO: read input, print output\n';
}

function RunResults({ out }: { out: { mode: string; results?: JudgeTestResult[]; result?: JudgeTestResult } }) {
  const list = out.mode === "custom" && out.result ? [out.result] : out.results ?? [];
  const allPass = list.length > 0 && list.every((r) => r.passed);
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-900">
        {out.mode === "custom" ? "Custom run" : `Sample tests: ${list.filter((r) => r.passed).length}/${list.length} passed`}
        {allPass && out.mode !== "custom" ? " ✓" : ""}
      </p>
      <div className="mt-2 space-y-2">
        {list.map((r, i) => (
          <details key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm" open={r.passed === false}>
            <summary className="cursor-pointer font-semibold text-slate-700">
              {out.mode === "custom" ? "Output" : `Sample ${i + 1}`}: {r.passed == null ? "ran" : r.passed ? <span className="text-emerald-600">Passed ✓</span> : <span className="text-red-600">Failed</span>}
              {r.timeSec != null && <span className="ml-2 font-normal text-slate-400">{Math.round(r.timeSec * 1000)}ms</span>}
            </summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div><p className="text-xs font-bold text-slate-400">INPUT</p><pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-2 font-mono text-xs text-slate-100">{r.input || "(empty)"}</pre></div>
              <div><p className="text-xs font-bold text-slate-400">YOUR OUTPUT</p><pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-2 font-mono text-xs text-slate-100">{r.actualOutput ?? r.stdout ?? "(none)"}</pre></div>
            </div>
            {r.expectedOutput != null && <div className="mt-2"><p className="text-xs font-bold text-slate-400">EXPECTED</p><pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-2 font-mono text-xs text-slate-100">{r.expectedOutput}</pre></div>}
            {r.stderr && <div className="mt-2"><p className="text-xs font-bold text-red-400">STDERR / COMPILER</p><pre className="mt-1 overflow-x-auto rounded-lg bg-red-950 p-2 font-mono text-xs text-red-100">{r.stderr}</pre></div>}
          </details>
        ))}
      </div>
    </div>
  );
}

function SubmissionList({ problemId, tick, onOpen }: { problemId: string; tick: unknown; onOpen: (id: string) => void }) {
  const { data } = useApi(() => codingService.submissions(problemId), [problemId, tick]);
  const rows = (data ?? []) as JudgeSubmission[];
  if (rows.length === 0) return <p className="mt-2 text-sm text-slate-400">No submissions yet — your runs and verdicts will appear here.</p>;
  return (
    <div className="mt-2 space-y-1.5">
      {rows.slice(0, 10).map((s) => (
        <button key={s.id} onClick={() => onOpen(s.id)} className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-indigo-50">
          <span className="font-medium text-slate-700">{s.language} · {s.passedTests}/{s.totalTests}{s.runtimeMs != null ? ` · ${s.runtimeMs}ms` : ""}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <Badge value={s.status} />
          </span>
        </button>
      ))}
    </div>
  );
}
