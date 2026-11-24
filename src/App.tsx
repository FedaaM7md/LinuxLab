/*
 * Linux Lab application shell.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ChapterMap } from "./components/ChapterMap";
import { LessonPanel } from "./components/LessonPanel";
import { TerminalCard } from "./components/TerminalCard";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Toast } from "./components/Toast";
import { GraduationIcon, NotebookIcon, TerminalIcon } from "./components/Icons";
import { useI18n } from "./i18n/I18nProvider";
import { useTheme } from "./lib/useTheme";
import { STORAGE_KEYS, readStored, writeStored } from "./lib/storage";
import { resolveImageConfig, type LabImageConfig } from "./emulator/images";
import { V86Controller, type V86State } from "./emulator/v86Controller";
import { SimulatedShell } from "./shell/simulatedShell";
import { LESSONS, V86_WORKSPACE_COMMAND, getLesson, totalStepCount } from "./lessons/lessons";
import { gradeStep } from "./lessons/grader";
import {
  clearProgress,
  currentStepIndex,
  lessonProgress,
  loadProgress,
  markStepComplete,
  overallProgress,
  resetProgressData,
  saveProgress,
  setLastLesson,
  type ProgressData,
} from "./progress/progress";
import { demoModeEnabled } from "./demo/demoMode";
import {
  DEMO_EPOCH_KEY,
  DEMO_MANIFEST_URL,
  parseResetAt,
  shouldResetDemo,
} from "./demo/demoReset";
import type { LessonFeedback, ShellMode } from "./types/ui";
import type { Lesson, LessonId } from "./lessons/lessons";

const DEMO_MODE = demoModeEnabled();

function useV86State(controller: V86Controller): V86State {
  const [state, setState] = useState<V86State>(() => controller.getState());
  useEffect(() => {
    setState(controller.getState());
    return controller.subscribe(setState);
  }, [controller]);
  return state;
}

function initialLessonId(data: ProgressData): LessonId {
  const stored = data.lastLessonId;
  if (stored && LESSONS.some((lesson) => lesson.id === stored)) return stored;
  return "navigation";
}

function initialMode(): ShellMode {
  const stored = readStored(STORAGE_KEYS.mode);
  return stored === "v86" ? "v86" : "simulated";
}

function initialConfig(): LabImageConfig {
  const base = resolveImageConfig();
  const stored = Number.parseInt(readStored(STORAGE_KEYS.memory) ?? "", 10);
  const allowed = [64, 128, 256, 512];
  return { ...base, memoryMb: allowed.includes(stored) ? stored : base.memoryMb };
}

export default function App() {
  const { t, locale, dir } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const [initialProgress] = useState<ProgressData>(() => loadProgress());
  const [progress, setProgress] = useState<ProgressData>(initialProgress);
  const [activeLessonId, setActiveLessonId] = useState<LessonId>(() =>
    initialLessonId(initialProgress),
  );
  const [mode, setMode] = useState<ShellMode>(initialMode);
  const [mobileView, setMobileView] = useState<"lesson" | "terminal">("terminal");
  const [feedback, setFeedback] = useState<LessonFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    action?: { label: string; run: () => void };
  } | null>(null);

  const [config] = useState<LabImageConfig>(initialConfig);
  const [memoryMb, setMemoryMb] = useState(config.memoryMb);
  const [simulatedShell] = useState(() => new SimulatedShell());
  const [v86] = useState(() => new V86Controller(config));
  const v86State = useV86State(v86);

  const gradingRef = useRef(false);
  const provisionedRef = useRef(false);

  const lesson = getLesson(activeLessonId);
  const lp = lessonProgress(lesson, progress);
  const stepIndex = currentStepIndex(lesson, progress);
  const activeStep = lesson.steps[stepIndex];
  const overall = overallProgress(LESSONS, progress);
  const canCheck = !lp.complete && (mode === "simulated" || v86State.shellReady);
  const allDone = overall.done >= totalStepCount();

  const notify = useCallback(
    (message: string, action?: { label: string; run: () => void }) => {
      setToast({ id: Date.now(), message, action });
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    document.title = t("doc.title", {
      number: lesson.number,
      title: lesson.title[locale],
    });
  }, [lesson, locale, t]);

  /* A scheduled demo reset writes /demo-reset.json. Only this browser's
     progress is cleared, and a first visit is never treated as a reset. */
  useEffect(() => {
    if (!DEMO_MODE) return;
    let cancelled = false;
    void fetch(DEMO_MANIFEST_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const resetAt = parseResetAt(payload);
        if (!resetAt) return;
        const stored = readStored(DEMO_EPOCH_KEY);
        if (shouldResetDemo(stored, resetAt)) {
          clearProgress();
          setProgress(resetProgressData());
          setActiveLessonId("navigation");
          setFeedback(null);
          notify(t("toast.demoReset"));
        }
        writeStored(DEMO_EPOCH_KEY, resetAt);
      })
      .catch(() => {
        /* A missing manifest is harmless: the demo simply does not reset. */
      });
    return () => {
      cancelled = true;
    };
  }, [notify, t]);

  useEffect(() => {
    if (mode === "v86") {
      const status = v86.getState().status;
      if (status === "idle" || status === "stopped") void v86.start();
    } else {
      const status = v86.getState().status;
      if (status !== "idle" && status !== "stopped") void v86.stop();
      provisionedRef.current = false;
    }
  }, [mode, v86]);

  useEffect(() => {
    return () => {
      void v86.dispose();
      void simulatedShell.dispose();
    };
  }, [v86, simulatedShell]);

  useEffect(() => {
    if (mode !== "v86" || !v86State.shellReady || provisionedRef.current) return;
    provisionedRef.current = true;
    v86.writeNotice("Linux Lab: preparing the demo lesson files in the guest...");
    v86
      .run(V86_WORKSPACE_COMMAND, { timeoutMs: 60000 })
      .then(() => v86.writeNotice("Linux Lab: demo lesson files are ready."))
      .catch(() => {
        provisionedRef.current = false;
        v86.writeNotice("Linux Lab: could not prepare lesson files automatically.");
      });
  }, [mode, v86, v86State.shellReady]);

  useEffect(() => {
    setFeedback(null);
  }, [activeLessonId, stepIndex]);

  const persist = useCallback(
    (next: ProgressData) => {
      setProgress(next);
      if (!saveProgress(next)) notify(t("error.storage"));
    },
    [notify, t],
  );

  const gradeCurrent = useCallback(
    async (silent: boolean) => {
      if (!activeStep || lp.complete || gradingRef.current) return;
      const shell = mode === "simulated" ? simulatedShell : v86;
      if (mode === "v86" && (v86State.status !== "running" || !v86State.shellReady)) {
        if (!silent) setFeedback({ kind: "error", error: t("lesson.shellNotReady") });
        return;
      }
      gradingRef.current = true;
      setChecking(true);
      try {
        const result = await gradeStep(shell, activeStep, {
          timeoutMs: mode === "v86" ? 12000 : 5000,
        });
        if (result.passed) {
          const updated = markStepComplete(progress, lesson.id, activeStep.id);
          persist(updated);
          setFeedback(null);
          notify(
            lessonProgress(lesson, updated).complete
              ? t("toast.lessonComplete")
              : t("toast.stepComplete"),
          );
        } else if (!silent) {
          setFeedback(
            result.error
              ? { kind: "error", error: result.error, checks: result.checks }
              : { kind: "retry", checks: result.checks },
          );
        }
      } catch (error) {
        if (!silent) {
          setFeedback({
            kind: "error",
            error: error instanceof Error ? error.message : t("error.unknown"),
          });
        }
      } finally {
        gradingRef.current = false;
        setChecking(false);
      }
    },
    [
      activeStep,
      lesson,
      lp.complete,
      mode,
      notify,
      persist,
      progress,
      simulatedShell,
      t,
      v86,
      v86State.shellReady,
      v86State.status,
    ],
  );

  const handleSelectLesson = useCallback(
    (next: Lesson) => {
      setActiveLessonId(next.id);
      persist(setLastLesson(progress, next.id));
      setFeedback(null);
      setMobileView("lesson");
    },
    [persist, progress],
  );

  const handleNextLesson = useCallback(() => {
    const index = LESSONS.findIndex((entry) => entry.id === activeLessonId);
    const next = LESSONS[(index + 1) % LESSONS.length];
    if (next) handleSelectLesson(next);
  }, [activeLessonId, handleSelectLesson]);

  const handleResetConfirm = useCallback(() => {
    const previousProgress = progress;
    const previousLesson = activeLessonId;
    clearProgress();
    setProgress(resetProgressData());
    setActiveLessonId("navigation");
    setFeedback(null);
    setResetOpen(false);
    notify(DEMO_MODE ? t("toast.demoReset") : t("toast.progressReset"), {
      label: t("common.undo"),
      run: () => {
        setProgress(previousProgress);
        saveProgress(previousProgress);
        setActiveLessonId(previousLesson);
        setFeedback(null);
        notify(t("toast.progressRestored"));
      },
    });
  }, [activeLessonId, notify, progress, t]);

  const handleModeChange = useCallback(
    (next: ShellMode) => {
      if (next === mode) return;
      setMode(next);
      writeStored(STORAGE_KEYS.mode, next);
      setFeedback(null);
      if (next === "v86") setMobileView("terminal");
    },
    [mode],
  );

  const handleMemoryChange = useCallback(
    (next: number) => {
      setMemoryMb(next);
      writeStored(STORAGE_KEYS.memory, String(next));
      v86.setMemoryMb(next);
    },
    [v86],
  );

  const handleSessionReset = useCallback(() => {
    setFeedback(null);
    provisionedRef.current = false;
  }, []);

  const completeSteps = Object.keys(progress.completed).length;

  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-amber px-3 py-2 text-sm font-bold text-[#222222] focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t("header.skip")}
      </a>

      <Header theme={theme} onToggleTheme={toggleTheme} demoMode={DEMO_MODE} />

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1500px] flex-1 px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8"
      >
        <ChapterMap
          progress={progress}
          activeLessonId={activeLessonId}
          progressResetEnabled={completeSteps > 0}
          demoMode={DEMO_MODE}
          onSelectLesson={handleSelectLesson}
          onReset={() => setResetOpen(true)}
        />

        {allDone && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-success/30 bg-success-soft px-3 py-2.5">
            <GraduationIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-success">{t("lesson.allDoneTitle")}</p>
              <p className="lesson-prose mt-0.5 text-xs">{t("lesson.allDoneBody")}</p>
            </div>
          </div>
        )}

        <div
          data-print-hide
          className="mb-3 mt-3 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface p-1 lg:hidden"
          role="group"
          aria-label={t("a11y.lessonPanel")}
        >
          <button
            type="button"
            aria-pressed={mobileView === "lesson"}
            onClick={() => setMobileView("lesson")}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              mobileView === "lesson"
                ? "bg-board text-chalk dark:bg-amber dark:text-[#222222]"
                : "text-muted hover:bg-canvas-deep"
            }`}
          >
            <NotebookIcon className="h-4 w-4" />
            {t("mobile.tabLesson")}
            <span className="numbers rounded bg-black/10 px-1.5 text-[10px] dark:bg-white/10">
              {overall.done}/{overall.total}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={mobileView === "terminal"}
            onClick={() => setMobileView("terminal")}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              mobileView === "terminal"
                ? "bg-board text-chalk dark:bg-amber dark:text-[#222222]"
                : "text-muted hover:bg-canvas-deep"
            }`}
          >
            <TerminalIcon className="h-4 w-4" />
            {t("mobile.tabTerminal")}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] xl:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
          <div className={`${mobileView === "lesson" ? "block" : "hidden"} min-w-0 lg:block`}>
            <LessonPanel
              lesson={lesson}
              progress={progress}
              feedback={feedback}
              checking={checking}
              canCheck={canCheck}
              onCheck={() => void gradeCurrent(false)}
              onNextLesson={handleNextLesson}
            />
          </div>

          <div
            id="terminal"
            className={`${mobileView === "terminal" ? "block" : "hidden"} min-w-0 scroll-mt-24 lg:block`}
          >
            <div className="lg:sticky lg:top-[calc(var(--header-h)+0.75rem)]">
              <TerminalCard
                mode={mode}
                onModeChange={handleModeChange}
                simulatedShell={simulatedShell}
                v86={v86}
                v86State={v86State}
                config={config}
                memoryMb={memoryMb}
                onMemoryChange={handleMemoryChange}
                active={mobileView === "terminal"}
                checking={checking}
                canCheck={canCheck}
                onCheck={() => void gradeCurrent(false)}
                onCommandExecuted={() => void gradeCurrent(true)}
                onSessionReset={handleSessionReset}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer demoMode={DEMO_MODE} />

      <ConfirmDialog
        open={resetOpen}
        title={DEMO_MODE ? t("demo.resetTitle") : t("progress.resetTitle")}
        body={DEMO_MODE ? t("demo.resetBody") : t("progress.resetBody")}
        confirmLabel={DEMO_MODE ? t("demo.resetConfirm") : t("progress.resetConfirm")}
        onConfirm={handleResetConfirm}
        onClose={() => setResetOpen(false)}
        destructive
      />

      <Toast
        key={toast?.id ?? "none"}
        message={toast?.message ?? null}
        action={toast?.action ?? null}
        onDismiss={dismissToast}
      />
    </div>
  );
}
