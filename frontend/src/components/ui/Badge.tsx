const palette: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Hard: "bg-red-50 text-red-700 ring-red-200",
  OPEN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UPCOMING: "bg-blue-50 text-blue-700 ring-blue-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
  APPLIED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  SHORTLISTED: "bg-blue-50 text-blue-700 ring-blue-200",
  ONLINE_ASSESSMENT: "bg-purple-50 text-purple-700 ring-purple-200",
  INTERVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
  SELECTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  WITHDRAWN: "bg-slate-100 text-slate-500 ring-slate-200",
  PRACTICED: "bg-blue-50 text-blue-700 ring-blue-200",
  CONFIDENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  NOT_STARTED: "bg-slate-100 text-slate-500 ring-slate-200",
  SOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ATTEMPTED: "bg-amber-50 text-amber-700 ring-amber-200",
  ALL: "bg-slate-100 text-slate-600 ring-slate-200",
};

const pretty: Record<string, string> = {
  ONLINE_ASSESSMENT: "ASSESSMENT",
  NOT_STARTED: "NOT STARTED",
};

export function Badge({ value }: { value: string }) {
  const v = value ?? "—";
  const cls = palette[v] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {pretty[v] ?? v.replace(/_/g, " ")}
    </span>
  );
}

/** Colored dot + label for urgency (deadlines). */
export function Urgency({ level, label }: { level: "normal" | "soon" | "today" | "closed"; label: string }) {
  const dot = level === "today" ? "bg-red-500" : level === "soon" ? "bg-amber-500" : level === "closed" ? "bg-slate-300" : "bg-emerald-500";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
