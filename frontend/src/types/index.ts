export type Role = "STUDENT" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface StudentProfile {
  id: string;
  userId: string;
  cgpa: number | null;
  branch: string | null;
  year: number | null;
  skills: string[];
  phone: string | null;
  resumeHeadline: string | null;
  location?: string | null;
  college?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
}

export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  description?: string | null;
  packageLpa?: number | null;
  eligibilityCgpa?: number | null;
  roles: string[];
  process?: string | null;
  topics: string[];
  _count?: { drives: number };
  drives?: Drive[];
  relevantProblems?: { id: string; title: string; difficulty: string; tags: string[] }[];
  interviewQuestions?: { id: string; category: string; difficulty: string; question: string }[];
  resources?: Resource[];
}

export interface Eligibility {
  eligible: boolean;
  reasons: string[];
}

export interface Drive {
  id: string;
  companyId: string;
  company?: Company;
  title: string;
  date: string;
  deadline?: string | null;
  location?: string | null;
  mode?: string;
  eligibility?: string | null;
  description?: string | null;
  status: string;
  minCgpa?: number | null;
  allowedBranches?: string[];
  allowedYears?: number[];
  requiredSkills?: string[];
  applied?: boolean;
  eligibilityResult?: Eligibility;
  _count?: { applications: number };
}

export interface StatusHistoryEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedBy?: { name: string; role: string } | null;
  note?: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  driveId: string;
  status: string;
  appliedAt: string;
  updatedAt?: string;
  drive?: Drive;
  history?: StatusHistoryEntry[];
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  type: string;
  url?: string | null;
  description?: string | null;
  level?: string | null;
  tags?: string[];
  company?: string | null;
  featured?: boolean;
  bookmarked?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  description: string;
  hint?: string | null;
  constraints?: string | null;
  inputFormat?: string | null;
  outputFormat?: string | null;
  sampleInput?: string | null;
  sampleOutput?: string | null;
  explanation?: string | null;
  estimatedMinutes?: number | null;
  companies?: string[];
  source?: string;
  externalId?: string | null;
  externalUrl?: string | null;
  expectedTimeComplexity?: string | null;
  expectedSpaceComplexity?: string | null;
  starterCode?: Record<string, string> | null;
  executionSupported?: boolean;
  solved?: boolean;
  bookmarked?: boolean;
}

export interface JudgeTestResult {
  order: number;
  input: string;
  expectedOutput: string | null;
  actualOutput: string | null;
  passed: boolean | null;
  stdout: string;
  stderr: string;
  timeSec: number | null;
  memoryKb: number | null;
}

export interface JudgeVerdict {
  submissionId: string;
  verdict: "ACCEPTED" | "WRONG_ANSWER" | "COMPILATION_ERROR" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED";
  passedTests: number;
  totalTests: number;
  runtimeMs: number | null;
  memoryKb: number | null;
}

export interface JudgeSubmission {
  id: string;
  language: string;
  status: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  passedTests: number;
  totalTests: number;
  createdAt: string;
}

export interface CodingAttempt {
  id: string;
  verdict: string;
  note?: string | null;
  createdAt: string;
  problem?: { id: string; title: string; difficulty: string };
}

export interface CodingSummary {
  total: number;
  solved: number;
  bookmarked: number;
  pct: number;
  submissions: number;
  accepted: number;
  acceptanceRate: number | null;
  activeDays: number;
  byDifficulty: { difficulty: string; total: number; solved: number; pct: number }[];
  strongestTags: { tag: string; total: number; solved: number; pct: number }[];
  weakestTags: { tag: string; total: number; solved: number; pct: number }[];
  weakestTag: string | null;
  recentAttempts: CodingAttempt[];
}

export interface AptitudeQuestion {
  id: string;
  category: string;
  topic?: string;
  difficulty?: string;
  question: string;
  options: string[];
  explanation?: string | null;
}

export interface QuizAttempt {
  id: string;
  category: string;
  difficulty?: string | null;
  score: number;
  total: number;
  timeTakenSeconds?: number | null;
  takenAt: string;
}

export interface QuizReviewItem {
  questionId: string;
  question: string;
  category: string;
  topic: string;
  options: string[];
  selectedIndex: number;
  answerIndex: number | null;
  correct: boolean;
  explanation: string | null;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeTakenSeconds: number | null;
  topics: { topic: string; correct: number; total: number; pct: number }[];
  review: QuizReviewItem[];
}

export interface AptitudeAnalytics {
  attempts: number;
  average: number | null;
  best: number | null;
  accuracy: number | null;
  byCategory: { category: string; attempts: number; average: number }[];
  trend: { takenAt: string; pct: number }[];
}

export interface InterviewQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  guidance?: string | null;
  keyPoints: string[];
  companies: string[];
  myStatus?: string;
}

export interface InterviewSummary {
  total: number;
  practiced: number;
  confident: number;
  pct: number;
  categories: { category: string; total: number; practiced: number; pct: number }[];
  weakestCategory: string | null;
}

export interface ResumeEntry {
  id: string;
  [key: string]: unknown;
}

export interface Resume {
  id: string;
  userId: string;
  summary?: string | null;
  experiences: ResumeEntry[];
  projects: ResumeEntry[];
  achievements: ResumeEntry[];
  certifications: ResumeEntry[];
}

export interface ResumeFull {
  user: User;
  profile: StudentProfile | null;
  resume: Resume;
  strength: { score: number; suggestions: string[] };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  link: string;
  priority: number;
}

export interface Completeness {
  score: number;
  missing: string[];
  sections: { label: string; done: boolean }[];
}

export interface TrendPoint {
  date: string;
  score: number;
}

export interface Readiness {
  score: number;
  grade: string;
  breakdown: { label: string; value: number; max: number }[];
  weakAreas: string[];
  strongest?: { label: string; value: number; max: number };
  weakest?: { label: string; value: number; max: number };
}

export interface Opportunity extends Drive {
  eligibilityResult: Eligibility;
  urgency: "normal" | "soon" | "today" | "closed";
}

export interface ActivityItem {
  type: string;
  title: string;
  detail: string;
  at: string;
}

export interface DashboardData {
  user: User;
  profile: StudentProfile | null;
  readiness: Readiness;
  completeness: Completeness;
  headline: string;
  trend: { points: TrendPoint[]; previousScore: number | null; change: number };
  stats: {
    problemsSolved: number;
    problemsTotal: number;
    codingPct: number;
    bookmarked: number;
    aptitudeAvg: number | null;
    quizCount: number;
    applicationsCount: number;
    upcomingCount: number;
    unreadNotifications: number;
    streak?: number;
    acceptanceRate?: number | null;
  };
  recommendations: Recommendation[];
  opportunities: Opportunity[];
  activity: ActivityItem[];
  applications: Application[];
  announcements: Announcement[];
  recentAttempts: QuizAttempt[];
}

export interface SearchResults {
  query: string;
  companies: Company[];
  drives: (Drive & { applied?: boolean })[];
  problems: { id: string; title: string; difficulty: string; tags: string[] }[];
  resources: Resource[];
  interview: { id: string; category: string; difficulty: string; question: string }[];
  announcements: Announcement[];
}

export interface Prefs {
  notifyDeadlines: boolean;
  notifyStatus: boolean;
  notifyAnnouncements: boolean;
  notifyPreparation: boolean;
}

export interface AdminOverview {
  students: number;
  companies: number;
  openDrives: number;
  applications: number;
  resources: number;
  announcements: number;
  avgCgpa: number | null;
  byBranch: Record<string, number>;
  avgReadiness: number | null;
  readinessDistribution: { label: string; count: number }[];
  applicationsByStatus: Record<string, number>;
  applicationsByCompany: Record<string, number>;
  placed: number;
  placementRate: number;
  codingSolved: number;
  aptitudeAvg: number | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
