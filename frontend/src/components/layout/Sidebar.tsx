import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Code2,
  Brain,
  BriefcaseBusiness,
  BookOpen,
  Megaphone,
  User,
  FileText,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  end?: boolean;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const studentNav: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Drives", icon: BriefcaseBusiness, path: "/drives" },
    { label: "Companies", icon: Building2, path: "/companies" },
    { label: "Coding Practice", icon: Code2, path: "/coding" },
    { label: "Aptitude", icon: Brain, path: "/aptitude" },
    { label: "Interview Prep", icon: BookOpen, path: "/interview" },
    { label: "Resume", icon: FileText, path: "/resume" },
    { label: "Resources", icon: BookOpen, path: "/resources" },
    { label: "Announcements", icon: Megaphone, path: "/announcements" },
  ];

  const studentSecondary = [
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const adminNav: NavItem[] = [
    { label: "Overview", icon: ShieldCheck, path: "/admin", end: true },
    { label: "Students", icon: Users, path: "/admin/students" },
    { label: "Companies", icon: Building2, path: "/admin/companies" },
    { label: "Drives", icon: BriefcaseBusiness, path: "/admin/drives" },
    { label: "Coding", icon: Code2, path: "/admin/coding" },
    { label: "Resources", icon: BookOpen, path: "/admin/resources" },
    { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  ];

  const nav = isAdmin ? adminNav : studentNav;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <GraduationCap size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">PlacePrep</h1>
          <p className="text-xs text-slate-500">{isAdmin ? "Placement cell" : "Placement preparation"}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isAdmin ? "Admin" : "Workspace"}
        </p>
        <div className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.label + item.path} to={item.path} end={!!item.end} className={linkClass}>
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {!isAdmin && (
          <>
            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
            <div className="space-y-1">
              <NavLink to="/profile" className={linkClass}>
                <User size={19} />
                <span>Profile</span>
              </NavLink>
              <NavLink to="/applications" className={linkClass}>
                <BriefcaseBusiness size={19} />
                <span>My Applications</span>
              </NavLink>
              {studentSecondary.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} className={linkClass}>
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </>
        )}

        {isAdmin && (
          <>
            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Student view</p>
            <div className="space-y-1">
              <NavLink to="/dashboard" className={linkClass}>
                <LayoutDashboard size={19} />
                <span>Dashboard (demo)</span>
              </NavLink>
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
