import { prisma } from "../config/db";
import { resumeStrength } from "../utils/completeness";

/** Resume center: one resume per student + nested sections, all owner-scoped. */
export const resumeService = {
  async getOrCreate(userId: string) {
    let resume = await prisma.resume.findUnique({
      where: { userId },
      include: { experiences: true, projects: true, achievements: true, certifications: true },
    });
    if (!resume) {
      resume = await prisma.resume.create({
        data: { userId },
        include: { experiences: true, projects: true, achievements: true, certifications: true },
      });
    }
    return resume;
  },

  update(userId: string, data: { summary?: string | null }) {
    return prisma.resume.upsert({
      where: { userId },
      create: { userId, summary: data.summary ?? undefined },
      update: { summary: data.summary ?? undefined },
      include: { experiences: true, projects: true, achievements: true, certifications: true },
    });
  },

  /** Full resume payload for the preview page (resume + profile + user). */
  async full(userId: string) {
    const [resume, profile, user] = await Promise.all([
      this.getOrCreate(userId),
      prisma.studentProfile.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!user) {
      const e = new Error("User not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    const strength = resumeStrength(profile as never, resume);
    const { passwordHash: _omit, ...safeUser } = user;
    return { user: safeUser, profile, resume, strength };
  },

  async owned(userId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) {
      const e = new Error("Resume section not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    return resume;
  },

  // Generic nested CRUD scoped to the owner's resume.
  nested(model: "experience" | "project" | "achievement" | "certification") {
    const delegate = {
      experience: prisma.resumeExperience,
      project: prisma.resumeProject,
      achievement: prisma.resumeAchievement,
      certification: prisma.resumeCertification,
    }[model] as unknown as {
      create(o: { data: Record<string, unknown> }): Promise<unknown>;
      update(o: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
      delete(o: { where: { id: string } }): Promise<unknown>;
      findFirst(o: { where: { id: string; resume: { userId: string } } }): Promise<unknown>;
    };
    return {
      create: (userId: string, resumeId: string, data: Record<string, unknown>) =>
        this.owned(userId, resumeId).then(() => delegate.create({ data: { ...data, resumeId } })),
      update: async (userId: string, id: string, data: Record<string, unknown>) => {
        const row = await delegate.findFirst({ where: { id, resume: { userId } } });
        if (!row) {
          const e = new Error("Entry not found") as Error & { status: number };
          e.status = 404;
          throw e;
        }
        return delegate.update({ where: { id }, data });
      },
      remove: async (userId: string, id: string) => {
        const row = await delegate.findFirst({ where: { id, resume: { userId } } });
        if (!row) {
          const e = new Error("Entry not found") as Error & { status: number };
          e.status = 404;
          throw e;
        }
        await delegate.delete({ where: { id } });
        return { id };
      },
    };
  },
};
