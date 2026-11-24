# TESTING — Linux Lab

Date: 2026-11-24. All results below are from commands and browsers actually run
on this machine. No test was skipped, deleted or weakened.

## 1. Environment

| Item | Value |
| --- | --- |
| Node.js | v24.12.0 |
| npm | 11.6.2 |
| Git | 2.51.1.windows.1 |
| OS | Windows, PowerShell |
| Browser used | Microsoft Edge 158 headless via DevTools Protocol |
| Dev/preview port | 5176 (`--strictPort`) |

No PHP, Docker, WSL, global npm installs or PATH changes were used.

## 2. Type-check

```powershell
npm run typecheck
```

```text
> fedaa-linux-lab@1.1.0 typecheck
> tsc --noEmit
```

Exit code 0, no diagnostics.

## 3. Unit and integration tests

```powershell
npm test
```

```text
 RUN  v5.1.1 linuxlab

 ✓ tests/shell/parser.test.ts (6 tests) 10ms
 ✓ tests/shell/vfs.test.ts (7 tests) 12ms
 ✓ tests/emulator/serial.test.ts (8 tests) 10ms
 ✓ tests/emulator/images.test.ts (11 tests) 12ms
 ✓ tests/demo/demoReset.test.ts (4 tests) 6ms
 ✓ tests/shell/contract.test.ts (1 test) 9ms
 ✓ tests/progress/progress.test.ts (6 tests) 10ms
 ✓ tests/shell/commands.test.ts (13 tests) 19ms
 ✓ tests/i18n/i18n.test.ts (7 tests) 17ms
 ✓ tests/lessons/grader.test.ts (16 tests) 27ms
 ✓ tests/security/source.test.ts (3 tests) 6ms
 ✓ tests/security/headers.test.ts (3 tests) 4ms

 Test Files  12 passed (12)
      Tests  85 passed (85)
   Start at  05:57:59
   Duration  4.79s
```

The original 72 tests still run with their original intent; 13 tests were added
for demo reset, bilingual brand copy, banned filler, security headers, source
safety and the protocol-relative image-path guard.

## 4. Production build

```powershell
npm run build
```

Final tail:

```text
dist/assets/v86-CivVqeco.wasm                                   2,000.26 kB │ gzip: 385.35 kB
dist/assets/index-BMYsZJPv.css                                     48.18 kB │ gzip:   9.65 kB
dist/assets/__vite-browser-external-DjvRwZj6.js                     0.06 kB │ gzip:   0.07 kB
dist/assets/libv86-CD84VscC.js                                    355.35 kB │ gzip:  91.61 kB
dist/assets/index-DAT2Bhk4.js                                     678.83 kB │ gzip: 191.04 kB
✓ built in 364ms
```

Expected non-fatal warnings: Vite externalizes Node built-ins referenced by
`v86/build/libv86.mjs` (`fs`, `crypto`, `node:crypto`, `node:fs/promises`,
`perf_hooks`). The module was imported in a real browser in an earlier build;
the v86 setup path was re-checked here.

The build contains a production-only CSP meta after `<meta charset>` and copies
`_headers`, `theme-boot.js`, `site.webmanifest`, `favicon.svg` and
`demo-reset.json`. Verified by reading `dist/index.html` and `dist/_headers`.

## 5. Dependency audit

```powershell
npm audit
npm audit --omit=dev
```

```text
found 0 vulnerabilities
found 0 vulnerabilities
```

## 6. Browser verification (real)

Served the production build with `npm run preview` on `http://localhost:5176`
and drove headless Edge through the DevTools Protocol.

### Final smoke (production build)

```text
{"title":"الفصل 1: التنقل في النظام — Linux Lab","lang":"ar","dir":"rtl",
 "prompt":true,"loading":false,"rows":15,"demoBar":false,"demoNote":true,
 "footerCredit":{"text":"تصميم وتطوير: فداء محمد","rel":"noopener noreferrer"},
 "footerCopyright":true,"og":true,"csp":true,"externalResources":0,
 "sw":1265,"vw":1280}
375: {"sw":375,"vw":375,"fixedCheck":{"top":762,"bottom":800},
      "letterSpacing":"normal"}
no console errors
```

- `<html lang="en" dir="ltr">`; Arabic switch gives `ar/rtl` and the title
  “الفصل 1: التنقل في النظام — Linux Lab”.
- Page title follows the active chapter and always ends with the Latin product
  name.
- No horizontal overflow (`scrollWidth` 1425 = 1440 minus the scrollbar).
- No external resource requests; CSP present; no console errors. The only
  external URL in source is the footer credit link, which loads nothing.

### Terminal rendering

- 1280×800 first paint: the xterm prompt `learner@linuxlab:~$` is present,
  rows = 15, no blank black panel. The localized loading line covers the short
  initialisation window.
- 375×812: host 349×471, 22 rows, the Arabic welcome strip is one line
  (`clientWidth` = `scrollWidth` = 349, height 28) and does not break mid-word.
- Resizing from 1440×1000 to 375×812 without reload keeps the prompt and refits
  the terminal (23 → 18 rows in the test).
- The phone check action is fixed in the viewport (`top` 762, `bottom` 800 at
  375×812) and moves with the `visualViewport` keyboard inset.

### Lesson and grading flow

Typed in the terminal with real key events; auto-grading ran after each command.

| Command | Stored steps | Progress | Result |
| --- | --- | --- | --- |
| `pwd` | 1 | 5% | Step 1 ticked |
| `cd documents` | 2 | 11% | Step 2 ticked |
| `cd ..` | 3 | 16% | Step 3 ticked |
| `cd projects` | 4 | 21% | Chapter complete card, “Next chapter”, toast |

- Chapter map updated to 4/4 and marked “Complete”.
- Hand-drawn ticks rendered in the step list.
- Manual “Check my work” on an unmet step produced “Not quite” plus the failing
  check label; the terminal “Check step” button was also present and enabled.
- The status line and prompt showed `/home/learner`, `~/documents`,
  `~/projects` correctly.

### Language, theme and mobile

- Language switch: en → ar changed `lang/dir` and the title to
  “الفصل 1: التنقل في النظام — Linux Lab”; progress was preserved.
- Theme switch changed `<html class="dark">` from light to dark after the effect
  settled.
- 375×812 and 360×800: `scrollWidth` equals the viewport (no horizontal
  overflow); header, chapter route and tabs fit. Phone screenshots use 375px.
- Chapter cards scroll horizontally in one row on phones; terminal/notebook tabs
  switch panels (`notebook:false, terminal:true` → `notebook:true,
  terminal:false`).
- 1440×1000 and 1280×800: two-column notebook/terminal layout, prompt visible.
- 768×1024 and 1024×768 were checked with no overflow; the mobile tab bar is
  hidden at 1024.

### Demo mode

- `DEMO_MODE=true` (default): one-line local-progress note under the chapter
  map, small header/footer demo marks, resettable progress. No coloured bar.
- `npm run demo:reset` wrote a new manifest; reloading cleared this browser's
  progress (1 step → 0) and stored the new epoch.
- `DEMO_MODE=false` build: no note, no “Reset demo data”, no demo tag and
  **zero** `/demo-reset.json` requests; title and lessons still work.
- Reset dialog: opened from the chapter-map button, reset progress to 0, and the
  toast offered **Undo**; clicking it restored the previous step (0 → 5%).
- Footer product information: About/Privacy/Terms/Help/Changelog opened in a
  focus-trapped sheet at 375px and 1440px with no overflow; the footer credit
  links to the owner site.

### Missing-image / real-VM path

- Switching to “Real VM” showed the setup dialog: folder `public/images/`, the
  three required files, each marked “missing”, plus the documentation note.
- Switching back to the simulated terminal removed the setup overlay.
- With the images in place (SeaBIOS / VGA BIOS from the v86 project and the
  official Alpine Linux 3.24 x86 virt ISO, SHA-256 checked against the
  published value), the real VM booted in Chrome: ISOLINUX, Alpine Linux 3.24,
  kernel 6.18 on the serial console, `root` login, and `uname`,
  `/etc/os-release`, `ls /` and `free -m` all ran inside the guest
  (24 November 2026). Lesson files were provisioned in the guest and the first
  step was graded automatically during the final review.
- The images are not committed (size and licences); see `docs/IMAGES.md`.

## 7. Accessibility

- Labels, focus rings, skip link (now `#main`), aria-live toasts with Undo,
  `aria-current` steps, progressbar values, reduced motion, and focus-trapped
  confirmation/info dialogs with focus return were exercised in the browser.
- Arabic content is checked to inherit no Latin letter-spacing
  (`getComputedStyle(...).letterSpacing === "normal"` for tags, eyebrows,
  chapter labels and footer links); the mono font is only used for commands,
  paths and numbers.
- Product information tabs wrap at 375px instead of clipping; the dialog body
  scrolls independently and focus returns to the trigger.
- Contrast ratios computed from the actual tokens:

| Pair | Ratio |
| --- | --- |
| Ink on paper | 14.98:1 |
| Muted on paper | 5.35:1 |
| Chalk on board | 10.59:1 |
| Muted on board | 6.16:1 |
| Amber ink on amber soft | 5.64:1 |
| Ink on amber | 8.68:1 |
| Success on success soft | 5.24:1 |
| Danger on danger soft | 5.63:1 |
| Amber on board deep | 8.36:1 |

No formal WCAG or screen-reader audit was performed. xterm's canvas is not
meaningful to screen readers; the terminal is labelled, but its output is not
mirrored to a live region.

## 8. Screenshots (real captures)

Screenshots were re-captured on 24 November 2026 from the running demo build with headless Chrome (desktop 1440×900, mobile 390×844, Arabic and English). The current files are in `docs/screenshots/` and are shown in the README.

## 9. Not verified

- Firefox, Safari, iOS and Android devices.
- A committed end-to-end suite (browser checks used temporary scripts that were
  removed after this report).
- Formal accessibility audit / screen-reader pass.
- The hourly scheduled task was documented but not installed on this machine.
