/**
 * Placement readiness is a weighted, explainable score (0–100).
 * Kept in one pure function so it is easy to test and to explain in viva.
 *
 * Inputs are deliberately simple counts/values the dashboard already has.
 */
export interface ReadinessInput {
  cgpa: number | null; // 0–10 scale
  skillsCount: number;
  codingSolved: number;
  codingTotal: number;
  aptitudeAvg: number | null; // 0–100
  applicationsCount: number;
}

export interface ReadinessResult {
  score: number;
  grade: string;
  breakdown: { label: string; value: number; max: number }[];
  weakAreas: string[];
}

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  const cgpaScore = input.cgpa == null ? 0 : clamp((input.cgpa / 10) * 100) * 0.2;
  const skillsScore = clamp(Math.min(input.skillsCount, 10) * 10) * 0.15;
  const codingScore =
    (input.codingTotal > 0 ? (input.codingSolved / input.codingTotal) * 100 : 0) * 0.3;
  const aptitudeScore = (input.aptitudeAvg ?? 0) * 0.25;
  const activityScore = clamp(Math.min(input.applicationsCount, 5) * 20) * 0.1;

  const score = clamp(cgpaScore + skillsScore + codingScore + aptitudeScore + activityScore);

  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Developing" : "Getting started";

  const weakAreas: string[] = [];
  if ((input.cgpa ?? 0) < 7) weakAreas.push("CGPA below 7 — check eligibility for top drives");
  if (input.skillsCount < 4) weakAreas.push("Add at least 4 skills to your profile");
  if (input.codingTotal > 0 && input.codingSolved / input.codingTotal < 0.4)
    weakAreas.push("Coding practice is low — solve more Easy problems first");
  if ((input.aptitudeAvg ?? 0) < 60) weakAreas.push("Aptitude average below 60% — take a mock quiz");
  if (input.applicationsCount === 0) weakAreas.push("No applications yet — apply to an open drive");

  return {
    score,
    grade,
    breakdown: [
      { label: "Academics (CGPA)", value: Math.round(cgpaScore), max: 20 },
      { label: "Skills", value: Math.round(skillsScore), max: 15 },
      { label: "Coding", value: Math.round(codingScore), max: 30 },
      { label: "Aptitude", value: Math.round(aptitudeScore), max: 25 },
      { label: "Applications", value: Math.round(activityScore), max: 10 },
    ],
    weakAreas,
  };
}
