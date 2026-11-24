/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import { SimulatedShell } from "../../src/shell/simulatedShell";

async function run(command: string) {
  const shell = new SimulatedShell();
  return shell.run(command);
}

describe("simulated shell commands", () => {
  it("starts in the demo home directory with a prompt", async () => {
    const shell = new SimulatedShell();
    expect(shell.getCwd()).toBe("/home/learner");
    const result = await shell.run("pwd");
    expect(result.stdout).toBe("/home/learner\n");
    expect(result.exitCode).toBe(0);
    expect(shell.getPrompt()).toContain("learner@linuxlab");
  });

  it("lists directories with and without details", async () => {
    const plain = await run("ls");
    expect(plain.stdout).toContain("documents");
    expect(plain.stdout).toContain("readme.txt");
    expect(plain.stdout).not.toContain(".profile");

    const all = await run("ls -a");
    expect(all.stdout).toContain(".profile");

    const long = await run("ls -l scripts");
    expect(long.stdout).toMatch(/-rw-r--r--\s+1\s+learner\s+learner\s+\d+/);
    expect(long.stdout).toContain("greet.sh");

    const directoryLine = await run("ls -ld scripts");
    expect(directoryLine.stdout.trim()).toMatch(/^drwx------\s+/);
  });

  it("changes directory and reports failures", async () => {
    const shell = new SimulatedShell();
    expect((await shell.run("cd documents")).exitCode).toBe(0);
    expect(shell.getCwd()).toBe("/home/learner/documents");
    const missing = await shell.run("cd nowhere");
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr).toContain("No such file or directory");
    const file = await shell.run("cd notes.txt");
    expect(file.stderr).toContain("Not a directory");
  });

  it("creates, copies, moves and deletes files", async () => {
    const shell = new SimulatedShell();
    expect((await shell.run("mkdir practice")).exitCode).toBe(0);
    expect((await shell.run("touch practice/empty.txt")).exitCode).toBe(0);
    expect((await shell.run("cp readme.txt practice/welcome.txt")).exitCode).toBe(0);
    expect((await shell.run("cat practice/welcome.txt")).stdout).toContain("Linux Lab");
    expect((await shell.run("mv practice/welcome.txt practice/notes.md")).exitCode).toBe(0);
    expect((await shell.run("ls practice")).stdout).toContain("notes.md");
    expect((await shell.run("ls practice")).stdout).not.toContain("welcome.txt");
    expect((await shell.run("rm practice/empty.txt")).exitCode).toBe(0);
    expect((await shell.run("ls practice")).stdout).not.toContain("empty.txt");
    expect((await shell.run("rm -r practice")).exitCode).toBe(0);
    expect((await shell.run("ls")).stdout).not.toContain("practice");
  });

  it("refuses to remove a non-empty directory without -r", async () => {
    const shell = new SimulatedShell();
    const result = await shell.run("rm documents");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Is a directory");
    expect((await shell.run("ls documents")).stdout).toContain("notes.txt");
  });

  it("changes permissions with numeric and symbolic modes", async () => {
    const shell = new SimulatedShell();
    expect((await shell.run("chmod +x scripts/greet.sh")).exitCode).toBe(0);
    expect((await shell.run("ls -l scripts/greet.sh")).stdout).toContain("-rwxr-xr-x");
    expect((await shell.run("chmod 600 readme.txt")).exitCode).toBe(0);
    expect((await shell.run("ls -l readme.txt")).stdout).toContain("-rw-------");
    expect((await shell.run("chmod 755 scripts")).exitCode).toBe(0);
    expect((await shell.run("ls -ld scripts")).stdout).toContain("drwxr-xr-x");
    expect((await shell.run("chmod 999 readme.txt")).exitCode).toBe(1);
  });

  it("pipes grep into wc and redirects output", async () => {
    const shell = new SimulatedShell();
    const piped = await shell.run("grep 200 logs/access.log | wc -l");
    expect(piped.stdout.trim()).toBe("4");

    const count = await shell.run("grep 200 logs/access.log | wc -l > reports/count.txt");
    expect(count.stdout).toBe("");
    expect((await shell.run("cat reports/count.txt")).stdout.trim()).toBe("4");

    const blocked = await shell.run("grep 403 logs/access.log > reports/blocked.txt");
    expect(blocked.exitCode).toBe(0);
    expect((await shell.run("cat reports/blocked.txt")).stdout.trim()).toBe("POST /login 403");

    const append = await shell.run("echo done >> reports/blocked.txt");
    expect(append.exitCode).toBe(0);
    expect((await shell.run("cat reports/blocked.txt")).stdout).toContain("done");
  });

  it("returns grep's exit code and supports flags", async () => {
    const shell = new SimulatedShell();
    expect((await shell.run("grep 403 logs/access.log")).exitCode).toBe(0);
    const none = await shell.run("grep 999 logs/access.log");
    expect(none.exitCode).toBe(1);
    expect(none.stdout).toBe("");
    const insensitive = await shell.run("grep -i login logs/access.log | wc -l");
    expect(insensitive.stdout.trim()).toBe("2");
    const counted = await shell.run("grep -c 200 logs/access.log");
    expect(counted.stdout.trim()).toBe("4");
  });

  it("counts lines, words and bytes", async () => {
    const shell = new SimulatedShell();
    const result = await shell.run("wc logs/access.log");
    expect(result.stdout).toMatch(/^\s*6\s+\d+\s+\d+\s+logs\/access\.log$/m);
    const lines = await shell.run("wc -l logs/access.log");
    expect(lines.stdout.trim()).toMatch(/^\s*6\s+logs\/access\.log$/);
  });

  it("reports unknown commands and syntax errors without throwing", async () => {
    const shell = new SimulatedShell();
    const unknown = await shell.run("not-a-command");
    expect(unknown.exitCode).toBe(127);
    expect(unknown.stderr).toContain("command not found");
    const syntax = await shell.run("echo 'unterminated");
    expect(syntax.exitCode).toBe(2);
    expect(syntax.stderr).toContain("syntax");
  });

  it("handles quoted arguments and echo", async () => {
    const shell = new SimulatedShell();
    const result = await shell.run(`echo "hello   world" 'and more'`);
    expect(result.stdout).toBe("hello   world and more\n");
    const noNewline = await shell.run("echo -n hi");
    expect(noNewline.stdout).toBe("hi");
  });

  it("resets to the seeded state", async () => {
    const shell = new SimulatedShell();
    await shell.run("mkdir practice");
    await shell.run("cd practice");
    await shell.reset();
    expect(shell.getCwd()).toBe("/home/learner");
    expect((await shell.run("ls")).stdout).not.toContain("practice");
  });

  it("exposes and clears history", async () => {
    const shell = new SimulatedShell();
    await shell.run("pwd");
    await shell.run("ls");
    expect(shell.getHistory()).toEqual(["pwd", "ls"]);
    await shell.reset();
    expect(shell.getHistory()).toEqual([]);
  });
});
