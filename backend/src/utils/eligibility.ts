interface DriveEligibility {
  minCgpa: number | null;
  allowedBranches: string[];
  allowedYears: number[];
  requiredSkills: string[];
  eligibilityCgpa?: number | null;
}

interface StudentSnapshot {
  cgpa: number | null;
  branch: string | null;
  year: number | null;
  skills: string[];
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * Deterministic eligibility engine. Checks structured drive rules against the
 * student's profile and explains every failure (used by drives list, company
 * pages and admin applicant filters).
 */
export function checkEligibility(drive: DriveEligibility, student: StudentSnapshot): EligibilityResult {
  const reasons: string[] = [];

  const minCgpa = drive.minCgpa ?? drive.eligibilityCgpa ?? null;
  if (minCgpa != null) {
    if (student.cgpa == null) reasons.push(`CGPA requirement: ${minCgpa} — yours: not set (complete your profile)`);
    else if (student.cgpa < minCgpa) reasons.push(`CGPA requirement: ${minCgpa} — yours: ${student.cgpa}`);
  }

  if (drive.allowedBranches.length > 0) {
    const mine = (student.branch ?? "").trim().toLowerCase();
    const ok = drive.allowedBranches.some((b) => b.trim().toLowerCase() === mine);
    if (!ok) {
      reasons.push(
        student.branch
          ? `Branches allowed: ${drive.allowedBranches.join(", ")} — yours: ${student.branch}`
          : `Branches allowed: ${drive.allowedBranches.join(", ")} — yours: not set`
      );
    }
  }

  if (drive.allowedYears.length > 0) {
    if (student.year == null) reasons.push(`Years allowed: ${drive.allowedYears.join(", ")} — yours: not set`);
    else if (!drive.allowedYears.includes(student.year))
      reasons.push(`Years allowed: ${drive.allowedYears.join(", ")} — yours: ${student.year}`);
  }

  if (drive.requiredSkills.length > 0) {
    const mine = new Set(student.skills.map((s) => s.trim().toLowerCase()));
    const missing = drive.requiredSkills.filter((s) => !mine.has(s.trim().toLowerCase()));
    if (missing.length > 0) reasons.push(`Missing required skills: ${missing.join(", ")}`);
  }

  return { eligible: reasons.length === 0, reasons };
}
