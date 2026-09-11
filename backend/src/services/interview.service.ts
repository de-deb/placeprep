import { prisma } from "../config/db";
import { INTERVIEW_CATEGORIES } from "../utils/constants";

/** Interview workspace: question bank + per-student progress. */
export const interviewService = {
  categories() {
    return [...INTERVIEW_CATEGORIES];
  },

  async list(userId: string, category?: string, difficulty?: string, search?: string) {
    const questions = await prisma.interviewQuestion.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(search ? { question: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
    const progress = await prisma.interviewProgress.findMany({ where: { userId } });
    const map = new Map(progress.map((p) => [p.questionId, p.status]));
    return questions.map((q) => ({ ...q, myStatus: map.get(q.id) ?? "NOT_STARTED" }));
  },

  setProgress(userId: string, questionId: string, status: string) {
    return prisma.interviewProgress.upsert({
      where: { userId_questionId: { userId, questionId } },
      create: { userId, questionId, status },
      update: { status },
    });
  },

  /** Progress analytics: overall %, per-category %, weakest category. */
  async summary(userId: string) {
    const [total, byCat, progress] = await Promise.all([
      prisma.interviewQuestion.count(),
      prisma.interviewQuestion.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.interviewProgress.findMany({ where: { userId }, include: { question: { select: { category: true } } } }),
    ]);
    const practicedByCat = new Map<string, number>();
    let confident = 0;
    for (const p of progress) {
      practicedByCat.set(p.question.category, (practicedByCat.get(p.question.category) ?? 0) + 1);
      if (p.status === "CONFIDENT") confident += 1;
    }
    const categories = byCat.map((c) => {
      const practiced = practicedByCat.get(c.category) ?? 0;
      return {
        category: c.category,
        total: c._count._all,
        practiced,
        pct: c._count._all ? Math.round((practiced / c._count._all) * 100) : 0,
      };
    });
    const weakest = [...categories].sort((a, b) => a.pct - b.pct)[0] ?? null;
    return {
      total,
      practiced: progress.length,
      confident,
      pct: total ? Math.round((progress.length / total) * 100) : 0,
      categories,
      weakestCategory: weakest && weakest.pct < 100 ? weakest.category : null,
    };
  },
};
