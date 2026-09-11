import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { announcementService } from "../services";
import { mockAnnouncements } from "../data/mockData";
import { formatDate } from "../utils/format";

export default function AnnouncementsPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve(mockAnnouncements) : announcementService.list()),
    [demoMode]
  );

  return (
    <AppLayout>
      <PageHeader title="Announcements" subtitle="Official updates from the placement cell." />
      {loading && <Skeleton lines={4} />}
      {error && !demoMode && !data && <ErrorState message={error} onRetry={reload} />}
      {!loading && (data ?? []).length === 0 && <EmptyState title="No announcements" hint="Check back later." />}
      <div className="space-y-3">
        {(data ?? []).map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-slate-900">{a.title}</h3>
              <span className="shrink-0 text-xs text-slate-400">{formatDate(a.createdAt)}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.body}</p>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
