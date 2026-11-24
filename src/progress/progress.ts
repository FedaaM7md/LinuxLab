/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import type { Lesson } from "../lessons/lessons";

export interface ProgressData {
  version: 1;
  completed: Record<string, boolean>;
  lastLessonId: Lesson["id"] | null;
  updatedAt: string;
}

export const PROGRESS_KEY = "fedaa.linuxlab.progress.v1";

export function progressKey(lessonId: string, stepId: string): string {
  return `${lessonId}:${stepId}`;
}

export function emptyProgress(): ProgressData {
  return {
    version: 1,
    completed: {},
    lastLessonId: null,
    updatedAt: new Date(0).toISOString(),
  };
}

function defaultStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function parseProgress(raw: string | null): ProgressData {
  if (!raw) return emptyProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return emptyProgress();
    const record = value as Record<string, unknown>;
    if (record.version !== 1) return emptyProgress();
    const completed: Record<string, boolean> = {};
    if (record.completed && typeof record.completed === "object") {
      for (const [key, entry] of Object.entries(record.completed as Record<string, unknown>)) {
        if (entry === true) completed[key] = true;
      }
    }
    const lastLessonId =
      typeof record.lastLessonId === "string" ? (record.lastLessonId as Lesson["id"]) : null;
    return {
      version: 1,
      completed,
      lastLessonId,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return emptyProgress();
  }
}

export function loadProgress(storage: Storage | null = defaultStorage()): ProgressData {
  if (!storage) return emptyProgress();
  try {
    return parseProgress(storage.getItem(PROGRESS_KEY));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(data: ProgressData, storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function isStepComplete(data: ProgressData, lessonId: string, stepId: string): boolean {
  return data.completed[progressKey(lessonId, stepId)] === true;
}

export function markStepComplete(
  data: ProgressData,
  lessonId: string,
  stepId: string,
): ProgressData {
  return {
    ...data,
    version: 1,
    completed: { ...data.completed, [progressKey(lessonId, stepId)]: true },
    lastLessonId: lessonId as Lesson["id"],
    updatedAt: new Date().toISOString(),
  };
}

export function setLastLesson(data: ProgressData, lessonId: Lesson["id"]): ProgressData {
  if (data.lastLessonId === lessonId) return data;
  return { ...data, lastLessonId: lessonId, updatedAt: new Date().toISOString() };
}

export function resetProgressData(): ProgressData {
  return {
    version: 1,
    completed: {},
    lastLessonId: null,
    updatedAt: new Date().toISOString(),
  };
}

export interface LessonProgress {
  done: number;
  total: number;
  complete: boolean;
}

export function lessonProgress(
  lesson: Lesson,
  data: ProgressData,
): LessonProgress {
  const done = lesson.steps.filter((step) => isStepComplete(data, lesson.id, step.id)).length;
  return { done, total: lesson.steps.length, complete: done === lesson.steps.length };
}

export interface OverallProgress {
  done: number;
  total: number;
  percent: number;
}

export function overallProgress(lessons: Lesson[], data: ProgressData): OverallProgress {
  let done = 0;
  let total = 0;
  for (const lesson of lessons) {
    const progress = lessonProgress(lesson, data);
    done += progress.done;
    total += progress.total;
  }
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/** First incomplete step index, or the last index when everything is done. */
export function currentStepIndex(lesson: Lesson, data: ProgressData): number {
  const index = lesson.steps.findIndex((step) => !isStepComplete(data, lesson.id, step.id));
  return index === -1 ? Math.max(0, lesson.steps.length - 1) : index;
}

export function clearProgress(storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}
