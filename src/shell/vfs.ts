/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

/**
 * A small, deliberately limited virtual filesystem for the demo shell.
 *
 * Everything is owned by the single demo user `learner`, so permission checks
 * focus on the owner bits. This is a teaching model, not a POSIX implementation.
 */

export const DEMO_USER = "learner";
export const DEMO_GROUP = "learner";
export const DEMO_HOME = "/home/learner";

export type VfsErrorCode =
  | "ENOENT"
  | "EEXIST"
  | "ENOTDIR"
  | "EISDIR"
  | "ENOTEMPTY"
  | "EACCES"
  | "EINVAL";

export class VfsError extends Error {
  readonly code: VfsErrorCode;

  constructor(code: VfsErrorCode, message: string) {
    super(message);
    this.name = "VfsError";
    this.code = code;
  }
}

export interface VfsFile {
  kind: "file";
  mode: number;
  content: string;
  mtime: number;
}

export interface VfsDir {
  kind: "dir";
  mode: number;
  children: Map<string, VfsNode>;
  mtime: number;
}

export type VfsNode = VfsFile | VfsDir;

export interface VfsEntry {
  name: string;
  node: VfsNode;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function file(mode: number, content: string, mtime: number): VfsFile {
  return { kind: "file", mode, content, mtime };
}

function dirWith(entries: Record<string, VfsNode>, mode: number, mtime: number): VfsDir {
  return { kind: "dir", mode, children: new Map(Object.entries(entries)), mtime };
}

/** Fixed timestamp keeps `ls -l` output stable in screenshots and tests. */
const SEED_TIME = Date.UTC(2026, 0, 15, 9, 30, 0);

/**
 * The demo workspace. File contents are explicitly demo material.
 */
export function createSeedFileSystem(): Vfs {
  const accessLog = [
    "GET /index.html 200",
    "GET /about.html 200",
    "POST /login 403",
    "GET /pricing.html 200",
    "POST /login 200",
    "GET /missing.html 404",
    "",
  ].join("\n");

  const notes = [
    "Linux lesson notes",
    "==================",
    "pwd prints the working directory.",
    "ls lists files and directories.",
    "cd changes the working directory.",
    "",
  ].join("\n");

  const readme = [
    "Linux Lab",
    "A safe place to practise Linux commands.",
    "This workspace is a demo, not a real system.",
    "",
  ].join("\n");

  const learner = dirWith(
    {
      documents: dirWith(
        {
          "notes.txt": file(0o644, notes, SEED_TIME),
          "todo.txt": file(0o644, "Practice pwd\nPractice ls\nPractice cd\n", SEED_TIME),
        },
        0o755,
        SEED_TIME,
      ),
      projects: dirWith(
        {
          "hello.txt": file(0o644, "Hello, learner!\n", SEED_TIME),
        },
        0o755,
        SEED_TIME,
      ),
      scripts: dirWith(
        {
          "greet.sh": file(
            0o644,
            '#!/bin/sh\necho "Hello from Linux Lab"\n',
            SEED_TIME,
          ),
        },
        0o700,
        SEED_TIME,
      ),
      logs: dirWith(
        {
          "access.log": file(0o644, accessLog, SEED_TIME),
        },
        0o755,
        SEED_TIME,
      ),
      reports: dirWith({}, 0o755, SEED_TIME),
      "readme.txt": file(0o644, readme, SEED_TIME),
      ".profile": file(
        0o644,
        "# Demo profile for the simulated shell\nexport LAB_MODE=demo\n",
        SEED_TIME,
      ),
    },
    0o755,
    SEED_TIME,
  );

  const home = dirWith({ learner }, 0o755, SEED_TIME);
  const root = dirWith(
    {
      home,
      tmp: dirWith({}, 0o1777, SEED_TIME),
    },
    0o755,
    SEED_TIME,
  );

  return new Vfs(root, DEMO_HOME);
}

export function formatMode(node: VfsNode): string {
  const type = node.kind === "dir" ? "d" : "-";
  const bits: Array<[number, string]> = [
    [0o400, "r"],
    [0o200, "w"],
    [0o100, "x"],
    [0o040, "r"],
    [0o020, "w"],
    [0o010, "x"],
    [0o004, "r"],
    [0o002, "w"],
    [0o001, "x"],
  ];
  let out = type;
  for (const [bit, char] of bits) {
    out += node.mode & bit ? char : "-";
  }
  return out;
}

export function formatLsDate(ms: number, now = Date.now()): string {
  const date = new Date(ms);
  const sixMonths = 182 * 24 * 60 * 60 * 1000;
  const day = String(date.getUTCDate()).padStart(2, " ");
  const clock = `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;
  const month = MONTHS[date.getUTCMonth()] ?? "Jan";
  if (Math.abs(now - ms) > sixMonths) {
    return `${month} ${day}  ${date.getUTCFullYear()}`;
  }
  return `${month} ${day} ${clock}`;
}

export function utf8Size(content: string): number {
  return new TextEncoder().encode(content).length;
}

export function normalizePath(input: string, cwd: string, home = DEMO_HOME): string {
  let raw = input;
  if (raw === "~") raw = home;
  else if (raw.startsWith("~/")) raw = `${home}/${raw.slice(2)}`;
  if (!raw.startsWith("/")) raw = `${cwd.replace(/\/+$/, "")}/${raw}`;
  const parts = raw.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `/${stack.join("/")}`;
}

export function basename(path: string): string {
  if (path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "");
  const index = trimmed.lastIndexOf("/");
  return index === -1 ? trimmed : trimmed.slice(index + 1);
}

export function dirname(path: string): string {
  if (path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "");
  const index = trimmed.lastIndexOf("/");
  if (index <= 0) return "/";
  return trimmed.slice(0, index);
}

function hasOwnerPermission(node: VfsNode, permission: "r" | "w" | "x"): boolean {
  const bit = permission === "r" ? 0o400 : permission === "w" ? 0o200 : 0o100;
  return (node.mode & bit) !== 0;
}

export class Vfs {
  readonly home: string;
  private root: VfsDir;

  constructor(root: VfsDir, home = DEMO_HOME) {
    this.root = root;
    this.home = home;
  }

  resolve(input: string, cwd: string): string {
    return normalizePath(input, cwd, this.home);
  }

  parentOf(path: string): { parent: VfsDir; name: string } {
    const name = basename(path);
    const parentPath = dirname(path);
    const parentNode = this.getNode(parentPath);
    if (parentNode.kind !== "dir") {
      throw new VfsError("ENOTDIR", `${parentPath}: Not a directory`);
    }
    return { parent: parentNode, name };
  }

  getNode(path: string): VfsNode {
    if (path === "/") return this.root;
    const parts = path.split("/").filter(Boolean);
    let current: VfsNode = this.root;
    for (const part of parts) {
      if (current.kind !== "dir") {
        throw new VfsError("ENOTDIR", `${path}: Not a directory`);
      }
      const next = current.children.get(part);
      if (!next) {
        throw new VfsError("ENOENT", `${path}: No such file or directory`);
      }
      current = next;
    }
    return current;
  }

  exists(path: string): boolean {
    try {
      this.getNode(path);
      return true;
    } catch {
      return false;
    }
  }

  isDir(path: string): boolean {
    try {
      return this.getNode(path).kind === "dir";
    } catch {
      return false;
    }
  }

  list(path: string): VfsEntry[] {
    const node = this.getNode(path);
    if (node.kind !== "dir") {
      throw new VfsError("ENOTDIR", `${path}: Not a directory`);
    }
    if (!hasOwnerPermission(node, "r") || !hasOwnerPermission(node, "x")) {
      throw new VfsError("EACCES", `${path}: Permission denied`);
    }
    return [...node.children.entries()]
      .map(([name, child]) => ({ name, node: child }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  readFile(path: string): string {
    const node = this.getNode(path);
    if (node.kind === "dir") {
      throw new VfsError("EISDIR", `${path}: Is a directory`);
    }
    if (!hasOwnerPermission(node, "r")) {
      throw new VfsError("EACCES", `${path}: Permission denied`);
    }
    return node.content;
  }

  /** Create or overwrite a regular file. Parent must exist and be writable. */
  writeFile(path: string, content: string, options: { append?: boolean } = {}): void {
    const existing = this.tryGetNode(path);
    if (existing) {
      if (existing.kind === "dir") {
        throw new VfsError("EISDIR", `${path}: Is a directory`);
      }
      if (!hasOwnerPermission(existing, "w")) {
        throw new VfsError("EACCES", `${path}: Permission denied`);
      }
      existing.content = options.append ? existing.content + content : content;
      existing.mtime = Date.now();
      return;
    }
    const { parent, name } = this.parentOf(path);
    this.assertWritableDir(parent, path);
    if (name === "" || name === "/") {
      throw new VfsError("EINVAL", `${path}: Invalid file name`);
    }
    parent.children.set(name, {
      kind: "file",
      mode: 0o644,
      content,
      mtime: Date.now(),
    });
  }

  touch(path: string): void {
    const existing = this.tryGetNode(path);
    if (existing) {
      if (!hasOwnerPermission(existing, "w")) {
        throw new VfsError("EACCES", `${path}: Permission denied`);
      }
      existing.mtime = Date.now();
      return;
    }
    const { parent, name } = this.parentOf(path);
    this.assertWritableDir(parent, path);
    parent.children.set(name, { kind: "file", mode: 0o644, content: "", mtime: Date.now() });
  }

  mkdir(path: string, options: { recursive?: boolean } = {}): void {
    if (path === "/") return;
    const existing = this.tryGetNode(path);
    if (existing) {
      if (options.recursive && existing.kind === "dir") return;
      throw new VfsError("EEXIST", `${path}: File exists`);
    }
    if (options.recursive) {
      let current = "/";
      for (const part of path.split("/").filter(Boolean)) {
        const next = current === "/" ? `/${part}` : `${current}/${part}`;
        const node = this.tryGetNode(next);
        if (!node) {
          const { parent } = this.parentOf(next);
          this.assertWritableDir(parent, next);
          parent.children.set(part, { kind: "dir", mode: 0o755, children: new Map(), mtime: Date.now() });
        } else if (node.kind !== "dir") {
          throw new VfsError("ENOTDIR", `${next}: Not a directory`);
        }
        current = next;
      }
      return;
    }
    const { parent, name } = this.parentOf(path);
    this.assertWritableDir(parent, path);
    parent.children.set(name, { kind: "dir", mode: 0o755, children: new Map(), mtime: Date.now() });
  }

  remove(path: string, options: { recursive?: boolean } = {}): void {
    if (path === "/") {
      throw new VfsError("EINVAL", `${path}: Cannot remove root`);
    }
    const node = this.getNode(path);
    if (node.kind === "dir" && node.children.size > 0 && !options.recursive) {
      throw new VfsError("ENOTEMPTY", `${path}: Directory not empty`);
    }
    const { parent, name } = this.parentOf(path);
    this.assertWritableDir(parent, path);
    parent.children.delete(name);
  }

  chmod(path: string, mode: number, options: { recursive?: boolean } = {}): void {
    const node = this.getNode(path);
    node.mode = mode & 0o777;
    if (options.recursive && node.kind === "dir") {
      for (const child of node.children.values()) {
        this.applyModeRecursive(child, mode);
      }
    }
  }

  copy(sourcePath: string, targetPath: string, options: { recursive?: boolean } = {}): void {
    if (sourcePath === targetPath) {
      throw new VfsError("EINVAL", `${sourcePath} and ${targetPath} are the same file`);
    }
    const source = this.getNode(sourcePath);
    if (source.kind === "dir" && !options.recursive) {
      throw new VfsError("EISDIR", `${sourcePath}: Is a directory`);
    }
    if (source.kind === "dir" && targetPath.startsWith(`${sourcePath}/`)) {
      throw new VfsError("EINVAL", `cannot copy a directory into itself: ${targetPath}`);
    }
    if (source.kind === "file" && !hasOwnerPermission(source, "r")) {
      throw new VfsError("EACCES", `${sourcePath}: Permission denied`);
    }
    const target = this.tryGetNode(targetPath);
    if (target) {
      if (source.kind === "file" && target.kind === "dir") {
        throw new VfsError("EISDIR", `${targetPath}: Is a directory`);
      }
      if (source.kind === "dir" && target.kind === "file") {
        throw new VfsError("EEXIST", `${targetPath}: File exists`);
      }
      if (source.kind === "dir" && target.kind === "dir") {
        for (const [name, child] of source.children) {
          const childTarget = `${targetPath}/${name}`;
          if (target.children.has(name)) {
            if (child.kind === "dir" && target.children.get(name)?.kind === "dir") {
              this.copy(`${sourcePath}/${name}`, childTarget, { recursive: true });
            } else {
              target.children.delete(name);
              target.children.set(name, this.cloneNode(child));
            }
          } else {
            target.children.set(name, this.cloneNode(child));
          }
        }
        return;
      }
      if (!hasOwnerPermission(target, "w")) {
        throw new VfsError("EACCES", `${targetPath}: Permission denied`);
      }
      target.mode = source.mode;
      target.mtime = Date.now();
      if (target.kind === "file") {
        target.content = source.kind === "file" ? source.content : "";
      }
      return;
    }
    const { parent, name } = this.parentOf(targetPath);
    this.assertWritableDir(parent, targetPath);
    parent.children.set(name, this.cloneNode(source));
  }

  move(sourcePath: string, targetPath: string): void {
    if (sourcePath === "/") {
      throw new VfsError("EINVAL", "cannot move root");
    }
    if (sourcePath === targetPath) {
      throw new VfsError("EINVAL", `${sourcePath} and ${targetPath} are the same file`);
    }
    const source = this.getNode(sourcePath);
    if (source.kind === "dir" && targetPath.startsWith(`${sourcePath}/`)) {
      throw new VfsError("EINVAL", `cannot move '${sourcePath}' into itself`);
    }
    const target = this.tryGetNode(targetPath);
    if (target) {
      if (target.kind === "file") {
        const { parent } = this.parentOf(targetPath);
        this.assertWritableDir(parent, targetPath);
      } else if (target.kind === "dir") {
        if (source.kind === "file") {
          // Caller normally resolves directory targets first; be forgiving.
          const nested = `${targetPath}/${basename(sourcePath)}`;
          this.move(sourcePath, nested);
          return;
        }
        if (target.children.size > 0) {
          throw new VfsError("ENOTEMPTY", `${targetPath}: Directory not empty`);
        }
      }
    }
    const { parent: sourceParent, name: sourceName } = this.parentOf(sourcePath);
    this.assertWritableDir(sourceParent, sourcePath);
    const { parent: targetParent, name: targetName } = this.parentOf(targetPath);
    this.assertWritableDir(targetParent, targetPath);
    if (target) targetParent.children.delete(targetName);
    sourceParent.children.delete(sourceName);
    targetParent.children.set(targetName, source);
  }

  tryGetNode(path: string): VfsNode | null {
    try {
      return this.getNode(path);
    } catch (error) {
      if (error instanceof VfsError && error.code === "ENOENT") return null;
      throw error;
    }
  }

  private assertWritableDir(node: VfsDir, path: string): void {
    if (!hasOwnerPermission(node, "w") || !hasOwnerPermission(node, "x")) {
      throw new VfsError("EACCES", `${path}: Permission denied`);
    }
  }

  private applyModeRecursive(node: VfsNode, mode: number): void {
    node.mode = mode & 0o777;
    if (node.kind === "dir") {
      for (const child of node.children.values()) {
        this.applyModeRecursive(child, mode);
      }
    }
  }

  private cloneNode(node: VfsNode): VfsNode {
    if (node.kind === "file") {
      return { ...node };
    }
    const children = new Map<string, VfsNode>();
    for (const [name, child] of node.children) {
      children.set(name, this.cloneNode(child));
    }
    return { kind: "dir", mode: node.mode, mtime: node.mtime, children };
  }
}
