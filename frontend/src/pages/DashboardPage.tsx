import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import StatCard from "../components/dashboard/StatCard";

const activities = [
  {
    title: "Solved Two Sum",
    category: "Coding Practice",
    time: "25 min ago",
    icon: Code2,
  },
  {
    title: "Completed Quantitative Aptitude",
    category: "Aptitude",
    time: "2 hours ago",
    icon: BookOpen,
  },
  {
    title: "Updated your resume",
    category: "Resume",
    time: "Yesterday",
    icon: CheckCircle2,
  },
];

const tasks = [
  {
    title: "Practice Arrays & Strings",
    type: "Coding",
    progress: 70,
  },
  {
    title: "Complete Aptitude Mock Test",
    type: "Aptitude",
    progress: 40,
  },
  {
    title: "Prepare for TCS Interview",
    type: "Company Prep",
    progress: 20,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-5 sm:p-6 lg:p-8">
          <section className="mb-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-indigo-600">
                  Thursday, July 30
                </p>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Good evening, Devananda 👋
                </h2>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Keep the momentum going. You're making solid progress.
                </p>
              </div>

              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md">
                Continue Preparation
                <ArrowRight size={17} />
              </button>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Overall Progress"
              value="68%"
              description="+8% from last week"
              icon={Target}
              iconClassName="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              title="Problems Solved"
              value="42"
              description="12 solved this week"
              icon={Code2}
              iconClassName="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              title="Aptitude Score"
              value="84%"
              description="+6% improvement"
              icon={Trophy}
              iconClassName="bg-amber-50 text-amber-600"
            />

            <StatCard
              title="Current Streak"
              value="7 days"
              description="Best streak: 12 days"
              icon={Flame}
              iconClassName="bg-orange-50 text-orange-600"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Preparation progress
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your progress across key placement areas
                  </p>
                </div>

                <span className="text-sm font-semibold text-indigo-600">
                  68%
                </span>
              </div>

              <div className="mt-6">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: "68%" }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Coding
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    72%
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Aptitude
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    84%
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Interviews
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    48%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Upcoming tasks
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Stay on track today
                  </p>
                </div>

                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  View all
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {tasks.map((task) => (
                  <div key={task.title}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {task.type}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        {task.progress}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Quick actions
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Jump back into preparation
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50">
                  <Code2 className="text-indigo-600" size={21} />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Solve Problems
                  </p>
                </button>

                <button className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50">
                  <BrainIcon />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Take a Quiz
                  </p>
                </button>

                <button className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50">
                  <BriefcaseBusiness className="text-indigo-600" size={21} />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Explore Companies
                  </p>
                </button>

                <button className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50">
                  <BookOpen className="text-indigo-600" size={21} />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Review Resources
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Recent activity
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your latest preparation activity
                  </p>
                </div>

                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  See history
                </button>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {activities.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      key={activity.title}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {activity.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {activity.category}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {activity.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function BrainIcon() {
  return <span className="text-xl">🧠</span>;
}