/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { describe, expect, it } from "vitest";
import { ShellSyntaxError, parseCommandLine, tokenize } from "../../src/shell/parser";

describe("tokenizer", () => {
  it("keeps quoted whitespace and empty quoted words", () => {
    expect(tokenize(`echo "hello world" 'x y' ""`)).toEqual([
      { type: "word", value: "echo" },
      { type: "word", value: "hello world" },
      { type: "word", value: "x y" },
      { type: "word", value: "" },
    ]);
  });

  it("supports escaped characters", () => {
    expect(tokenize("echo hello\\ world")).toEqual([
      { type: "word", value: "echo" },
      { type: "word", value: "hello world" },
    ]);
  });

  it("recognises pipes and redirects", () => {
    expect(tokenize("cat a | grep b > out.txt")).toEqual([
      { type: "word", value: "cat" },
      { type: "word", value: "a" },
      { type: "op", value: "|" },
      { type: "word", value: "grep" },
      { type: "word", value: "b" },
      { type: "op", value: ">" },
      { type: "word", value: "out.txt" },
    ]);
  });
});

describe("parser", () => {
  it("builds a pipeline with redirections", () => {
    const parsed = parseCommandLine("grep 200 logs/access.log | wc -l > reports/count.txt");
    expect(parsed.empty).toBe(false);
    expect(parsed.segments).toHaveLength(2);
    expect(parsed.segments[0]?.argv).toEqual(["grep", "200", "logs/access.log"]);
    expect(parsed.segments[1]?.argv).toEqual(["wc", "-l"]);
    expect(parsed.segments[1]?.outputFile).toEqual({ path: "reports/count.txt", append: false });
  });

  it("treats empty input as an empty pipeline", () => {
    expect(parseCommandLine("   ")).toEqual({ segments: [], empty: true });
  });

  it("rejects unterminated quotes and empty pipe segments", () => {
    expect(() => parseCommandLine('echo "oops')).toThrowError(ShellSyntaxError);
    expect(() => parseCommandLine("ls | | wc")).toThrowError(/unexpected token/);
    expect(() => parseCommandLine("echo hi >")).toThrowError(/missing redirection target/);
  });
});
