import type {
  Announcement,
  Application,
  CodingProblem,
  Company,
  DashboardData,
  Drive,
  InterviewQuestion,
  NotificationItem,
  Resource,
} from "../types";

/** Fallback content so the UI is demonstrable even when the backend/DB is down. */
export const mockCompanies: Company[] = [
  { id: "c-tcs", name: "TCS", industry: "IT Services", packageLpa: 7.2, eligibilityCgpa: 6, roles: ["Software Developer"], process: "OA → Technical → HR", topics: ["Arrays", "OOPs", "SQL"], description: "Large-scale IT services recruiter." },
  { id: "c-zoho", name: "Zoho", industry: "Product", packageLpa: 12, eligibilityCgpa: 7, roles: ["Software Developer"], process: "Programming → Advanced Programming → HR", topics: ["Arrays", "Strings", "DSA"], description: "Product company, programming-heavy." },
  { id: "c-infosys", name: "Infosys", industry: "IT Services", packageLpa: 6.5, eligibilityCgpa: 6, roles: ["System Engineer"], process: "Aptitude + MCQ → Technical HR → HR", topics: ["Arrays", "DBMS"], description: "Campus hiring with problem-solving focus." },
  { id: "c-amazon", name: "Amazon", industry: "Product", packageLpa: 28, eligibilityCgpa: 7.5, roles: ["SDE-1"], process: "OA → Technical Rounds → Bar Raiser", topics: ["Arrays", "Trees", "Graphs", "Dynamic Programming"], description: "High-bar product hiring." },
];

export const mockDrives: Drive[] = [
  { id: "d1", companyId: "c-tcs", company: mockCompanies[0], title: "TCS Ninja — 2027 Batch", date: new Date(Date.now() + 14 * 86400000).toISOString(), deadline: new Date(Date.now() + 10 * 86400000).toISOString(), location: "Chennai", mode: "On-campus", eligibility: "CGPA ≥ 6.0", description: "National qualifier hiring.", status: "OPEN", applied: false, eligibilityResult: { eligible: true, reasons: [] } },
  { id: "d2", companyId: "c-zoho", company: mockCompanies[1], title: "Zoho Software Developer", date: new Date(Date.now() + 2 * 86400000).toISOString(), deadline: new Date(Date.now() + 1 * 86400000).toISOString(), location: "Chennai", mode: "Off-campus", eligibility: "CGPA ≥ 7.0", description: "Programming-heavy process.", status: "OPEN", applied: true, eligibilityResult: { eligible: true, reasons: [] } },
  { id: "d3", companyId: "c-amazon", company: mockCompanies[3], title: "Amazon SDE Intern — 2027", date: new Date(Date.now() + 21 * 86400000).toISOString(), deadline: new Date(Date.now() + 2 * 86400000).toISOString(), location: "Bengaluru", mode: "Off-campus", eligibility: "CGPA ≥ 7.5", description: "Summer intern hiring.", status: "OPEN", applied: false, eligibilityResult: { eligible: true, reasons: [] } },
];

export const mockProblems: CodingProblem[] = [
  { id: "p1", title: "Two Sum", difficulty: "Easy", source: "INTERNAL", executionSupported: true, tags: ["Arrays", "HashMap"], description: "Return indices of two numbers that add up to target.", hint: "Use a hash map.", sampleInput: "4\n2 7 11 15\n9", sampleOutput: "0 1", explanation: "Store each value's index; for x check if target−x was seen.", estimatedMinutes: 15, companies: ["Amazon", "TCS"], solved: true, bookmarked: true },
  { id: "p2", title: "Valid Parentheses", difficulty: "Easy", tags: ["Stack"], description: "Determine if brackets are valid.", hint: "Push opening brackets.", sampleInput: "()[]{}", sampleOutput: "true", explanation: "Stack-based matching in O(n).", estimatedMinutes: 15, solved: true },
  { id: "p3", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", tags: ["Arrays"], description: "Maximum profit from one transaction.", sampleInput: "6\n7 1 5 3 6 4", sampleOutput: "5", explanation: "One pass tracking minimum price.", estimatedMinutes: 20 },
  { id: "p4", title: "Merge Intervals", difficulty: "Medium", tags: ["Sorting"], description: "Merge overlapping intervals.", solved: false, bookmarked: true },
  { id: "p5", title: "Number of Islands", difficulty: "Medium", tags: ["Graphs"], description: "Count islands in a grid." },
  { id: "p6", title: "LRU Cache", difficulty: "Hard", tags: ["Design"], description: "Design an LRU cache." },
];

export const mockResources: Resource[] = [
  { id: "r1", title: "NeetCode 150 — DSA roadmap", category: "Coding", type: "LINK", level: "Intermediate", description: "Curated DSA list.", tags: ["DSA"], featured: true, bookmarked: true },
  { id: "r2", title: "Quantitative Aptitude basics", category: "Aptitude", type: "ARTICLE", level: "Beginner", description: "Percentages, ratios, time & work.", tags: ["Quant"] },
  { id: "r3", title: "OOPs interview cheat-sheet", category: "Interview", type: "DOC", level: "Beginner", description: "Pillars of OOPs with examples.", tags: ["OOP"] },
];

export const mockAnnouncements: Announcement[] = [
  { id: "a1", title: "TCS registrations open", body: "Apply from the Drives page before the deadline.", audience: "ALL", createdAt: new Date().toISOString() },
  { id: "a2", title: "Mock aptitude test on Friday", body: "Practice the Aptitude module before Friday.", audience: "ALL", createdAt: new Date().toISOString() },
];

export const mockApplications: Application[] = [
  { id: "app1", userId: "demo-student", driveId: "d1", status: "SHORTLISTED", appliedAt: new Date(Date.now() - 4 * 86400000).toISOString(), drive: mockDrives[0], history: [{ id: "h1", oldStatus: "APPLIED", newStatus: "SHORTLISTED", changedBy: { name: "Placement Admin", role: "ADMIN" }, note: null, createdAt: new Date(Date.now() - 86400000).toISOString() }] },
  { id: "app2", userId: "demo-student", driveId: "d2", status: "APPLIED", appliedAt: new Date(Date.now() - 86400000).toISOString(), drive: mockDrives[1], history: [] },
];

export const mockNotifications: NotificationItem[] = [
  { id: "n1", type: "APPLICATION_STATUS", title: "Shortlisted: TCS Ninja", message: "Your application moved from APPLIED to SHORTLISTED.", link: "/applications", read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "n2", type: "DRIVE_DEADLINE", title: "Deadline approaching: Zoho Software Developer", message: "Apply before tomorrow.", link: "/drives", read: false, createdAt: new Date().toISOString() },
  { id: "n3", type: "PREPARATION", title: "Welcome to PlacePrep", message: "Complete your profile to unlock your readiness score.", link: "/profile", read: true, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
];

export const mockInterviewQuestions: InterviewQuestion[] = [
  { id: "iq1", category: "HR", difficulty: "Easy", question: "Tell me about yourself.", guidance: "60–90 seconds: education → skills → project → why this role.", keyPoints: ["Under 90 seconds", "End with role fit"], companies: ["TCS"], myStatus: "CONFIDENT" },
  { id: "iq2", category: "OOP", difficulty: "Easy", question: "Explain the four pillars of OOP with examples.", guidance: "One crisp example per pillar.", keyPoints: ["Encapsulation", "Abstraction", "Inheritance", "Polymorphism"], companies: ["Zoho"], myStatus: "PRACTICED" },
  { id: "iq3", category: "DBMS", difficulty: "Medium", question: "INNER JOIN vs LEFT JOIN with an example.", guidance: "Write the query for employees without departments.", keyPoints: ["NULL handling", "Write SQL live"], companies: ["Amazon"], myStatus: "NOT_STARTED" },
  { id: "iq4", category: "DSA", difficulty: "Medium", question: "How would you detect a cycle in a linked list?", guidance: "Floyd's tortoise-hare; prove why they meet.", keyPoints: ["O(1) space"], companies: ["Amazon"], myStatus: "NOT_STARTED" },
];

export const interviewGuide = [
  { title: "Tell me about yourself", tip: "60–90 seconds: education → skills → project → why this role." },
  { title: "OOPs pillars", tip: "Encapsulation, abstraction, inheritance, polymorphism — one example each." },
  { title: "DBMS vs RDBMS + joins", tip: "Be ready to write INNER/LEFT JOIN and explain normalization." },
  { title: "Project deep-dive", tip: "Architecture, your role, toughest bug, what you would improve." },
  { title: "HR questions", tip: "Strengths, relocation, night shifts — answer honestly and calmly." },
];

/** Demo-mode command-center payload mirroring the backend shape. */
export function mockDashboard(name: string): DashboardData {
  return {
    user: { id: "demo-student", name, email: "student@placeprep.local", role: "STUDENT" },
    profile: {
      id: "p1", userId: "demo-student", cgpa: 8.4, branch: "Computer Science", year: 3,
      skills: ["JavaScript", "TypeScript", "React", "DSA", "SQL"], phone: "98765 43210",
      resumeHeadline: "B.Tech CSE '27 | Full-stack learner", location: "Chennai",
      college: "VIT Chennai", degree: "B.Tech", graduationYear: 2027,
      github: "https://github.com/devananda", linkedin: "https://linkedin.com/in/devananda", portfolio: null,
    },
    readiness: {
      score: 68, grade: "Good",
      breakdown: [
        { label: "Academics (CGPA)", value: 17, max: 20 },
        { label: "Skills", value: 9, max: 15 },
        { label: "Coding", value: 15, max: 30 },
        { label: "Aptitude", value: 19, max: 25 },
        { label: "Applications", value: 8, max: 10 },
      ],
      weakAreas: ["Coding practice is low — solve more Easy problems first"],
      strongest: { label: "Aptitude", value: 19, max: 25 },
      weakest: { label: "Coding", value: 15, max: 30 },
    },
    completeness: { score: 82, missing: ["Add a portfolio link"], sections: [] },
    headline: "Your biggest opportunity is Coding. Solve 3 more Easy problems to reach 50%.",
    trend: {
      points: [52, 55, 58, 60, 63, 66, 68].map((s, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString(), score: s })),
      previousScore: 66, change: 2,
    },
    stats: { problemsSolved: 2, problemsTotal: 6, codingPct: 33, bookmarked: 2, aptitudeAvg: 72, quizCount: 3, applicationsCount: 2, upcomingCount: 3, unreadNotifications: 2 },
    recommendations: [
      { id: "coding", title: "Solve 3 Easy coding problems", detail: "Coding is at 33% — Easy problems build momentum fastest.", link: "/coding", priority: 30 },
      { id: "drive", title: "Apply to Amazon SDE Intern", detail: "You are eligible — deadline in 2 days.", link: "/drives", priority: 5 },
      { id: "interview", title: "Practice DBMS interview questions", detail: "Interview prep needs attention.", link: "/interview", priority: 50 },
    ],
    opportunities: mockDrives.map((d, i) => ({
      ...d,
      eligibilityResult: i === 2
        ? { eligible: false, reasons: ["CGPA requirement: 7.5 — yours: 7.4 (demo)"] }
        : { eligible: true, reasons: [] as string[] },
      urgency: (i === 1 ? "today" : i === 2 ? "soon" : "normal") as "normal" | "soon" | "today",
    })),
    activity: [
      { type: "coding", title: "Solved Two Sum", detail: "Coding Practice", at: new Date(Date.now() - 3600000).toISOString() },
      { type: "aptitude", title: "Scored 4/5 in Logical", detail: "Aptitude", at: new Date(Date.now() - 7200000).toISOString() },
      { type: "application", title: "Applied to Zoho Software Developer", detail: "APPLIED", at: new Date(Date.now() - 86400000).toISOString() },
    ],
    applications: mockApplications,
    announcements: mockAnnouncements,
    recentAttempts: [
      { id: "q1", category: "Logical", score: 4, total: 5, takenAt: new Date(Date.now() - 7200000).toISOString() },
      { id: "q2", category: "Quantitative", score: 3, total: 5, takenAt: new Date(Date.now() - 172800000).toISOString() },
    ],
  };
}
