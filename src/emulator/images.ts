/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import type { TranslationKey } from "../i18n/en";

export type ImageKey = "bios" | "vgaBios" | "cdrom" | "hdd";

export interface LabImageConfig {
  basePath: string;
  bios: string;
  vgaBios: string;
  cdrom: string;
  /** Empty string means "no hard-disk image". */
  hdd: string;
  memoryMb: number;
}

export interface ImageFileSpec {
  key: ImageKey;
  filename: string;
  required: boolean;
  /** Minimum plausible file size; HTML fallbacks and empty files are rejected. */
  minBytes: number;
  purposeKey: TranslationKey;
}

export interface ImageProbeDetail extends ImageFileSpec {
  url: string;
  found: boolean | null;
  sizeBytes: number | null;
  error?: string;
}

export interface ImageProbeResult {
  ready: boolean;
  basePath: string;
  details: ImageProbeDetail[];
  missing: ImageProbeDetail[];
  error?: string;
}

const DEFAULT_BASE_PATH = "/images/";
const DEFAULT_MEMORY_MB = 128;
const ALLOWED_MEMORY = [64, 128, 256, 512] as const;
const SAFE_FILENAME = /^[A-Za-z0-9._/-]+$/;

export const DEFAULT_IMAGE_CONFIG: LabImageConfig = {
  basePath: DEFAULT_BASE_PATH,
  bios: "seabios.bin",
  vgaBios: "vgabios.bin",
  cdrom: "linux.iso",
  hdd: "",
  memoryMb: DEFAULT_MEMORY_MB,
};

type EnvLike = Record<string, unknown>;

function envString(env: EnvLike, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" ? value : undefined;
}

function asFilename(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!SAFE_FILENAME.test(trimmed) || trimmed.includes("..") || trimmed.startsWith("/")) {
    return fallback;
  }
  return trimmed;
}

function asBasePath(value: string | undefined): string {
  if (!value) return DEFAULT_BASE_PATH;
  const trimmed = value.trim();
  // Same-origin relative paths only: reject absolute URLs and the
  // protocol-relative //host form, which would otherwise be a request forgery.
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    !SAFE_FILENAME.test(trimmed) ||
    trimmed.includes("..")
  ) {
    return DEFAULT_BASE_PATH;
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

/**
 * Reads optional VITE_* overrides. All values are public build-time settings;
 * no secrets belong here. Invalid values fall back to safe defaults.
 */
export function resolveImageConfig(env: EnvLike = import.meta.env as EnvLike): LabImageConfig {
  const memory = Number.parseInt(envString(env, "VITE_V86_MEMORY_MB") ?? "", 10);
  return {
    basePath: asBasePath(envString(env, "VITE_IMAGE_BASE_PATH")),
    bios: asFilename(envString(env, "VITE_V86_BIOS_FILE"), DEFAULT_IMAGE_CONFIG.bios),
    vgaBios: asFilename(envString(env, "VITE_V86_VGA_BIOS_FILE"), DEFAULT_IMAGE_CONFIG.vgaBios),
    cdrom: asFilename(envString(env, "VITE_V86_CDROM_FILE"), DEFAULT_IMAGE_CONFIG.cdrom),
    hdd: asFilename(envString(env, "VITE_V86_HDD_FILE"), ""),
    memoryMb: (ALLOWED_MEMORY as readonly number[]).includes(memory) ? memory : DEFAULT_MEMORY_MB,
  };
}

export function imageUrl(basePath: string, filename: string): string {
  return `${basePath}${filename.replace(/^\/+/, "")}`;
}

export function buildImageSpecs(config: LabImageConfig): ImageFileSpec[] {
  const specs: ImageFileSpec[] = [
    {
      key: "bios",
      filename: config.bios,
      required: true,
      minBytes: 32 * 1024,
      purposeKey: "setup.biosPurpose",
    },
    {
      key: "vgaBios",
      filename: config.vgaBios,
      required: true,
      minBytes: 4 * 1024,
      purposeKey: "setup.vgaPurpose",
    },
    {
      key: "cdrom",
      filename: config.cdrom,
      required: true,
      minBytes: 1_000_000,
      purposeKey: "setup.cdromPurpose",
    },
  ];
  if (config.hdd) {
    specs.push({
      key: "hdd",
      filename: config.hdd,
      required: false,
      minBytes: 1_000_000,
      purposeKey: "setup.hddPurpose",
    });
  }
  return specs;
}

interface HeadResponse {
  ok: boolean;
  status: number;
  headers: {
    get(name: string): string | null;
  };
}

export type HeadFetch = (
  input: string,
  init?: { method?: string; signal?: AbortSignal; cache?: RequestCache },
) => Promise<HeadResponse>;

export interface ProbeOptions {
  fetchImpl?: HeadFetch;
  timeoutMs?: number;
}

function contentTypeOf(response: HeadResponse): string {
  return (response.headers.get("content-type") ?? "").toLowerCase();
}

function contentLengthOf(response: HeadResponse): number | null {
  const raw = response.headers.get("content-length");
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

export async function probeImage(
  spec: ImageFileSpec,
  basePath: string,
  options: ProbeOptions = {},
): Promise<ImageProbeDetail> {
  const url = imageUrl(basePath, spec.filename);
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as HeadFetch | undefined);
  const detail: ImageProbeDetail = {
    ...spec,
    url,
    found: null,
    sizeBytes: null,
  };
  if (!fetchImpl) {
    return { ...detail, found: false, error: "fetch is not available" };
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 8000;
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : null;

  try {
    const response = await fetchImpl(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ...detail, found: false, error: `HTTP ${response.status}` };
    }
    const contentType = contentTypeOf(response);
    if (contentType.includes("text/html")) {
      return {
        ...detail,
        found: false,
        error: "HTML response — the server is probably returning a fallback page",
      };
    }
    const size = contentLengthOf(response);
    if (size !== null && size < spec.minBytes) {
      return {
        ...detail,
        found: false,
        sizeBytes: size,
        error: `File is too small (${size} bytes); expected at least ${spec.minBytes}`,
      };
    }
    return { ...detail, found: true, sizeBytes: size };
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "Timed out while checking the file"
        : error instanceof Error
          ? error.message
          : "Network error";
    return { ...detail, found: false, error: message };
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

export async function probeImages(
  config: LabImageConfig,
  options: ProbeOptions = {},
): Promise<ImageProbeResult> {
  const specs = buildImageSpecs(config);
  const details = await Promise.all(
    specs.map((spec) => probeImage(spec, config.basePath, options)),
  );
  const missing = details.filter((detail) => detail.required && detail.found !== true);
  return {
    ready: missing.length === 0,
    basePath: config.basePath,
    details,
    missing,
  };
}
