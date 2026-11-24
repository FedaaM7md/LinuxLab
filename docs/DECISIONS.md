# DECISIONS — Linux Lab

Decisions are listed with the trade-off that came with them.

1. **Keep the working Shell/grader model.** This release is an upgrade, not a
   rewrite. The `Shell` interface, virtual filesystem, read-only grader and
   progress schema are preserved so the original tests keep their meaning.
2. **Identity first, not a skin.** The palette, type, logo, layout and copy were
   redesigned around “classroom notebook + bench terminal”. Existing utility
   classes were not reused just because they existed.
3. **Paper is light, chalkboard is dark.** The theme names are literal: light is
   `#FBF8EF` paper with ink; dark is `#1F3B2D` board with chalk. Both use the
   same semantic tokens, so contrast is tuned once per theme.
4. **Changa + Noto Naskh Arabic + JetBrains Mono.** Changa carries headings and
   UI, Naskh is reserved for Arabic reading text, JetBrains Mono for the
   terminal. Cairo was removed because the identity does not name it. All are
   OFL and self-hosted from `@fontsource` packages.
5. **Asymmetric split.** The notebook is ~44–46% and the terminal ~54–56%.
   Equal columns made the two jobs look interchangeable; they are not.
6. **Chapter map instead of a KPI card.** Progress is expressed as four
   numbered chapters with per-step ticks. On phones the chapters become a
   horizontal, snap-scrolling route so the lesson stays close to the first
   screen.
7. **Hand-drawn ticks are a component, not a font glyph.** `HandMarks.tsx`
   draws the tick with two uneven strokes. It can inherit colour and does not
   add an icon dependency.
8. **Original SVG icons.** Keeping one small outline set authored for this
   product avoids a runtime icon dependency and any third-party logo risk.
9. **Terminal output stays LTR/English.** xterm.js does not implement bidi or
   Arabic shaping. Translating the terminal banner into Arabic would produce
   broken joined text and confusing prompts, so all UI labels are translated but
   the terminal buffer remains LTR. This is documented in the component.
10. **Keep legacy storage keys.** Keys remain `fedaa.linuxlab.*` so existing
    progress survives the redesign. They are internal identifiers, not visible
    brand copy; the vendor prefix is allowed.
11. **Static demo reset via a manifest, not a server.** `demo:reset` writes an
    ISO timestamp. Each browser clears its own progress when it sees a newer
    timestamp. This gives scheduled resets on a static host and keeps visitors
    isolated without accounts.
12. **A first visit is not a reset.** If there is no stored epoch, the app only
    records the current one. Otherwise deploying the reset feature would erase
    every visitor's progress on their next visit.
13. **Demo mode is a build flag.** `DEMO_MODE` is parsed in `vite.config.ts` and
    injected as a constant. A client-side toggle would be a fake control and a
    console user could hide the banner.
14. **Production CSP only.** Vite's React-refresh preamble is inline in dev, so
    a strict `script-src` would break the dev server. The build injects a meta
    CSP; `_headers` covers hosts that support real headers. The dev server is
    explicitly documented as not production.
15. **External pre-paint script.** The old inline theme script could not run
    under the new CSP. `/theme-boot.js` is tiny, blocking and cacheable; it also
    supports `?lang=` and `?theme=` for QA and screenshots.
16. **`style-src 'unsafe-inline'` is accepted for now.** xterm sets inline
    styles on its DOM. Restricting scripts is the higher-value control; the
    review documents the trade-off.
17. **Same-origin images only.** Image URLs are operator configuration and were
    a potential SSRF vector. Protocol-relative `//host`, absolute URLs, `..`,
    query and hash paths are rejected with tests.
18. **Focus trap in the confirm dialog.** The dialog is the only modal surface;
    trapping Tab and restoring focus to the trigger is cheap and measurable.
19. **No router.** The product is one workspace. A fake `/login` route would add
    surface without a backend; client-only apps are required to open directly
    into the demo.
20. **Proprietary licence.** `LICENSE` is the operative notice. Third-party
    fonts and packages keep their licences.
21. **No owner credit near the brand.** The product name stands alone; the
    wordmark is Latin in both languages with the Arabic descriptor under it. The
    only UI owner mention is the quiet footer link to `fedaamohamed.com`.
22. **Quiet demo note instead of a coloured bar.** A learning app should not
    shout at the learner. The local-progress note sits under the chapter map,
    and a tiny footer line marks the demo build. `DEMO_MODE=false` removes both.
23. **Product information sheets, not a router.** About, Privacy, Terms, Help
    and Changelog are short, translated, focus-trapped sheets deep-linked by
    hash. This gives real destinations without adding a routing dependency.
24. **Robust terminal fitting.** xterm is fitted only when the host has size,
    with ResizeObserver, window/orientation events, font readiness and a retry
    loop. A localized HTML welcome strip carries Arabic; the LTR buffer stays
    short so phones never wrap mid-word.
25. **Sticky phone check action.** The check button is a fixed thumb-reach
    action on narrow screens, moved above the visual-viewport keyboard inset.
    Desktop keeps a compact toolbar button.
26. **RTL letter-spacing reset.** Arabic never inherits Latin tracking or
    uppercase styling; a global RTL utility resets letter-spacing and the mono
    font is reserved for commands, paths and numbers.
27. **No new libraries.** Product info, the dialog focus trap, the OG image and
    all marks are original code/assets. Existing xterm and v86 were part of the
    original specification and remain.
28. **Metadata without a fake deployment.** `index.html` has a real description,
    OG/Twitter tags and a local 1200×630 cover. The canonical/OG origin uses the
    reserved `linuxlab.example` placeholder documented in `INSTALL.md`, so a
    deployer must replace it with the real origin.
