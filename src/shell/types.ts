/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

/**
 * Contract shared by both shell backends:
 *  - SimulatedShell (virtual filesystem, always available)
 *  - V86Shell (real Linux guest behind the v86 serial console)
 *
 * The lesson grader only relies on `run()` with read-only commands, so the same
 * lesson checks work in both modes.
 */
export type ShellKind = "simulated" | "v86";

export interface ShellResult {
  /** Standard output, without the prompt. */
  stdout: string;
  /** Standard error, without the prompt. */
  stderr: string;
  exitCode: number;
  /** Working directory reported by the shell after the command. */
  cwd: string;
  durationMs: number;
}

export interface ShellRunOptions {
  timeoutMs?: number;
}

export interface Shell {
  readonly kind: ShellKind;
  /** Execute one command line. User mistakes resolve with an exit code; they do not throw. */
  run(command: string, options?: ShellRunOptions): Promise<ShellResult>;
  /** Current working directory. Never empty. */
  getCwd(): string;
  /** Reset the shell state (reseeds the demo filesystem; reboots the VM when applicable). */
  reset(): Promise<void>;
  /** Release resources. */
  dispose(): Promise<void>;
}

export type ShellErrorCode = "not-ready" | "timeout" | "disposed" | "unsupported";

export class ShellError extends Error {
  readonly code: ShellErrorCode;

  constructor(code: ShellErrorCode, message: string) {
    super(message);
    this.name = "ShellError";
    this.code = code;
  }
}

export function isShellError(value: unknown): value is ShellError {
  return value instanceof ShellError;
}
