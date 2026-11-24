/*
 * Terminal bench: xterm surface, simulated terminal and the optional v86 VM.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * Terminal output stays LTR/English on purpose: xterm does not shape Arabic
 * text or implement bidi, so mixing RTL prose into the buffer would be unsafe.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import type { TranslationKey } from "../i18n/en";
import { useI18n } from "../i18n/I18nProvider";
import type { V86Controller, V86State, V86Status } from "../emulator/v86Controller";
import type { SimulatedShell } from "../shell/simulatedShell";
import type { ShellMode } from "../types/ui";
import type { LabImageConfig } from "../emulator/images";
import { SetupScreen } from "./SetupScreen";
import {
  CheckIcon,
  ClearIcon,
  CpuIcon,
  PlayIcon,
  RestartIcon,
  StopIcon,
  TerminalIcon,
} from "./Icons";

interface TerminalCardProps {
  mode: ShellMode;
  onModeChange: (mode: ShellMode) => void;
  simulatedShell: SimulatedShell;
  v86: V86Controller;
  v86State: V86State;
  config: LabImageConfig;
  memoryMb: number;
  onMemoryChange: (memoryMb: number) => void;
  active: boolean;
  checking: boolean;
  canCheck: boolean;
  onCheck: () => void;
  onCommandExecuted: () => void;
  onSessionReset: () => void;
}

const STATUS_KEYS: Record<V86Status, TranslationKey> = {
  idle: "status.idle",
  probing: "status.probing",
  "missing-images": "status.missing",
  starting: "status.starting",
  running: "status.running",
  stopped: "status.stopped",
  error: "status.error",
};

const STATUS_DOT: Record<V86Status, string> = {
  idle: "bg-chalk/35",
  probing: "bg-amber animate-pulse",
  "missing-images": "bg-danger",
  starting: "bg-amber animate-pulse",
  running: "bg-success",
  stopped: "bg-chalk/35",
  error: "bg-danger",
};

const MEMORY_OPTIONS = [64, 128, 256, 512];

function toTerminalNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
}

function paintSimulatedBanner(terminal: Terminal): void {
  // Keep this short: xterm wraps by columns, not by words, and a long line
  // breaks mid-word on phones. The localized instruction is rendered as HTML
  // above the terminal, where bidi and Arabic shaping are safe.
  terminal.write("\u001b[1;38;5;214mLinux Lab\u001b[0m\r\n\r\n");
}

export function TerminalCard({
  mode,
  onModeChange,
  simulatedShell,
  v86,
  v86State,
  config,
  memoryMb,
  onMemoryChange,
  active,
  checking,
  canCheck,
  onCheck,
  onCommandExecuted,
  onSessionReset,
}: TerminalCardProps) {
  const { t, dir } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const editorRef = useRef({ buffer: "", busy: false });
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const commandCallbackRef = useRef(onCommandExecuted);
  const resetCallbackRef = useRef(onSessionReset);
  const [ready, setReady] = useState(false);
  const [v86Checking, setV86Checking] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    commandCallbackRef.current = onCommandExecuted;
  }, [onCommandExecuted]);

  useEffect(() => {
    resetCallbackRef.current = onSessionReset;
  }, [onSessionReset]);

  useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;
      setNearFooter(footer.getBoundingClientRect().top < window.innerHeight * 0.9);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setTerminalVisible(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      // Ignore browser chrome; move only for an on-screen keyboard.
      setKeyboardInset(inset > 120 ? Math.round(inset) : 0);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily: '"JetBrains Mono", "Cascadia Mono", Consolas, monospace',
      fontSize: window.matchMedia("(max-width: 640px)").matches ? 12 : 13,
      lineHeight: 1.45,
      scrollback: 2500,
      convertEol: false,
      allowTransparency: true,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      theme: {
        background: "#0E1A14",
        foreground: "#F3EFE0",
        cursor: "#FFB000",
        cursorAccent: "#0E1A14",
        selectionBackground: "#FFB00055",
        black: "#0E1A14",
        red: "#E88C7D",
        green: "#9CCB86",
        yellow: "#FFB000",
        blue: "#8FB7C9",
        magenta: "#C9A7C4",
        cyan: "#A8D5BA",
        white: "#F3EFE0",
        brightBlack: "#5B7263",
        brightRed: "#F2A495",
        brightGreen: "#B8DDA6",
        brightYellow: "#FFC24D",
        brightBlue: "#AACFDD",
        brightMagenta: "#DCC0D8",
        brightCyan: "#C2E6CF",
        brightWhite: "#FFFDF6",
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(host);
    terminalRef.current = terminal;
    fitRef.current = fit;

    let disposed = false;
    let readySet = false;
    let frame = 0;
    let retry: number | undefined;

    const hasSize = () => host.clientWidth > 4 && host.clientHeight > 4;

    const fitNow = () => {
      if (disposed || !hasSize()) return false;
      try {
        fit.fit();
        if (terminal.rows > 0) terminal.refresh(0, terminal.rows - 1);
        return true;
      } catch {
        // A hidden panel or an in-flight layout can reject fit(); retry later.
        return false;
      }
    };

    const markReady = () => {
      if (disposed || readySet) return;
      if (fitNow()) {
        readySet = true;
        setReady(true);
        if (retry !== undefined) window.clearInterval(retry);
      }
    };

    const scheduleFit = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (fitNow()) markReady();
      });
    };

    // Fonts change the cell metrics; refit after they load so the first prompt
    // is visible immediately at every viewport width.
    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!disposed) scheduleFit();
      });
    }

    markReady();
    scheduleFit();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleFit) : null;
    observer?.observe(host);
    window.addEventListener("resize", scheduleFit);
    window.addEventListener("orientationchange", scheduleFit);
    // Fallback for layouts that settle without a ResizeObserver callback.
    retry = window.setInterval(markReady, 200);
    if (readySet) {
      window.clearInterval(retry);
      retry = undefined;
    }

    return () => {
      disposed = true;
      if (retry !== undefined) window.clearInterval(retry);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleFit);
      window.removeEventListener("orientationchange", scheduleFit);
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() => {
      try {
        fitRef.current?.fit();
        const terminal = terminalRef.current;
        if (terminal && terminal.rows > 0) terminal.refresh(0, terminal.rows - 1);
      } catch {
        // Ignore transient layout states.
      }
      terminalRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [active, mode, ready]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal || !ready) return;
    terminal.write("\u001b[2J\u001b[H");
    const editor = editorRef.current;
    editor.buffer = "";
    editor.busy = false;

    if (mode === "simulated") {
      paintSimulatedBanner(terminal);
      const writePrompt = () => terminal.write(simulatedShell.getPrompt());

      const redraw = () => {
        terminal.write(`\r\u001b[2K${simulatedShell.getPrompt()}${editor.buffer}`);
      };

      const submit = (line: string) => {
        const trimmed = line.trim();
        editor.buffer = "";
        terminal.write("\r\n");
        if (trimmed === "") {
          writePrompt();
          return;
        }
        if (trimmed === "clear") {
          terminal.write("\u001b[2J\u001b[H");
          writePrompt();
          return;
        }
        if (historyRef.current[historyRef.current.length - 1] !== line) {
          historyRef.current.push(line);
          if (historyRef.current.length > 100) historyRef.current.shift();
        }
        historyIndexRef.current = historyRef.current.length;
        editor.busy = true;
        void simulatedShell
          .run(line)
          .then((result) => {
            if (result.stdout) terminal.write(toTerminalNewlines(result.stdout));
            if (result.stderr) {
              terminal.write(`\u001b[31m${toTerminalNewlines(result.stderr)}\u001b[0m`);
            }
            editor.busy = false;
            writePrompt();
            terminal.scrollToBottom();
            commandCallbackRef.current();
          })
          .catch((error: unknown) => {
            editor.busy = false;
            const message = error instanceof Error ? error.message : "Command failed";
            terminal.write(`\u001b[31m${toTerminalNewlines(message)}\u001b[0m\r\n`);
            writePrompt();
          });
      };

      const historyMove = (delta: number) => {
        const history = historyRef.current;
        if (history.length === 0) return;
        const next = Math.max(0, Math.min(history.length, historyIndexRef.current + delta));
        historyIndexRef.current = next;
        editor.buffer = next === history.length ? "" : history[next] ?? "";
        redraw();
      };

      const disposable = terminal.onData((data: string) => {
        if (editor.busy) return;
        if (data === "\u001b[A") {
          historyMove(-1);
          return;
        }
        if (data === "\u001b[B") {
          historyMove(1);
          return;
        }
        if (data === "\u007f") {
          if (editor.buffer.length === 0) {
            terminal.write("\u0007");
            return;
          }
          editor.buffer = editor.buffer.slice(0, -1);
          terminal.write("\b \b");
          return;
        }
        if (data === "\u0003") {
          editor.buffer = "";
          terminal.write("^C\r\n");
          writePrompt();
          return;
        }
        if (data === "\u000c") {
          terminal.write("\u001b[2J\u001b[H");
          writePrompt();
          terminal.write(editor.buffer);
          return;
        }
        if (data === "\u0015") {
          editor.buffer = "";
          redraw();
          return;
        }
        if (data === "\t" || data.startsWith("\u001b")) return;

        for (const char of data) {
          if (char === "\r" || char === "\n") {
            submit(editor.buffer);
            break;
          }
          if (char === "\u007f") {
            if (editor.buffer.length > 0) {
              editor.buffer = editor.buffer.slice(0, -1);
              terminal.write("\b \b");
            }
            continue;
          }
          if (char === "\u0003") {
            editor.buffer = "";
            terminal.write("^C\r\n");
            writePrompt();
            break;
          }
          if (char < " ") continue;
          editor.buffer += char;
          terminal.write(char);
        }
      });

      writePrompt();
      terminal.scrollToBottom();
      return () => {
        disposable.dispose();
      };
    }

    v86.attach({ write: (data: string) => terminal.write(data) });
    terminal.write("\u001b[2mLinux Lab — v86\u001b[0m\r\n\r\n");
    if (v86State.status !== "running") {
      terminal.write("\u001b[2mPress Start to boot.\u001b[0m\r\n");
    }
    let lineBuffer = "";
    let autoGradeTimer: ReturnType<typeof setTimeout> | null = null;
    const disposable = terminal.onData((data: string) => {
      if (v86.getState().status !== "running") return;
      v86.sendInput(data);
      for (const char of data) {
        if (char === "\r" || char === "\n") {
          const hasCommand = lineBuffer.trim() !== "";
          lineBuffer = "";
          if (hasCommand && v86.getState().shellReady) {
            if (autoGradeTimer) clearTimeout(autoGradeTimer);
            autoGradeTimer = setTimeout(() => {
              autoGradeTimer = null;
              commandCallbackRef.current();
            }, 1200);
          }
        } else if (char === "\u007f") {
          lineBuffer = lineBuffer.slice(0, -1);
        } else if (char >= " ") {
          lineBuffer += char;
        }
      }
    });
    return () => {
      if (autoGradeTimer) clearTimeout(autoGradeTimer);
      disposable.dispose();
      v86.detach();
    };
    // v86State.status is intentionally read only when the mode changes; live
    // output is streamed by the controller through attach().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready, simulatedShell, v86]);

  const resetSession = useCallback(async () => {
    const terminal = terminalRef.current;
    terminal?.write("\u001b[2J\u001b[H");
    if (mode === "simulated") {
      await simulatedShell.reset();
      editorRef.current = { buffer: "", busy: false };
      historyIndexRef.current = historyRef.current.length;
      if (terminal) {
        paintSimulatedBanner(terminal);
        terminal.write(simulatedShell.getPrompt());
      }
      resetCallbackRef.current();
    } else {
      resetCallbackRef.current();
      await v86.reset();
    }
  }, [mode, simulatedShell, v86]);

  const retryImages = useCallback(async () => {
    setV86Checking(true);
    try {
      await v86.stop();
      await v86.start();
    } finally {
      setV86Checking(false);
    }
  }, [v86]);

  const startVm = useCallback(() => {
    void v86.start();
  }, [v86]);

  const stopVm = useCallback(() => {
    void v86.stop();
  }, [v86]);

  const clearScreen = useCallback(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    terminal.write("\u001b[2J\u001b[H");
    if (mode === "simulated") {
      terminal.write(simulatedShell.getPrompt());
      terminal.write(editorRef.current.buffer);
    }
  }, [mode, simulatedShell]);

  const statusLabel =
    mode === "simulated" ? t("status.simulated") : t(STATUS_KEYS[v86State.status]);
  const dotClass = mode === "simulated" ? "bg-amber" : STATUS_DOT[v86State.status];
  const vmBusy = ["probing", "starting", "running"].includes(v86State.status);
  const showSetup =
    mode === "v86" && (v86State.status === "missing-images" || v86State.status === "error");
  const showStopped = mode === "v86" && (v86State.status === "idle" || v86State.status === "stopped");

  return (
    <section
      aria-label={t("a11y.terminalPanel")}
      className="overflow-hidden rounded-[var(--radius-note)] border border-board-line bg-board-deep shadow-lift"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-board-line bg-board px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-chalk/20 bg-white/5 text-amber">
            <TerminalIcon className="h-4 w-4" />
          </span>
          <h2 className="truncate text-sm font-bold text-chalk">{t("terminal.windowTitle")}</h2>
          <span className={mode === "simulated" ? "tag tag-demo" : "tag border-chalk/25 bg-white/5 text-chalk-soft"}>
            {mode === "simulated" ? t("mode.simulatedBadge") : t("mode.v86Badge")}
          </span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
          <span className="text-[11px] font-semibold text-chalk/65" aria-live="polite">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="terminal-chrome flex flex-wrap items-center gap-1.5 border-b border-board-line bg-board-deep px-2.5 py-2 sm:px-3">
        <div
          className="flex rounded-md border border-chalk/15 bg-black/25 p-0.5"
          role="group"
          aria-label={t("mode.switchAria")}
        >
          <button
            type="button"
            aria-pressed={mode === "simulated"}
            onClick={() => onModeChange("simulated")}
            className={`cursor-pointer rounded px-2 py-1 text-[11px] font-bold transition-colors ${
              mode === "simulated"
                ? "bg-amber text-[#222222]"
                : "text-chalk/65 hover:bg-white/10 hover:text-chalk"
            }`}
          >
            {t("mode.simulatedShort")}
          </button>
          <button
            type="button"
            aria-pressed={mode === "v86"}
            onClick={() => onModeChange("v86")}
            className={`cursor-pointer rounded px-2 py-1 text-[11px] font-bold transition-colors ${
              mode === "v86"
                ? "bg-amber text-[#222222]"
                : "text-chalk/65 hover:bg-white/10 hover:text-chalk"
            }`}
          >
            {t("mode.v86Short")}
          </button>
        </div>

        {mode === "v86" ? (
          <>
            <button
              type="button"
              className="btn h-7 cursor-pointer rounded-md border border-chalk/15 bg-white/5 px-2 text-[11px] text-chalk hover:bg-white/10 disabled:opacity-40"
              onClick={startVm}
              disabled={vmBusy}
              title={t("terminal.start")}
              aria-label={t("terminal.start")}
            >
              <PlayIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("terminal.start")}</span>
            </button>
            <button
              type="button"
              className="btn h-7 cursor-pointer rounded-md border border-chalk/15 bg-white/5 px-2 text-[11px] text-chalk hover:bg-white/10 disabled:opacity-40"
              onClick={stopVm}
              disabled={!vmBusy}
              title={t("terminal.stop")}
              aria-label={t("terminal.stop")}
            >
              <StopIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("terminal.stop")}</span>
            </button>
          </>
        ) : null}

        <button
          type="button"
          className="btn h-7 cursor-pointer rounded-md border border-chalk/15 bg-white/5 px-2 text-[11px] text-chalk hover:bg-white/10"
          onClick={() => void resetSession()}
          title={mode === "simulated" ? t("terminal.newSession") : t("terminal.restart")}
          aria-label={mode === "simulated" ? t("terminal.newSession") : t("terminal.restart")}
        >
          <RestartIcon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">
            {mode === "simulated" ? t("terminal.newSession") : t("terminal.restart")}
          </span>
        </button>

        {mode === "v86" && (
          <label className="flex items-center gap-1 text-[11px] text-chalk/65">
            <CpuIcon className="h-3.5 w-3.5 opacity-70" />
            <span className="hidden lg:inline">{t("terminal.memory")}</span>
            <select
              value={memoryMb}
              onChange={(event) => onMemoryChange(Number(event.target.value))}
              disabled={vmBusy}
              aria-label={t("terminal.memory")}
              className="rounded border border-chalk/20 bg-board px-1.5 py-1 text-[11px] text-chalk disabled:opacity-50"
            >
              {MEMORY_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {t("terminal.memoryMb", { size })}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="ms-auto flex items-center gap-1.5">
          <button
            type="button"
            className="btn hidden h-7 cursor-pointer rounded-md bg-amber px-2.5 text-[11px] text-[#222222] hover:bg-[#ffc033] disabled:opacity-40 lg:inline-flex"
            onClick={onCheck}
            disabled={checking || !canCheck}
            aria-label={checking ? t("terminal.checking") : t("terminal.check")}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            <span>{checking ? t("terminal.checking") : t("terminal.check")}</span>
          </button>
          <button
            type="button"
            className="btn h-7 w-7 cursor-pointer rounded-md border border-chalk/15 bg-white/5 p-0 text-[11px] text-chalk hover:bg-white/10"
            onClick={clearScreen}
            title={t("terminal.clear")}
            aria-label={t("terminal.clear")}
          >
            <ClearIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {mode === "simulated" && (
        <div
          dir={dir}
          className="border-b border-board-line bg-board px-3 py-1.5 text-[10px] leading-relaxed text-chalk/65 sm:px-4"
        >
          {t("terminal.welcome")}
        </div>
      )}

      <div className="relative bg-[#0E1A14]">
        <div
          ref={hostRef}
          dir="ltr"
          role="group"
          aria-label={t("terminal.aria")}
          tabIndex={0}
          className="terminal-shell h-[58dvh] min-h-[360px] w-full lg:h-[calc(100vh-470px)] lg:max-h-[760px]"
          onClick={() => terminalRef.current?.focus()}
          onFocus={() => terminalRef.current?.focus()}
        />
        {!ready && (
          <div className="terminal-loading pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-chalk/60">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-chalk/20 border-t-amber" />
              {t("terminal.loading")}
            </span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="crt-lines pointer-events-none absolute inset-0 hidden opacity-60 sm:block"
        />

        {showSetup && (
          <SetupScreen
            state={v86State}
            config={config}
            checking={v86Checking}
            onRetry={() => void retryImages()}
            onUseSimulated={() => onModeChange("simulated")}
          />
        )}

        {showStopped && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-board-deep/80 p-4">
            <div className="max-w-sm rounded-lg border border-board-line bg-board p-4 text-center text-chalk">
              <p className="text-sm font-bold">{t("terminal.notStarted")}</p>
              <button type="button" className="btn-amber mt-3" onClick={startVm}>
                <PlayIcon className="h-4 w-4" />
                {t("terminal.start")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-board-line bg-board px-3 py-2 text-[10px] text-chalk/50 sm:px-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-amber">$</span>
          {mode === "simulated" ? t("terminal.demoHint") : t("mode.v86Notice")}
        </span>
        <span className="hidden sm:inline">{t("terminal.focus")}</span>
      </div>

      {active && terminalVisible && !nearFooter && !showSetup && !showStopped && (
        <div
          className="mobile-check fixed inset-x-3 z-30 lg:hidden"
          style={keyboardInset > 0 ? { bottom: keyboardInset + 12 } : undefined}
        >
          <button
            type="button"
            className="btn-amber w-full shadow-lift"
            onClick={onCheck}
            disabled={checking || !canCheck}
            aria-label={checking ? t("terminal.checking") : t("terminal.check")}
          >
            {checking ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#222222]/30 border-t-[#222222]" />
                {t("terminal.checking")}
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                {t("terminal.check")}
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
