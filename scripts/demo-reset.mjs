/*
 * demo:reset — schedule a demo dataset reset for every visitor.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * Writes public/demo-reset.json (and dist/demo-reset.json when a production
 * build exists) with a fresh timestamp. Each browser clears its local progress
 * the next time it loads the app. No server or account is involved.
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = {
  resetAt: new Date().toISOString(),
  note: "Linux Lab demo reset manifest",
};
const payload = `${JSON.stringify(manifest, null, 2)}\n`;

async function writeManifest(relativePath) {
  const target = join(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, payload, "utf8");
  console.log(`demo:reset wrote ${relativePath}`);
}

await writeManifest(join("public", "demo-reset.json"));

try {
  const dist = await stat(join(root, "dist"));
  if (dist.isDirectory()) {
    await writeManifest(join("dist", "demo-reset.json"));
  }
} catch {
  // No production build yet; the next `npm run build` copies the public file.
}

console.log(`demo:reset scheduled at ${manifest.resetAt}`);
