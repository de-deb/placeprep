import { describe, expect, it } from "vitest";
import { checkEligibility } from "../src/utils/eligibility";
import { profileCompleteness, resumeStrength } from "../src/utils/completeness";
import { buildRecommendations } from "../src/utils/recommendations";
import { canTransition, isTerminal, isValidStatus } from "../src/utils/constants";

describe("application status machine", () => {
  it("allows forward transitions, blocks backwards/terminal", () => {
    expect(canTransition("APPLIED", "SHORTLISTED")).toBe(true);
    expect(canTransition("APPLIED", "INTERVIEW")).toBe(true);
    expect(canTransition("INTERVIEW", "SELECTED")).toBe(true);
    expect(canTransition("SHORTLISTED", "APPLIED")).toBe(false);
    expect(canTransition("SELECTED", "REJECTED")).toBe(false);
    expect(canTransition("APPLIED", "APPLIED")).toBe(false);
    expect(canTransition("APPLIED", "NOPE")).toBe(false);
    expect(isTerminal("SELECTED")).toBe(true);
    expect(isTerminal("APPLIED")).toBe(false);
    expect(isValidStatus("WITHDRAWN")).toBe(true);
  });
});

describe("eligibility engine", () => {
  const drive = {
    minCgpa: 8,
    allowedBranches: ["Computer Science"],
    allowedYears: [3, 4],
    requiredSkills: ["React"],
  };
  it("passes an eligible student", () => {
    const r = checkEligibility(drive, { cgpa: 8.5, branch: "Computer Science", year: 3, skills: ["React", "SQL"] });
    expect(r.eligible).toBe(true);
    expect(r.reasons).toHaveLength(0);
  });
  it("explains every failure", () => {
    const r = checkEligibility(drive, { cgpa: 7.7, branch: "ECE", year: 2, skills: ["SQL"] });
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/7\.7/);
    expect(r.reasons.length).toBeGreaterThanOrEqual(3);
  });
  it("handles missing profile data", () => {
    const r = checkEligibility(drive, { cgpa: null, branch: null, year: null, skills: [] });
    expect(r.eligible).toBe(false);
    expect(r.reasons.length).toBe(4);
  });
});

describe("profile completeness + resume strength", () => {
  it("scores a complete profile 100", () => {
    const r = profileCompleteness({
      cgpa: 8.5, branch: "CSE", year: 3,
      skills: ["JS", "TS", "React", "SQL"], phone: "999", resumeHeadline: "Hi",
      location: "Chennai", college: "VIT", degree: "B.Tech", graduationYear: 2027,
      github: "https://github.com/x", linkedin: "https://linkedin.com/x", portfolio: "https://x.dev",
    });
    expect(r.score).toBe(100);
    expect(r.missing).toHaveLength(0);
  });
  it("scores empty profile 0 and suggests resume additions", () => {
    expect(profileCompleteness(null).score).toBe(0);
    const s = resumeStrength(null, null);
    expect(s.score).toBe(0);
    expect(s.suggestions.length).toBeGreaterThan(0);
  });
});

describe("recommendation engine", () => {
  it("prioritizes eligible closing drives, then profile, coding, aptitude", () => {
    const recs = buildRecommendations({
      completeness: 50, skillsCount: 2, codingSolved: 0, codingTotal: 10, easyRemaining: 5,
      aptitudeAvg: null, applicationsCount: 0,
      openEligibleDrives: [{ id: "d1", title: "TCS Ninja", deadline: new Date(Date.now() + 86400000).toISOString() }],
      interviewPracticedPct: 0, weakestInterviewCategory: "DBMS", weakestCodingTag: "Arrays",
    });
    expect(recs.length).toBeLessThanOrEqual(5);
    expect(recs[0].id).toBe("drive-d1");
    expect(recs.map((r) => r.link).every((l) => l.startsWith("/"))).toBe(true);
  });
  it("stays quiet for a strong student except stretch goals", () => {
    const recs = buildRecommendations({
      completeness: 100, skillsCount: 8, codingSolved: 9, codingTotal: 10, easyRemaining: 0,
      aptitudeAvg: 85, applicationsCount: 3, openEligibleDrives: [],
      interviewPracticedPct: 90, weakestInterviewCategory: null, weakestCodingTag: null,
    });
    expect(recs.every((r) => r.id !== "profile" && r.id !== "aptitude")).toBe(true);
  });
});
