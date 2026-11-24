/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import wasmUrl from "v86/build/v86.wasm?url";
import { buildImageSpecs, imageUrl, probeImages, type ImageProbeDetail, type LabImageConfig } from "./images";
import { buildSerialCommand, extractSerialOutput, looksLikePrompt, looksLikeShellPrompt } from "./serial";
import { ShellError, type Shell, type ShellResult, type ShellRunOptions } from "../shell/types";

export type V86Status =
  | "idle"
  | "probing"
  | "missing-images"
  | "starting"
  | "running"
  | "stopped"
  | "error";

export interface V86State {
  status: V86Status;
  ready: boolean;
  /** A real command prompt was seen; safe to send grading commands. */
  shellReady: boolean;
  message: string | null;
  images: ImageProbeDetail[];
  basePath: string;
  memoryMb: number;
}

export interface TerminalSink {
  write(data: string): void;
}

interface SerialEmulator {
  serial0_send(data: string): void;
  add_listener(event: string, listener: (argument: unknown) => void): void;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  restart(): void;
}

interface CaptureState {
  buffer: string;
  command: ReturnType<typeof buildSerialCommand>;
  resolve: (result: { output: string; exitCode: number }) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

function createToken(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * v86-backed shell. The emulator runs entirely in the browser; images are
 * loaded from the local `public/images/` folder and are never downloaded by us.
 *
 * Serial streams are merged (2>&1) for grading, and check commands are captured
 * silently so they do not clutter the learner's terminal.
 */
export class V86Controller implements Shell {
  readonly kind = "v86" as const;
  private config: LabImageConfig;
  private state: V86State;
  private listeners = new Set<(state: V86State) => void>();
  private emulator: SerialEmulator | null = null;
  private terminal: TerminalSink | null = null;
  private capture: CaptureState | null = null;
  private bootBuffer = "";
  private lastKnownCwd = "~";
  private queue: Promise<unknown> = Promise.resolve();
  private disposed = false;
  private starting = false;
  private generation = 0;

  constructor(config: LabImageConfig) {
    this.config = config;
    this.state = {
      status: "idle",
      ready: false,
      shellReady: false,
      message: null,
      images: [],
      basePath: config.basePath,
      memoryMb: config.memoryMb,
    };
  }

  getState(): V86State {
    return this.state;
  }

  getConfig(): LabImageConfig {
    return this.config;
  }

  subscribe(listener: (state: V86State) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  attach(terminal: TerminalSink): void {
    this.terminal = terminal;
  }

  detach(): void {
    this.terminal = null;
  }

  /** Start probing and booting. Missing images resolve into the setup state, not an exception. */
  async start(): Promise<void> {
    if (this.disposed) throw new ShellError("disposed", "The VM controller has been disposed.");
    if (this.emulator || this.starting) return;
    this.starting = true;
    const generation = ++this.generation;
    this.patch({ status: "probing", ready: false, shellReady: false, message: null });

    try {
      const probe = await probeImages(this.config);
      if (generation !== this.generation) return;
      this.patch({ images: probe.details, basePath: probe.basePath });
      if (!probe.ready) {
        this.patch({ status: "missing-images", ready: false, shellReady: false });
        return;
      }

      this.patch({ status: "starting", ready: false, shellReady: false });
      const module = await import("v86");
      if (generation !== this.generation) return;
      const images = buildImageSpecs(this.config);
      const bios = images.find((entry) => entry.key === "bios");
      const vgaBios = images.find((entry) => entry.key === "vgaBios");
      const cdrom = images.find((entry) => entry.key === "cdrom");
      if (!bios || !vgaBios || !cdrom) throw new Error("Image configuration is incomplete.");

      const options: Record<string, unknown> = {
        wasm_path: wasmUrl,
        memory_size: this.config.memoryMb * 1024 * 1024,
        vga_memory_size: 4 * 1024 * 1024,
        bios: { url: imageUrl(this.config.basePath, bios.filename) },
        vga_bios: { url: imageUrl(this.config.basePath, vgaBios.filename) },
        cdrom: { url: imageUrl(this.config.basePath, cdrom.filename) },
        autostart: true,
        disable_speaker: true,
        disable_mouse: true,
      };
      if (this.config.hdd) {
        options.hda = { url: imageUrl(this.config.basePath, this.config.hdd) };
      }

      const emulator = new module.V86(options) as unknown as SerialEmulator;
      this.emulator = emulator;
      emulator.add_listener("serial0-output-byte", (byte) => {
        this.onSerialByte(Number(byte));
      });
      emulator.add_listener("emulator-started", () => {
        this.patch({ status: "running" });
      });
      emulator.add_listener("download-error", (event) => {
        const details = event as { file_name?: string } | undefined;
        this.patch({
          status: "error",
          message: `The guest image could not be loaded${
            details?.file_name ? `: ${details.file_name}` : ""
          }.`,
        });
      });
      this.patch({ status: "running", ready: false, shellReady: false });
    } catch (error) {
      if (generation !== this.generation) return;
      this.patch({
        status: "error",
        ready: false,
        shellReady: false,
        message: error instanceof Error ? error.message : "The v86 emulator could not start.",
      });
    } finally {
      if (generation === this.generation) this.starting = false;
    }
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.starting = false;
    this.cancelCapture(new ShellError("disposed", "The virtual machine was stopped."));
    const emulator = this.emulator;
    this.emulator = null;
    if (emulator) {
      try {
        await emulator.destroy();
      } catch {
        // Destroying an already-stopped emulator is harmless.
      }
    }
    this.bootBuffer = "";
    this.patch({ status: "stopped", ready: false, shellReady: false, message: null });
  }

  async reset(): Promise<void> {
    if (this.emulator) {
      this.cancelCapture(new ShellError("timeout", "The virtual machine is restarting."));
      this.bootBuffer = "";
      this.patch({ status: "starting", ready: false, shellReady: false, message: null });
      this.emulator.restart();
      return;
    }
    await this.start();
  }

  setMemoryMb(memoryMb: number): void {
    if (this.emulator) return;
    this.config = { ...this.config, memoryMb };
    this.patch({ memoryMb });
  }

  /** Forward learner keystrokes to the guest's serial console. */
  sendInput(data: string): void {
    if (!this.emulator || this.capture) return;
    try {
      this.emulator.serial0_send(data);
    } catch {
      // The guest may not be ready yet; dropping input is preferable to crashing.
    }
  }

  /** Write a short status line into the attached terminal (not the guest). */
  writeNotice(text: string): void {
    this.terminal?.write(`\r\n\u001b[2m${text}\u001b[0m\r\n`);
  }

  run(command: string, options: ShellRunOptions = {}): Promise<ShellResult> {
    const started = Date.now();
    const timeoutMs = options.timeoutMs ?? 10000;
    const task = this.queue.then(async () => {
      if (!this.emulator) {
        throw new ShellError("not-ready", "The virtual machine is not running.");
      }
      const token = createToken();
      const serialCommand = buildSerialCommand(command, token);
      const extraction = await this.captureCommand(serialCommand, timeoutMs);
      const stdout = extraction.output;
      const trimmedCommand = command.trim();
      if (trimmedCommand === "pwd" && /^\/\S*$/.test(stdout.trim())) {
        this.lastKnownCwd = stdout.trim();
      }
      return {
        stdout,
        stderr: "",
        exitCode: extraction.exitCode,
        cwd: this.lastKnownCwd,
        durationMs: Date.now() - started,
      } satisfies ShellResult;
    });
    this.queue = task.catch(() => undefined);
    return task;
  }

  getCwd(): string {
    return this.lastKnownCwd;
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    await this.stop();
    this.listeners.clear();
    this.terminal = null;
  }

  private captureCommand(
    command: ReturnType<typeof buildSerialCommand>,
    timeoutMs: number,
  ): Promise<{ output: string; exitCode: number }> {
    const emulator = this.emulator;
    if (!emulator) {
      return Promise.reject(new ShellError("not-ready", "The virtual machine is not running."));
    }
    return new Promise((resolve, reject) => {
      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              this.cancelCapture(new ShellError("timeout", "The serial console did not answer in time."));
            }, timeoutMs)
          : null;
      this.capture = {
        buffer: "",
        command,
        resolve,
        reject,
        timer,
      };
      try {
        emulator.serial0_send(`${command.script}\n`);
      } catch (error) {
        this.cancelCapture(
          error instanceof Error ? error : new ShellError("not-ready", "The serial console is unavailable."),
        );
      }
    });
  }

  private onSerialByte(byte: number): void {
    const char = String.fromCharCode(byte);
    if (this.capture) {
      this.capture.buffer += char;
      const extracted = extractSerialOutput(this.capture.buffer, this.capture.command);
      if (extracted) {
        const capture = this.capture;
        this.capture = null;
        if (capture.timer) clearTimeout(capture.timer);
        capture.resolve(extracted);
      }
      return;
    }

    this.terminal?.write(char);

    if (!this.state.shellReady) {
      this.bootBuffer += char;
      if (this.bootBuffer.length > 8192) {
        this.bootBuffer = this.bootBuffer.slice(-4096);
      }
      if (looksLikeShellPrompt(this.bootBuffer)) {
        this.bootBuffer = "";
        this.patch({ ready: true, shellReady: true });
      } else if (!this.state.ready && looksLikePrompt(this.bootBuffer)) {
        this.patch({ ready: true });
      }
    }
  }

  private cancelCapture(error: Error): void {
    const capture = this.capture;
    if (!capture) return;
    this.capture = null;
    if (capture.timer) clearTimeout(capture.timer);
    capture.reject(error);
  }

  private patch(update: Partial<V86State>): void {
    this.state = { ...this.state, ...update };
    for (const listener of this.listeners) listener(this.state);
  }
}
