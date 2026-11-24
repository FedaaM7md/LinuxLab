# Linux and BIOS images

**Status: images are intentionally absent.** This repository does not contain,
download, mirror, or auto-fetch any BIOS or Linux image. Real-VM mode stays in
the clearly-labelled “images missing” state until an operator adds files.

The application only ever requests the configured files from its own origin
(`public/images/` by default). There are no CDNs, image registries, or remote
downloads at runtime.

## Where files go

With `npm run preview` or static hosting, files in `public/images/` are copied
into `dist/` at build time, so run `npm run build` again after adding or
replacing images.

Default folder:

```text
public/images/
```

Default filenames:

| File | Purpose | Approx. size | Required |
| --- | --- | --- | --- |
| `seabios.bin` | x86 BIOS for the v86 machine | ~128 KB | Yes |
| `vgabios.bin` | VGA BIOS | ~36 KB | Yes |
| `linux.iso` | Bootable Linux live ISO | hundreds of MB | Yes |
| (optional) `disk.img` | Writable hard-disk image | varies | No |

All names are configurable at build time through `.env` (never committed):

```dotenv
VITE_IMAGE_BASE_PATH=/images/
VITE_V86_BIOS_FILE=seabios.bin
VITE_V86_VGA_BIOS_FILE=vgabios.bin
VITE_V86_CDROM_FILE=linux.iso
VITE_V86_HDD_FILE=
```

Invalid paths, absolute URLs, protocol-relative `//host` paths, `..` segments,
query/hash strings, absolute filenames and non-allowlisted memory values fall
back to safe defaults. See `src/emulator/images.ts`.

`.gitignore` excludes `public/images/*` except `public/images/README.md`.

## Official sources (manual download after approval)

These are the official upstream locations at the time of writing. The project
owner must review the licence terms before downloading or redistributing
anything.

1. **SeaBIOS binaries** — <https://www.seabios.org/Releases/>
   - Use the compiled `bios.bin` / `vgabios.bin` artifacts from your trusted
     distribution, or build from source.
   - SeaBIOS is distributed under the GNU LGPL v3. The BIOS images are **not**
     a dependency or bundled asset of this app; they are operator-supplied
     guest firmware, and their license is separate from this project's code.
2. **Alpine Linux (recommended for a small live ISO)** —
   <https://alpinelinux.org/downloads/>
   - Choose the **x86 (32-bit) virt ISO**, for example
     `alpine-virt-<version>-x86.iso` (about 50 MB). v86 emulates a 32-bit x86
     PC, so x86_64 ISOs will not boot.
   - Verified with Alpine 3.24 x86 virt: at the `boot:` prompt type
     `virt console=ttyS0,115200`, log in as `root`, and the lesson workspace is
     provisioned automatically.
   - Alpine packages use a mixture of licenses (MIT, BSD, Apache-2.0, GPL and
     others). The ISO is a collective work; do not redistribute it unless you
     have verified the applicable terms.
3. **Debian live / netinst** — <https://www.debian.org/CD/live/>
   - Larger, mixed licensing including GPL components. Local evaluation use is
     fine; redistribution requires review.
4. **Buildroot** — <https://buildroot.org/download.html>
   - Build your own minimal image with a serial console and known licenses.

Do not use random “prebuilt v86 images” from unofficial mirrors. Verify
SHA-256 checksums from the upstream release page before use.

## Checksums

The project does not verify image content beyond basic plausibility. Operators
should verify upstream checksums themselves:

```powershell
Get-FileHash .\public\images\seabios.bin -Algorithm SHA256
Get-FileHash .\public\images\vgabios.bin -Algorithm SHA256
Get-FileHash .\public\images\linux.iso -Algorithm SHA256
```

Compare each digest with the value published by the source. Record the values
in your private deployment notes (not in git).

## Boot requirements for the lessons

The v86 controller bridges **serial port 0** to xterm. The guest must therefore
print a shell prompt on `ttyS0`:

1. Boot the ISO.
2. At the bootloader, add the kernel parameter:

   ```text
   console=ttyS0,115200
   ```

   - Syslinux (Alpine): press **Tab**, append the parameter, press Enter.
   - GRUB (Debian): press **e**, edit the `linux` line, press Ctrl+X.
3. Wait for `login:` in the terminal.
4. Log in (Alpine live typically allows `root` with no password; follow your
   image's documentation). A `#` or `$` shell prompt must appear.
5. The app detects the shell prompt, then provisions the labelled demo
   workspace under the user's home directory and enables Check/grading.

If the guest only shows a login prompt, the app marks the VM running but keeps
grading disabled (`shellReady`). Log in once; the shell prompt activates
grading and workspace provisioning.

Auto-login is recommended for classroom use, but no custom ISO is shipped.
Example getty override (only on an image you control):

```sh
# /etc/inittab or a systemd unit — for reference only, not applied by this app
ttyS0::respawn:/sbin/getty -L ttyS0 115200 vt100
```

## Image detection behaviour

Before booting, the controller sends HTTP `HEAD` requests to each configured
file and treats a file as **missing** when:

- the response status is not 2xx;
- the content type is `text/html` (typical for dev-server SPA fallbacks, which
  would otherwise return `index.html` with status 200);
- a `content-length` is present and smaller than a conservative minimum
  (32 KB BIOS, 4 KB VGA BIOS, 1 MB ISO/disk).

If `content-length` is absent, the file is considered present; a real download
failure is then reported by v86 in the terminal status area. Detection is a
usability check, not an integrity or malware check.

## Licenses summary

| Artifact | Upstream license | Bundled here? |
| --- | --- | --- |
| SeaBIOS firmware | LGPL-3.0 | No |
| VGA BIOS (SeaBIOS build) | LGPL-3.0 | No |
| Alpine ISO | Mixed (per package) | No |
| Debian ISO | Mixed, incl. GPL | No |
| v86 emulator npm package | BSD-2-Clause | Yes (npm dependency) |

This project's direct dependencies themselves contain no GPL/AGPL/LGPL code;
the guest OS and firmware are external operator-supplied artifacts. See
`THIRD-PARTY-NOTICES.md`.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Setup screen lists files as missing | Files absent, wrong folder, or dev server returned HTML | Place files in `public/images/`, restart the dev server, press “Check again” |
| “Found” but boot fails | Wrong/corrupt BIOS or ISO | Re-download, verify checksum, check browser console |
| Boot output appears but no grading | Login prompt, no serial console, or no shell prompt | Add `console=ttyS0,115200`, log in, or configure auto-login |
| Commands time out | Guest is not at a shell prompt | Log in; wait for boot to finish |
| Lesson files absent | Provisioning could not run | Check that `~` is writable and the shell is POSIX-like; reload the workspace |

## Security

Treat guest images as untrusted code. The v86 emulator runs them in a browser
sandbox, but a malicious image can still consume CPU/RAM, attempt network
access depending on configuration, or exploit a browser/emulator bug. Use only
trusted, checksum-verified images and keep the browser updated. See
`SECURITY.md`.
