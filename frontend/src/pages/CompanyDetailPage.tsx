import { Link, useParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { companyService } from "../services";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";
import { mockCompanies } from "../data/mockData";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(() => companyService.get(id!), [id]);
  const prepApi = useApi(
    () => (demoMode ? Promise.resolve(null) : companyService.prep(id!)),
    [id, demoMode]
  );

  const company = data ?? mockCompanies.find((c) => c.id === id);

  return (
    <AppLayout>
      <Link to="/companies" className="mb-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">← Back to companies</Link>
      {loading && <Skeleton lines={5} />}
      {error && !company && <ErrorState message={error} onRetry={reload} />}
      {!loading && !company && <EmptyState title="Company not found" />}
      {company && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{company.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{company.industry ?? ""} {company.website ? `· ${company.website}` : ""}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {company.packageLpa != null && <Badge value={`${company.packageLpa} LPA`} />}
                {company.eligibilityCgpa != null && <Badge value={`${company.eligibilityCgpa}+ CGPA`} />}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{company.description ?? "No description yet."}</p>
              {company.process && (
                <>
                  <h3 className="mt-6 font-semibold text-slate-900">Recruitment process</h3>
                  <ol className="mt-2 space-y-1.5">
                    {company.process.split("→").map((s, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">{i + 1}</span>
                        {s.trim()}
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {(company.roles ?? []).length > 0 && (
                <>
                  <h3 className="mt-6 font-semibold text-slate-900">Open roles</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {company.roles.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </>
              )}
            </Card>
            <div className="space-y-6">
              <Card>
                <CardTitle title="Important topics" subtitle="Focus here first" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {(company.topics ?? []).length === 0 && <p className="text-sm text-slate-400">No topics listed.</p>}
                  {(company.topics ?? []).map((t) => <span key={t} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{t}</span>)}
                </div>
              </Card>
              <Card>
                <CardTitle title="Drives" subtitle={`${company.drives?.length ?? 0} scheduled`} />
                <div className="mt-3 space-y-2">
                  {(company.drives ?? []).length === 0 && <p className="text-sm text-slate-400">No drives scheduled yet.</p>}
                  {(company.drives ?? []).map((d) => (
                    <Link key={d.id} to="/drives" className="block rounded-xl border border-slate-100 p-3 text-sm transition hover:border-indigo-200 hover:bg-indigo-50/50">
                      <p className="font-semibold text-slate-800">{d.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(d.date)} · {d.status}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Prepare for this company */}
          <Card className="mt-6 border-indigo-100">
            <CardTitle
              title={`Prepare for ${company.name}`}
              subtitle="Company-matched problems, questions and resources"
              right={prepApi.data ? <span className="text-sm font-bold text-indigo-700">{prepApi.data.solved}/{prepApi.data.total} solved ({prepApi.data.pct}%)</span> : undefined}
            />
            {prepApi.data && prepApi.data.byTopic.length > 0 && (
              <div className="mt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${prepApi.data.pct}%` }} />
                </div>
                <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {prepApi.data.byTopic.map((t) => (
                    <div key={t.topic}>
                      <div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-700">{t.topic}</span><span className="text-slate-400">{t.solved}/{t.total}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${t.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
                {prepApi.data.weakestTopic && <p className="mt-2 text-xs font-semibold text-amber-700">Weakest: {prepApi.data.weakestTopic}</p>}
                {prepApi.data.recommended.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended next</p>
                    <div className="mt-2 space-y-1.5">
                      {prepApi.data.recommended.map((p, i) => (
                        <Link key={p.id} to={p.source === "INTERNAL" ? `/coding/${p.id}` : "/coding"} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-indigo-50">
                          <span className="font-medium text-slate-700">{i + 1}. {p.title}</span><Badge value={p.difficulty} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coding problems</p>
                <div className="mt-2 space-y-2">
                  {(company.relevantProblems ?? []).length === 0 && <p className="text-sm text-slate-400">Solve topic-wise from Coding Practice.</p>}
                  {(company.relevantProblems ?? []).map((p) => (
                    <Link key={p.id} to="/coding" className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-indigo-50">
                      <span className="truncate font-medium text-slate-700">{p.title}</span>
                      <Badge value={p.difficulty} />
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview questions</p>
                <div className="mt-2 space-y-2">
                  {(company.interviewQuestions ?? []).length === 0 && <p className="text-sm text-slate-400">Practice category-wise from Interview Prep.</p>}
                  {(company.interviewQuestions ?? []).map((q) => (
                    <Link key={q.id} to="/interview" className="block rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-indigo-50">
                      <span className="font-medium text-slate-700">{q.question}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{q.category} · {q.difficulty}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Resources</p>
                <div className="mt-2 space-y-2">
                  {(company.resources ?? []).length === 0 && <p className="text-sm text-slate-400">See the Resource Center.</p>}
                  {(company.resources ?? []).map((r) => (
                    <Link key={r.id} to="/resources" className="block rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-indigo-50">
                      <span className="font-medium text-slate-700">{r.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{r.type}{r.level ? ` · ${r.level}` : ""}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
