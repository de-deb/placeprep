interface ProfileLike {
  cgpa: number | null;
  branch: string | null;
  year: number | null;
  skills: string[];
  phone: string | null;
  resumeHeadline: string | null;
  location: string | null;
  college: string | null;
  degree: string | null;
  graduationYear: number | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
}

export interface CompletenessResult {
  score: number;
  missing: string[];
  sections: { label: string; done: boolean }[];
}

/**
 * Single profile-completeness engine reused by dashboard, profile and resume.
 * Weights sum to 100; each rule is one line so it is viva-explainable.
 */
export function profileCompleteness(p: ProfileLike | null): CompletenessResult {
  if (!p) {
    return { score: 0, missing: ["Complete your profile to get started"], sections: [] };
  }
  const sections = [
    { label: "Basic info (phone + location)", done: !!(p.phone && p.location), weight: 12, hint: "Add your phone number and location" },
    { label: "Education (college, degree, year, CGPA)", done: !!(p.college && p.degree && p.graduationYear && p.cgpa != null), weight: 22, hint: "Add college, degree, graduation year and CGPA" },
    { label: "Branch & year", done: !!(p.branch && p.year), weight: 10, hint: "Add your branch and current year" },
    { label: "Skills (4+)", done: p.skills.length >= 4, weight: 20, hint: `Add ${Math.max(0, 4 - p.skills.length)} more skills (need 4+)` },
    { label: "Headline", done: !!p.resumeHeadline, weight: 8, hint: "Add a resume headline" },
    { label: "Links (GitHub + LinkedIn)", done: !!(p.github && p.linkedin), weight: 16, hint: "Add GitHub and LinkedIn links" },
    { label: "Portfolio", done: !!p.portfolio, weight: 12, hint: "Add a portfolio link" },
  ];
  const score = sections.reduce((s, x) => s + (x.done ? x.weight : 0), 0);
  return {
    score,
    missing: sections.filter((x) => !x.done).map((x) => x.hint),
    sections: sections.map(({ label, done }) => ({ label, done })),
  };
}

interface ResumeLike {
  summary: string | null;
  experiences: unknown[];
  projects: unknown[];
  achievements: unknown[];
  certifications: unknown[];
}

export interface StrengthResult {
  score: number;
  suggestions: string[];
}

/** Resume strength 0–100 across 8 checks (weights sum to 100). */
export function resumeStrength(profile: ProfileLike | null, resume: ResumeLike | null): StrengthResult {
  const suggestions: string[] = [];
  let score = 0;

  if (profile && profile.phone && profile.location) score += 10;
  else suggestions.push("Add phone and location to your profile");

  if (profile && profile.college && profile.degree && profile.cgpa != null) score += 10;
  else suggestions.push("Complete your education details");

  if (profile && profile.skills.length >= 4) score += 12;
  else suggestions.push("List at least 4 skills");

  if (profile && profile.github && profile.linkedin) score += 12;
  else suggestions.push("Add GitHub and LinkedIn profiles");

  if (resume?.summary) score += 8;
  else suggestions.push("Write a 2–3 line professional summary");

  const projects = resume?.projects ?? [];
  if (projects.length >= 2) score += 16;
  else suggestions.push(`Add at least 2 projects (have ${projects.length})`);

  if (resume && (resume.experiences ?? []).length >= 1) score += 12;
  else suggestions.push("Add internship or work experience");

  if (resume && ((resume.achievements ?? []).length >= 1 || (resume.certifications ?? []).length >= 1))
    score += 12;
  else suggestions.push("Add an achievement or certification");

  const withLinks = (projects as { githubUrl?: string | null; liveUrl?: string | null }[]).filter(
    (pr) => pr.githubUrl || pr.liveUrl
  ).length;
  if (projects.length > 0 && withLinks === projects.length && projects.length >= 1) score += 8;
  else if (projects.length > 0) suggestions.push("Link GitHub/live URLs on every project");

  return { score: Math.min(100, score), suggestions };
}
