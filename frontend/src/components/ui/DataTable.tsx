import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

/**
 * Client-side sortable + paginated table. Enough for college-scale admin
 * tables without a data-grid dependency.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  pageSize = 8,
  emptyTitle = "No rows found",
  emptyHint,
}: {
  columns: Column<T>[];
  rows: T[];
  pageSize?: number;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * dir;
    });
  }, [rows, columns, sortKey, dir]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggle = (key: string, sortable: boolean) => {
    if (!sortable) return;
    if (sortKey === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setDir(1);
    }
    setPage(0);
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="font-semibold text-slate-800">{emptyTitle}</p>
        {emptyHint && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">
                  <button
                    onClick={() => toggle(c.key, !!c.sortValue)}
                    className={c.sortValue ? "inline-flex items-center gap-1 uppercase hover:text-slate-800" : "uppercase"}
                    aria-label={c.sortValue ? `Sort by ${c.header}` : undefined}
                  >
                    {c.header}
                    {c.sortValue && sortKey === c.key && <span aria-hidden="true">{dir === 1 ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={row.id} className="transition hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>Page {safePage + 1} of {pages} · {rows.length} rows</span>
          <div className="flex gap-2">
            <button
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              ← Prev
            </button>
            <button
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
