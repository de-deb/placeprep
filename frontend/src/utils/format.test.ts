import { describe, expect, it } from "vitest";
import { formatDate, formatSeconds, timeAgo } from "./format";

describe("formatDate", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2026-09-10T00:00:00.000Z")).toMatch(/2026|Sep/);
  });
  it("handles null/undefined/invalid", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("timeAgo", () => {
  it("labels recent times relatively", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
    expect(timeAgo(new Date(Date.now() - 5 * 60000).toISOString())).toBe("5m ago");
    expect(timeAgo(new Date(Date.now() - 3 * 3600000).toISOString())).toBe("3h ago");
    expect(timeAgo(null)).toBe("—");
  });
});

describe("formatSeconds", () => {
  it("formats mm:ss", () => {
    expect(formatSeconds(65)).toBe("1:05");
    expect(formatSeconds(0)).toBe("0:00");
    expect(formatSeconds(null)).toBe("—");
  });
});
