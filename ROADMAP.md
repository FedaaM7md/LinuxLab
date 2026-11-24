# ROADMAP — Linux Lab

This is an honest list. Items marked **missing** were not done; nothing here is
claimed as finished without evidence in `TESTING.md`.

## Done in this release

- New identity: beaker-and-prompt mark, paper/chalkboard palette, Changa +
  Noto Naskh Arabic + JetBrains Mono, lesson-notebook layout, chapter map,
  hand-drawn step marks.
- Full Arabic/English copy review, logical CSS, print styles, focus states and
  a focus-trapped confirmation dialog.
- Demo mode: quiet local-progress note, local reset with Undo, `npm run
  demo:reset`, scheduled reset manifest and per-browser isolation.
- Ownership files: proprietary `LICENSE`, `COPYRIGHT.md`, footer copyright,
  package metadata and source headers.
- Security: production CSP meta + static security headers, external pre-paint
  script (no inline script), same-origin image-path guard against `//host`
  SSRF, dependency audit, source-safety tests.
- Documentation refresh and fresh real screenshots (AR/EN, 375px phone,
  1280/1440 desktop, paper/chalkboard, footer/About).
- Review fixes: reliable first-paint terminal fitting, short/LTR terminal
  welcome with an Arabic HTML line, quiet demo note instead of a coloured bar,
  Latin wordmark + Arabic descriptor, fixed phone check action, footer-only
  owner credit, About/Privacy/Terms/Help/Changelog sheets, OG/Twitter metadata,
  RTL letter-spacing reset, no new libraries.

## Missing or unverified

1. **Real v86 guest boot is unverified.** No BIOS/ISO images are bundled, so
   guest login, serial prompt detection against a real kernel, in-guest
   provisioning and in-guest grading were not executed. The controller,
   image-probe and setup screen are tested; the rest is documented as untested.
2. **No committed end-to-end browser suite.** Browser checks were run with
   temporary headless Edge + DevTools Protocol scripts that were removed. A
   Playwright suite is a sensible next step.
3. **No screen-reader or formal WCAG audit.** Labels, focus rings, skip link,
   aria-live regions, reduced motion and a focus trap exist; no NVDA/VoiceOver
   pass was performed.
4. **Chromium-only browser checks.** Edge 158 headless was used; Firefox and
   Safari were not tested.
5. **No per-visitor demo accounts.** The build is client-only; isolation comes
   from separate browser storage. There is no server-side identity or sync.
6. **The simulated terminal is intentionally small.** No globbing, variables,
   command lists, job control, tab completion or `sudo`.
7. **Scheduled hourly reset is documented, not installed.** The `demo:reset`
   command was run; the Windows Task Scheduler entry was not created on this
   machine.
8. **Real VM images are operator-supplied.** No integrity or malware scan is
   performed; HEAD probing is only a usability check.
9. **No account features, uploads, exports or audit log.** These do not exist
   in a client-only lab; if a backend is added they become requirements.
10. **No dark-mode print variant.** Print styles force a clean light page.
11. **Canonical and Open Graph URLs use the reserved `linuxlab.example`
    placeholder.** A deployer must replace it with the real origin; the local
    `og-cover.png` is already included.

## Nice to have

- Playwright tests for lesson completion, language switch, demo reset and the
  missing-image screen.
- Optional per-chapter free-play sandbox with a command palette.
- Export/import of progress as JSON (with a clear local-only warning).
- More chapters (processes, networking, package management) with the same
  notebook/terminal layout.
- A verified, checksum-pinned image recipe for classroom use after licence
  review.
