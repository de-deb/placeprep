import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><GraduationCap size={22} /></div>
          <span className="text-lg font-bold text-slate-900">PlacePrep</span>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link to={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Open app →</Link>
          ) : (
            <>
              <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log in</Link>
              <Link to="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Get started</Link>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">VIT Chennai · Software Engineering</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          One portal for placement preparation & management
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-500">
          Practice coding & aptitude, prepare company-wise, track readiness, apply to drives —
          while the placement cell manages students, drives and announcements.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Start preparing</Link>
          <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Admin login</Link>
        </div>
        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {[
            { t: "Readiness dashboard", d: "Weighted score across CGPA, skills, coding, aptitude and applications — with weak areas." },
            { t: "Drives & applications", d: "Browse open drives, check eligibility, apply in one click, track status." },
            { t: "Placement cell tools", d: "Manage students, companies, drives, resources and announcements with analytics." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-bold text-slate-900">{f.t}</p>
              <p className="mt-2 text-sm text-slate-500">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
