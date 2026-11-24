/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import {
  DEMO_EPOCH_KEY,
  DEMO_MANIFEST_URL,
  parseResetAt,
  shouldResetDemo,
} from "../../src/demo/demoReset";
import { parseDemoFlag } from "../../src/demo/demoMode";

describe("demo flag", () => {
  it("defaults to enabled and accepts common true/false spellings", () => {
    expect(parseDemoFlag(undefined)).toBe(true);
    expect(parseDemoFlag("")).toBe(true);
    expect(parseDemoFlag("true")).toBe(true);
    expect(parseDemoFlag("1")).toBe(true);
    expect(parseDemoFlag("on")).toBe(true);
    expect(parseDemoFlag("false")).toBe(false);
    expect(parseDemoFlag(" FALSE ")).toBe(false);
    expect(parseDemoFlag("0")).toBe(false);
    expect(parseDemoFlag("off")).toBe(false);
    expect(parseDemoFlag("no")).toBe(false);
    expect(parseDemoFlag("disabled")).toBe(false);
  });
});

describe("demo reset manifest", () => {
  it("exposes a same-origin manifest URL and a storage key", () => {
    expect(DEMO_MANIFEST_URL.startsWith("/")).toBe(true);
    expect(DEMO_MANIFEST_URL).not.toContain("//");
    expect(DEMO_EPOCH_KEY).toContain("demoEpoch");
  });

  it("parses only a valid ISO reset timestamp", () => {
    expect(parseResetAt({ resetAt: "2026-11-24T10:00:00.000Z" })).toBe(
      "2026-11-24T10:00:00.000Z",
    );
    expect(parseResetAt({ resetAt: "not a date" })).toBeNull();
    expect(parseResetAt({ resetAt: 42 })).toBeNull();
    expect(parseResetAt({})).toBeNull();
    expect(parseResetAt(null)).toBeNull();
    expect(parseResetAt("2026-11-24T10:00:00.000Z")).toBeNull();
  });

  it("never resets a first visit and only resets on a newer manifest", () => {
    const earlier = "2026-11-24T09:00:00.000Z";
    const later = "2026-11-25T09:00:00.000Z";
    expect(shouldResetDemo(null, later)).toBe(false);
    expect(shouldResetDemo(earlier, null)).toBe(false);
    expect(shouldResetDemo(earlier, earlier)).toBe(false);
    expect(shouldResetDemo(later, earlier)).toBe(false);
    expect(shouldResetDemo(earlier, later)).toBe(true);
    expect(shouldResetDemo("broken", later)).toBe(true);
  });
});
