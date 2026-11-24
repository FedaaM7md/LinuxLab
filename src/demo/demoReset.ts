/*
 * Demo dataset reset helpers.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * The app is static, so a scheduled `npm run demo:reset` writes a manifest with
 * a new reset timestamp. Each visitor compares that timestamp with the one in
 * local storage; a newer timestamp clears only that visitor's progress.
 */

export const DEMO_EPOCH_KEY = "fedaa.linuxlab.demoEpoch.v1";
export const DEMO_MANIFEST_URL = "/demo-reset.json";

export interface DemoResetManifest {
  resetAt: string;
  note?: string;
}

export function parseResetAt(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as Record<string, unknown>).resetAt;
  if (typeof raw !== "string") return null;
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

/**
 * A first visit is not a reset: there is no progress to clear yet. A reset
 * happens only when the manifest is newer than the timestamp this device saw.
 */
export function shouldResetDemo(stored: string | null, remote: string | null): boolean {
  if (!remote) return false;
  if (!stored) return false;
  const remoteTime = Date.parse(remote);
  const storedTime = Date.parse(stored);
  if (!Number.isFinite(remoteTime)) return false;
  if (!Number.isFinite(storedTime)) return remote !== stored;
  return remoteTime > storedTime;
}
