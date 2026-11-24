/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

/**
 * Command-line parsing for the demo shell: quotes, backslash escapes,
 * pipelines (`|`) and redirects (`>`, `>>`, `<`).
 *
 * Deliberately no variable expansion or globbing; unsupported syntax fails
 * clearly instead of pretending to be bash.
 */

export class ShellSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShellSyntaxError";
  }
}

type Operator = "|" | ">" | ">>" | "<";

type Token = { type: "word"; value: string } | { type: "op"; value: Operator };

export interface ParsedSegment {
  argv: string[];
  inputFile?: string;
  outputFile?: { path: string; append: boolean };
}

export interface ParsedPipeline {
  segments: ParsedSegment[];
  empty: boolean;
}

export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  let hasWord = false;

  const flush = (): void => {
    if (hasWord) {
      tokens.push({ type: "word", value: buffer });
      buffer = "";
      hasWord = false;
    }
  };

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? "";

    if (char === " " || char === "\t") {
      flush();
      continue;
    }

    if (char === "'") {
      hasWord = true;
      index += 1;
      while (index < line.length && line[index] !== "'") {
        buffer += line[index];
        index += 1;
      }
      if (index >= line.length) {
        throw new ShellSyntaxError("syntax error: unterminated single quote");
      }
      continue;
    }

    if (char === '"') {
      hasWord = true;
      index += 1;
      while (index < line.length && line[index] !== '"') {
        const inner = line[index] ?? "";
        if (inner === "\\" && (line[index + 1] === '"' || line[index + 1] === "\\")) {
          buffer += line[index + 1];
          index += 2;
        } else {
          buffer += inner;
          index += 1;
        }
      }
      if (index >= line.length) {
        throw new ShellSyntaxError("syntax error: unterminated double quote");
      }
      continue;
    }

    if (char === "\\") {
      const next = line[index + 1];
      if (next !== undefined) {
        buffer += next;
        hasWord = true;
        index += 1;
      }
      continue;
    }

    if (char === "|") {
      flush();
      tokens.push({ type: "op", value: "|" });
      continue;
    }

    if (char === ">" || char === "<") {
      flush();
      let operator: Operator = char;
      if (char === ">" && line[index + 1] === ">") {
        operator = ">>";
        index += 1;
      }
      tokens.push({ type: "op", value: operator });
      continue;
    }

    buffer += char;
    hasWord = true;
  }

  flush();
  return tokens;
}

export function parseCommandLine(line: string): ParsedPipeline {
  const trimmed = line.trim();
  if (trimmed === "") {
    return { segments: [], empty: true };
  }

  const tokens = tokenize(line);
  const segments: ParsedSegment[] = [];
  let current: ParsedSegment = { argv: [] };
  let pendingRedirect: Operator | null = null;

  const pushSegment = (): void => {
    if (current.argv.length === 0) {
      throw new ShellSyntaxError("syntax error near unexpected token `|'");
    }
    segments.push(current);
    current = { argv: [] };
  };

  for (const token of tokens) {
    if (token.type === "word") {
      if (pendingRedirect) {
        if (token.value === "") {
          throw new ShellSyntaxError(`syntax error near unexpected token \`${pendingRedirect}'`);
        }
        if (pendingRedirect === "<") {
          current.inputFile = token.value;
        } else {
          current.outputFile = {
            path: token.value,
            append: pendingRedirect === ">>",
          };
        }
        pendingRedirect = null;
      } else {
        current.argv.push(token.value);
      }
      continue;
    }

    if (pendingRedirect) {
      throw new ShellSyntaxError(`syntax error near unexpected token \`${token.value}'`);
    }

    if (token.value === "|") {
      pushSegment();
    } else {
      pendingRedirect = token.value;
    }
  }

  if (pendingRedirect) {
    throw new ShellSyntaxError("syntax error: missing redirection target");
  }

  if (current.argv.length === 0) {
    throw new ShellSyntaxError("syntax error near unexpected token `|'");
  }

  segments.push(current);
  return { segments, empty: false };
}
