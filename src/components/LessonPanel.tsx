/*
 * The lesson notebook: a ruled paper page beside the terminal.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { useEffect, useState } from "react";
import type { Lesson, LocalizedText } from "../lessons/lessons";
import { LESSONS } from "../lessons/lessons";
import {
  currentStepIndex,
  isStepComplete,
  lessonProgress,
  type ProgressData,
} from "../progress/progress";
import type { LessonFeedback } from "../types/ui";
import { useI18n } from "../i18n/I18nProvider";
import { AlertIcon, ArrowIcon, CheckIcon, ChevronIcon, GraduationIcon, InfoIcon } from "./Icons";
import { ChalkCheck, HandUnderline } from "./HandMarks";

interface LessonPanelProps {
  lesson: Lesson;
  progress: ProgressData;
  feedback: LessonFeedback | null;
  checking: boolean;
  canCheck: boolean;
  onCheck: () => void;
  onNextLesson: () => void;
}

export function LessonPanel({
  lesson,
  progress,
  feedback,
  checking,
  canCheck,
  onCheck,
  onNextLesson,
}: LessonPanelProps) {
  const { t, locale } = useI18n();
  const [showHint, setShowHint] = useState(false);

  const text = (value: LocalizedText) => value[locale];
  const activeIndex = currentStepIndex(lesson, progress);
  const activeStep = lesson.steps[activeIndex];
  const lp = lessonProgress(lesson, progress);
  const stepKey = activeStep ? `${lesson.id}:${activeStep.id}` : `${lesson.id}:done`;
  const isLastLesson = lesson.number === LESSONS.length;

  useEffect(() => {
    setShowHint(false);
  }, [stepKey]);

  const failedChecks = feedback?.checks?.filter((check) => !check.passed) ?? [];

  return (
    <section
      id="lesson"
      aria-label={t("a11y.lessonPanel")}
      className="notebook paper scroll-mt-24 overflow-hidden p-4 pb-5 sm:p-5 sm:pb-6"
    >
      <div className="notebook-body">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="eyebrow">{t("lesson.kicker", { number: lesson.number, count: lesson.steps.length })}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">
              {text(lesson.title)}
            </h1>
            <p className="mt-0.5 text-xs text-muted">{text(lesson.subtitle)}</p>
            <HandUnderline className="mt-1 h-2 w-24 text-amber" />
          </div>
          {lp.complete ? (
            <span className="tag border-success/40 bg-success-soft text-success">
              <ChalkCheck className="h-3.5 w-3.5" />
              {t("chapter.complete")}
            </span>
          ) : (
            <span className="tag tag-amber numbers">
              {lp.done}/{lp.total}
            </span>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-line border-s-[3px] border-s-amber bg-canvas/70 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {t("lesson.goal")}
          </p>
          <p className="lesson-prose mt-0.5 text-[13px]">{text(lesson.goal)}</p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {t("lesson.steps")}
            </h2>
            <span className="numbers text-[10px] font-semibold text-muted">
              {lp.done}/{lp.total}
            </span>
          </div>

          <ol className="mt-2 space-y-1" aria-label={t("a11y.stepList")}>
            {lesson.steps.map((step, index) => {
              const done = isStepComplete(progress, lesson.id, step.id);
              const current = !lp.complete && index === activeIndex;
              return (
                <li
                  key={step.id}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                    current
                      ? "border border-amber/60 bg-amber-soft/70"
                      : "border border-transparent"
                  }`}
                >
                  <span
                    className={`numbers flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      done
                        ? "border-success/50 bg-success-soft text-success"
                        : current
                          ? "border-amber bg-amber text-[#222222]"
                          : "border-line-strong bg-surface text-muted"
                    }`}
                  >
                    {done ? <ChalkCheck className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                      done ? "text-muted" : current ? "text-ink" : "text-muted"
                    }`}
                  >
                    {text(step.title)}
                  </span>
                  <span className="sr-only">
                    {done ? t("lesson.completed") : current ? t("lesson.current") : t("lesson.upcoming")}
                  </span>
                  {current && (
                    <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-amber-ink rtl:rotate-180" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-4 border-t-2 border-dashed border-line pt-4">
          {lp.complete ? (
            <div className="rounded-lg border border-success/30 bg-success-soft p-4">
              <div className="flex items-center gap-2 text-success">
                <ChalkCheck className="h-6 w-6" />
                <h2 className="text-lg font-bold">{t("lesson.doneTitle")}</h2>
              </div>
              <p className="lesson-prose mt-1 text-xs">{t("lesson.doneBody")}</p>
              <button type="button" className="btn-amber mt-3 w-full" onClick={onNextLesson}>
                {isLastLesson ? t("lesson.finishCourse") : t("lesson.nextLesson")}
                <ArrowIcon className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          ) : activeStep ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="tag border-line-strong bg-surface text-muted numbers">
                  {t("lesson.stepOf", { current: activeIndex + 1, total: lesson.steps.length })}
                </span>
                <button
                  type="button"
                  className="cursor-pointer text-[11px] font-bold text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
                  onClick={() => setShowHint((value) => !value)}
                  aria-expanded={showHint}
                >
                  {showHint ? t("lesson.hideHint") : t("lesson.showHint")}
                </button>
              </div>

              <h2 className="mt-2 text-lg font-bold leading-snug text-ink">
                {text(activeStep.title)}
              </h2>
              <p className="lesson-prose mt-1.5 text-[13.5px]">{text(activeStep.instruction)}</p>

              {activeStep.examples && activeStep.examples.length > 0 && (
                <div className="mt-3">
                  <p className="eyebrow">{t("lesson.example")}</p>
                  <div className="mt-1.5 space-y-1" dir="ltr">
                    {activeStep.examples.map((example) => (
                      <code key={example} className="code-line">
                        {example}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {showHint && (
                <div className="mt-3 rounded-md border border-amber/50 bg-amber-soft px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-ink">
                    {t("lesson.hint")}
                  </p>
                  <p className="lesson-prose mt-0.5 text-xs">{text(activeStep.hint)}</p>
                </div>
              )}

              <details className="group mt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-bold text-muted hover:text-ink">
                  <InfoIcon className="h-3.5 w-3.5" />
                  {t("lesson.checklist")}
                  <ChevronIcon className="h-3 w-3 transition-transform group-open:rotate-90 rtl:group-open:-rotate-90" />
                </summary>
                <ul className="mt-1.5 space-y-1 ps-1">
                  {activeStep.checks.map((check, checkIndex) => (
                    <li
                      key={`${check.command}-${checkIndex}`}
                      className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber" />
                      {text(check.label)}
                    </li>
                  ))}
                </ul>
              </details>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-amber flex-1 sm:flex-none"
                  onClick={onCheck}
                  disabled={checking || !canCheck}
                >
                  {checking ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#222222]/30 border-t-[#222222]" />
                      {t("lesson.checking")}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      {t("lesson.check")}
                    </>
                  )}
                </button>
                <span className="max-w-[15rem] text-[10px] leading-tight text-muted">
                  {t("lesson.autoGraded")}
                </span>
              </div>

              <div aria-live="polite" className="mt-2">
                {feedback?.kind === "retry" && (
                  <div className="rounded-md border border-danger/35 bg-danger-soft px-3 py-2 text-xs text-danger">
                    <p className="flex items-center gap-1.5 font-bold">
                      <AlertIcon className="h-4 w-4" />
                      {t("lesson.failed")}
                    </p>
                    <p className="lesson-prose mt-0.5 text-xs">{t("lesson.failedBody")}</p>
                    {failedChecks.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {failedChecks.map((check, checkIndex) => (
                          <li
                            key={`${check.check.command}-${checkIndex}`}
                            className="flex items-start gap-1.5"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
                            {text(check.check.label)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {feedback?.kind === "error" && (
                  <div className="rounded-md border border-amber/60 bg-amber-soft px-3 py-2 text-xs text-amber-ink">
                    <p className="flex items-center gap-1.5 font-bold">
                      <AlertIcon className="h-4 w-4" />
                      {t("lesson.failed")}
                    </p>
                    <p className="lesson-prose mt-0.5 text-xs">
                      {t("lesson.checkError", { error: feedback.error })}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
          <GraduationIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("lesson.demoFiles")}
        </p>
      </div>
    </section>
  );
}
