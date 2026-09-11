/**
 * Shared domain constants. Statuses are validated Strings (not DB enums) so
 * v1 rows keep working; the state machine below is enforced in services.
 */
export const APPLICATION_STATUSES = [
  "APPLIED",
  "SHORTLISTED",
  "ONLINE_ASSESSMENT",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Terminal states — no further transitions allowed. */
const TERMINAL: ApplicationStatus[] = ["SELECTED", "REJECTED", "WITHDRAWN"];

/** Forward pipeline order for the student timeline UI. */
export const APPLICATION_PIPELINE: ApplicationStatus[] = [
  "APPLIED",
  "SHORTLISTED",
  "ONLINE_ASSESSMENT",
  "INTERVIEW",
  "SELECTED",
];

/** Allowed next statuses from each state (admin moves forward/sideways, student withdraws). */
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["SHORTLISTED", "ONLINE_ASSESSMENT", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["ONLINE_ASSESSMENT", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  ONLINE_ASSESSMENT: ["INTERVIEW", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["SELECTED", "REJECTED", "WITHDRAWN"],
  SELECTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function isValidStatus(s: string): s is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(s);
}

export function canTransition(from: string, to: string): boolean {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  if (from === to) return false;
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(status: string): boolean {
  return (TERMINAL as string[]).includes(status);
}

/** Human next-step hint shown on the student timeline. */
export const NEXT_STEP: Record<string, string> = {
  APPLIED: "Wait for shortlisting — keep preparing in the meantime.",
  SHORTLISTED: "Get ready for the online assessment round.",
  ONLINE_ASSESSMENT: "Clear the assessment — revise aptitude + core subjects.",
  INTERVIEW: "Prepare your project story and HR answers.",
  SELECTED: "Congratulations! Complete joining formalities.",
  REJECTED: "Review weak areas and apply to the next drive.",
  WITHDRAWN: "Application withdrawn.",
};

export const NOTIFICATION_TYPES = [
  "DRIVE_DEADLINE",
  "APPLICATION_STATUS",
  "ANNOUNCEMENT",
  "PREPARATION",
  "SYSTEM",
] as const;

export const INTERVIEW_CATEGORIES = [
  "HR",
  "OOP",
  "DBMS",
  "OS",
  "Networks",
  "DSA",
  "Projects",
  "Cybersecurity",
  "Cloud",
] as const;

export const INTERVIEW_PROGRESS = ["PRACTICED", "CONFIDENT"] as const;

export const CODING_VERDICTS = ["SOLVED", "ATTEMPTED"] as const;
