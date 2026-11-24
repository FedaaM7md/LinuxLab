# THIRD-PARTY NOTICES — Linux Lab

Linux Lab is proprietary (see `LICENSE`). It uses the following **direct**
third-party packages. Every direct package is MIT, BSD-2-Clause, Apache-2.0, ISC
or OFL-1.1. No GPL/AGPL/LGPL package is a direct dependency.

## Runtime dependencies

| Package | Version | License | Use |
| --- | --- | --- | --- |
| `react` | 19.3.1 | MIT | UI runtime |
| `react-dom` | 19.3.1 | MIT | DOM renderer |
| `v86` | 0.5.476 (resolved `0.5.476+g9457e7a`) | BSD-2-Clause | x86 emulator for optional real-VM mode |
| `@xterm/xterm` | 6.0.0 | MIT | Terminal rendering |
| `@xterm/addon-fit` | 0.11.0 | MIT | Terminal resize fitting |
| `@fontsource/changa` | 5.3.0 | OFL-1.1 | Self-hosted Changa (headings/UI) |
| `@fontsource/noto-naskh-arabic` | 5.3.0 | OFL-1.1 | Self-hosted Noto Naskh Arabic (lesson prose) |
| `@fontsource/jetbrains-mono` | 5.3.0 | OFL-1.1 | Self-hosted JetBrains Mono (terminal/code) |

Font authors: Changa — The Changa Project Authors; Noto Naskh Arabic — The Noto
Project Authors; JetBrains Mono — The JetBrains Mono Project Authors. The SIL
Open Font License 1.1 texts are kept in `public/font-licenses/` and copied to
`dist/font-licenses/` on every build, alongside the bundled font files.

## Development dependencies

| Package | Version | License | Use |
| --- | --- | --- | --- |
| `typescript` | 5.9.3 | Apache-2.0 | Type checking |
| `vite` | 8.3.8 | MIT | Dev server and bundler |
| `@vitejs/plugin-react` | 6.3.0 | MIT | React integration |
| `vitest` | 5.1.1 | MIT | Test runner |
| `jsdom` | 29.1.1 | MIT | DOM test environment (pinned; 31 needs a newer Node) |
| `tailwindcss` | 4.3.5 | MIT | Utility CSS |
| `@tailwindcss/vite` | 4.3.5 | MIT | Tailwind Vite plugin |
| `@types/react` | 19.2.14 | MIT | React types |
| `@types/react-dom` | 19.2.4 | MIT | React DOM types |

## Transitive dependencies

Transitive packages are pinned in `package-lock.json`. `npm audit` and
`npm audit --omit=dev` reported **0 vulnerabilities** on 2026-11-24. A manual
review found no copyleft direct dependency. This notice is not legal advice; run
a full licence audit before public redistribution.

## Not bundled: guest operating systems and firmware

No Linux distribution, ISO, SeaBIOS, VGA BIOS or disk image is distributed with
this repository. Operators supply those files locally after reviewing their
licences (SeaBIOS is LGPL-3.0; Linux distributions commonly include GPL and many
other licences). See `docs/IMAGES.md`.

## No third-party logos or web assets

The beaker-and-prompt logo, favicon, hand-drawn marks and all icons are original
SVG authored for this product. No CDN, remote font, analytics script or
third-party logo is loaded at runtime. Linux Lab does not claim ownership of any
third-party work.
