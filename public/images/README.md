# v86 image folder

This folder is intentionally **empty of binaries**. No BIOS or Linux images are
downloaded by this project. The operator must obtain them manually after
approval and place them here (or in a folder configured with
`VITE_IMAGE_BASE_PATH`).

Default expected files:

| File           | Purpose                              |
| -------------- | ------------------------------------ |
| `seabios.bin`  | SeaBIOS x86 BIOS used by v86         |
| `vgabios.bin`  | VGA BIOS used by v86                 |
| `linux.iso`    | Bootable Linux live ISO (serial-capable) |

See `docs/IMAGES.md` for official sources, checksum guidance and licensing.

These files are excluded from git by `.gitignore` (`public/images/*`).
