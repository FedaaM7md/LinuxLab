/*
 * Hand-drawn marks used for completed lesson steps.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

interface CheckProps {
  className?: string;
  /** Colour is inherited unless a class overrides it. */
  title?: string;
}

/** A chalk-style tick with a slightly uneven stroke. */
export function ChalkCheck({ className = "h-5 w-5", title }: CheckProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M3.6 12.4c1.7 1.5 3.2 3.2 4.4 4.9 2.2-4.2 4.7-7.5 7.9-10.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.1 7.9c.8-.6 1.7-1.2 2.7-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** A loose underline for a section label. */
export function HandUnderline({ className = "h-2 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 8" className={className} fill="none" aria-hidden="true" focusable="false">
      <path
        d="M2 5.2c14-2 29-2.9 44-2.4 16 .5 32 1.6 48 3.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
