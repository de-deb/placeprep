import { prisma } from "../config/db";
import { calculateReadiness } from "../utils/readiness";
import { profileCompleteness } from "../utils/completeness";
import { buildRecommendations } from "../utils/recommendations";
import { checkEligibility } from "../utils/eligibility";
import { notificationService } from "./notification.service";
import { interviewService } from "./interview.service";
import { prepService } from "./prep.service";

/** Start of today (server-local) — one readiness snapshot per day max. */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Command-center aggregation. One call powers greeting, readiness card,
 * next actions, opportunities, activity, trend and notifications.
 */
export const dashboardService = {
  async getForUser(userId: string) {
    const [
      user,
      profile,
      codingTotal,
      codingSolved,
      easyRemaining,
      bookmarked,
      attempts,
      applications,
      openDrives,
      announcements,
      codingAttempts,
      snapshots,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.studentProfile.findUnique({ where: { userId } }),
      prisma.codingProblem.count(),
      prisma.codingProgress.count({ where: { userId, solved: true } }),
      prisma.codingProblem.count({
        where: { difficulty: "Easy", NOT: { progress: { some: { userId, solved: true } } } },
      }),
      prisma.codingProgress.count({ where: { userId, bookmarked: true } }),
      prisma.quizAttempt.findMany({ where: { userId }, orderBy: { takenAt: "desc" }, take: 10 }),
      prisma.application.findMany({
        where: { userId },
        include: { drive: { include: { company: true } } },
        orderBy: { appliedAt: "desc" },
      }),
      prisma.drive.findMany({
        where: { status: { in: ["OPEN", "UPCOMING"] } },
        include: { company: true },
        orderBy: { date: "asc" },
        take: 10,
      }),
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.codingAttempt.findMany({
        where: { userId },
        include: { problem: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.readinessSnapshot.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 14 }),
    ]);

    if (!user) {
      const e = new Error("User not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }

    const aptitudeAvg =
      attempts.length > 0
        ? Math.round(
            (attempts.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / attempts.length) * 10
          ) / 10
        : null;

    const readiness = calculateReadiness({
      cgpa: profile?.cgpa ?? null,
      skillsCount: profile?.skills.length ?? 0,
      codingSolved,
      codingTotal,
      aptitudeAvg,
      applicationsCount: applications.length,
    });

    const completeness = profileCompleteness(profile as never);

    // Daily snapshot (update today's row, else insert) + trend context.
    const today = startOfToday();
    const todays = snapshots.find((s) => s.createdAt >= today);
    const snapData = {
      userId,
      score: readiness.score,
      academicsScore: readiness.breakdown[0].value,
      skillsScore: readiness.breakdown[1].value,
      codingScore: readiness.breakdown[2].value,
      aptitudeScore: readiness.breakdown[3].value,
      applicationsScore: readiness.breakdown[4].value,
    };
    if (todays) {
      await prisma.readinessSnapshot.update({ where: { id: todays.id }, data: snapData });
    } else {
      await prisma.readinessSnapshot.create({ data: snapData });
    }
    const previous = snapshots.find((s) => !todays || s.id !== todays.id) ?? null;
    const trend = [...snapshots]
      .reverse()
      .map((s) => ({ date: s.createdAt, score: s.score }))
      .slice(-14);

    // Eligibility per open drive + urgency.
    const now = Date.now();
    const opportunities = openDrives.map((d) => {
      const eligibility = checkEligibility(
        {
          minCgpa: d.minCgpa,
          allowedBranches: d.allowedBranches,
          allowedYears: d.allowedYears,
          requiredSkills: d.requiredSkills,
          eligibilityCgpa: d.company.eligibilityCgpa,
        },
        {
          cgpa: profile?.cgpa ?? null,
          branch: profile?.branch ?? null,
          year: profile?.year ?? null,
          skills: profile?.skills ?? [],
        }
      );
      const applied = applications.some((a) => a.driveId === d.id);
      const deadlineMs = d.deadline ? new Date(d.deadline).getTime() - now : null;
      const urgency =
        d.status === "CLOSED" ? "closed" : deadlineMs == null ? "normal" : deadlineMs < 0 ? "closed" : deadlineMs < 86400000 ? "today" : deadlineMs < 3 * 86400000 ? "soon" : "normal";
      return { ...d, eligibilityResult: eligibility, applied, urgency };
    });

    const openEligible = opportunities
      .filter((o) => o.eligibilityResult.eligible && !o.applied && o.status === "OPEN")
      .slice(0, 3)
      .map((o) => ({ id: o.id, title: o.title, deadline: o.deadline?.toISOString() ?? null }));

    // Deadline reminders (deduped, preference-aware).
    for (const o of opportunities) {
      if ((o.urgency === "soon" || o.urgency === "today") && !o.applied) {
        await notificationService.notify({
          userId,
          type: "DRIVE_DEADLINE",
          title: `Deadline ${o.urgency === "today" ? "today" : "approaching"}: ${o.title}`,
          message: `${o.company.name} — apply before ${o.deadline ? new Date(o.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "the deadline"}.`,
          link: "/drives",
          ref: `deadline:${o.id}`,
        });
      }
    }

    const interview = await interviewService.summary(userId);
    const codingSummary = await prepService.codingSummary(userId);
    const { solveStreak } = await import("./execution/judge.service");
    const streak = await solveStreak(userId);

    const recommendations = buildRecommendations({
      completeness: completeness.score,
      skillsCount: profile?.skills.length ?? 0,
      codingSolved,
      codingTotal,
      easyRemaining,
      aptitudeAvg,
      applicationsCount: applications.length,
      openEligibleDrives: openEligible,
      interviewPracticedPct: interview.total ? (interview.practiced / interview.total) * 100 : null,
      weakestInterviewCategory: interview.weakestCategory,
      weakestCodingTag: codingSummary.weakestTag,
    });

    // Headline recommendation for the dashboard header.
    const lowest = [...readiness.breakdown].sort((a, b) => a.value / b.value)[0];
    const headline =
      recommendations[0]?.title ??
      (lowest ? `Your biggest opportunity is ${lowest.label}.` : "Keep up the momentum.");

    // Unified recent activity (derived — no extra model needed).
    const activity: { type: string; title: string; detail: string; at: string }[] = [
      ...codingAttempts
        .filter((a) => a.verdict === "SOLVED")
        .slice(0, 3)
        .map((a) => ({
          type: "coding",
          title: `Solved ${a.problem.title}`,
          detail: "Coding Practice",
          at: a.createdAt.toISOString(),
        })),
      ...attempts.slice(0, 3).map((a) => ({
        type: "aptitude",
        title: `Scored ${a.score}/${a.total} in ${a.category}`,
        detail: "Aptitude",
        at: a.takenAt.toISOString(),
      })),
      ...applications.slice(0, 3).map((a) => ({
        type: "application",
        title: `Applied to ${a.drive.title}`,
        detail: a.status,
        at: a.appliedAt.toISOString(),
      })),
    ]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 6);

    const unreadNotifications = await notificationService.unreadCount(userId);
    const totalProblems = codingTotal || 1;

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      profile,
      readiness: {
        ...readiness,
        strongest: [...readiness.breakdown].sort((a, b) => b.value - a.value)[0],
        weakest: lowest,
      },
      completeness,
      headline,
      trend: {
        points: trend,
        previousScore: previous?.score ?? null,
        change: previous ? readiness.score - previous.score : 0,
      },
      stats: {
        problemsSolved: codingSolved,
        problemsTotal: codingTotal,
        codingPct: Math.round((codingSolved / totalProblems) * 100),
        bookmarked,
        aptitudeAvg,
        quizCount: attempts.length,
        applicationsCount: applications.length,
        upcomingCount: openDrives.length,
        unreadNotifications,
        streak: streak.streak,
        acceptanceRate: codingSummary.acceptanceRate,
      },
      recommendations,
      opportunities: opportunities.slice(0, 6),
      activity,
      applications: applications.slice(0, 5),
      announcements,
      recentAttempts: attempts.slice(0, 5),
    };
  },
};
