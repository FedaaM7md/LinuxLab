# INSTALL — Linux Lab

These are the exact commands used on this machine (Windows PowerShell,
Node 24.12.0, npm 11.6.2). PHP, Docker, WSL and global installs are not needed.

## 1. Prerequisites

```powershell
node -v        # v24.12.0
npm -v         # 11.6.2
git --version  # git version 2.51.1.windows.1
```

Project folder: `linuxlab`.

## 2. Install dependencies

For a fresh checkout:

```powershell
cd linuxlab
npm ci
```

`node_modules` was already present on this machine, so this release did not
re-run `npm ci`; it updated the existing tree and the lockfile with the commands
below.
The lockfile is committed. If you change dependencies, update it explicitly:

```powershell
npm install --package-lock-only
```

Fonts for the product identity (all self-hosted, OFL-1.1, exact versions):

```powershell
npm uninstall @fontsource-variable/cairo
npm install @fontsource/changa@5.3.0 @fontsource/noto-naskh-arabic@5.3.0 @fontsource/jetbrains-mono@5.3.0 --save-exact
```

No network request is made at runtime for fonts or any other asset.

## 3. Run

```powershell
npm run dev
```

The dev server is fixed to port **5176** with `--strictPort`:

```text
http://localhost:5176/
```

For the production build:

```powershell
npm run build
npm run preview
```

`preview` also uses port 5176. Stop it with `Ctrl+C` (or stop the background
job) when finished.

## 4. Quality commands

```powershell
npm run typecheck
npm test
npm run build
npm audit
```

Expected on 2026-11-24: type-check clean, **85 tests passing in 12 files**,
production build successful, `npm audit` reports 0 vulnerabilities. Real output
is in `TESTING.md`.

## 5. Demo mode

`DEMO_MODE=true` is the default. It shows the persistent demo banner and enables
the scheduled-reset check. `DEMO_MODE=false` in `.env` (or the process
environment) removes the demo banner and demo write actions from the build:

```powershell
$env:DEMO_MODE="false"
npm run build
```

The flag is baked into the bundle by `vite.config.ts`; it is not a server
setting and cannot be switched from the browser console.

Schedule a reset (the CLI is real; the scheduled task below is an operator
example and was **not** created during this task):

```powershell
npm run demo:reset
```

This writes `public/demo-reset.json` (and `dist/demo-reset.json` if a build
exists) with a new ISO timestamp. Each browser compares that timestamp with the
one it saw last time and clears only its own progress. No accounts, server or
personal data are involved.

Hourly Windows Task Scheduler example:

```powershell
schtasks /Create /SC HOURLY /TN "LinuxLabDemoReset" /TR "cmd /c cd /d linuxlab && npm run demo:reset" /ST 00:00
```

A static host can run the same command from cron before redeploying the built
folder.

## 6. Optional real-VM images (manual)

Do **not** download images automatically. After approval, place the required
files in:

```text
public/images/
```

See `docs/IMAGES.md` for filenames, sources, checksums and the serial-console
boot requirement (`console=ttyS0,115200`). Without them, the app shows the
missing-image screen and lessons continue in the simulated terminal.

## 7. Static hosting

Copy `dist/` to any static host. Replace the reserved `https://linuxlab.example/`
origin in `index.html` (canonical and Open Graph URLs) with the deployed origin;
the OG image is `public/og-cover.png` (1200×630) and the touch icon is
`public/apple-touch-icon.png`.

Production hardening files are included:

- `dist/_headers` — CSP, HSTS, COOP, CORP, nosniff, frame denial, referrer and
  permissions policies (Netlify/Cloudflare Pages format).
- A production-only CSP `<meta>` is injected at build time; development does not
  use it because Vite's React refresh preamble is inline.
- `.wasm` should be served as `application/wasm`.
- Missing images must return real `404`s, not an HTML fallback.

See `docs/SECURITY-REVIEW.md` for the threat model and remaining host duties.

## 8. Ownership and licence

`npm run build` embeds the self-hosted fonts and original assets. The project is
proprietary: see `LICENSE` and `COPYRIGHT.md`. Third-party
packages and fonts keep their own licences; see `THIRD-PARTY-NOTICES.md`.
