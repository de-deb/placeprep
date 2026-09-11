import type {
  AdminOverview,
  Announcement,
  Application,
  AptitudeAnalytics,
  AptitudeQuestion,
  CodingProblem,
  CodingSummary,
  Company,
  DashboardData,
  Drive,
  InterviewQuestion,
  InterviewSummary,
  NotificationItem,
  Prefs,
  QuizAttempt,
  QuizResult,
  Resource,
  ResumeFull,
  SearchResults,
  StudentProfile,
  User,
} from "../types";
import { api } from "./api";
import type {
  JudgeSubmission,
  JudgeTestResult,
  JudgeVerdict,
} from "../types";

function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return p.then((r) => r.data.data);
}

type Params = Record<string, string | undefined>;
function clean(p: Params): Params {
  return Object.fromEntries(Object.entries(p).filter(([, v]) => v != null && v !== "")) as Params;
}

export const authService = {
  register: (input: { name: string; email: string; password: string }) =>
    unwrap<{ user: User; token: string }>(api.post("/api/auth/register", input)),
  login: (input: { email: string; password: string }) =>
    unwrap<{ user: User; token: string }>(api.post("/api/auth/login", input)),
  me: () => unwrap<User & { profile: StudentProfile | null }>(api.get("/api/auth/me")),
};

export const dashboardService = {
  get: () => unwrap<DashboardData>(api.get("/api/dashboard")),
};

export const profileService = {
  get: () => unwrap<StudentProfile>(api.get("/api/students/profile")),
  update: (input: Partial<StudentProfile>) =>
    unwrap<StudentProfile>(api.put("/api/students/profile", input)),
};

export const companyService = {
  list: (search?: string) =>
    unwrap<Company[]>(api.get("/api/companies", { params: search ? { search } : {} })),
  get: (id: string) => unwrap<Company>(api.get(`/api/companies/${id}`)),
  prep: (id: string) =>
    unwrap<{
      company: string; topics: string[]; solved: number; total: number; pct: number;
      byTopic: { topic: string; total: number; solved: number; pct: number }[];
      weakestTopic: string | null;
      recommended: { id: string; title: string; difficulty: string; tags: string[]; source: string }[];
    }>(api.get(`/api/companies/${id}/prep`)),
  create: (input: Partial<Company>) => unwrap<Company>(api.post("/api/companies", input)),
  update: (id: string, input: Partial<Company>) => unwrap<Company>(api.put(`/api/companies/${id}`, input)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete(`/api/companies/${id}`)),
};

export const driveService = {
  list: (status?: string) =>
    unwrap<Drive[]>(api.get("/api/drives", { params: status ? { status } : {} })),
  get: (id: string) => unwrap<Drive>(api.get(`/api/drives/${id}`)),
  create: (input: Record<string, unknown>) => unwrap<Drive>(api.post("/api/drives", input)),
  update: (id: string, input: Record<string, unknown>) =>
    unwrap<Drive>(api.put(`/api/drives/${id}`, input)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete(`/api/drives/${id}`)),
};

export const applicationService = {
  mine: () => unwrap<Application[]>(api.get("/api/applications")),
  apply: (driveId: string) => unwrap<Application>(api.post("/api/applications", { driveId })),
  withdraw: (id: string) => unwrap<{ id: string }>(api.delete(`/api/applications/${id}`)),
  timeline: (id: string) => unwrap<Application>(api.get(`/api/applications/${id}`)),
  setStatus: (id: string, status: string, note?: string | null) =>
    unwrap<Application>(api.put(`/api/applications/${id}/status`, { status, note })),
};

export const resourceService = {
  list: (params?: { category?: string; search?: string; level?: string; tag?: string; featured?: boolean; bookmarked?: boolean; company?: string }) =>
    unwrap<Resource[]>(api.get("/api/resources", { params: clean({ ...(params as Params), featured: params?.featured ? "true" : undefined, bookmarked: params?.bookmarked ? "true" : undefined }) })),
  toggleBookmark: (id: string) => unwrap<{ resourceId: string; bookmarked: boolean }>(api.put(`/api/resources/${id}/bookmark`)),
  create: (input: Partial<Resource>) => unwrap<Resource>(api.post("/api/resources", input)),
  update: (id: string, input: Partial<Resource>) =>
    unwrap<Resource>(api.put(`/api/resources/${id}`, input)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete(`/api/resources/${id}`)),
};

export const announcementService = {
  list: () => unwrap<Announcement[]>(api.get("/api/announcements")),
  create: (input: { title: string; body: string }) =>
    unwrap<Announcement>(api.post("/api/announcements", input)),
  update: (id: string, input: { title?: string; body?: string }) =>
    unwrap<Announcement>(api.put(`/api/announcements/${id}`, input)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete(`/api/announcements/${id}`)),
};

export const codingService = {
  problems: (params?: { difficulty?: string; search?: string; tag?: string; source?: string }) =>
    unwrap<CodingProblem[]>(api.get("/api/coding/problems", { params: clean(params ?? {}) })),
  detail: (id: string) =>
    unwrap<CodingProblem & { attempts: { id: string; verdict: string; note?: string | null; createdAt: string }[]; relevant: { id: string; title: string; difficulty: string; tags: string[] }[] }>(
      api.get(`/api/coding/problems/${id}`)
    ),
  setProgress: (id: string, input: { solved?: boolean; bookmarked?: boolean }) =>
    unwrap<unknown>(api.put(`/api/coding/problems/${id}/progress`, input)),
  attempt: (id: string, input: { verdict: "SOLVED" | "ATTEMPTED"; note?: string | null }) =>
    unwrap<unknown>(api.post(`/api/coding/problems/${id}/attempts`, input)),
  summary: () => unwrap<CodingSummary>(api.get("/api/coding/summary")),
  run: (id: string, input: { language: string; code: string; stdin?: string }) =>
    unwrap<{ mode: string; results?: JudgeTestResult[]; result?: JudgeTestResult }>(
      api.post(`/api/coding/problems/${id}/run`, input, { timeout: 45000 })
    ),
  submit: (id: string, input: { language: string; code: string }) =>
    unwrap<JudgeVerdict>(api.post(`/api/coding/problems/${id}/submit`, input, { timeout: 120000 })),
  submissions: (id: string) => unwrap<JudgeSubmission[]>(api.get(`/api/coding/problems/${id}/submissions`)),
  submission: (submissionId: string) =>
    unwrap<JudgeSubmission & { sourceCode: string }>(api.get(`/api/coding/submissions/${submissionId}`)),
  languages: () => unwrap<{ code: string; name: string }[]>(api.get("/api/coding/languages")),
  daily: () =>
    unwrap<{ id: string; title: string; difficulty: string; tags: string[]; reason: string; date: string } | null>(
      api.get("/api/coding/daily")
    ),
  recommended: () =>
    unwrap<{ id: string; title: string; difficulty: string; tags: string[]; reason: string }[]>(
      api.get("/api/coding/recommended")
    ),
  streak: () => unwrap<{ streak: number; activeDays: number }>(api.get("/api/coding/streak")),
};

export const aptitudeService = {
  meta: () =>
    unwrap<{ categories: { name: string; count: number }[]; difficulties: { name: string; count: number }[]; topics: { name: string; count: number }[] }>(
      api.get("/api/aptitude/meta")
    ),
  questions: (params?: { category?: string; difficulty?: string; topic?: string; take?: number }) =>
    unwrap<AptitudeQuestion[]>(api.get("/api/aptitude/questions", { params: clean({ ...(params as object as Params), take: params?.take ? String(params.take) : undefined }) })),
  submit: (answers: { questionId: string; selectedIndex: number }[], opts?: { timeTakenSeconds?: number; difficulty?: string }) =>
    unwrap<QuizResult>(api.post("/api/aptitude/submit", { answers, ...opts })),
  attempts: () => unwrap<QuizAttempt[]>(api.get("/api/aptitude/attempts")),
  analytics: () => unwrap<AptitudeAnalytics>(api.get("/api/aptitude/analytics")),
};

export const interviewService = {
  categories: () => unwrap<string[]>(api.get("/api/interview/categories")),
  questions: (params?: { category?: string; difficulty?: string; search?: string }) =>
    unwrap<InterviewQuestion[]>(api.get("/api/interview/questions", { params: clean(params ?? {}) })),
  setProgress: (id: string, status: "PRACTICED" | "CONFIDENT") =>
    unwrap<unknown>(api.put(`/api/interview/questions/${id}/progress`, { status })),
  summary: () => unwrap<InterviewSummary>(api.get("/api/interview/summary")),
};

export const resumeService = {
  get: () => unwrap<ResumeFull>(api.get("/api/resume")),
  update: (input: { summary?: string | null }) => unwrap<unknown>(api.put("/api/resume", input)),
  add: (kind: string, input: Record<string, unknown>) => unwrap<{ id: string }>(api.post(`/api/resume/${kind}`, input)),
  updateEntry: (kind: string, id: string, input: Record<string, unknown>) =>
    unwrap<unknown>(api.put(`/api/resume/${kind}/${id}`, input)),
  removeEntry: (kind: string, id: string) => unwrap<{ id: string }>(api.delete(`/api/resume/${kind}/${id}`)),
};

export const notificationService = {
  list: (unreadOnly = false) =>
    unwrap<{ items: NotificationItem[]; unread: number }>(
      api.get("/api/notifications", { params: unreadOnly ? { unread: "true" } : {} })
    ),
  markRead: (id: string) => unwrap<{ id: string }>(api.put(`/api/notifications/${id}/read`)),
  markAllRead: () => unwrap<{ ok: boolean }>(api.put("/api/notifications/read-all")),
};

export const searchService = {
  query: (q: string) => unwrap<SearchResults>(api.get("/api/search", { params: { q } })),
};

export const settingsService = {
  updateAccount: (name: string) => unwrap<User>(api.put("/api/users/me", { name })),
  changePassword: (currentPassword: string, newPassword: string) =>
    unwrap<{ ok: boolean }>(api.put("/api/users/password", { currentPassword, newPassword })),
  prefs: () => unwrap<Prefs>(api.get("/api/users/prefs")),
  updatePrefs: (prefs: Partial<Prefs>) => unwrap<Prefs>(api.put("/api/users/prefs", prefs)),
};

export const adminService = {
  overview: () => unwrap<AdminOverview>(api.get("/api/admin/overview")),
  students: (params?: { search?: string; branch?: string; minCgpa?: number }) =>
    unwrap<(User & { profile: StudentProfile | null; _count: { applications: number } })[]>(
      api.get("/api/admin/students", {
        params: clean({ search: params?.search, branch: params?.branch, minCgpa: params?.minCgpa != null ? String(params.minCgpa) : undefined }),
      })
    ),
  studentDetail: (id: string) => unwrap<Record<string, unknown>>(api.get(`/api/admin/students/${id}`)),
  driveDetail: (id: string) =>
    unwrap<Drive & { funnel: Record<string, number>; totalApplicants: number; applicants: unknown[] }>(
      api.get(`/api/admin/drives/${id}`)
    ),
  driveApplicants: (id: string, params?: { search?: string; branch?: string; minCgpa?: number; status?: string }) =>
    unwrap<unknown[]>(
      api.get(`/api/drives/${id}/applicants`, {
        params: clean({ search: params?.search, branch: params?.branch, minCgpa: params?.minCgpa != null ? String(params.minCgpa) : undefined, status: params?.status }),
      })
    ),
  bulkStatus: (ids: string[], status: string, note?: string) =>
    unwrap<{ updated: number; skipped: number }>(api.post("/api/applications/bulk-status", { ids, status, note })),
};
