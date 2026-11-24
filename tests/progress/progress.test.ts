/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LESSONS } from "../../src/lessons/lessons";
import {
  PROGRESS_KEY,
  currentStepIndex,
  emptyProgress,
  lessonProgress,
  loadProgress,
  markStepComplete,
  overallProgress,
  parseProgress,
  resetProgressData,
  saveProgress,
} from "../../src/progress/progress";

describe("progress persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts empty and saves to the documented key", () => {
    const initial = loadProgress();
    expect(initial.completed).toEqual({});
    expect(initial.lastLessonId).toBeNull();

    const updated = markStepComplete(initial, "navigation", "where-am-i");
    expect(saveProgress(updated)).toBe(true);
    expect(localStorage.getItem(PROGRESS_KEY)).toContain("navigation:where-am-i");
    expect(loadProgress().completed["navigation:where-am-i"]).toBe(true);
  });

  it("ignores malformed payloads", () => {
    expect(parseProgress("not json").completed).toEqual({});
    expect(parseProgress('{"version":2,"completed":{}}').completed).toEqual({});
    expect(parseProgress('{"version":1,"completed":{"a:b":true,"c:d":false}}').completed).toEqual({
      "a:b": true,
    });
  });

  it("computes lesson and overall progress", () => {
    let data = emptyProgress();
    const lesson = LESSONS[0]!;
    expect(lessonProgress(lesson, data)).toEqual({ done: 0, total: 4, complete: false });
    data = markStepComplete(data, lesson.id, lesson.steps[0]!.id);
    expect(lessonProgress(lesson, data)).toEqual({ done: 1, total: 4, complete: false });
    for (const step of lesson.steps) data = markStepComplete(data, lesson.id, step.id);
    expect(lessonProgress(lesson, data).complete).toBe(true);

    const overall = overallProgress(LESSONS, data);
    expect(overall.done).toBe(4);
    expect(overall.total).toBe(19);
    expect(overall.percent).toBe(21);
  });

  it("finds the first incomplete step", () => {
    const lesson = LESSONS[0]!;
    let data = emptyProgress();
    expect(currentStepIndex(lesson, data)).toBe(0);
    data = markStepComplete(data, lesson.id, lesson.steps[0]!.id);
    expect(currentStepIndex(lesson, data)).toBe(1);
    for (const step of lesson.steps) data = markStepComplete(data, lesson.id, step.id);
    expect(currentStepIndex(lesson, data)).toBe(lesson.steps.length - 1);
  });

  it("resets progress data and storage", () => {
    saveProgress(markStepComplete(emptyProgress(), "files", "make-practice"));
    const reset = resetProgressData();
    expect(reset.completed).toEqual({});
    expect(reset.lastLessonId).toBeNull();
    saveProgress(reset);
    expect(loadProgress().completed).toEqual({});
  });

  it("survives unavailable storage", () => {
    expect(saveProgress(emptyProgress(), null)).toBe(false);
    expect(loadProgress(null).completed).toEqual({});
  });
});
