/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { parseCommandLine } from "../shell/parser";
import type { Shell } from "../shell/types";
import type { Expectation, LessonCheck, LessonStep } from "./lessons";

/**
 * Commands the grader is allowed to run. They must not mutate the filesystem,
 * the working directory, or any other shell state, because checks run against
 * the learner's live session.
 */
export const READ_ONLY_COMMANDS = new Set(["pwd", "ls", "cat", "grep", "wc", "echo", "whoami", "uname"]);

export interface ReadOnlyCheck {
  readOnly: boolean;
  reason?: string;
}

export function inspectReadOnly(command: string): ReadOnlyCheck {
  let parsed;
  try {
    parsed = parseCommandLine(command);
  } catch (error) {
    return { readOnly: false, reason: error instanceof Error ? error.message : "invalid command" };
  }
  if (parsed.empty) return { readOnly: false, reason: "empty check command" };
  for (const segment of parsed.segments) {
    if (segment.outputFile) {
      return { readOnly: false, reason: "checks must not redirect output to files" };
    }
    const name = segment.argv[0];
    if (!name || !READ_ONLY_COMMANDS.has(name)) {
      return { readOnly: false, reason: `command "${name ?? ""}" is not read-only` };
    }
  }
  return { readOnly: true };
}

export interface CheckOutcome {
  check: LessonCheck;
  passed: boolean;
  /** Normalised stdout, useful for diagnostics and tests. */
  output: string;
  stderr: string;
  exitCode: number;
}

export interface StepGrade {
  passed: boolean;
  checks: CheckOutcome[];
  error?: string;
}

const ANSI_PATTERN = /\u001b\[[0-9;?]*[A-Za-z]/g;

export function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(ANSI_PATTERN, "").replace(/[ \t]+$/gm, "").trimEnd();
}

export function evaluateExpectation(
  output: string,
  exitCode: number,
  expectation: Expectation,
): boolean {
  const normalized = normalizeOutput(output);
  switch (expectation.kind) {
    case "equals":
      return normalized.trim() === expectation.value.trim();
    case "contains": {
      const haystack = expectation.ignoreCase ? normalized.toLowerCase() : normalized;
      const needle = expectation.ignoreCase ? expectation.value.toLowerCase() : expectation.value;
      return haystack.includes(needle);
    }
    case "notContains": {
      const haystack = expectation.ignoreCase ? normalized.toLowerCase() : normalized;
      const needle = expectation.ignoreCase ? expectation.value.toLowerCase() : expectation.value;
      return !haystack.includes(needle);
    }
    case "matches":
      try {
        return new RegExp(expectation.pattern, expectation.flags ?? "").test(normalized);
      } catch {
        return false;
      }
    case "lineCount":
      return (normalized === "" ? 0 : normalized.split("\n").length) === expectation.count;
    case "exitCode":
      return exitCode === expectation.code;
    default:
      return false;
  }
}

export interface GradeOptions {
  timeoutMs?: number;
}

export async function gradeStep(
  shell: Shell,
  step: LessonStep,
  options: GradeOptions = {},
): Promise<StepGrade> {
  const outcomes: CheckOutcome[] = [];
  for (const check of step.checks) {
    const readOnly = inspectReadOnly(check.command);
    if (!readOnly.readOnly) {
      return {
        passed: false,
        checks: outcomes,
        error: `Unsafe check command: ${readOnly.reason ?? "unknown reason"}`,
      };
    }

    try {
      const result = await shell.run(check.command, { timeoutMs: options.timeoutMs ?? 8000 });
      outcomes.push({
        check,
        passed: evaluateExpectation(result.stdout, result.exitCode, check.expect),
        output: normalizeOutput(result.stdout),
        stderr: result.stderr,
        exitCode: result.exitCode,
      });
    } catch (error) {
      return {
        passed: false,
        checks: outcomes,
        error: error instanceof Error ? error.message : "Unknown shell error",
      };
    }
  }

  return {
    passed: outcomes.length > 0 && outcomes.every((outcome) => outcome.passed),
    checks: outcomes,
  };
}
