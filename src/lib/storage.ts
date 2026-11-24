/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

export const STORAGE_KEYS = {
  progress: "fedaa.linuxlab.progress.v1",
  locale: "fedaa.linuxlab.locale.v1",
  theme: "fedaa.linuxlab.theme.v1",
  mode: "fedaa.linuxlab.mode.v1",
  memory: "fedaa.linuxlab.memory.v1",
} as const;

/** localStorage can be unavailable (private mode, disabled storage, SSR). */
function defaultStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readStored(key: string, storage: Storage | null = defaultStorage()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(
  key: string,
  value: string,
  storage: Storage | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: string, storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
