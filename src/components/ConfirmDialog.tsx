/*
 * Accessible confirmation dialog.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/I18nProvider";
import { useDialogFocus } from "../lib/useDialogFocus";
import { AlertIcon, CloseIcon } from "./Icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, onClose, dialogRef, confirmRef);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-board-deep/70"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="paper relative w-full max-w-md p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              destructive ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber-ink"
            }`}
          >
            <AlertIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-bold text-ink">
              {title}
            </h2>
            <div id="confirm-dialog-body" className="lesson-prose mt-1.5 text-sm">
              {body}
            </div>
          </div>
          <button
            type="button"
            className="btn-icon -me-1 -mt-1 h-8 w-8 shrink-0 border-0 bg-transparent"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={destructive ? "btn-danger" : "btn-amber"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
