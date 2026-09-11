import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { getErrorMessage } from "../services/api";

export default function LoginPage() {
  const { login, enterDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("student@placeprep.local");
  const [password, setPassword] = useState("Student@123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">PlacePrep</h1>
            <p className="text-sm text-slate-500">Placement preparation portal</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-900">Welcome back</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">Log in to continue your preparation.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          No account?{" "}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Register</Link>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => { enterDemo("STUDENT"); navigate("/dashboard"); }} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Demo as Student
          </button>
          <button onClick={() => { enterDemo("ADMIN"); navigate("/admin"); }} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Demo as Admin
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">Seeded logins: student@placeprep.local / Student@123 · admin@placeprep.local / Admin@123</p>
      </div>
    </div>
  );
}
