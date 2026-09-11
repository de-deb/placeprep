import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState<null | { title: string; message: string; confirmLabel: string; resolve: (v: boolean) => void }>(null);

  const confirm = (message: string, opts?: { title?: string; confirmLabel?: string }) =>
    new Promise<boolean>((resolve) =>
      setPending({ message, title: opts?.title ?? "Please confirm", confirmLabel: opts?.confirmLabel ?? "Delete", resolve })
    );

  const dialog = pending && (
    <Modal title={pending.title} onClose={() => { pending.resolve(false); setPending(null); }}>
      <p className="text-sm text-slate-600">{pending.message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => { pending.resolve(false); setPending(null); }}
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          onClick={() => { pending.resolve(true); setPending(null); }}
        >
          {pending.confirmLabel}
        </button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}
