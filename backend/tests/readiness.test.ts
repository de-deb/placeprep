import { describe, expect, it } from "vitest";
import { calculateReadiness } from "../src/utils/readiness";

describe("calculateReadiness", () => {
  it("scores a strong student highly", () => {
    const r = calculateReadiness({
      cgpa: 9,
      skillsCount: 8,
      codingSolved: 8,
      codingTotal: 10,
      aptitudeAvg: 85,
      applicationsCount: 3,
    });
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.grade).toMatch(/Excellent|Good/);
    expect(r.breakdown).toHaveLength(5);
  });

  it("flags weak areas for a beginner", () => {
    const r = calculateReadiness({
      cgpa: 6.2,
      skillsCount: 1,
      codingSolved: 0,
      codingTotal: 6,
      aptitudeAvg: 40,
      applicationsCount: 0,
    });
    expect(r.score).toBeLessThan(50);
    expect(r.weakAreas.length).toBeGreaterThan(0);
  });

  it("handles missing data without crashing", () => {
    const r = calculateReadiness({
      cgpa: null,
      skillsCount: 0,
      codingSolved: 0,
      codingTotal: 0,
      aptitudeAvg: null,
      applicationsCount: 0,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.weakAreas.length).toBeGreaterThan(0);
  });
});
