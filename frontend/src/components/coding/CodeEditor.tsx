import Editor from "@monaco-editor/react";
import { monacoLanguage } from "../../lib/monaco";

const MONACO_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 12 },
  renderLineHighlight: "all" as const,
  tabSize: 4,
} as const;

/** Real code editor (Monaco). Ctrl/Cmd+Enter runs the code. */
export function CodeEditor({
  language,
  code,
  onChange,
  onRun,
  height = "100%",
}: {
  language: string;
  code: string;
  onChange: (code: string) => void;
  onRun?: () => void;
  height?: string | number;
}) {
  return (
    <Editor
      height={height}
      language={monacoLanguage(language)}
      value={code}
      theme="vs"
      options={MONACO_OPTIONS}
      onChange={(v) => onChange(v ?? "")}
      onMount={(editor, monaco) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun?.());
        editor.focus();
      }}
      loading={<p className="p-4 text-sm text-slate-400">Loading editor… (first load fetches the local bundle)</p>}
    />
  );
}
