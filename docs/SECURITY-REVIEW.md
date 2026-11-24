# Security review — Linux Lab

Date: 2026-11-24
Scope: the client-only Linux Lab build in this repository.
Owner: Fedaa Mohamed.

## 1. Threat model

| Asset | Risk | Mitigation |
| --- | --- | --- |
| Learner progress in `localStorage` | Tampering or casual disclosure on a shared device | Contains no identity or secrets; reset action; per-browser isolation. Nothing is sent anywhere. |
| UI integrity (XSS) | Injected markup through stored data or terminal output | React escapes all text; no `dangerouslySetInnerHTML`; xterm receives text, not HTML. Source-safety test scans the tree. |
| Supply chain | Malicious/compromised npm package | Small direct dependency set, lockfile, `npm audit` 0 vulnerabilities, permissive licences only. |
| SSRF via image configuration | Operator/build env points `HEAD` at another origin | Same-origin relative paths only; `//host`, absolute URLs, `..`, query/hash and protocol forms are rejected. Tested. |
| CSP bypass | Inline scripts, remote script injection | External pre-paint bootstrap; production `script-src 'self' 'wasm-unsafe-eval'`; no inline script in `index.html`. |
| Emulator/guest image | Untrusted guest code | Images are never auto-downloaded or bundled; operator must verify checksums; browser sandbox is the only boundary. |
| Clickjacking / framing | Third-party framing of the demo | `frame-ancestors 'none'` and `X-Frame-Options: DENY`. |
| Data leakage via referrer | URL leakage to external sites | `Referrer-Policy: no-referrer`, no external links at runtime. |

Out of scope for a client-only build: login throttling, password policy, session
regeneration, server-side authorization/IDOR, CSRF, uploads, CSV formula
injection, audit logging. They become required the moment a backend exists.

## 2. What was checked

- Every route is a single static page; no router, no server actions.
- All user-controlled text renders through React interpolation.
- Terminal output is written via xterm's text API; ANSI sequences can format
  text but cannot execute code or alter the surrounding DOM.
- Lesson checks are restricted to a read-only command allowlist (no redirection,
  no mutating commands) and are covered by tests.
- Image base paths and filenames are validated. A test covers protocol-relative
  and query-bearing paths.
- `index.html` contains only external script tags; the theme bootstrap is
  `/theme-boot.js`.
- Production CSP is injected by `vite.config.ts` and also provided in
  `public/_headers`; the dev server is deliberately left without a CSP because
  Vite injects an inline React-refresh preamble.
- `npm audit` and `npm audit --omit=dev`: 0 vulnerabilities.
- No `.env` in git; `.env.example` uses `APP_DEBUG=false` and public values.
- Dialog focus trap and return-focus behaviour were added and exercised in the
  browser. The owner credit is a plain external navigation link with
  `rel="noopener noreferrer"`; it loads no resource.
- Open Graph/Twitter metadata and a local OG image were added without external
  requests.
- Mobile and desktop layouts were checked at 375×812, 390×844, 768×1024,
  1024×768 and 1440×1000 CSS pixels with no horizontal overflow.

## 3. Findings fixed during this release

1. **Inline theme script** could not run under a strict CSP. Moved to
   `public/theme-boot.js`; added a test that rejects inline script bodies.
2. **Protocol-relative image base** (`//evil.example/`) passed the old
   allowlist. Rejected now, with a regression test.
3. **No production CSP** existed in the build. Added a production-only meta CSP
   and a complete `_headers` file (CSP, HSTS, COOP, CORP, nosniff, frame denial,
   referrer and permissions policies).
4. **Dialog lacked a focus trap.** Tab now cycles inside the dialog and focus
   returns to the trigger.
5. **Source-safety regressions** (`dangerouslySetInnerHTML`, `eval`,
   `new Function`, external URLs) are now guarded by a test.
6. **Demo flag was not enforceable.** It is now a build-time constant read from
   `DEMO_MODE`, so it cannot be flipped from the console.
7. **Brand/ownership gaps.** Added proprietary licence, copyright notice,
   package metadata and source headers. The footer credit is the only UI owner
   mention and links out with `noopener noreferrer`.
8. **Blank terminal first paint.** xterm now waits for a measurable host,
   refits on ResizeObserver/window/orientation/font events, and shows a localized
   loading state instead of an unexplained black box.
9. **Arabic typography defect.** RTL content now resets Latin letter-spacing and
   uppercase tracking; the mono font is only used for codes and numbers.

## 4. Remaining risks and host duties

- The static host must actually send `_headers` (Netlify/Cloudflare Pages style).
  A plain file server that ignores it loses HSTS/COOP/frame headers; the meta CSP
  still applies.
- `style-src 'unsafe-inline'` is required by xterm's inline styles. Keep it
  scoped to styles; never extend it to scripts.
- `wasm-unsafe-eval` is required by v86. If real-VM mode is not deployed, remove
  it and the v86 chunk.
- Operator-supplied guest images remain untrusted. No malware scan or checksum
  verification is implemented in the app.
- A shared demo browser profile means shared local progress. Use separate
  profiles for kiosks or clear site data between visitors.
- `localStorage` can be edited by the visitor; progress is not a security
  control and must not be used for certification or grading records.
- No external penetration test, formal WCAG audit or browser matrix beyond
  Chromium was performed.
