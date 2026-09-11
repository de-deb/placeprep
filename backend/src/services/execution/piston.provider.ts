import { env } from "../../config/env";
import type { ExecuteRequest, ExecuteResult, ExecutionProvider } from "./types";

const RUNTIME: Record<string, string> = {
  python: "python",
  cpp: "c++",
  java: "java",
};

interface PistonResponse {
  compile?: { stdout: string; stderr: string; output: string; code: number; signal: string | null };
  run: {
    stdout: string; stderr: string; output: string; code: number; signal: string | null;
    // Field names differ across Piston builds; read defensively.
    time?: number; cpu_time?: number; wall_time?: number; memory?: number;
  };
}

/**
 * Piston provider (https://github.com/engineer-man/piston) — sandboxed
 * execution (isolated jobs, enforced cpu/memory/output limits).
 * Uses version "*" (latest installed runtime) so no version bookkeeping.
 * PISTON_URL is the API root: http://localhost:2000/api/v2 locally,
 * http://piston:2000/api/v2 inside Docker Compose.
 */
export const pistonProvider: ExecutionProvider = {
  name: "piston",

  async execute(req: ExecuteRequest): Promise<ExecuteResult> {
    const runtime = RUNTIME[req.language];
    if (!runtime) throw Object.assign(new Error(`Unsupported language: ${req.language}`), { status: 400 });

    const base = (process.env.PISTON_URL ?? "http://localhost:2000/api/v2").replace(/\/$/, "");
    const controller = new AbortController();
    const timeoutMs = Number(process.env.EXECUTION_HTTP_TIMEOUT_MS ?? 20000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${base}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          language: runtime,
          version: "*",
          files: [{ content: req.code }],
          stdin: req.stdin,
          run_timeout: Math.min(req.cpuTimeLimitSec, 10) * 1000,
          compile_timeout: 10000,
          run_memory_limit: Math.min(req.memoryLimitKb, 256 * 1024) * 1024,
        }),
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return { stdout: "", stderr: "", compileOutput: "", exitCode: null, signal: null, timeSec: null, memoryKb: null, timedOut: true };
      }
      throw Object.assign(new Error("Execution service unreachable — try again shortly"), { status: 502 });
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) {
      throw Object.assign(new Error("Execution service is busy (rate limited) — try again in a minute"), { status: 503 });
    }
    if (!res.ok) {
      throw Object.assign(new Error(`Execution service error (${res.status})`), { status: 502 });
    }

    const body = (await res.json()) as PistonResponse;
    const compileFailed = body.compile != null && body.compile.code !== 0;
    const run = body.run;
    const killed = run.signal === "SIGKILL" || run.code === 137 || run.signal === "SIGXCPU";
    // Interpreted languages report syntax errors at run time — surface them as compile errors.
    const looksLikeCompileError = !compileFailed && run.code !== 0 && /syntaxerror/i.test(run.stderr ?? "");
    const ms = run.time ?? run.cpu_time ?? run.wall_time;
    return {
      stdout: run.stdout ?? "",
      stderr: run.stderr ?? "",
      compileOutput: compileFailed ? body.compile!.output || body.compile!.stderr : looksLikeCompileError ? run.stderr : "",
      exitCode: compileFailed ? body.compile!.code : run.code,
      signal: compileFailed ? body.compile!.signal : run.signal,
      timeSec: typeof ms === "number" ? ms / 1000 : null,
      memoryKb: typeof run.memory === "number" ? Math.round(run.memory / 1024) : null,
      timedOut: !compileFailed && !looksLikeCompileError && killed,
    };
  },
};

export const SUPPORTED_LANGUAGES = [
  { code: "python", name: "Python" },
  { code: "cpp", name: "C++" },
  { code: "java", name: "Java" },
];
