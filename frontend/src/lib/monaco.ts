import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

// Bundle Monaco locally (no CDN at runtime). Loaded lazily with the
// workspace route (see App.tsx) so the main bundle stays lean.
loader.config({ monaco });

export const MONACO_LANGUAGES: Record<string, string> = {
  python: "python",
  cpp: "cpp",
  java: "java",
};

export function monacoLanguage(code: string): string {
  return MONACO_LANGUAGES[code] ?? "plaintext";
}
