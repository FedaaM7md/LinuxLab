/*
 * Build-time demo flag.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * DEMO_MODE defaults to true. The Vite config turns the environment value into
 * the __DEMO_MODE__ constant so the flag is fixed at build time and cannot be
 * flipped from the browser console.
 */

export function parseDemoFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === "") return true;
  const value = raw.trim().toLowerCase();
  return !["false", "0", "off", "no", "disabled"].includes(value);
}

export function demoModeEnabled(): boolean {
  return typeof __DEMO_MODE__ === "boolean" ? __DEMO_MODE__ : true;
}
