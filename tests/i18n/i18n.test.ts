/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import { ar } from "../../src/i18n/ar";
import { en } from "../../src/i18n/en";
import { translate } from "../../src/i18n";

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
    .map((match) => match[1] ?? "")
    .sort();
}

function visibleBrandText(): string {
  return [
    en["brand.name"],
    ar["brand.name"],
    en["brand.descriptor"],
    ar["brand.descriptor"],
    en["doc.title"],
    ar["doc.title"],
  ].join(" ");
}

describe("translations", () => {
  it("has exactly the same keys in Arabic and English", () => {
    const englishKeys = Object.keys(en).sort();
    const arabicKeys = Object.keys(ar).sort();
    expect(arabicKeys).toEqual(englishKeys);
  });

  it("has no empty translation values", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), `en.${key}`).not.toBe("");
    }
    for (const [key, value] of Object.entries(ar)) {
      expect(value.trim(), `ar.${key}`).not.toBe("");
    }
  });

  it("keeps interpolation placeholders in sync", () => {
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(placeholders(ar[key]), `ar.${key}`).toEqual(placeholders(en[key]));
    }
  });

  it("interpolates variables and falls back safely", () => {
    expect(translate("en", "progress.completedSteps", { done: 3, total: 19 })).toBe("3 of 19 steps");
    expect(translate("ar", "terminal.memoryMb", { size: 128 })).toContain("128");
    expect(translate("en", "progress.completedSteps")).toContain("{done}");
  });

  it("contains the required accessibility strings", () => {
    for (const key of [
      "a11y.lessonPanel",
      "a11y.terminalPanel",
      "a11y.progress",
      "a11y.chapterMap",
      "a11y.demoNote",
      "a11y.brandHome",
      "a11y.stepList",
      "a11y.sectionNav",
    ]) {
      expect(en[key as keyof typeof en]).toBeTruthy();
    }
  });

  it("keeps the product name standalone and the owner credit in the footer only", () => {
    expect(en["brand.name"]).toBe("Linux Lab");
    expect(ar["brand.name"]).toBe("Linux Lab");
    expect(en["brand.descriptor"]).toBe("معمل لينكس");
    expect(ar["brand.descriptor"]).toBe("معمل لينكس");
    expect(en["doc.title"]).toContain("— Linux Lab");
    expect(ar["doc.title"]).toContain("— Linux Lab");
    expect(en["footer.copyright"]).toBe("© 2026 Linux Lab. All rights reserved.");
    expect(ar["footer.copyright"]).toBe("© 2026 معمل لينكس. جميع الحقوق محفوظة.");
    expect(en["footer.credit"]).toBe("Designed & built by Fedaa Mohamed");
    expect(ar["footer.credit"]).toBe("تصميم وتطوير: فداء محمد");
    expect(visibleBrandText()).not.toMatch(/Fedaa|فداء/);
  });

  it("avoids the banned marketing filler", () => {
    const banned = [
      "seamless",
      "elevate",
      "empower",
      "unlock",
      "revolutionize",
      "next-level",
      "all-in-one",
      "game-changer",
      "بكل سهولة",
      "ارتقِ",
      "حلول متكاملة",
      "بضغطة زر",
    ];
    const all = [...Object.values(en), ...Object.values(ar)].join("\n").toLowerCase();
    for (const phrase of banned) {
      expect(all, `banned filler: ${phrase}`).not.toContain(phrase.toLowerCase());
    }
  });
});
