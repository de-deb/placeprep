/**
 * Execution provider contract. PlacePrep never runs user code itself —
 * implementations must be sandboxed (Piston/Judge0). The default provider
 * is the public Piston API (no credentials); point PISTON_URL at a
 * self-hosted Piston or swap in a Judge0 provider without touching callers.
 */
export interface ExecuteRequest {
  language: string; // placeprep code: python | cpp | java
  code: string;
  stdin: string;
  cpuTimeLimitSec: number;
  memoryLimitKb: number;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  exitCode: number | null;
  signal: string | null;
  timeSec: number | null;
  memoryKb: number | null;
  timedOut: boolean;
}

export interface ExecutionProvider {
  name: string;
  execute(req: ExecuteRequest): Promise<ExecuteResult>;
}

let override: ExecutionProvider | null = null;

/** Test seam: integration tests inject a stub sandbox. */
export function __setExecutionProvider(p: ExecutionProvider | null) {
  override = p;
}

export function getExecutionProvider(): ExecutionProvider {
  if (override) return override;
  // Lazy require avoids cycles.
  const { pistonProvider } = require("./piston.provider") as typeof import("./piston.provider");
  return pistonProvider;
}
