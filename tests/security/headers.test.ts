/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import headers from "../../public/_headers?raw";
import indexHtml from "../../index.html?raw";

describe("static security headers", () => {
  it("ships a strict production content security policy", () => {
    expect(headers).toContain("Content-Security-Policy:");
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("base-uri 'self'");
    expect(headers).toContain("connect-src 'self'");
    // Inline scripts are not needed: the theme bootstrap is an external file.
    expect(headers).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("ships the expected hardening headers", () => {
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).toContain("X-Frame-Options: DENY");
    expect(headers).toContain("Referrer-Policy: no-referrer");
    expect(headers).toContain("Permissions-Policy:");
    expect(headers).toContain("Cross-Origin-Opener-Policy: same-origin");
    expect(headers).toContain("Cross-Origin-Resource-Policy: same-origin");
    expect(headers).toContain("Strict-Transport-Security:");
    expect(headers).toContain("/demo-reset.json");
    expect(headers).toContain("Cache-Control: no-store");
  });

  it("does not rely on inline scripts or external CDNs in the HTML shell", () => {
    const scripts = [...indexHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    expect(indexHtml).toContain('src="/theme-boot.js"');
    for (const match of scripts) {
      const tag = match[0];
      expect(tag, `script without src: ${tag}`).toMatch(/\ssrc="/);
      expect((match[1] ?? "").trim()).toBe("");
    }
    expect(indexHtml).not.toMatch(/<script[^>]+\ssrc="https?:\/\//);
    expect(indexHtml).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//);
    expect(indexHtml).not.toMatch(/<img[^>]+\ssrc="https?:\/\//);
    expect(indexHtml).toContain('rel="canonical"');
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:image"');
    expect(indexHtml).toContain('name="referrer" content="no-referrer"');
    expect(indexHtml).toContain('name="copyright"');
  });
});
