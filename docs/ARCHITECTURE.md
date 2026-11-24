# ARCHITECTURE — Linux Lab

## 1. Shape of the system

```text
┌──────────────────────────── Browser (no app server) ───────────────────────────┐
│                                                                                │
│  React UI: Header / ChapterMap / LessonPanel / TerminalCard / SetupScreen      │
│      │                    │                          │                        │
│      │ grade requests     │ terminal input/output    │ language/theme         │
│      ▼                    ▼                          ▼                        │
│  Lesson grader ──────► Shell interface ◄────── xterm.js front end             │
│      │                    │     ▲                    ▲                        │
│      │ read-only checks   │     │                    │ serial bytes           │
│      ▼                    ▼     │                    │                        │
│  Lesson data        SimulatedShell (virtual FS)   V86Controller ──────────────┐│
│                     & command parser                │ dynamic import         ││
│                                                     ▼                        ││
│                                              v86 emulator + WASM             ││
│                                                     │                        ││
│                                              local images in /images/        ││
└────────────────────────────────────────────────────────────────────────────────┘
```

Everything is client-side. `npm run build` produces a static `dist/` that can be
hosted on any static file server. A scheduled demo reset changes one JSON file
(no server required).

## 2. Module map

```text
src/
├─ main.tsx                 React bootstrap, xterm CSS, global styles
├─ App.tsx                  orchestration: mode, progress, grading, demo reset, dialogs
├─ styles/index.css         design tokens (paper/chalkboard), fonts, base + print CSS
├─ i18n/
│  ├─ en.ts, ar.ts          flat, typed UI dictionaries (identical key sets)
│  ├─ index.ts              translate() + locale guard
│  └─ I18nProvider.tsx      locale context, <html lang dir>, persistence
├─ lib/
│  ├─ appMeta.ts            version, support details and the owner credit URL
│  ├─ storage.ts            safe localStorage access + key registry
│  ├─ useDialogFocus.ts     shared focus trap, Escape and focus return
│  └─ useTheme.ts           paper/chalkboard theme sync + persistence
├─ demo/
│  ├─ demoMode.ts           DEMO_MODE parsing + build-time flag
│  └─ demoReset.ts          reset manifest parsing and first-visit rules
├─ shell/
│  ├─ types.ts              Shell interface + ShellResult + ShellError
│  ├─ vfs.ts                virtual filesystem (nodes, modes, copy/move…)
│  ├─ parser.ts             quotes, escapes, pipes, redirects
│  ├─ commands.ts           ~20 demo commands (read + mutate)
│  └─ simulatedShell.ts     pipeline execution, prompt, history, reset
├─ emulator/
│  ├─ images.ts             image config, same-origin URL building, HEAD probing
│  ├─ serial.ts             serial framing, marker extraction, prompt detection
│  └─ v86Controller.ts      v86 lifecycle, serial bridge, Shell implementation
├─ lessons/
│  ├─ lessons.ts            bilingual lesson/step/check content + v86 seed script
│  └─ grader.ts             read-only enforcement + expectation evaluation
├─ progress/progress.ts     versioned progress model and computations
├─ types/ui.ts              UI-only unions (mode, feedback)
└─ components/
   ├─ Brand.tsx             beaker mark + Latin wordmark + Arabic descriptor
   ├─ Header.tsx            sticky board-green bench strip
   ├─ ChapterMap.tsx        chapter route, step progress and quiet demo note
   ├─ LessonPanel.tsx       ruled notebook lesson page
   ├─ TerminalCard.tsx      xterm bench, robust fit, welcome strip, mobile check
   ├─ SetupScreen.tsx       missing-image dialog
   ├─ HandMarks.tsx         hand-drawn tick/underline
   ├─ Icons.tsx             original outline icon set
   ├─ InfoDialog.tsx        About, Privacy, Terms, Help, Changelog
   ├─ ConfirmDialog.tsx     focus-trapped destructive dialog
   ├─ Toast.tsx             status toast with optional Undo
   └─ Footer.tsx            product links, demo note, copyright and credit
tests/                      12 Vitest files, 85 tests
scripts/demo-reset.mjs      demo:reset CLI
public/theme-boot.js        pre-paint theme/locale bootstrap (external, CSP-safe)
public/_headers             static security headers
public/og-cover.png         1200×630 social preview
public/apple-touch-icon.png 180×180 touch icon
index.html                  title, description, canonical URL, Open Graph/Twitter tags
docs/                       architecture, brand, decisions, images, security review
```

## 3. The Shell contract

Both backends implement `src/shell/types.ts`:

```ts
interface Shell {
  readonly kind: "simulated" | "v86";
  run(command: string, options?: { timeoutMs?: number }): Promise<ShellResult>;
  getCwd(): string;
  reset(): Promise<void>;
  dispose(): Promise<void>;
}

interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
  durationMs: number;
}
```

User mistakes (unknown command, missing file) resolve with non-zero exit codes
and stderr; they do not reject. The grader relies on this to distinguish a
failing check from a broken backend. Infrastructure problems (timeout, disposed
shell, VM not running) throw `ShellError`.

### Simulated backend

`SimulatedShell` seeds an in-memory VFS, parses a command line, executes a
pipeline segment by segment, routes pipes/redirects, and returns the final
status. `cd` updates the cwd; other commands receive it as context. Tests cover
VFS semantics, parsing, commands and the interface contract.

### v86 backend

`V86Controller` wraps a v86 instance:

1. Probe local images with `HEAD` (`images.ts`); only same-origin relative
   paths are accepted.
2. Dynamically import `v86`, construct it with BIOS/VGA BIOS/ISO URLs and the
   configured memory, and boot the guest.
3. Bridge `serial0-output-byte` to the attached terminal and terminal input to
   `serial0_send`.
4. Detect a shell prompt (`#`/`$`) separately from a login prompt.
5. Grade through a framed command:

   ```sh
   printf '%s%s_B\n' '__LINUXLAB_' '<token>'; { <command> ; } 2>&1; \
     printf '%s%s_D_%s\n' '__LINUXLAB_' '<token>' "$?"
   ```

   Markers are assembled from split literals so the echoed script cannot be
   mistaken for a marker. Check output is captured silently.
6. When the shell is ready, `App` runs a one-line POSIX provisioning script to
   seed the same demo workspace under `~`.

The stream is merged (`2>&1`) for grading; `stderr` from the V86 backend is
therefore empty and errors appear in `stdout`.

## 4. Grading flow

```text
user command (terminal) ──► Shell.run(command)
        │
        └─► onCommandExecuted ──► gradeStep(current step)

manual Check ─────────────────► gradeStep(current step)

gradeStep:
  for each check:
    assert read-only (pwd|ls|cat|grep|wc|echo|whoami|uname; no redirect)
    Shell.run(check.command) with timeout
    evaluate expectation against normalised stdout / exit code
  step passes only if every check passes and no error occurred
```

- Checks are read-only by construction, so grading never mutates the learner's
  files or cwd. A test asserts this for every lesson and rejects unsafe commands
  at runtime.
- Checks use file state (`ls`, `cat`) or cwd (`pwd`), e.g. “did `~/practice`
  appear?”.
- Lessons 2–4 use `~/` paths so a learner who ended Chapter 1 inside
  `~/projects` can still complete them. A test runs all three from a non-home
  cwd.
- Auto-grade failures are silent; manual checks show which labelled condition
  failed without revealing expected values.

## 5. Progress model

`ProgressData` (version 1):

```ts
{
  version: 1,
  completed: { "lessonId:stepId": true },
  lastLessonId: "navigation" | ... | null,
  updatedAt: ISO-8601
}
```

Stored under `fedaa.linuxlab.progress.v1` (legacy key kept for continuity). The
loader validates shape and ignores malformed JSON. The active step is the first
incomplete step of the active chapter. Other keys: locale, theme, shell mode,
guest memory, demo epoch.

## 6. Demo reset

- `DEMO_MODE` is read by `vite.config.ts` and injected as `__DEMO_MODE__`
  (`loadEnv` plus `parseDemoFlag`). Default true.
- `npm run demo:reset` writes `public/demo-reset.json` with a new ISO timestamp
  (and `dist/demo-reset.json` when a build exists).
- On load, the app fetches the manifest with `cache: "no-store"`, validates it,
  and compares it with the epoch stored in this browser. A newer timestamp
  clears only that browser's progress. A first visit is never a reset.
- The UI shows a small local-progress note under the chapter map, not a
  full-width bar. The reset action is the chapter-map button and uses a
  focus-trapped confirmation; the terminal session is not touched. Manual reset
  shows an Undo action in the toast.
- When `DEMO_MODE=false`, the note, header tag and manifest check disappear and
  the reset command is unnecessary. There is no route to return 404 because the
  app has no router or login.

## 7. i18n, direction, theming

- `en.ts` is the source of the key union; `ar.ts` is typed as
  `Record<TranslationKey, string>`; tests compare key sets, placeholders and
  banned filler.
- `I18nProvider` writes `document.documentElement.lang` and `dir` and persists
  the locale. Arabic is the default.
- Layout uses logical CSS (`ms-*`, `me-*`, `start/end`, `rtl:` variants).
  The terminal always stays LTR because shell output is LTR and xterm has no
  bidi/shaping support.
- Design tokens live in `src/styles/index.css` (`@theme inline` + CSS vars).
  Light = paper, dark = chalkboard. Fonts: Changa, Noto Naskh Arabic, JetBrains
  Mono, all self-hosted. Arabic content never inherits Latin letter-spacing.
- Theme is a `dark` class on `<html>`; `/theme-boot.js` applies it before paint
  to avoid a flash and to avoid an inline script under CSP.
- `InfoDialog` provides short About, Privacy, Terms, Help and Changelog sheets,
  deep-linked through `#about`, `#privacy`, `#terms`, `#help`, `#changelog`.
  `useDialogFocus` is shared by it and the destructive confirmation dialog.

## 8. Terminal fitting and mobile check

- xterm is opened, then fitted only after the host has a non-zero size. A
  `ResizeObserver`, window resize, orientation change and a short retry loop
  all schedule a fit; `document.fonts.ready` triggers another fit so the first
  prompt is visible without a blank box.
- The welcome instruction is rendered as an HTML strip above the terminal,
  where Arabic shaping and bidi work. The xterm buffer stays short and LTR.
- On narrow screens the terminal check button is a fixed action above the
  safe-area/keyboard inset (using `visualViewport`), so it stays reachable while
  typing. The desktop toolbar keeps its own check button.

## 9. Image detection

`probeImages()` sends same-origin `HEAD` requests and classifies files as missing
on non-2xx, `text/html`, or implausibly small `content-length`. This handles the
dev-server SPA fallback without downloading a whole ISO. Tests inject fake fetch
implementations. Base paths reject absolute URLs, `//host`, `..`, query and hash
forms. See `docs/IMAGES.md`.

## 10. Security boundaries

- No backend, cookies, accounts, analytics, CDNs or third-party scripts.
- React escapes all text; no `dangerouslySetInnerHTML` (tested). Terminal output
  is written through xterm's text API, not as HTML.
- Production CSP meta is injected only in `build`; `public/_headers` carries CSP
  and the other headers. Inline style is allowed only for xterm's DOM styles.
- Dialogs trap focus and restore it; the theme bootstrap is external. The only
  external URL in application source is the muted footer credit to
  `https://fedaamohamed.com`, a plain navigation link that loads no resource.
- `index.html` carries title, description, canonical URL and Open Graph/Twitter
  metadata; the social image is a local 1200×630 PNG.
- v86 guest images are operator-supplied and must be trusted. See
  `docs/SECURITY-REVIEW.md`.

## 11. Build and bundle notes

- `v86` is dynamically imported only when real-VM mode starts.
- Vite externalizes Node built-ins referenced by `libv86.mjs`; warnings are
  expected and non-fatal.
- Tailwind 4 uses the Vite plugin; no PostCSS config is required.
- `_headers`, `theme-boot.js`, `site.webmanifest`, `favicon.svg` and
  `demo-reset.json` are copied from `public/`.
