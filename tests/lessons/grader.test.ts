/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import { LESSONS, getLesson, totalStepCount } from "../../src/lessons/lessons";
import { gradeStep, inspectReadOnly, evaluateExpectation, normalizeOutput } from "../../src/lessons/grader";
import { SimulatedShell } from "../../src/shell/simulatedShell";

const SOLUTIONS: Record<string, string[]> = {
  "navigation:where-am-i": [],
  "navigation:enter-documents": ["cd documents"],
  "navigation:back-home": ["cd .."],
  "navigation:enter-projects": ["cd projects"],

  "files:make-practice": ["mkdir ~/practice"],
  "files:create-empty": ["touch ~/practice/empty.txt"],
  "files:copy-readme": ["cp ~/readme.txt ~/practice/welcome.txt"],
  "files:rename-file": ["mv ~/practice/welcome.txt ~/practice/notes.md"],
  "files:remove-empty": ["rm ~/practice/empty.txt"],
  "files:read-result": [],

  "permissions:inspect-script": [],
  "permissions:make-executable": ["chmod +x ~/scripts/greet.sh"],
  "permissions:private-readme": ["chmod 600 ~/readme.txt"],
  "permissions:open-scripts-dir": ["chmod 755 ~/scripts"],

  "text:grep-ok": ["grep 200 ~/logs/access.log > ~/reports/ok.txt"],
  "text:pipe-count": ["grep 200 ~/logs/access.log | wc -l > ~/reports/count.txt"],
  "text:grep-blocked": ["grep 403 ~/logs/access.log > ~/reports/blocked.txt"],
  "text:grep-insensitive": ["grep -i login ~/logs/access.log | wc -l > ~/reports/logins.txt"],
  "text:wc-total": ["wc -l ~/logs/access.log > ~/reports/total.txt"],
};

describe("lesson content", () => {
  it("ships four lessons with unique lesson and step ids", () => {
    expect(LESSONS).toHaveLength(4);
    expect(totalStepCount()).toBe(19);
    const lessonIds = new Set(LESSONS.map((lesson) => lesson.id));
    expect(lessonIds.size).toBe(4);
    const stepIds = new Set<string>();
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        const key = `${lesson.id}:${step.id}`;
        expect(stepIds.has(key)).toBe(false);
        stepIds.add(key);
      }
    }
    expect(stepIds.size).toBe(19);
  });

  it("has bilingual, non-empty content and at least one check per step", () => {
    for (const lesson of LESSONS) {
      for (const value of [lesson.title, lesson.subtitle, lesson.goal]) {
        expect(value.ar.trim()).not.toBe("");
        expect(value.en.trim()).not.toBe("");
      }
      for (const step of lesson.steps) {
        expect(step.title.ar.trim()).not.toBe("");
        expect(step.title.en.trim()).not.toBe("");
        expect(step.instruction.ar.trim()).not.toBe("");
        expect(step.instruction.en.trim()).not.toBe("");
        expect(step.hint.ar.trim()).not.toBe("");
        expect(step.hint.en.trim()).not.toBe("");
        expect(step.checks.length).toBeGreaterThan(0);
      }
    }
  });

  it("only uses read-only check commands", () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        for (const check of step.checks) {
          const result = inspectReadOnly(check.command);
          expect(result.readOnly, `${lesson.id}/${step.id}: ${result.reason ?? ""}`).toBe(true);
        }
      }
    }
  });

  it("has a solution path for every graded check", () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        expect(SOLUTIONS[`${lesson.id}:${step.id}`]).toBeDefined();
      }
    }
  });
});

describe("grader with lesson fixtures", () => {
  for (const lesson of LESSONS) {
    it(`grades "${lesson.id}" step by step against the simulated shell`, async () => {
      const shell = new SimulatedShell();
      for (const step of lesson.steps) {
        const before = await gradeStep(shell, step);
        const solution = SOLUTIONS[`${lesson.id}:${step.id}`] ?? [];
        if (solution.length === 0) {
          expect(before.passed, `step ${step.id} should already be satisfied`).toBe(true);
        } else {
          expect(before.passed, `step ${step.id} should fail before its solution`).toBe(false);
        }
        for (const command of solution) {
          const result = await shell.run(command);
          expect(result.exitCode, `command failed: ${command} (${result.stderr})`).toBe(0);
        }
        const after = await gradeStep(shell, step);
        expect(
          after.passed,
          `step ${step.id} did not pass; checks: ${JSON.stringify(
            after.checks.map((check) => ({
              command: check.check.command,
              passed: check.passed,
              output: check.output,
            })),
          )}`,
        ).toBe(true);
        for (const check of after.checks) {
          expect(check.check.command).not.toMatch(/^\s*(cd|mkdir|touch|rm|mv|cp|chmod)\b/);
        }
      }
    });
  }

  it("grades workspace lessons from a non-home working directory", async () => {
    for (const lessonId of ["files", "permissions", "text"] as const) {
      const lesson = getLesson(lessonId);
      const shell = new SimulatedShell();
      expect((await shell.run("cd projects")).exitCode).toBe(0);
      for (const step of lesson.steps) {
        for (const command of SOLUTIONS[`${lesson.id}:${step.id}`] ?? []) {
          const result = await shell.run(command);
          expect(result.exitCode, `${lesson.id}: ${command}`).toBe(0);
        }
        const grade = await gradeStep(shell, step);
        expect(grade.passed, `${lesson.id}/${step.id}`).toBe(true);
      }
    }
  });

  it("does not mutate state while grading", async () => {
    const shell = new SimulatedShell();
    const before = shell.getCwd();
    await gradeStep(shell, getLesson("navigation").steps[1]!);
    expect(shell.getCwd()).toBe(before);
    expect((await shell.run("ls")).stdout).not.toContain("practice");
  });

  it("reports individual failing checks", async () => {
    const shell = new SimulatedShell();
    const step = getLesson("files").steps[0]!;
    const grade = await gradeStep(shell, step);
    expect(grade.passed).toBe(false);
    expect(grade.checks).toHaveLength(1);
    expect(grade.checks[0]?.passed).toBe(false);
    expect(grade.error).toBeUndefined();
  });

  it("rejects unsafe check commands without running them", async () => {
    const shell = new SimulatedShell();
    const grade = await gradeStep(shell, {
      id: "unsafe",
      title: { ar: "خطر", en: "Unsafe" },
      instruction: { ar: "لا", en: "No" },
      hint: { ar: "لا", en: "No" },
      checks: [
        {
          command: "rm readme.txt",
          expect: { kind: "exitCode", code: 0 },
          label: { ar: "خطر", en: "Unsafe" },
        },
      ],
    });
    expect(grade.passed).toBe(false);
    expect(grade.error).toContain("Unsafe check command");
    expect((await shell.run("cat readme.txt")).exitCode).toBe(0);
  });

  it("surfaces shell failures as a grade error", async () => {
    const shell = new SimulatedShell();
    await shell.dispose();
    const grade = await gradeStep(shell, getLesson("navigation").steps[0]!);
    expect(grade.passed).toBe(false);
    expect(grade.error).toContain("disposed");
  });
});

describe("expectation evaluation", () => {
  it("compares, contains, matches and counts", () => {
    expect(evaluateExpectation("/home/learner\n", 0, { kind: "equals", value: "/home/learner" })).toBe(true);
    expect(evaluateExpectation("Hello\n", 0, { kind: "contains", value: "hello", ignoreCase: true })).toBe(true);
    expect(evaluateExpectation("Hello\n", 0, { kind: "notContains", value: "world" })).toBe(true);
    expect(evaluateExpectation("abc\n", 0, { kind: "matches", pattern: "^abc$" })).toBe(true);
    expect(evaluateExpectation("a\nb\n", 0, { kind: "lineCount", count: 2 })).toBe(true);
    expect(evaluateExpectation("", 1, { kind: "exitCode", code: 1 })).toBe(true);
    expect(evaluateExpectation("", 0, { kind: "lineCount", count: 0 })).toBe(true);
  });

  it("normalises ANSI sequences and CRLF", () => {
    expect(normalizeOutput("\u001b[32mok\u001b[0m\r\n")).toBe("ok");
  });

  it("rejects unsafe check commands", () => {
    expect(inspectReadOnly("pwd").readOnly).toBe(true);
    expect(inspectReadOnly("cat ~/readme.txt").readOnly).toBe(true);
    expect(inspectReadOnly("rm readme.txt").readOnly).toBe(false);
    expect(inspectReadOnly("pwd > leak.txt").readOnly).toBe(false);
    expect(inspectReadOnly("cd /tmp").readOnly).toBe(false);
    expect(inspectReadOnly("ls | wc -l").readOnly).toBe(true);
  });
});
