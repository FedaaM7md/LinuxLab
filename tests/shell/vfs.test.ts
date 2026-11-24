/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import {
  DEMO_HOME,
  VfsError,
  createSeedFileSystem,
  normalizePath,
  basename,
  dirname,
  formatMode,
} from "../../src/shell/vfs";

describe("VFS seed", () => {
  it("includes the documented demo workspace", () => {
    const vfs = createSeedFileSystem();
    expect(vfs.home).toBe(DEMO_HOME);
    expect(vfs.isDir("/home/learner/documents")).toBe(true);
    expect(vfs.readFile("/home/learner/readme.txt")).toContain("Linux Lab");
    expect(vfs.readFile("/home/learner/logs/access.log").trim().split("\n")).toHaveLength(6);
    expect(vfs.readFile("/home/learner/scripts/greet.sh")).toContain("#!/bin/sh");
    expect(formatMode(vfs.getNode("/home/learner/readme.txt"))).toBe("-rw-r--r--");
    expect(formatMode(vfs.getNode("/home/learner/scripts"))).toBe("drwx------");
  });

  it("resolves relative paths, dot segments and the home shortcut", () => {
    expect(normalizePath("documents", "/home/learner")).toBe("/home/learner/documents");
    expect(normalizePath("../projects", "/home/learner/documents")).toBe("/home/learner/projects");
    expect(normalizePath("~/logs", "/")).toBe("/home/learner/logs");
    expect(normalizePath("../../../../", "/home/learner")).toBe("/");
    expect(basename("/home/learner/readme.txt")).toBe("readme.txt");
    expect(dirname("/home/learner/readme.txt")).toBe("/home/learner");
  });
});

describe("VFS mutations", () => {
  it("creates nested directories and files", () => {
    const vfs = createSeedFileSystem();
    vfs.mkdir("/home/learner/practice", { recursive: true });
    vfs.writeFile("/home/learner/practice/a.txt", "hello\n");
    expect(vfs.readFile("/home/learner/practice/a.txt")).toBe("hello\n");
    expect(vfs.list("/home/learner/practice").map((entry) => entry.name)).toEqual(["a.txt"]);
  });

  it("copies directories recursively and moves entries", () => {
    const vfs = createSeedFileSystem();
    vfs.copy("/home/learner/documents", "/home/learner/documents-copy", { recursive: true });
    expect(vfs.readFile("/home/learner/documents-copy/notes.txt")).toContain("Linux lesson notes");
    vfs.move("/home/learner/documents-copy/notes.txt", "/home/learner/moved.txt");
    expect(vfs.exists("/home/learner/documents-copy/notes.txt")).toBe(false);
    expect(vfs.readFile("/home/learner/moved.txt")).toContain("Linux lesson notes");
  });

  it("refuses to remove a non-empty directory without recursion", () => {
    const vfs = createSeedFileSystem();
    expect(() => vfs.remove("/home/learner/documents")).toThrowError(VfsError);
    expect(vfs.isDir("/home/learner/documents")).toBe(true);
    vfs.remove("/home/learner/documents", { recursive: true });
    expect(vfs.exists("/home/learner/documents")).toBe(false);
  });

  it("enforces owner permissions", () => {
    const vfs = createSeedFileSystem();
    vfs.chmod("/home/learner/readme.txt", 0o600);
    expect(vfs.readFile("/home/learner/readme.txt")).toContain("Linux Lab");
    vfs.chmod("/home/learner/readme.txt", 0o000);
    expect(() => vfs.readFile("/home/learner/readme.txt")).toThrowError(/Permission denied/);
    expect(() => vfs.list("/home/learner/documents")).not.toThrow();
  });

  it("rejects copying a directory into itself", () => {
    const vfs = createSeedFileSystem();
    expect(() =>
      vfs.copy("/home/learner/documents", "/home/learner/documents/nested", { recursive: true }),
    ).toThrowError(/into itself/);
  });
});
