/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import type { CheckOutcome } from "../lessons/grader";

export type ShellMode = "simulated" | "v86";

export type LessonFeedback =
  | { kind: "retry"; checks: CheckOutcome[] }
  | { kind: "error"; error: string; checks?: CheckOutcome[] };
