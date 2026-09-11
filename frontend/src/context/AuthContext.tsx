import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { authService } from "../services";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  enterDemo: (role?: User["role"]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStored(): { user: User | null; token: string | null; demo: boolean } {
  try {
    const token = localStorage.getItem("placeprep_token");
    const userRaw = localStorage.getItem("placeprep_user");
    const demo = localStorage.getItem("placeprep_demo") === "1";
    return { user: userRaw ? (JSON.parse(userRaw) as User) : null, token, demo };
  } catch {
    return { user: null, token: null, demo: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Screenshot/demo shortcut: /dashboard?demo=student (used for docs screenshots + viva).
    try {
      const params = new URLSearchParams(window.location.search);
      const demoParam = params.get("demo");
      if (demoParam === "student" || demoParam === "admin") {
        const demoUser: User =
          demoParam === "admin"
            ? { id: "demo-admin", name: "Placement Admin", email: "admin@placeprep.local", role: "ADMIN" }
            : { id: "demo-student", name: "Devananda", email: "student@placeprep.local", role: "STUDENT" };
        localStorage.removeItem("placeprep_token");
        localStorage.setItem("placeprep_user", JSON.stringify(demoUser));
        localStorage.setItem("placeprep_demo", "1");
        setUser(demoUser);
        setDemoMode(true);
        setLoading(false);
        return;
      }
    } catch {
      /* ignore */
    }
    const stored = readStored();
    if (stored.demo && stored.user) {
      setUser(stored.user);
      setDemoMode(true);
      setLoading(false);
      return;
    }
    if (!stored.token) {
      setLoading(false);
      return;
    }
    setToken(stored.token);
    authService
      .me()
      .then((me) => {
        setUser({ id: me.id, name: me.name, email: me.email, role: me.role });
        localStorage.setItem("placeprep_user", JSON.stringify({ id: me.id, name: me.name, email: me.email, role: me.role }));
      })
      .catch(() => {
        localStorage.removeItem("placeprep_token");
        localStorage.removeItem("placeprep_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (u: User, t: string | null, demo: boolean) => {
    setUser(u);
    setToken(t);
    setDemoMode(demo);
    if (t) localStorage.setItem("placeprep_token", t);
    else localStorage.removeItem("placeprep_token");
    localStorage.setItem("placeprep_user", JSON.stringify(u));
    if (demo) localStorage.setItem("placeprep_demo", "1");
    else localStorage.removeItem("placeprep_demo");
  };

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token: t } = await authService.login({ email, password });
    persist(u, t, false);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: u, token: t } = await authService.register({ name, email, password });
    persist(u, t, false);
  }, []);

  const enterDemo = useCallback((role: User["role"] = "STUDENT") => {
    const demoUser: User =
      role === "ADMIN"
        ? { id: "demo-admin", name: "Placement Admin", email: "admin@placeprep.local", role: "ADMIN" }
        : { id: "demo-student", name: "Devananda", email: "student@placeprep.local", role: "STUDENT" };
    localStorage.removeItem("placeprep_token");
    persist(demoUser, null, true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("placeprep_token");
    localStorage.removeItem("placeprep_user");
    localStorage.removeItem("placeprep_demo");
    setUser(null);
    setToken(null);
    setDemoMode(false);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, demoMode, login, register, enterDemo, logout }),
    [user, token, loading, demoMode, login, register, enterDemo, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
