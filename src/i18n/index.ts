/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import type { Locale } from "../lessons/lessons";
import { ar } from "./ar";
import { en, type TranslationKey } from "./en";

export { ar, en };
export type { TranslationKey };

export const DICTIONARIES = { ar, en } as const;

export function translate(
  locale: Locale,
  key: TranslationKey,
  variables?: Record<string, string | number>,
): string {
  const dictionary = DICTIONARIES[locale] ?? en;
  const template: string = dictionary[key] ?? en[key] ?? key;
  if (!variables) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = variables[name];
    return value === undefined ? match : String(value);
  });
}

export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}
