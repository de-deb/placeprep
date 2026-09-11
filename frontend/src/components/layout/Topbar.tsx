import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services";
import type { NotificationItem } from "../../types";
import Sidebar from "./Sidebar";
import { formatDate } from "../../utils/format";

export default function Topbar() {
  const { user, demoMode } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const initials = (user?.name ?? "PP").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (demoMode || !user) return;
    notificationService
      .list(false)
      .then((r) => {
        setNotes(r.items.slice(0, 6));
        setUnread(r.unread);
      })
      .catch(() => {});
  }, [demoMode, user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBellOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const openNote = async (n: NotificationItem) => {
    setBellOpen(false);
    if (!n.read && !demoMode) {
      try {
        await notificationService.markRead(n.id);
        setUnread((u) => Math.max(0, u - 1));
        setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        /* non-blocking */
      }
    }
    navigate(n.link ?? "/notifications");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <>
      <header className="topbar flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-3">
          <button
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <form onSubmit={submitSearch} className="relative w-full max-w-md" role="search">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies, drives, problems… (Enter)"
              aria-label="Global search"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </form>
        </div>

        <div className="ml-4 flex items-center gap-3 sm:gap-4">
          {demoMode && (
            <span className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 md:inline">
              Demo mode
            </span>
          )}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              aria-expanded={bellOpen}
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="menu">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <Link to="/notifications" onClick={() => setBellOpen(false)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notes.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">You're all caught up 🎉</p>}
                  {notes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNote(n)}
                      className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 ${n.read ? "" : "bg-indigo-50/50"}`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDate(n.createdAt)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <Link to="/profile" className="flex items-center gap-3 rounded-xl transition hover:bg-slate-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Guest"}</p>
              <p className="text-xs text-slate-500">{user?.role === "ADMIN" ? "Placement Cell" : "Student"}</p>
            </div>
          </Link>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white shadow-xl" onClick={() => setMobileOpen(false)}>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
