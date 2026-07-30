import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function CompaniesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Company Preparation
          </h1>

          <p className="mt-2 text-slate-500">
            Explore companies and prepare for their recruitment process.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Company preparation module coming next.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}