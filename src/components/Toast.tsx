/*
 * Toast notification with an optional undo action.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { useEffect } from "react";
import { CheckIcon } from "./Icons";

interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastProps {
  message: string | null;
  action?: ToastAction | null;
  onDismiss: () => void;
}

export function Toast({ message, action = null, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, action ? 6500 : 2800);
    return () => clearTimeout(timer);
  }, [message, action, onDismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      {message && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-amber/60 bg-board px-3 py-2 text-sm font-semibold text-chalk shadow-lift">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber text-[#222222]">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">{message}</span>
          {action && (
            <button
              type="button"
              onClick={() => {
                onDismiss();
                action.run();
              }}
              className="ms-1 shrink-0 cursor-pointer rounded-md border border-amber/50 px-2 py-0.5 text-[11px] font-bold text-amber hover:bg-amber/10"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
