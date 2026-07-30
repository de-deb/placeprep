import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Code2,
  Brain,
  FileText,
  User,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Companies",
    icon: Building2,
    path: "/companies",
  },
  {
    label: "Coding Practice",
    icon: Code2,
    path: "/coding",
  },
  {
    label: "Aptitude",
    icon: Brain,
    path: "/aptitude",
  },
  {
    label: "Resume",
    icon: FileText,
    path: "/resume",
  },
];

const secondaryNavigation = [
  {
    label: "Profile",
    icon: User,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <GraduationCap size={22} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            PlacePrep
          </h1>

          <p className="text-xs text-slate-500">
            Placement preparation
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {/* Workspace */}
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Account */}
        <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Account
        </p>

        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}