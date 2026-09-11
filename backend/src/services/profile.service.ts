import { prisma } from "../config/db";

/** Student profile read/update. One profile per user (auto-created at register). */
export const profileService = {
  async get(userId: string) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (profile) return profile;
    return prisma.studentProfile.create({ data: { userId } });
  },

  async update(
    userId: string,
    data: {
      cgpa?: number | null;
      branch?: string | null;
      year?: number | null;
      skills?: string[];
      phone?: string | null;
      resumeHeadline?: string | null;
      location?: string | null;
      college?: string | null;
      degree?: string | null;
      graduationYear?: number | null;
      github?: string | null;
      linkedin?: string | null;
      portfolio?: string | null;
    }
  ) {
    const cleanedSkills = data.skills
      ? [...new Set(data.skills.map((s) => s.trim()).filter(Boolean))].slice(0, 30)
      : undefined;
    const url = (v?: string | null) => (v === "" ? null : v);
    const { github, linkedin, portfolio, ...rest } = data;
    const linkFields = {
      ...(github !== undefined ? { github: url(github) ?? undefined } : {}),
      ...(linkedin !== undefined ? { linkedin: url(linkedin) ?? undefined } : {}),
      ...(portfolio !== undefined ? { portfolio: url(portfolio) ?? undefined } : {}),
    };
    return prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, ...rest, ...linkFields, skills: cleanedSkills ?? [] },
      update: { ...rest, ...linkFields, ...(cleanedSkills !== undefined ? { skills: cleanedSkills } : {}) },
    });
  },
};
