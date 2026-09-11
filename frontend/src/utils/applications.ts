/** Application workflow helpers shared by student + admin UIs. */

export const PIPELINE = ["APPLIED", "SHORTLISTED", "ONLINE_ASSESSMENT", "INTERVIEW", "SELECTED"] as const;

const TERMINAL = new Set(["SELECTED", "REJECTED", "WITHDRAWN"]);

export function terminalOf(status: string): boolean {
  return TERMINAL.has(status);
}

export const NEXT_STEP_FALLBACK: Record<string, string> = {
  APPLIED: "Wait for shortlisting — keep preparing in the meantime.",
  SHORTLISTED: "Get ready for the online assessment round.",
  ONLINE_ASSESSMENT: "Clear the assessment — revise aptitude + core subjects.",
  INTERVIEW: "Prepare your project story and HR answers.",
  SELECTED: "Congratulations! Complete joining formalities.",
  REJECTED: "Review weak areas and apply to the next drive.",
  WITHDRAWN: "Application withdrawn.",
};

export const STATUS_TONE: Record<string, string> = {
  APPLIED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  SHORTLISTED: "bg-blue-50 text-blue-700 ring-blue-200",
  ONLINE_ASSESSMENT: "bg-purple-50 text-purple-700 ring-purple-200",
  INTERVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
  SELECTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  WITHDRAWN: "bg-slate-100 text-slate-500 ring-slate-200",
};
