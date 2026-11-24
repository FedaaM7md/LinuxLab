/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_IMAGE_CONFIG,
  buildImageSpecs,
  imageUrl,
  probeImages,
  resolveImageConfig,
  type HeadFetch,
  type ProbeOptions,
} from "../../src/emulator/images";

interface FakeResponseOptions {
  status?: number;
  contentType?: string;
  length?: number | null;
}

function fakeResponse({ status = 200, contentType = "application/octet-stream", length = 200_000 }: FakeResponseOptions) {
  const headers = new Map<string, string>();
  headers.set("content-type", contentType);
  if (length !== null) headers.set("content-length", String(length));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string): string | null {
        return headers.get(name.toLowerCase()) ?? null;
      },
    },
  };
}

function installFetch(
  handler: (url: string) => FakeResponseOptions | Error,
): HeadFetch {
  return async (url: string) => {
    const result = handler(url);
    if (result instanceof Error) throw result;
    return fakeResponse(result);
  };
}

describe("image configuration", () => {
  it("uses the documented defaults", () => {
    expect(resolveImageConfig({})).toEqual(DEFAULT_IMAGE_CONFIG);
    expect(DEFAULT_IMAGE_CONFIG).toMatchObject({
      basePath: "/images/",
      bios: "seabios.bin",
      vgaBios: "vgabios.bin",
      cdrom: "linux.iso",
      hdd: "",
      memoryMb: 128,
    });
  });

  it("accepts safe overrides", () => {
    const config = resolveImageConfig({
      VITE_IMAGE_BASE_PATH: "/lab-images/",
      VITE_V86_BIOS_FILE: "bios/seabios.bin",
      VITE_V86_VGA_BIOS_FILE: "bios/vgabios.bin",
      VITE_V86_CDROM_FILE: "distro.iso",
      VITE_V86_HDD_FILE: "disk.img",
      VITE_V86_MEMORY_MB: "256",
    });
    expect(config.basePath).toBe("/lab-images/");
    expect(config.bios).toBe("bios/seabios.bin");
    expect(config.cdrom).toBe("distro.iso");
    expect(config.hdd).toBe("disk.img");
    expect(config.memoryMb).toBe(256);
  });

  it("falls back on invalid values instead of trusting the environment", () => {
    const config = resolveImageConfig({
      VITE_IMAGE_BASE_PATH: "images-cdn.example.com/",
      VITE_V86_BIOS_FILE: "../seabios.bin",
      VITE_V86_CDROM_FILE: "https://example.com/linux.iso",
      VITE_V86_MEMORY_MB: "99999",
    });
    expect(config.basePath).toBe("/images/");
    expect(config.bios).toBe("seabios.bin");
    expect(config.cdrom).toBe("linux.iso");
    expect(config.memoryMb).toBe(128);
  });

  it("rejects protocol-relative and query-bearing image paths (SSRF guard)", () => {
    expect(resolveImageConfig({ VITE_IMAGE_BASE_PATH: "//evil.example/" }).basePath).toBe(
      "/images/",
    );
    expect(resolveImageConfig({ VITE_IMAGE_BASE_PATH: "/images/?url=//evil" }).basePath).toBe(
      "/images/",
    );
    expect(resolveImageConfig({ VITE_IMAGE_BASE_PATH: "/images/#hash" }).basePath).toBe(
      "/images/",
    );
  });

  it("builds URLs and required specs", () => {
    expect(imageUrl("/images/", "seabios.bin")).toBe("/images/seabios.bin");
    const specs = buildImageSpecs(DEFAULT_IMAGE_CONFIG);
    expect(specs.map((spec) => spec.key)).toEqual(["bios", "vgaBios", "cdrom"]);
    expect(specs.every((spec) => spec.required)).toBe(true);
    const withDisk = buildImageSpecs({ ...DEFAULT_IMAGE_CONFIG, hdd: "disk.img" });
    expect(withDisk.find((spec) => spec.key === "hdd")?.required).toBe(false);
  });
});

describe("image probing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports missing images when the server returns 404", async () => {
    const options: ProbeOptions = { fetchImpl: installFetch(() => ({ status: 404 })) };
    const result = await probeImages(DEFAULT_IMAGE_CONFIG, options);
    expect(result.ready).toBe(false);
    expect(result.missing).toHaveLength(3);
    expect(result.details[0]?.found).toBe(false);
    expect(result.details[0]?.error).toContain("404");
  });

  it("treats the dev-server HTML fallback as a missing file", async () => {
    const options: ProbeOptions = {
      fetchImpl: installFetch(() => ({ status: 200, contentType: "text/html; charset=utf-8" })),
    };
    const result = await probeImages(DEFAULT_IMAGE_CONFIG, options);
    expect(result.ready).toBe(false);
    expect(result.details.every((detail) => detail.found === false)).toBe(true);
    expect(result.details[0]?.error).toContain("HTML");
  });

  it("rejects implausibly small files", async () => {
    const options: ProbeOptions = { fetchImpl: installFetch(() => ({ length: 120 })) };
    const result = await probeImages(DEFAULT_IMAGE_CONFIG, options);
    expect(result.ready).toBe(false);
    expect(result.missing).toHaveLength(3);
    expect(result.details[0]?.error).toContain("too small");
  });

  it("marks a complete image set as ready", async () => {
    const options: ProbeOptions = {
      fetchImpl: installFetch((url) => ({
        contentType: url.endsWith(".iso") ? "application/x-iso9660-image" : "application/octet-stream",
        length: url.endsWith(".iso") ? 90_000_000 : 128_000,
      })),
    };
    const result = await probeImages(DEFAULT_IMAGE_CONFIG, options);
    expect(result.ready).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.details.every((detail) => detail.found === true)).toBe(true);
  });

  it("surfaces network failures without rejecting", async () => {
    const options: ProbeOptions = {
      fetchImpl: installFetch(() => new Error("network down")),
    };
    const result = await probeImages(DEFAULT_IMAGE_CONFIG, options);
    expect(result.ready).toBe(false);
    expect(result.details[0]?.error).toBe("network down");
  });

  it("returns not-ready when fetch is unavailable", async () => {
    const original = globalThis.fetch;
    // @ts-expect-error deliberately remove fetch for this test
    delete globalThis.fetch;
    try {
      const result = await probeImages(DEFAULT_IMAGE_CONFIG, {});
      expect(result.ready).toBe(false);
      expect(result.details[0]?.error).toContain("fetch");
    } finally {
      globalThis.fetch = original;
    }
  });
});
