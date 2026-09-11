export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      {label}
    </div>
  );
}

/** Shimmer placeholder that mirrors content shape (used instead of bare spinners). */
export function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-3 rounded-2xl border border-slate-200 bg-white p-6 ${className}`} aria-hidden="true">
      <div className="h-5 w-1/3 rounded-lg bg-slate-200" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg bg-slate-100" style={{ width: `${92 - i * 9}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded-lg bg-slate-100" />
          <div className="mt-2 h-4 w-4/5 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center" role="alert">
      <p className="font-semibold text-red-800">Something went wrong</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Tiny inline SVG line chart (no chart dependency). */
export function Sparkline({ points, width = 220, height = 56 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) {
    return <p className="text-xs text-slate-400">Not enough history yet — check back after more activity.</p>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - 6 - ((p - min) / span) * (height - 12)] as const);
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = points[points.length - 1] >= points[0];
  const stroke = up ? "#059669" : "#dc2626";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Trend from ${points[0]} to ${points[points.length - 1]}`}>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={up ? "#ecfdf5" : "#fef2f2"} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={stroke} stroke="#fff" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

/** Horizontal bar list for distributions (branch, status, readiness). */
export function BarList({ rows, max }: { rows: { label: string; count: number; tone?: string }[]; max?: number }) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{r.label}</span>
            <span className="font-bold text-slate-900">{r.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${r.tone ?? "bg-indigo-500"}`}
              style={{ width: `${Math.round((r.count / top) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
    </div>
  );
}
