import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/States";
import { Badge } from "../../components/ui/Badge";
import { useApi } from "../../hooks/useApi";
import { adminService } from "../../services";
import { useAuth } from "../../context/AuthContext";
import type { StudentProfile, User } from "../../types";

type Row = User & { profile: StudentProfile | null; _count: { applications: number } };

const demoRows: Row[] = [
  { id: "1", name: "Devananda", email: "student@placeprep.local", role: "STUDENT", profile: { id: "p1", userId: "1", cgpa: 8.4, branch: "Computer Science", year: 3, skills: ["React", "DSA"], phone: null, resumeHeadline: null }, _count: { applications: 2 } },
  { id: "2", name: "Aarav Sharma", email: "aarav@placeprep.local", role: "STUDENT", profile: { id: "p2", userId: "2", cgpa: 9.1, branch: "Computer Science", year: 4, skills: ["Java", "DSA"], phone: null, resumeHeadline: null }, _count: { applications: 2 } },
];

export default function AdminStudentsPage() {
  const { demoMode } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const { data, loading, error, reload } = useApi(
    () =>
      demoMode
        ? Promise.resolve(demoRows.filter((r) => (!query || r.name.toLowerCase().includes(query.toLowerCase()) || r.email.includes(query)) && (!branch || r.profile?.branch === branch)))
        : adminService.students({ search: query || undefined, branch: branch || undefined, minCgpa: minCgpa ? Number(minCgpa) : undefined }),
    [query, branch, minCgpa, demoMode]
  );

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = search.trim();
    if (trimmed !== query) {
      setQuery(trimmed);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (!val && query) {
      setQuery("");
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Students"
        subtitle={`${data?.length ?? 0} registered — click a row for the 360° view`}
        action={
          <>
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name or email… (Enter)"
                aria-label="Search students"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </form>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Filter by branch" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All branches</option>
              <option>Computer Science</option><option>AIDS</option><option>ECE</option><option>Mechanical</option><option>Civil</option>
            </select>
            <select value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} aria-label="Filter by CGPA" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">Any CGPA</option>
              <option value="6">6.0+</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option>
            </select>
          </>
        }
      />
      {loading && <Skeleton lines={5} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (data ?? []).length === 0 && <EmptyState title="No students found" hint="Adjust search or filters." />}
      {!loading && !error && (data ?? []).length > 0 && (
        <DataTable<Row>
          rows={data ?? []}
          emptyTitle="No students found"
          columns={[
            {
              key: "name", header: "Name",
              render: (s) => <Link to={`/admin/students/${s.id}`} className="font-semibold text-indigo-700 hover:text-indigo-900">{s.name}</Link>,
              sortValue: (s) => s.name.toLowerCase(),
            },
            { key: "email", header: "Email", render: (s) => <span className="text-slate-500">{s.email}</span> },
            { key: "branch", header: "Branch", render: (s) => s.profile?.branch ?? "—", sortValue: (s) => s.profile?.branch ?? "" },
            { key: "cgpa", header: "CGPA", render: (s) => <b>{s.profile?.cgpa ?? "—"}</b>, sortValue: (s) => s.profile?.cgpa ?? -1 },
            { key: "skills", header: "Skills", render: (s) => <span className="text-xs text-slate-500">{(s.profile?.skills ?? []).slice(0, 3).join(", ") || "—"}</span> },
            {
              key: "apps", header: "Applications", render: (s) => <Badge value={`${s._count.applications} applied`} />,
              sortValue: (s) => s._count.applications,
            },
          ]}
        />
      )}
    </AppLayout>
  );
}
