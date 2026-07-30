import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function CodingPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Coding Practice
          </h1>

          <p className="mt-2 text-slate-500">
            Sharpen your problem-solving skills with curated coding problems.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Coding practice module coming next.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}