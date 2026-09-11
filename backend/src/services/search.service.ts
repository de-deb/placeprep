import { prisma } from "../config/db";

/** Unified global search across modules (answers never leave the server). */
export const searchService = {
  async search(query: string, userId?: string) {
    const q = query.trim().slice(0, 80);
    if (q.length < 2) {
      const e = new Error("Search needs at least 2 characters") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    const contains = { contains: q, mode: "insensitive" } as const;
    const [companies, drives, problems, resources, interview, announcements] = await Promise.all([
      prisma.company.findMany({ where: { OR: [{ name: contains }, { industry: contains }] }, take: 5 }),
      prisma.drive.findMany({
        where: { OR: [{ title: contains }, { location: contains }] },
        include: { company: { select: { name: true } } },
        take: 5,
      }),
      prisma.codingProblem.findMany({
        where: { OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true, difficulty: true, tags: true },
        take: 5,
      }),
      prisma.resource.findMany({
        where: { OR: [{ title: contains }, { description: contains }] },
        take: 5,
      }),
      prisma.interviewQuestion.findMany({
        where: { OR: [{ question: contains }, { category: contains }] },
        select: { id: true, category: true, difficulty: true, question: true },
        take: 5,
      }),
      prisma.announcement.findMany({
        where: { OR: [{ title: contains }, { body: contains }] },
        take: 5,
      }),
    ]);

    // Mark drives the student already applied to.
    let appliedIds = new Set<string>();
    if (userId) {
      const apps = await prisma.application.findMany({ where: { userId }, select: { driveId: true } });
      appliedIds = new Set(apps.map((a) => a.driveId));
    }

    return {
      query: q,
      companies,
      drives: drives.map((d) => ({ ...d, applied: appliedIds.has(d.id) })),
      problems,
      resources,
      interview,
      announcements,
    };
  },
};
