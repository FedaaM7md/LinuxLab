/*
 * Linux Lab brand mark and lockup.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * The mark is an Erlenmeyer beaker with a terminal prompt inside: a lab
 * vessel for practising commands. It is drawn for this product only.
 */

import { useI18n } from "../i18n/I18nProvider";

export function LabMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path
        d="M18.2 7.2h11.6M20.3 7.2v11.6L11.7 36.6a5.4 5.4 0 0 0 4.9 7.7h14.8a5.4 5.4 0 0 0 4.9-7.7L27.7 18.8V7.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.3 30.7h17.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.34"
      />
      <path
        d="M18.4 32.9l4.2 3.7-4.2 3.7"
        stroke="var(--lab-amber)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.4 40.3h5.4"
        stroke="var(--lab-amber)"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="37.4" cy="9.4" r="2.6" fill="var(--lab-amber)" opacity="0.9" />
    </svg>
  );
}

interface BrandLockupProps {
  compact?: boolean;
  /** Use chalk colours for placement on the board-green header. */
  tone?: "chalk" | "ink";
  className?: string;
}

export function BrandLockup({
  compact = false,
  tone = "ink",
  className = "",
}: BrandLockupProps) {
  const { t } = useI18n();
  const titleColor = tone === "chalk" ? "text-chalk" : "text-ink";
  const quietColor = tone === "chalk" ? "text-chalk/60" : "text-muted";

  return (
    <span className={`flex min-w-0 items-center gap-3 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl border ${
          tone === "chalk"
            ? "border-chalk/20 bg-white/5 text-chalk"
            : "border-line bg-surface-2 text-ink"
        } ${compact ? "h-9 w-9" : "h-11 w-11"}`}
      >
        <LabMark className={compact ? "h-7 w-7" : "h-8 w-8"} />
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={`block truncate font-display font-bold ${titleColor} ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {t("brand.name")}
        </span>
        <span className={`mt-1 block text-[10px] font-semibold ${quietColor}`}>
          {t("brand.descriptor")}
        </span>
      </span>
    </span>
  );
}
