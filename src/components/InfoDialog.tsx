/*
 * Short product information sheets: about, privacy, terms, help and changelog.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { useRef } from "react";
import { createPortal } from "react-dom";
import { APP_VERSION, SUPPORT_EMAIL, SUPPORT_PHONE } from "../lib/appMeta";
import { useDialogFocus } from "../lib/useDialogFocus";
import { useI18n } from "../i18n/I18nProvider";
import { CloseIcon } from "./Icons";

export type InfoSection = "about" | "privacy" | "terms" | "help" | "changelog";

const SECTIONS: InfoSection[] = ["about", "privacy", "terms", "help", "changelog"];

interface InfoDialogProps {
  section: InfoSection | null;
  onSelect: (section: InfoSection) => void;
  onClose: () => void;
}

export function InfoDialog({ section, onSelect, onClose }: InfoDialogProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(section !== null, onClose, dialogRef, closeRef);

  if (!section) return null;

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
        aria-labelledby="info-dialog-title"
        aria-describedby="info-dialog-body"
        className="paper relative flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="info-dialog-title" className="text-lg font-bold text-ink">
              {t(`info.${section}.title`)}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn-icon h-8 w-8 shrink-0 border-0 bg-transparent"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <nav
          aria-label={t("footer.links")}
          className="flex flex-wrap gap-1 border-b border-line bg-canvas px-3 py-2"
        >
          {SECTIONS.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => onSelect(entry)}
              aria-pressed={entry === section}
              className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                entry === section
                  ? "bg-board text-chalk dark:bg-amber dark:text-[#222222]"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {t(`footer.${entry}`)}
            </button>
          ))}
        </nav>

        <div id="info-dialog-body" className="overflow-y-auto px-5 py-4">
          <p className="lesson-prose whitespace-pre-line text-[13px]">
            {t(`info.${section}.body`, {
              version: APP_VERSION,
              email: SUPPORT_EMAIL,
              phone: SUPPORT_PHONE,
            })}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-2 text-[10px] text-muted">
          <span>{t("footer.version", { version: APP_VERSION })}</span>
          <span>{t("footer.copyright")}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
