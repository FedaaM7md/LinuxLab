/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { COMMANDS } from "./commands";
import { ShellSyntaxError, parseCommandLine } from "./parser";
import { ShellError, type Shell, type ShellResult, type ShellRunOptions } from "./types";
import { DEMO_HOME, Vfs, VfsError, createSeedFileSystem } from "./vfs";

const MAX_HISTORY = 200;

export function displayCwd(cwd: string, home = DEMO_HOME): string {
  if (cwd === home) return "~";
  if (cwd.startsWith(`${home}/`)) return `~${cwd.slice(home.length)}`;
  return cwd;
}

export function formatPrompt(cwd: string, home = DEMO_HOME): string {
  const short = displayCwd(cwd, home);
  return `\u001b[1;32mlearner@linuxlab\u001b[0m:\u001b[1;34m${short}\u001b[0m$ `;
}

function errorReason(error: unknown): string {
  if (error instanceof VfsError) {
    switch (error.code) {
      case "ENOENT":
        return "No such file or directory";
      case "EACCES":
        return "Permission denied";
      case "EISDIR":
        return "Is a directory";
      case "ENOTDIR":
        return "Not a directory";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

/**
 * Demo shell: executes a deliberately small but coherent Linux-like command set
 * against an in-memory filesystem. Labelled as a simulation throughout the UI.
 */
export class SimulatedShell implements Shell {
  readonly kind = "simulated" as const;
  private vfs: Vfs;
  private cwd: string;
  private disposed = false;
  private history: string[] = [];

  constructor(options: { vfs?: Vfs } = {}) {
    this.vfs = options.vfs ?? createSeedFileSystem();
    this.cwd = this.vfs.home;
  }

  getCwd(): string {
    return this.cwd;
  }

  getPrompt(): string {
    return formatPrompt(this.cwd, this.vfs.home);
  }

  getHistory(): readonly string[] {
    return this.history;
  }

  async run(command: string, _options: ShellRunOptions = {}): Promise<ShellResult> {
    const started = Date.now();
    if (this.disposed) {
      throw new ShellError("disposed", "The simulated shell has been disposed.");
    }

    const trimmed = command.trim();
    if (trimmed !== "") {
      this.history.push(trimmed);
      if (this.history.length > MAX_HISTORY) this.history.shift();
    }

    let parsed;
    try {
      parsed = parseCommandLine(command);
    } catch (error) {
      const message = error instanceof ShellSyntaxError ? error.message : "syntax error";
      return this.result("", `linuxlab-sh: ${message}\n`, 2, started);
    }

    if (parsed.empty) return this.result("", "", 0, started);

    let input = "";
    let stderr = "";
    let exitCode = 0;

    for (let index = 0; index < parsed.segments.length; index += 1) {
      const segment = parsed.segments[index];
      if (!segment) continue;

      if (segment.inputFile !== undefined) {
        try {
          input = this.vfs.readFile(this.vfs.resolve(segment.inputFile, this.cwd));
        } catch (error) {
          stderr += `linuxlab-sh: ${segment.inputFile}: ${errorReason(error)}\n`;
          exitCode = 1;
          break;
        }
      }

      const [name = "", ...args] = segment.argv;
      let stdout = "";
      let commandCode = 0;

      const handler = COMMANDS[name];
      if (!handler) {
        stderr += `linuxlab-sh: ${name}: command not found\n`;
        commandCode = 127;
      } else {
        try {
          const outcome = handler(args, { vfs: this.vfs, cwd: this.cwd, input });
          stdout = outcome.stdout;
          stderr += outcome.stderr;
          commandCode = outcome.code;
          if (outcome.cwd !== undefined) this.cwd = outcome.cwd;
        } catch (error) {
          stderr += `linuxlab-sh: ${name}: ${errorReason(error)}\n`;
          commandCode = 1;
        }
      }

      if (segment.outputFile) {
        try {
          this.vfs.writeFile(
            this.vfs.resolve(segment.outputFile.path, this.cwd),
            stdout,
            { append: segment.outputFile.append },
          );
          stdout = "";
        } catch (error) {
          stderr += `linuxlab-sh: ${segment.outputFile.path}: ${errorReason(error)}\n`;
          commandCode = 1;
          stdout = "";
        }
      }

      input = stdout;
      exitCode = commandCode;
    }

    return this.result(input, stderr, exitCode, started);
  }

  async reset(): Promise<void> {
    if (this.disposed) throw new ShellError("disposed", "The simulated shell has been disposed.");
    this.vfs = createSeedFileSystem();
    this.cwd = this.vfs.home;
    this.history = [];
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.history = [];
  }

  private result(stdout: string, stderr: string, exitCode: number, started: number): ShellResult {
    return {
      stdout,
      stderr,
      exitCode,
      cwd: this.cwd,
      durationMs: Date.now() - started,
    };
  }
}
