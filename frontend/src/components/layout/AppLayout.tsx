import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../context/AuthContext";

/** Shared student/admin shell: sidebar + topbar + content area. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { demoMode } = useAuth();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        {demoMode && (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800">
            Demo mode — showing sample data. Log in with a real account (backend running) for live data.
          </div>
        )}
        <main id="main-content" className="mx-auto w-full max-w-7xl p-5 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
