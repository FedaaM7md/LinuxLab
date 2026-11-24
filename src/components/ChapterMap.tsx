/*
 * Chapter map: the course's progress model shown as numbered chapters on a
 * route, not as a generic KPI card.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { LESSONS, type Lesson } from "../lessons/lessons";
import {
  overallProgress,
  lessonProgress,
  type ProgressData,
} from "../progress/progress";
import { ChalkCheck } from "./HandMarks";
import { MapIcon, TrashIcon } from "./Icons";
import { useI18n } from "../i18n/I18nProvider";

interface ChapterMapProps {
  progress: ProgressData;
  activeLessonId: Lesson["id"];
  progressResetEnabled: boolean;
  demoMode: boolean;
  onSelectLesson: (lesson: Lesson) => void;
  onReset: () => void;
}

export function ChapterMap({
  progress,
  activeLessonId,
  progressResetEnabled,
  demoMode,
  onSelectLesson,
  onReset,
}: ChapterMapProps) {
  const { t, locale } = useI18n();
  const overall = overallProgress(LESSONS, progress);

  return (
    <section
      id="chapter-map"
      aria-label={t("a11y.chapterMap")}
      className="paper scroll-mt-24 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1.5">
            <MapIcon className="h-3.5 w-3.5" />
            {t("chapter.kicker")}
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{t("chapter.title")}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {t("chapter.summary", { done: overall.done, total: overall.total })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-end">
            <span className="numbers block font-display text-3xl font-bold leading-none text-ink">
              {t("chapter.percent", { percent: overall.percent })}
            </span>
            <span className="mt-1 block text-[10px] font-semibold text-muted">
              {t("progress.completedSteps", { done: overall.done, total: overall.total })}
            </span>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={!progressResetEnabled}
            className="btn-quiet h-8 rounded-md px-2 text-[11px]"
            title={t("progress.reset")}
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("progress.reset")}</span>
          </button>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full border border-line bg-canvas-deep"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={overall.percent}
        aria-label={t("a11y.progress")}
      >
        <div
          className="h-full rounded-full bg-board transition-[width] duration-500 dark:bg-amber"
          style={{ width: `${overall.percent}%` }}
        />
      </div>

      {demoMode && (
        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] text-muted">
          <span className="sr-only">{t("a11y.demoNote")}: </span>
          <span className="tag tag-demo shrink-0">{t("demo.badge")}</span>
          <span className="truncate">{t("demo.note")}</span>
        </p>
      )}

      <ol className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
        {LESSONS.map((lesson) => {
          const lp = lessonProgress(lesson, progress);
          const active = lesson.id === activeLessonId;
          const statusLabel = lp.complete
            ? t("chapter.complete")
            : active
              ? t("chapter.current")
              : lp.done > 0
                ? t("chapter.inProgress", { done: lp.done, total: lp.total })
                : t("chapter.notStarted");

          return (
            <li key={lesson.id} className="min-w-[235px] snap-start sm:min-w-0">
              <button
                type="button"
                onClick={() => onSelectLesson(lesson)}
                aria-current={active ? "true" : undefined}
                aria-label={`${t("chapter.lessonNumber", { number: lesson.number })}: ${
                  lesson.title[locale]
                }. ${statusLabel}`}
                className={`group relative flex h-full w-full flex-col rounded-lg border p-3 text-start transition-colors ${
                  active
                    ? "border-amber bg-surface-2 shadow-note"
                    : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute start-0 top-3 bottom-3 w-[3px] rounded-full bg-amber"
                  />
                )}

                <span className="flex items-start gap-2.5">
                  <span
                    className={`hand-ring numbers flex h-8 w-8 shrink-0 items-center justify-center border text-sm font-bold ${
                      lp.complete
                        ? "border-success/50 bg-success-soft text-success"
                        : active
                          ? "border-amber bg-amber text-[#222222]"
                          : "border-line-strong bg-canvas text-muted"
                    }`}
                  >
                    {lp.complete ? (
                      <ChalkCheck className="h-4 w-4" />
                    ) : (
                      String(lesson.number).padStart(2, "0")
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                      {t("chapter.lessonNumber", { number: lesson.number })}
                    </span>
                    <span className="block truncate text-sm font-bold text-ink">
                      {lesson.title[locale]}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted">
                      {lesson.subtitle[locale]}
                    </span>
                  </span>
                </span>

                <span className="mt-2.5 flex items-center gap-1" aria-hidden="true">
                  {lesson.steps.map((step) => {
                    const done = progress.completed[`${lesson.id}:${step.id}`] === true;
                    return (
                      <span
                        key={step.id}
                        className={`h-1.5 flex-1 rounded-full ${
                          done ? "bg-success dark:bg-amber" : "bg-line-strong/70"
                        }`}
                      />
                    );
                  })}
                </span>

                <span className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold">
                  <span className={active ? "text-amber-ink" : "text-muted"}>{statusLabel}</span>
                  <span className="numbers text-muted">
                    {lp.done}/{lp.total}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
