import { prisma } from "../config/db";
import { calculateReadiness } from "../utils/readiness";
import { profileCompleteness, resumeStrength } from "../utils/completeness";

/** Placement-cell analytics + student/drive intelligence. College scale: per-student loops are fine. */
export const adminService = {
  async overview() {
    const [
      students,
      companies,
      openDrives,
      applications,
      resources,
      announcements,
      profiles,
      appsByStatus,
      appsByCompany,
      selectedUsers,
      solvedAgg,
      attempts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.company.count(),
      prisma.drive.count({ where: { status: "OPEN" } }),
      prisma.application.count(),
      prisma.resource.count(),
      prisma.announcement.count(),
      prisma.studentProfile.findMany({ select: { cgpa: true, branch: true, skills: true, userId: true } }),
      prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.application.findMany({ select: { drive: { select: { company: { select: { name: true } } } } } }),
      prisma.application.findMany({ where: { status: "SELECTED" }, select: { userId: true } }),
      prisma.codingProgress.groupBy({ by: ["solved"], _count: { _all: true } }),
      prisma.quizAttempt.findMany({ select: { score: true, total: true } }),
    ]);

    const cgpas = profiles.map((p) => p.cgpa).filter((c): c is number => c != null);
    const avgCgpa = cgpas.length ? Math.round((cgpas.reduce((a, b) => a + b, 0) / cgpas.length) * 100) / 100 : null;

    const byBranch: Record<string, number> = {};
    for (const p of profiles) {
      const b = p.branch?.trim() || "Unspecified";
      byBranch[b] = (byBranch[b] ?? 0) + 1;
    }

    // Readiness distribution + average (same engine as the student side).
    const codingSolvedByUser = new Map<string, number>();
    const solvedRows = await prisma.codingProgress.findMany({ where: { solved: true }, select: { userId: true } });
    for (const r of solvedRows) codingSolvedByUser.set(r.userId, (codingSolvedByUser.get(r.userId) ?? 0) + 1);
    const codingTotal = await prisma.codingProblem.count();
    const attemptsByUser = new Map<string, { s: number; t: number }>();
    const allAttempts = await prisma.quizAttempt.findMany({ select: { userId: true, score: true, total: true } });
    for (const a of allAttempts) {
      const cur = attemptsByUser.get(a.userId) ?? { s: 0, t: 0 };
      cur.s += a.total > 0 ? (a.score / a.total) * 100 : 0;
      cur.t += 1;
      attemptsByUser.set(a.userId, cur);
    }
    const appsByUser = new Map<string, number>();
    const allApps = await prisma.application.findMany({ select: { userId: true } });
    for (const a of allApps) appsByUser.set(a.userId, (appsByUser.get(a.userId) ?? 0) + 1);

    const studentUsers = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));
    const buckets = { excellent: 0, good: 0, developing: 0, starting: 0 };
    let readinessSum = 0;
    for (const u of studentUsers) {
      const p = profileByUser.get(u.id);
      const att = attemptsByUser.get(u.id);
      const r = calculateReadiness({
        cgpa: p?.cgpa ?? null,
        skillsCount: p?.skills.length ?? 0,
        codingSolved: codingSolvedByUser.get(u.id) ?? 0,
        codingTotal,
        aptitudeAvg: att ? Math.round((att.s / att.t) * 10) / 10 : null,
        applicationsCount: appsByUser.get(u.id) ?? 0,
      });
      readinessSum += r.score;
      if (r.score >= 80) buckets.excellent += 1;
      else if (r.score >= 60) buckets.good += 1;
      else if (r.score >= 40) buckets.developing += 1;
      else buckets.starting += 1;
    }
    const avgReadiness = studentUsers.length ? Math.round((readinessSum / studentUsers.length) * 10) / 10 : null;

    const byStatus: Record<string, number> = {};
    for (const g of appsByStatus) byStatus[g.status] = g._count._all;
    const byCompany: Record<string, number> = {};
    for (const a of appsByCompany) {
      const n = a.drive.company.name;
      byCompany[n] = (byCompany[n] ?? 0) + 1;
    }
    const placed = new Set(selectedUsers.map((s) => s.userId)).size;
    const solvedCount = solvedAgg.find((g) => g.solved)?._count._all ?? 0;
    const aptitudeAvgAll = attempts.length
      ? Math.round((attempts.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / attempts.length) * 10) / 10
      : null;

    return {
      students: studentUsers.length,
      companies,
      openDrives,
      applications,
      resources,
      announcements,
      avgCgpa,
      byBranch,
      avgReadiness,
      readinessDistribution: [
        { label: "Excellent (80+)", count: buckets.excellent },
        { label: "Good (60–79)", count: buckets.good },
        { label: "Developing (40–59)", count: buckets.developing },
        { label: "Starting (<40)", count: buckets.starting },
      ],
      applicationsByStatus: byStatus,
      applicationsByCompany: byCompany,
      placed,
      placementRate: studentUsers.length ? Math.round((placed / studentUsers.length) * 1000) / 10 : 0,
      codingSolved: solvedCount,
      aptitudeAvg: aptitudeAvgAll,
    };
  },

  async listStudents(search?: string, branch?: string, minCgpa?: number) {
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { profile: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
    return users
      .filter((u) => {
        if (branch && u.profile?.branch?.toLowerCase() !== branch.toLowerCase()) return false;
        if (minCgpa != null && (u.profile?.cgpa ?? -1) < minCgpa) return false;
        return true;
      })
      .map(({ passwordHash: _omit, ...u }) => u);
  },

  /** Read-only 360° student view for the placement cell. */
  async studentDetail(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        applications: { include: { drive: { include: { company: true } } }, orderBy: { appliedAt: "desc" } },
        quizAttempts: { orderBy: { takenAt: "desc" }, take: 10 },
        codingProgress: { include: { problem: { select: { title: true, difficulty: true } } } },
        interviewProgress: { include: { question: { select: { category: true } } } },
        snapshots: { orderBy: { createdAt: "desc" }, take: 10 },
        resume: { include: { experiences: true, projects: true, achievements: true, certifications: true } },
      },
    });
    if (!user || user.role !== "STUDENT") {
      const e = new Error("Student not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    const { passwordHash: _omit, ...safe } = user;
    const codingTotal = await prisma.codingProblem.count();
    const codingSolved = user.codingProgress.filter((p) => p.solved).length;
    const att = user.quizAttempts;
    const aptitudeAvg = att.length
      ? Math.round((att.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / att.length) * 10) / 10
      : null;
    const readiness = calculateReadiness({
      cgpa: user.profile?.cgpa ?? null,
      skillsCount: user.profile?.skills.length ?? 0,
      codingSolved,
      codingTotal,
      aptitudeAvg,
      applicationsCount: user.applications.length,
    });
    return {
      ...safe,
      readiness,
      completeness: profileCompleteness(user.profile as never),
      resumeStrength: resumeStrength(user.profile as never, user.resume),
      stats: {
        codingSolved,
        codingTotal,
        aptitudeAvg,
        quizCount: att.length,
        applicationsCount: user.applications.length,
        interviewPracticed: user.interviewProgress.length,
        selected: user.applications.some((a) => a.status === "SELECTED"),
      },
    };
  },

  /** Drive command view: funnel + applicants. */
  async driveDetail(id: string) {
    const drive = await prisma.drive.findUnique({
      where: { id },
      include: {
        company: true,
        applications: {
          include: { user: { include: { profile: true } } },
          orderBy: { appliedAt: "desc" },
        },
      },
    });
    if (!drive) {
      const e = new Error("Drive not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    const funnel: Record<string, number> = {};
    for (const a of drive.applications) funnel[a.status] = (funnel[a.status] ?? 0) + 1;
    return {
      ...drive,
      funnel,
      totalApplicants: drive.applications.length,
      applicants: drive.applications.map(({ user, ...a }) => {
    const { passwordHash: _omit, notificationPrefs: _prefs, ...safe } = user;
        return { ...a, student: safe };
      }),
    };
  },
};
