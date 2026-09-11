import { prisma } from "../config/db";

/** Coding + aptitude. Answers (correct options) never leave the server except in graded reviews. */
export const prepService = {
  // ---------- coding ----------
  listProblems(difficulty?: string, search?: string, tag?: string, source?: string) {
    return prisma.codingProblem.findMany({
      where: {
        ...(difficulty ? { difficulty } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(source ? { source } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async listProblemsWithProgress(userId: string, difficulty?: string, search?: string, tag?: string, source?: string) {
    const problems = await this.listProblems(difficulty, search, tag, source);
    const progress = await prisma.codingProgress.findMany({ where: { userId } });
    const map = new Map(progress.map((p) => [p.problemId, p]));
    return problems.map((p) => ({
      ...p,
      solved: map.get(p.id)?.solved ?? false,
      bookmarked: map.get(p.id)?.bookmarked ?? false,
    }));
  },

  async problemDetail(userId: string, id: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) {
      const e = new Error("Problem not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    const [progress, attempts] = await Promise.all([
      prisma.codingProgress.findUnique({ where: { userId_problemId: { userId, problemId: id } } }),
      prisma.codingAttempt.findMany({ where: { userId, problemId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    // Relevant = same tags (excluding itself), capped for the UI.
    const relevant =
      problem.tags.length > 0
        ? await prisma.codingProblem.findMany({
            where: { id: { not: id }, tags: { hasSome: problem.tags } },
            select: { id: true, title: true, difficulty: true, tags: true },
            take: 4,
          })
        : [];
    return {
      ...problem,
      solved: progress?.solved ?? false,
      bookmarked: progress?.bookmarked ?? false,
      attempts,
      relevant,
    };
  },

  setProgress(userId: string, problemId: string, data: { solved?: boolean; bookmarked?: boolean }) {
    return prisma.codingProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      create: { userId, problemId, ...data },
      update: data,
    });
  },

  /** Self-check submission: records an attempt; SOLVED also flips progress. Labeled practice-only in UI. */
  async submitAttempt(userId: string, problemId: string, verdict: string, note?: string | null) {
    const attempt = await prisma.codingAttempt.create({
      data: { userId, problemId, verdict, note: note ?? undefined },
    });
    if (verdict === "SOLVED") {
      await this.setProgress(userId, problemId, { solved: true });
    }
    return attempt;
  },

  /** Analytics for /coding/progress: by difficulty, top tags, weak tags, recent solves. */
  async codingSummary(userId: string) {
    const [problems, progress, attempts, submissions] = await Promise.all([
      prisma.codingProblem.findMany({ select: { id: true, difficulty: true, tags: true } }),
      prisma.codingProgress.findMany({ where: { userId } }),
      prisma.codingAttempt.findMany({
        where: { userId },
        include: { problem: { select: { id: true, title: true, difficulty: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.codingSubmission.findMany({ where: { userId }, select: { status: true, createdAt: true } }),
    ]);
    const accepted = submissions.filter((s) => s.status === "ACCEPTED").length;
    const daySet = new Set(submissions.filter((s) => s.status === "ACCEPTED").map((s) => s.createdAt.toISOString().slice(0, 10)));
    const solvedIds = new Set(progress.filter((p) => p.solved).map((p) => p.problemId));
    const bookmarked = progress.filter((p) => p.bookmarked).length;
    const byDifficulty = ["Easy", "Medium", "Hard"].map((d) => {
      const all = problems.filter((p) => p.difficulty === d);
      const solved = all.filter((p) => solvedIds.has(p.id)).length;
      return { difficulty: d, total: all.length, solved, pct: all.length ? Math.round((solved / all.length) * 100) : 0 };
    });
    const tagStats = new Map<string, { total: number; solved: number }>();
    for (const p of problems) {
      for (const t of p.tags) {
        const s = tagStats.get(t) ?? { total: 0, solved: 0 };
        s.total += 1;
        if (solvedIds.has(p.id)) s.solved += 1;
        tagStats.set(t, s);
      }
    }
    const tags = [...tagStats.entries()]
      .map(([tag, s]) => ({ tag, ...s, pct: s.total ? Math.round((s.solved / s.total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
    return {
      total: problems.length,
      solved: solvedIds.size,
      bookmarked,
      pct: problems.length ? Math.round((solvedIds.size / problems.length) * 100) : 0,
      submissions: submissions.length,
      accepted,
      acceptanceRate: submissions.length ? Math.round((accepted / submissions.length) * 100) : null,
      activeDays: daySet.size,
      byDifficulty,
      strongestTags: [...tags].sort((a, b) => b.pct - a.pct).slice(0, 3),
      weakestTags: tags.slice(0, 3),
      weakestTag: tags.length > 0 && tags[0].pct < 100 ? tags[0].tag : null,
      recentAttempts: attempts,
    };
  },

  // ---------- aptitude ----------
  async aptitudeMeta() {
    const [cats, diffs, topics] = await Promise.all([
      prisma.aptitudeQuestion.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.aptitudeQuestion.groupBy({ by: ["difficulty"], _count: { _all: true } }),
      prisma.aptitudeQuestion.groupBy({ by: ["topic"], _count: { _all: true } }),
    ]);
    return {
      categories: cats.map((c) => ({ name: c.category, count: c._count._all })),
      difficulties: diffs.map((d) => ({ name: d.difficulty, count: d._count._all })),
      topics: topics.map((t) => ({ name: t.topic, count: t._count._all })),
    };
  },

  listQuestions(category?: string, difficulty?: string, topic?: string) {
    return prisma.aptitudeQuestion.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(topic ? { topic } : {}),
      },
      orderBy: [{ category: "asc" }, { topic: "asc" }],
    });
  },

  async listQuestionsPublic(category?: string, difficulty?: string, topic?: string, take?: number) {
    const qs = await prisma.aptitudeQuestion.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(topic ? { topic } : {}),
      },
      orderBy: [{ category: "asc" }],
      ...(take ? { take } : {}),
    });
    // Shuffle server-side so every quiz feels fresh; answers stay hidden.
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    return shuffled.map(({ answerIndex: _omit, explanation: _omit2, ...q }) => q);
  },

  recordAttempt(userId: string, category: string, score: number, total: number, opts?: { timeTakenSeconds?: number; difficulty?: string }) {
    if (score > total) {
      const e = new Error("Score cannot exceed total") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    return prisma.quizAttempt.create({
      data: { userId, category, score, total, timeTakenSeconds: opts?.timeTakenSeconds, difficulty: opts?.difficulty },
    });
  },

  listAttempts(userId: string) {
    return prisma.quizAttempt.findMany({ where: { userId }, orderBy: { takenAt: "desc" }, take: 20 });
  },

  /** Grades + records + returns full per-question review (only AFTER submission). */
  async submitQuiz(
    userId: string,
    answers: { questionId: string; selectedIndex: number }[],
    opts?: { timeTakenSeconds?: number; difficulty?: string }
  ) {
    const qs = await prisma.aptitudeQuestion.findMany({ where: { id: { in: answers.map((a) => a.questionId) } } });
    const map = new Map(qs.map((q) => [q.id, q]));
    let correct = 0;
    const review = answers.map((a) => {
      const q = map.get(a.questionId);
      const isCorrect = q ? q.answerIndex === a.selectedIndex : false;
      if (isCorrect) correct += 1;
      return {
        questionId: a.questionId,
        question: q?.question ?? "",
        category: q?.category ?? "",
        topic: q?.topic ?? "",
        options: q?.options ?? [],
        selectedIndex: a.selectedIndex,
        answerIndex: q?.answerIndex ?? null,
        correct: isCorrect,
        explanation: q?.explanation ?? null,
      };
    });
    const unanswered = review.filter((r) => r.selectedIndex < 0).length;
    const total = answers.length;
    const category = qs[0]?.category ?? "General";
    const attempt = await this.recordAttempt(userId, category, correct, total, opts);
    // Topic performance for the result screen.
    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const r of review) {
      const s = byTopic.get(r.topic) ?? { correct: 0, total: 0 };
      s.total += 1;
      if (r.correct) s.correct += 1;
      byTopic.set(r.topic, s);
    }
    return {
      attemptId: attempt.id,
      score: correct,
      total,
      percentage: total ? Math.round((correct / total) * 100) : 0,
      correct,
      incorrect: total - correct - unanswered,
      unanswered,
      timeTakenSeconds: opts?.timeTakenSeconds ?? null,
      topics: [...byTopic.entries()].map(([topic, s]) => ({
        topic,
        ...s,
        pct: s.total ? Math.round((s.correct / s.total) * 100) : 0,
      })),
      review,
    };
  },

  async aptitudeAnalytics(userId: string) {
    const attempts = await prisma.quizAttempt.findMany({ where: { userId }, orderBy: { takenAt: "asc" } });
    if (attempts.length === 0) {
      return { attempts: 0, average: null, best: null, accuracy: null, byCategory: [], trend: [] };
    }
    const pcts = attempts.map((a) => (a.total > 0 ? (a.score / a.total) * 100 : 0));
    const avg = Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10;
    const catMap = new Map<string, number[]>();
    for (const a of attempts) {
      const arr = catMap.get(a.category) ?? [];
      arr.push(a.total > 0 ? (a.score / a.total) * 100 : 0);
      catMap.set(a.category, arr);
    }
    const byCategory = [...catMap.entries()].map(([category, arr]) => ({
      category,
      attempts: arr.length,
      average: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
    }));
    return {
      attempts: attempts.length,
      average: avg,
      best: Math.round(Math.max(...pcts) * 10) / 10,
      accuracy: avg,
      byCategory,
      trend: attempts.slice(-10).map((a) => ({
        takenAt: a.takenAt,
        pct: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
      })),
    };
  },

  /** Company-focused prep: progress over the company's topics + recommended next. */
  async companyPrep(userId: string, companyName: string) {
    const company = await prisma.company.findUnique({ where: { name: companyName } });
    if (!company) {
      const e = new Error("Company not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    const topics = company.topics ?? [];
    if (topics.length === 0) {
      return { company: company.name, topics: [], solved: 0, total: 0, pct: 0, byTopic: [], recommended: [] };
    }
    const problems = await prisma.codingProblem.findMany({
      where: { tags: { hasSome: topics } },
      select: { id: true, title: true, difficulty: true, tags: true, source: true },
    });
    const solvedIds = new Set(
      (await prisma.codingProgress.findMany({ where: { userId, solved: true }, select: { problemId: true } })).map(
        (p) => p.problemId
      )
    );
    const byTopic = topics.map((t) => {
      const set = problems.filter((p) => p.tags.includes(t));
      const solved = set.filter((p) => solvedIds.has(p.id)).length;
      return { topic: t, total: set.length, solved, pct: set.length ? Math.round((solved / set.length) * 100) : 0 };
    });
    const weakest = [...byTopic].sort((a, b) => a.pct - b.pct).find((t) => t.pct < 100) ?? null;
    const rank = (d: string) => (d === "Easy" ? 0 : d === "Medium" ? 1 : 2);
    const recommended = problems
      .filter((p) => !solvedIds.has(p.id) && (!weakest || p.tags.includes(weakest.topic)))
      .sort((a, b) => rank(a.difficulty) - rank(b.difficulty))
      .slice(0, 3);
    const solved = problems.filter((p) => solvedIds.has(p.id)).length;
    return {
      company: company.name,
      topics,
      solved,
      total: problems.length,
      pct: problems.length ? Math.round((solved / problems.length) * 100) : 0,
      byTopic,
      weakestTopic: weakest?.topic ?? null,
      recommended,
    };
  },
};
