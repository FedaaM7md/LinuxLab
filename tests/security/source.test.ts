import { describe, expect, it } from "vitest";

const sources = import.meta.glob("../../src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("source safety", () => {
  it("finds the application source files", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it("does not use raw HTML injection or dynamic code evaluation", () => {
    for (const [file, source] of Object.entries(sources)) {
      expect(source, `${file}: dangerouslySetInnerHTML`).not.toContain(
        "dangerouslySetInnerHTML",
      );
      expect(source, `${file}: eval(`).not.toMatch(/\beval\s*\(/);
      expect(source, `${file}: new Function`).not.toContain("new Function");
    }
  });

  it("keeps external network endpoints out of runtime source", () => {
    for (const [file, source] of Object.entries(sources)) {
      // The footer credit is a plain navigation link to the owner's site. It
      // loads no resource; everything else must be relative or same-origin.
      const withoutCredit = source.replaceAll("https://fedaamohamed.com", "");
      expect(withoutCredit, `${file}: external URL`).not.toMatch(/https?:\/\//);
    }
  });
});
