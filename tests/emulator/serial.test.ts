/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import {
  buildSerialCommand,
  extractSerialOutput,
  looksLikePrompt,
  looksLikeShellPrompt,
  stripAnsi,
} from "../../src/emulator/serial";

describe("serial command framing", () => {
  it("builds markers from split literals so the echoed script cannot match", () => {
    const command = buildSerialCommand("grep 200 logs/access.log", "abcdef123456");
    expect(command.beginMarker).toBe("__LINUXLAB_abcdef123456_B");
    expect(command.donePrefix).toBe("__LINUXLAB_abcdef123456_D_");
    expect(command.script).toContain("grep 200 logs/access.log");
    expect(command.script).toContain("2>&1");
    expect(command.script).not.toContain(command.beginMarker);
    expect(command.script).not.toContain(command.donePrefix);
  });

  it("rejects unsafe tokens", () => {
    expect(() => buildSerialCommand("pwd", "UPPER")).toThrowError(/token/i);
    expect(() => buildSerialCommand("pwd", "abc")).toThrowError(/token/i);
  });

  it("extracts stdout and the exit status", () => {
    const command = buildSerialCommand("pwd", "aaaaaaaaaaaa");
    const buffer = [
      "root@lab:~# printf '%s%s_B\\n' '__LINUXLAB_' 'aaaaaaaaaaaa'; { pwd ; } 2>&1; printf ...",
      command.beginMarker,
      "/home/learner",
      `${command.donePrefix}0`,
      "root@lab:~# ",
    ].join("\r\n");
    expect(extractSerialOutput(buffer, command)).toEqual({
      output: "/home/learner\n",
      exitCode: 0,
    });
  });

  it("returns null until the done marker arrives", () => {
    const command = buildSerialCommand("pwd", "bbbbbbbbbbbb");
    expect(extractSerialOutput(`noise\n${command.beginMarker}\n/home`, command)).toBeNull();
    expect(extractSerialOutput("noise without markers", command)).toBeNull();
  });

  it("parses non-zero exit codes", () => {
    const command = buildSerialCommand("false", "cccccccccccc");
    const buffer = `${command.beginMarker}\n${command.donePrefix}127\n`;
    expect(extractSerialOutput(buffer, command)?.exitCode).toBe(127);
  });
});

describe("terminal helpers", () => {
  it("strips ANSI colour codes", () => {
    expect(stripAnsi("\u001b[1;32mroot@lab\u001b[0m:~#")).toBe("root@lab:~#");
  });

  it("detects shell and login prompts", () => {
    expect(looksLikePrompt("Welcome\nroot@lab:~# ")).toBe(true);
    expect(looksLikePrompt("learner@lab:~$ ")).toBe(true);
    expect(looksLikePrompt("Debian GNU/Linux\nlab login: ")).toBe(true);
    expect(looksLikePrompt("Booting kernel...\n[  OK  ] Started")).toBe(false);
  });

  it("distinguishes a shell prompt from a login prompt", () => {
    expect(looksLikeShellPrompt("Welcome\nroot@lab:~# ")).toBe(true);
    expect(looksLikeShellPrompt("~ # ")).toBe(true);
    expect(looksLikeShellPrompt("Debian GNU/Linux\nlab login: ")).toBe(false);
    expect(looksLikeShellPrompt("Password: ")).toBe(false);
    expect(looksLikeShellPrompt("root\nPassword: \nroot@lab:~# ")).toBe(true);
  });
});
