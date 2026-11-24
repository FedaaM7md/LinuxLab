/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import { ShellError, type Shell } from "../../src/shell/types";
import { SimulatedShell } from "../../src/shell/simulatedShell";

/**
 * Contract the lesson grader depends on. It is executed against the simulated
 * backend. The v86 adapter implements the same interface, but exercising it
 * automatically would require local OS images plus a real browser runtime, so
 * that path is covered manually (see TESTING.md).
 */
async function exerciseShellContract(shell: Shell): Promise<void> {
  expect(shell.kind).toBe("simulated");
  expect(shell.getCwd()).toMatch(/^\//);

  const pwd = await shell.run("pwd");
  expect(pwd.exitCode).toBe(0);
  expect(pwd.stdout.trim()).toBe(shell.getCwd());
  expect(typeof pwd.durationMs).toBe("number");

  const readme = await shell.run("cat readme.txt");
  expect(readme.exitCode).toBe(0);
  expect(readme.stdout).toContain("Linux Lab");

  const missing = await shell.run("cat no-such-file");
  expect(missing.exitCode).not.toBe(0);
  expect(missing.stderr).not.toBe("");

  const unknown = await shell.run("definitely-not-a-command");
  expect(unknown.exitCode).toBe(127);
  expect(unknown.stderr).toContain("command not found");

  await shell.run("mkdir contract-dir");
  const list = await shell.run("ls");
  expect(list.stdout).toContain("contract-dir");

  await shell.reset();
  const afterReset = await shell.run("ls");
  expect(afterReset.stdout).not.toContain("contract-dir");
  expect(shell.getCwd()).toBe("/home/learner");

  await shell.dispose();
  await expect(shell.run("pwd")).rejects.toBeInstanceOf(ShellError);
}

describe("Shell interface contract", () => {
  it("is fulfilled by the simulated shell", async () => {
    const shell: Shell = new SimulatedShell();
    await exerciseShellContract(shell);
  });
});
