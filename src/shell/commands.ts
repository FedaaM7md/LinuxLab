/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import {
  DEMO_GROUP,
  DEMO_USER,
  Vfs,
  VfsError,
  basename,
  formatLsDate,
  formatMode,
  utf8Size,
  type VfsNode,
} from "./vfs";

export interface CommandContext {
  vfs: Vfs;
  cwd: string;
  input: string;
}

export interface CommandOutcome {
  stdout: string;
  stderr: string;
  code: number;
  cwd?: string;
}

export type CommandHandler = (args: string[], context: CommandContext) => CommandOutcome;

const ok = (stdout = "", cwd?: string): CommandOutcome => ({
  stdout,
  stderr: "",
  code: 0,
  ...(cwd !== undefined ? { cwd } : {}),
});

const fail = (stderr: string, code = 1): CommandOutcome => ({
  stdout: "",
  stderr: stderr.endsWith("\n") ? stderr : `${stderr}\n`,
  code,
});

const REASONS: Record<string, string> = {
  ENOENT: "No such file or directory",
  EEXIST: "File exists",
  ENOTDIR: "Not a directory",
  EISDIR: "Is a directory",
  ENOTEMPTY: "Directory not empty",
  EACCES: "Permission denied",
  EINVAL: "Invalid argument",
};

function reason(error: unknown): string {
  if (error instanceof VfsError) return REASONS[error.code] ?? error.message;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

function joinPath(parent: string, name: string): string {
  if (parent === "/") return `/${name}`;
  return `${parent.replace(/\/+$/, "")}/${name}`;
}

interface FlagSet {
  flags: Set<string>;
  operands: string[];
}

function parseFlags(args: string[], allowed: string): FlagSet {
  const flags = new Set<string>();
  const operands: string[] = [];
  let endOfOptions = false;
  for (const arg of args) {
    if (!endOfOptions && arg === "--") {
      endOfOptions = true;
      continue;
    }
    if (!endOfOptions && arg.startsWith("-") && arg.length > 1) {
      for (const char of arg.slice(1)) {
        if (!allowed.includes(char)) {
          throw new Error(`invalid option -- '${char}'`);
        }
        flags.add(char);
      }
    } else {
      operands.push(arg);
    }
  }
  return { flags, operands };
}

function splitLines(content: string): string[] {
  if (content === "") return [];
  const lines = content.split("\n").map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function countLines(content: string): number {
  if (content === "") return 0;
  const newlines = (content.match(/\n/g) ?? []).length;
  return newlines + (content.endsWith("\n") ? 0 : 1);
}

function countWords(content: string): number {
  return content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
}

const pwd: CommandHandler = (_args, context) => ok(`${context.cwd}\n`);

const cd: CommandHandler = (args, context) => {
  if (args.length > 1) return fail("cd: too many arguments");
  const target = args[0] ?? "~";
  const path = context.vfs.resolve(target, context.cwd);
  try {
    const node = context.vfs.getNode(path);
    if (node.kind !== "dir") {
      return fail(`cd: ${target}: Not a directory`);
    }
    if ((node.mode & 0o100) === 0) {
      return fail(`cd: ${target}: Permission denied`);
    }
    return ok("", path);
  } catch (error) {
    if (error instanceof VfsError && error.code === "ENOENT") {
      return fail(`cd: ${target}: No such file or directory`);
    }
    return fail(`cd: ${target}: ${reason(error)}`);
  }
};

function lsLongLine(node: VfsNode, displayName: string): string {
  const links = node.kind === "dir" ? 2 + countSubdirectories(node) : 1;
  const size = node.kind === "dir" ? 4096 : utf8Size(node.content);
  return `${formatMode(node)} ${links} ${DEMO_USER} ${DEMO_GROUP} ${size} ${formatLsDate(
    node.mtime,
  )} ${displayName}`;
}

function countSubdirectories(node: VfsNode): number {
  if (node.kind !== "dir") return 0;
  let count = 0;
  for (const child of node.children.values()) {
    if (child.kind === "dir") count += 1;
  }
  return count;
}

const ls: CommandHandler = (args, context) => {
  let parsed: FlagSet;
  try {
    parsed = parseFlags(args, "laAd");
  } catch (error) {
    return fail(`ls: ${reason(error)}`, 2);
  }
  const all = parsed.flags.has("a") || parsed.flags.has("A");
  const long = parsed.flags.has("l");
  const dirAsFile = parsed.flags.has("d");
  const operands = parsed.operands.length > 0 ? parsed.operands : ["."];
  const multiple = operands.length > 1;

  const stdout: string[] = [];
  const errors: string[] = [];
  let exitCode = 0;

  for (const operand of operands) {
    const path = context.vfs.resolve(operand, context.cwd);
    let node: VfsNode;
    try {
      node = context.vfs.getNode(path);
    } catch {
      errors.push(`ls: cannot access '${operand}': No such file or directory`);
      exitCode = 2;
      continue;
    }

    if (node.kind === "file" || dirAsFile) {
      const display = operand === "." ? "." : operand;
      if (long) {
        stdout.push(lsLongLine(node, display));
      } else {
        stdout.push(display);
      }
      continue;
    }

    let entries;
    try {
      entries = context.vfs.list(path);
    } catch (error) {
      errors.push(`ls: cannot open directory '${operand}': ${reason(error)}`);
      exitCode = 2;
      continue;
    }

    if (multiple) stdout.push(`${operand}:`);
    const visible: Array<{ name: string; node: VfsNode }> = [];
    if (all) {
      if (!parsed.flags.has("A")) {
        visible.push({ name: ".", node });
      }
      const parentPath = path === "/" ? "/" : path.slice(0, path.lastIndexOf("/")) || "/";
      const parent = context.vfs.tryGetNode(parentPath) ?? node;
      visible.push({ name: "..", node: parent });
    }
    const skipDot = !parsed.flags.has("a");
    for (const entry of entries) {
      if (skipDot && entry.name.startsWith(".")) continue;
      visible.push(entry);
    }
    if (long) {
      for (const entry of visible) {
        stdout.push(lsLongLine(entry.node, entry.name));
      }
    } else {
      stdout.push(visible.map((entry) => entry.name).join("  "));
    }
    if (multiple) stdout.push("");
  }

  const stdoutText = stdout.length > 0 ? `${stdout.join("\n")}\n` : "";
  let stderrText = errors.join("\n");
  if (stderrText) stderrText += "\n";
  return { stdout: stdoutText, stderr: stderrText, code: exitCode };
};

const mkdir: CommandHandler = (args, context) => {
  let parsed: FlagSet;
  try {
    parsed = parseFlags(args, "p");
  } catch (error) {
    return fail(`mkdir: ${reason(error)}`, 2);
  }
  if (parsed.operands.length === 0) return fail("mkdir: missing operand");
  const errors: string[] = [];
  let code = 0;
  for (const operand of parsed.operands) {
    const path = context.vfs.resolve(operand, context.cwd);
    try {
      context.vfs.mkdir(path, { recursive: parsed.flags.has("p") });
    } catch (error) {
      errors.push(`mkdir: cannot create directory '${operand}': ${reason(error)}`);
      code = 1;
    }
  }
  return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
};

const touch: CommandHandler = (args, context) => {
  const operands = args.filter((arg) => arg !== "--");
  if (operands.length === 0) return fail("touch: missing file operand");
  const errors: string[] = [];
  let code = 0;
  for (const operand of operands) {
    try {
      context.vfs.touch(context.vfs.resolve(operand, context.cwd));
    } catch (error) {
      errors.push(`touch: cannot touch '${operand}': ${reason(error)}`);
      code = 1;
    }
  }
  return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
};

const cat: CommandHandler = (args, context) => {
  const files = args.filter((arg) => arg !== "--");
  if (files.length === 0) return ok(context.input);
  let stdout = "";
  let stderr = "";
  let code = 0;
  for (const operand of files) {
    const path = context.vfs.resolve(operand, context.cwd);
    try {
      stdout += context.vfs.readFile(path);
    } catch (error) {
      stderr += `cat: ${operand}: ${reason(error)}\n`;
      code = 1;
    }
  }
  return { stdout, stderr, code };
};

function destinationFor(vfs: Vfs, source: string, target: string): string {
  const targetNode = vfs.tryGetNode(target);
  if (targetNode && targetNode.kind === "dir") {
    return joinPath(target, basename(source));
  }
  return target;
}

const cp: CommandHandler = (args, context) => {
  let parsed: FlagSet;
  try {
    parsed = parseFlags(args, "rR");
  } catch (error) {
    return fail(`cp: ${reason(error)}`, 2);
  }
  if (parsed.operands.length < 2) return fail("cp: missing destination file operand");
  const recursive = parsed.flags.has("r") || parsed.flags.has("R");
  const sources = parsed.operands.slice(0, -1);
  const destinationRaw = parsed.operands[parsed.operands.length - 1] ?? "";
  const destination = context.vfs.resolve(destinationRaw, context.cwd);
  const destinationIsDir = context.vfs.isDir(destination);
  if (sources.length > 1 && !destinationIsDir) {
    return fail(`cp: target '${destinationRaw}' is not a directory`);
  }

  const errors: string[] = [];
  let code = 0;
  for (const sourceRaw of sources) {
    const source = context.vfs.resolve(sourceRaw, context.cwd);
    try {
      if (source === destination) {
        throw new VfsError("EINVAL", "source and destination are the same file");
      }
      const target = destinationFor(context.vfs, source, destination);
      context.vfs.copy(source, target, { recursive });
    } catch (error) {
      errors.push(`cp: ${sourceRaw}: ${reason(error)}`);
      code = 1;
    }
  }
  return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
};

const mv: CommandHandler = (args, context) => {
  let parsed: FlagSet;
  try {
    parsed = parseFlags(args, "f");
  } catch (error) {
    return fail(`mv: ${reason(error)}`, 2);
  }
  if (parsed.operands.length < 2) return fail("mv: missing destination file operand");
  const sources = parsed.operands.slice(0, -1);
  const destinationRaw = parsed.operands[parsed.operands.length - 1] ?? "";
  const destination = context.vfs.resolve(destinationRaw, context.cwd);
  const destinationIsDir = context.vfs.isDir(destination);
  if (sources.length > 1 && !destinationIsDir) {
    return fail(`mv: target '${destinationRaw}' is not a directory`);
  }
  const errors: string[] = [];
  let code = 0;
  for (const sourceRaw of sources) {
    const source = context.vfs.resolve(sourceRaw, context.cwd);
    try {
      const target = destinationFor(context.vfs, source, destination);
      context.vfs.move(source, target);
    } catch (error) {
      errors.push(`mv: cannot move '${sourceRaw}': ${reason(error)}`);
      code = 1;
    }
  }
  return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
};

const rm: CommandHandler = (args, context) => {
  let parsed: FlagSet;
  try {
    parsed = parseFlags(args, "rRf");
  } catch (error) {
    return fail(`rm: ${reason(error)}`, 2);
  }
  const recursive = parsed.flags.has("r") || parsed.flags.has("R");
  const force = parsed.flags.has("f");
  if (parsed.operands.length === 0) {
    return force ? ok() : fail("rm: missing operand");
  }
  const errors: string[] = [];
  let code = 0;
  for (const operand of parsed.operands) {
    const path = context.vfs.resolve(operand, context.cwd);
    try {
      const node = context.vfs.getNode(path);
      if (node.kind === "dir" && !recursive) {
        throw new VfsError("EISDIR", `${operand}: Is a directory`);
      }
      context.vfs.remove(path, { recursive });
    } catch (error) {
      if (force && error instanceof VfsError && error.code === "ENOENT") continue;
      errors.push(`rm: cannot remove '${operand}': ${reason(error)}`);
      code = 1;
    }
  }
  return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
};

function applySymbolicMode(current: number, spec: string): number | null {
  let mode = current & 0o777;
  for (const clause of spec.split(",")) {
    const match = /^([ugoa]*)([+=-])([rwx]*)$/.exec(clause);
    if (!match) return null;
    const who = match[1] === "" ? "a" : (match[1] ?? "a");
    const operator = match[2] ?? "";
    const permissions = match[3] ?? "";
    let bits = 0;
    if (permissions.includes("r")) bits |= 0o444;
    if (permissions.includes("w")) bits |= 0o222;
    if (permissions.includes("x")) bits |= 0o111;
    const targets = new Set<string>();
    if (who.includes("a")) {
      targets.add("u");
      targets.add("g");
      targets.add("o");
    }
    if (who.includes("u")) targets.add("u");
    if (who.includes("g")) targets.add("g");
    if (who.includes("o")) targets.add("o");
    let whoMask = 0;
    for (const target of targets) {
      whoMask |= target === "u" ? 0o700 : target === "g" ? 0o070 : 0o007;
    }
    if (operator === "+") mode |= bits & whoMask;
    else if (operator === "-") mode &= ~(bits & whoMask);
    else if (operator === "=") {
      mode &= ~whoMask;
      mode |= bits & whoMask;
    }
  }
  return mode & 0o777;
}

const chmod: CommandHandler = (args, context) => {
  const operands = args.filter((arg) => arg !== "--");
  if (operands.length < 2) return fail("chmod: missing operand");
  const modeSpec = operands[0] ?? "";
  const targets = operands.slice(1);
  const errors: string[] = [];
  let numericMode: number | null = null;
  if (/^[0-7]{3,4}$/.test(modeSpec)) {
    numericMode = parseInt(modeSpec, 8) & 0o777;
  } else if (!/^[ugoa]*[+=-][rwx]*(,[ugoa]*[+=-][rwx]*)*$/.test(modeSpec)) {
    return fail(`chmod: invalid mode: '${modeSpec}'`);
  }

  for (const operand of targets) {
    const path = context.vfs.resolve(operand, context.cwd);
    try {
      const node = context.vfs.getNode(path);
      const nextMode = numericMode ?? applySymbolicMode(node.mode, modeSpec);
      if (nextMode === null) {
        errors.push(`chmod: invalid mode: '${modeSpec}'`);
        continue;
      }
      context.vfs.chmod(path, nextMode);
    } catch (error) {
      errors.push(`chmod: cannot access '${operand}': ${reason(error)}`);
    }
  }
  return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code: errors.length ? 1 : 0 };
};

const grep: CommandHandler = (args, context) => {
  let ignoreCase = false;
  let invert = false;
  let showNumbers = false;
  let countOnly = false;
  let listOnly = false;
  const operands: string[] = [];
  let endOfOptions = false;
  for (const arg of args) {
    if (!endOfOptions && arg === "--") {
      endOfOptions = true;
      continue;
    }
    if (!endOfOptions && arg.startsWith("-") && arg.length > 1) {
      for (const char of arg.slice(1)) {
        if (char === "i") ignoreCase = true;
        else if (char === "v") invert = true;
        else if (char === "n") showNumbers = true;
        else if (char === "c") countOnly = true;
        else if (char === "l") listOnly = true;
        else return fail(`grep: invalid option -- '${char}'`, 2);
      }
      continue;
    }
    operands.push(arg);
  }
  const pattern = operands.shift();
  if (pattern === undefined) return fail("grep: missing pattern", 2);
  let expression: RegExp;
  try {
    expression = new RegExp(pattern, ignoreCase ? "i" : "");
  } catch {
    return fail(`grep: invalid regular expression: '${pattern}'`, 2);
  }

  const files = operands;
  const sources: Array<{ name: string; content: string }> = [];
  const errors: string[] = [];
  if (files.length === 0) {
    sources.push({ name: "", content: context.input });
  } else {
    for (const operand of files) {
      if (operand === "-") {
        sources.push({ name: "", content: context.input });
        continue;
      }
      try {
        sources.push({
          name: operand,
          content: context.vfs.readFile(context.vfs.resolve(operand, context.cwd)),
        });
      } catch (error) {
        errors.push(`grep: ${operand}: ${reason(error)}`);
      }
    }
  }
  if (errors.length > 0) {
    return { stdout: "", stderr: `${errors.join("\n")}\n`, code: 2 };
  }

  const multiple = files.length > 1;
  let stdout = "";
  let matchedAny = false;
  for (const source of sources) {
    const lines = splitLines(source.content);
    const selected: Array<{ line: string; number: number }> = [];
    lines.forEach((line, index) => {
      const matches = expression.test(line);
      if (matches !== invert) selected.push({ line, number: index + 1 });
    });
    if (selected.length > 0) matchedAny = true;
    if (listOnly) {
      if (selected.length > 0) stdout += `${source.name || "(standard input)"}\n`;
      continue;
    }
    if (countOnly) {
      stdout += multiple && source.name ? `${source.name}:${selected.length}\n` : `${selected.length}\n`;
      continue;
    }
    for (const entry of selected) {
      const prefix = multiple && source.name ? `${source.name}:` : "";
      const numberPrefix = showNumbers ? `${entry.number}:` : "";
      stdout += `${prefix}${numberPrefix}${entry.line}\n`;
    }
  }

  return { stdout, stderr: "", code: matchedAny ? 0 : 1 };
};

const wc: CommandHandler = (args, context) => {
  let showLines = false;
  let showWords = false;
  let showChars = false;
  const operands: string[] = [];
  let endOfOptions = false;
  for (const arg of args) {
    if (!endOfOptions && arg === "--") {
      endOfOptions = true;
      continue;
    }
    if (!endOfOptions && arg.startsWith("-") && arg.length > 1) {
      for (const char of arg.slice(1)) {
        if (char === "l") showLines = true;
        else if (char === "w") showWords = true;
        else if (char === "c") showChars = true;
        else return fail(`wc: invalid option -- '${char}'`, 2);
      }
      continue;
    }
    operands.push(arg);
  }
  if (!showLines && !showWords && !showChars) {
    showLines = true;
    showWords = true;
    showChars = true;
  }

  const sources: Array<{ name: string; content: string }> = [];
  if (operands.length === 0) {
    sources.push({ name: "", content: context.input });
  } else {
    for (const operand of operands) {
      try {
        sources.push({
          name: operand,
          content: context.vfs.readFile(context.vfs.resolve(operand, context.cwd)),
        });
      } catch (error) {
        return fail(`wc: ${operand}: ${reason(error)}`);
      }
    }
  }

  const fields = (content: string): number[] => {
    const values: number[] = [];
    if (showLines) values.push(countLines(content));
    if (showWords) values.push(countWords(content));
    if (showChars) values.push(utf8Size(content));
    return values;
  };

  const format = (values: number[], name: string): string => {
    const padded = values.map((value) => String(value).padStart(7)).join(" ");
    return name ? `${padded} ${name}\n` : `${padded}\n`;
  };

  let stdout = "";
  const totals = fields("");
  for (const source of sources) {
    const values = fields(source.content);
    values.forEach((value, index) => {
      totals[index] = (totals[index] ?? 0) + value;
    });
    stdout += format(values, source.name);
  }
  if (sources.length > 1) {
    stdout += format(totals, "total");
  }
  return ok(stdout);
};

const echo: CommandHandler = (args) => {
  let newline = true;
  let start = 0;
  if (args[0] === "-n") {
    newline = false;
    start = 1;
  }
  const text = args.slice(start).join(" ");
  return ok(newline ? `${text}\n` : text);
};

const whoami: CommandHandler = () => ok(`${DEMO_USER}\n`);

const uname: CommandHandler = (args) => {
  if (args.includes("-a")) {
    return ok("Linux linuxlab 6.0.0-lab-sim #1 SMP PREEMPT x86_64 GNU/Linux\n");
  }
  return ok("Linux\n");
};

const clear: CommandHandler = () => ok("\u001b[2J\u001b[H");

const help: CommandHandler = () =>
  ok(
    [
      "Linux Lab — simulated terminal (demo)",
      "This is a teaching model with a virtual filesystem, not a real Linux kernel.",
      "",
      "Navigation   pwd, ls [-l] [-a] [-d], cd",
      "Files        mkdir [-p], touch, cp [-r], mv, rm [-r] [-f], cat",
      "Permissions  chmod MODE PATH (numeric or +x / go-w forms)",
      "Text         grep [-i] [-v] [-n] [-c] [-l], wc [-l] [-w] [-c], echo",
      "Other        whoami, uname, clear, help",
      "",
      "Also supported: quotes, pipes (|) and redirects (>, >>, <).",
      "Not supported: variables, globbing, command lists (; &&).",
      "",
    ].join("\n"),
  );

const noExit: CommandHandler = () =>
  ok("This demo shell cannot exit. Use “New session” to reset it.\n");

export const COMMANDS: Record<string, CommandHandler> = {
  pwd,
  cd,
  ls,
  mkdir,
  touch,
  cat,
  cp,
  mv,
  rm,
  chmod,
  grep,
  wc,
  echo,
  whoami,
  uname,
  clear,
  help,
  exit: noExit,
};

export const COMMAND_NAMES = Object.keys(COMMANDS);
