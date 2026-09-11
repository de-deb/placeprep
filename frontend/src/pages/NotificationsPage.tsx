import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { notificationService } from "../services";
import { getErrorMessage } from "../services/api";
import { mockNotifications } from "../data/mockData";
import { timeAgo } from "../utils/format";

const TYPE_LABEL: Record<string, string> = {
  DRIVE_DEADLINE: "Drive",
  APPLICATION_STATUS: "Application",
  ANNOUNCEMENT: "Announcement",
  PREPARATION: "Preparation",
  SYSTEM: "System",
};

export default function NotificationsPage() {
  const { demoMode } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => (demoMode ? Promise.resolve({ items: mockNotifications, unread: 2 }) : notificationService.list(false)),
    [demoMode]
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [msg, setMsg] = useState<string | null>(null);

  const items = (data?.items ?? []).filter((n) => filter === "all" || !n.read);

  const markAll = async () => {
    if (demoMode) return setMsg("Demo mode — log in to manage notifications.");
    try {
      await notificationService.markAllRead();
      reload();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  };

  const open = async (id: string, read: boolean) => {
    if (!read && !demoMode) {
      try {
        await notificationService.markRead(id);
        reload();
      } catch { /* navigation still works */ }
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.unread} unread` : "Deadlines, status updates and announcements."}
        action={
          <>
            <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "unread")} aria-label="Filter notifications" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="all">All</option>
              <option value="unread">Unread only</option>
            </select>
            <button onClick={markAll} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Mark all read
            </button>
          </>
        }
      />
      {msg && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{msg}</p>}
      {loading && <Skeleton lines={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title={filter === "unread" ? "No unread notifications" : "No notifications yet"} hint="Status changes, deadlines and announcements will appear here." />
      )}
      <div className="space-y-2.5">
        {items.map((n) => (
          <Link key={n.id} to={n.link ?? "/notifications"} onClick={() => open(n.id, n.read)}>
            <Card className={`transition hover:border-indigo-200 ${n.read ? "" : "border-indigo-200 bg-indigo-50/40"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white"}`}>
                  <Bell size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{n.title}</p>
                    <Badge value={TYPE_LABEL[n.type] ?? n.type} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600" aria-label="Unread" />}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
