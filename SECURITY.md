# SECURITY — Linux Lab

This is a **client-only teaching demo**, not a production service. Full threat
model and review notes: `docs/SECURITY-REVIEW.md`.

## Deployment model

- Static build (`dist/`); no application server, database, cookies or accounts.
- No analytics, trackers, CDNs, remote fonts or third-party runtime scripts.
- No upload endpoint, no file-writing API, no outbound user URL fetches.
- Guest BIOS/ISO images are **not** bundled and never downloaded by the app.

## Implemented

- Production CSP meta tag injected at build time, plus `public/_headers`:
  `default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'` (xterm writes inline styles),
  `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`,
  `connect-src 'self'`, worker/blob image allowances for the emulator.
- External pre-paint theme script — no inline executable script.
- HSTS, COOP, CORP, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`.
- React escaping; no `dangerouslySetInnerHTML`; no `eval`/`new Function` in
  application source (tested).
- Same-origin image-path validation; protocol-relative `//host`, absolute URLs,
  `..` and query/hash paths fall back to `/images/`.
- Demo flag is build-time (`DEMO_MODE`), not a client-side toggle.
- `npm audit` (runtime and full tree): **0 vulnerabilities** at report time.
- No `.env` is committed; `.env.example` has dummy/public values and
  `APP_DEBUG=false`.
- Focus-trapped dialogs, labels, focus rings, skip link, reduced-motion support.
- The only external link is the muted footer credit with
  `rel="noopener noreferrer"`; it loads no resource.

## Not applicable / not present

There is no authentication, authorization, session, CSRF surface, password
reset, upload form, CSV export, Markdown renderer or admin audit log. If any of
those are added, they must be designed with server-side validation,
authorization, throttling, secure cookies and audit logging.

## Guest images

v86 runs operator-supplied guest code inside the browser sandbox. A malicious
image can consume CPU/RAM or exploit a browser/emulator bug. Use only trusted,
checksum-verified images; keep the browser updated. See `docs/IMAGES.md`.

## Reporting

This is a proprietary draft. Report security concerns privately to the owner;
do not publish exploit details.
