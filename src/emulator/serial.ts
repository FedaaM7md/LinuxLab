/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

/**
 * Pure helpers for talking to a real Linux guest over v86's serial port.
 * Kept free of v86/browser imports so they can be unit tested in Node.
 */

export interface SerialCommand {
  script: string;
  beginMarker: string;
  donePrefix: string;
}

export interface ExtractedOutput {
  output: string;
  exitCode: number;
}

const TOKEN_PATTERN = /^[a-f0-9]{8,32}$/;

export function buildSerialCommand(command: string, token: string): SerialCommand {
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error("Serial command tokens must be 8–32 lowercase hex characters.");
  }
  const beginMarker = `__LINUXLAB_${token}_B`;
  const donePrefix = `__LINUXLAB_${token}_D_`;
  const script = [
    `printf '%s%s_B\\n' '__LINUXLAB_' '${token}'`,
    `{ ${command} ; } 2>&1`,
    `printf '%s%s_D_%s\\n' '__LINUXLAB_' '${token}' "$?"`,
  ].join("; ");
  return { script, beginMarker, donePrefix };
}

/**
 * Extracts command output between the begin marker and the done marker.
 * Returns null while the done marker has not arrived yet.
 */
export function extractSerialOutput(buffer: string, command: SerialCommand): ExtractedOutput | null {
  const normalised = buffer.replace(/\r\n/g, "\n");
  const beginIndex = normalised.indexOf(command.beginMarker);
  if (beginIndex === -1) return null;
  const afterBegin = normalised.slice(beginIndex + command.beginMarker.length);
  const doneIndex = afterBegin.indexOf(command.donePrefix);
  if (doneIndex === -1) return null;
  const statusStart = doneIndex + command.donePrefix.length;
  const statusMatch = /^(\d+)/.exec(afterBegin.slice(statusStart));
  if (!statusMatch) return null;
  let output = afterBegin.slice(0, doneIndex);
  if (output.startsWith("\n")) output = output.slice(1);
  return {
    output,
    exitCode: Number.parseInt(statusMatch[1] ?? "0", 10),
  };
}

export function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "");
}

/** Heuristic boot detection: a shell prompt or a login prompt on the serial line. */
export function looksLikePrompt(buffer: string): boolean {
  const clean = stripAnsi(buffer).replace(/\r/g, "");
  if (/login:\s*$/i.test(clean)) return true;
  if (/password:\s*$/i.test(clean)) return true;
  return looksLikeShellPrompt(buffer);
}

/** Stricter than looksLikePrompt: a real command prompt ($ or #), not a login prompt. */
export function looksLikeShellPrompt(buffer: string): boolean {
  const clean = stripAnsi(buffer).replace(/\r/g, "");
  if (/login:\s*$/i.test(clean) || /password:\s*$/i.test(clean)) return false;
  const lastLine = clean.split("\n").filter((line) => line.trim() !== "").at(-1) ?? "";
  return /[#$]\s*$/.test(lastLine) && lastLine.length < 200;
}
