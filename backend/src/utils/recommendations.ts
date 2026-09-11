export interface RecommendationInput {
  completeness: number;
  skillsCount: number;
  codingSolved: number;
  codingTotal: number;
  easyRemaining: number;
  aptitudeAvg: number | null;
  applicationsCount: number;
  openEligibleDrives: { id: string; title: string; deadline: string | null }[];
  interviewPracticedPct: number | null;
  weakestInterviewCategory: string | null;
  weakestCodingTag: string | null;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  link: string;
  priority: number;
}

/**
 * Deterministic recommendation engine (no AI). Rules are ordered by priority;
 * the dashboard shows the top 5. Pure function — unit tested.
 */
export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const out: Recommendation[] = [];

  if (input.completeness < 80) {
    out.push({
      id: "profile",
      title: "Complete your profile",
      detail: `Profile is ${input.completeness}% complete — drives filter on CGPA, branch and skills.`,
      link: "/profile",
      priority: 10,
    });
  }

  if (input.skillsCount < 4) {
    out.push({
      id: "skills",
      title: `Add ${4 - input.skillsCount} more skills`,
      detail: "Recruiters and eligibility checks look for at least 4 listed skills.",
      link: "/profile",
      priority: 20,
    });
  }

  const codingPct = input.codingTotal > 0 ? (input.codingSolved / input.codingTotal) * 100 : 0;
  if (codingPct < 40 && input.easyRemaining > 0) {
    const n = Math.min(3, input.easyRemaining);
    out.push({
      id: "coding",
      title: `Solve ${n} Easy coding problems`,
      detail: `Coding is at ${Math.round(codingPct)}% — Easy problems build momentum fastest.`,
      link: "/coding",
      priority: 30,
    });
  } else if (codingPct < 70 && input.codingTotal - input.codingSolved > 0) {
    out.push({
      id: "coding-next",
      title: "Push coding past 70%",
      detail: input.weakestCodingTag
        ? `Weakest topic: ${input.weakestCodingTag}. Practice it next.`
        : "Keep solving — Medium problems unlock top product companies.",
      link: "/coding",
      priority: 35,
    });
  }

  if (input.aptitudeAvg == null || input.aptitudeAvg < 60) {
    out.push({
      id: "aptitude",
      title: "Take a Quantitative aptitude quiz",
      detail:
        input.aptitudeAvg == null
          ? "No quiz attempts yet — establish your baseline."
          : `Average is ${input.aptitudeAvg}% — aim for 70%+ before assessments.`,
      link: "/aptitude",
      priority: 40,
    });
  }

  if (input.openEligibleDrives.length > 0) {
    const d = input.openEligibleDrives[0];
    out.push({
      id: `drive-${d.id}`,
      title: `Apply to ${d.title}`,
      detail: d.deadline
        ? `You are eligible — deadline ${new Date(d.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`
        : "You are eligible for this open drive.",
      link: "/drives",
      priority: 5,
    });
  } else if (input.applicationsCount === 0) {
    out.push({
      id: "apply",
      title: "Apply to your first drive",
      detail: "Applications count toward readiness — check eligibility on open drives.",
      link: "/drives",
      priority: 25,
    });
  }

  if (
    input.interviewPracticedPct != null &&
    input.interviewPracticedPct < 50 &&
    input.weakestInterviewCategory
  ) {
    out.push({
      id: "interview",
      title: `Practice ${input.weakestInterviewCategory} interview questions`,
      detail: `Interview prep is ${Math.round(input.interviewPracticedPct)}% practiced.`,
      link: "/interview",
      priority: 50,
    });
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
