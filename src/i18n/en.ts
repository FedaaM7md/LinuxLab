/*
 * English interface copy — Linux Lab.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * Voice: a patient teacher. Short sentences, concrete verbs, no marketing filler.
 */

export const en = {
  "brand.name": "Linux Lab",
  "brand.descriptor": "معمل لينكس",

  "doc.title": "Chapter {number}: {title} — Linux Lab",

  "header.skip": "Skip to main content",
  "header.courseMap": "Chapter map",
  "header.notebook": "Notebook",
  "header.terminal": "Terminal",
  "header.language": "Language",
  "header.langArabic": "العربية",
  "header.langEnglish": "English",
  "header.themeToPaper": "Switch to the paper theme",
  "header.themeToBoard": "Switch to the chalkboard theme",

  "demo.badge": "Demo",
  "demo.note": "Progress is saved in this browser only.",
  "demo.resetTitle": "Reset this demo?",
  "demo.resetBody":
    "Completed steps will be cleared and the lab restarts at Chapter 1. The current terminal session is not touched.",
  "demo.resetConfirm": "Reset demo data",

  "chapter.kicker": "Course map",
  "chapter.title": "From pwd to pipes",
  "chapter.summary": "{done} of {total} steps complete",
  "chapter.percent": "{percent}%",
  "chapter.lessonNumber": "Chapter {number}",
  "chapter.notStarted": "Not started",
  "chapter.complete": "Complete",
  "chapter.inProgress": "{done} of {total}",
  "chapter.current": "You are here",

  "lesson.kicker": "Chapter {number} · {count} steps",
  "lesson.goal": "What you will practise",
  "lesson.steps": "Step list",
  "lesson.stepOf": "Step {current} of {total}",
  "lesson.completed": "Done",
  "lesson.current": "Now",
  "lesson.upcoming": "Next",
  "lesson.hint": "Hint",
  "lesson.showHint": "Show a hint",
  "lesson.hideHint": "Hide the hint",
  "lesson.check": "Check my work",
  "lesson.checking": "Checking…",
  "lesson.autoGraded": "Graded from the terminal state with read-only checks.",
  "lesson.failed": "Not quite",
  "lesson.failedBody": "Read the step again, open the hint, then try. Nothing is lost.",
  "lesson.checkError": "The check could not run: {error}",
  "lesson.doneTitle": "Chapter finished",
  "lesson.doneBody": "Every step in this chapter is marked complete.",
  "lesson.nextLesson": "Next chapter",
  "lesson.finishCourse": "Back to Chapter 1",
  "lesson.shellNotReady":
    "The terminal is not ready. Start the VM or switch back to the simulated terminal.",
  "lesson.checklist": "What the check reads",
  "lesson.example": "Type it in the terminal",
  "lesson.demoFiles":
    "The workspace holds demo files. Changes stay in this browser tab and are not saved anywhere else.",
  "lesson.allDoneTitle": "Course finished",
  "lesson.allDoneBody":
    "All 19 steps are complete. Reopen any chapter whenever you want to practise again.",
  "terminal.windowTitle": "Bench terminal",
  "terminal.loading": "Preparing the terminal…",
  "terminal.welcome": "Welcome — type help for the command list.",
  "terminal.aria": "Interactive terminal",
  "terminal.focus": "Click the terminal to type.",
  "terminal.notStarted": "The VM is stopped. Start it to boot the guest.",
  "terminal.start": "Start",
  "terminal.stop": "Stop",
  "terminal.restart": "Restart",
  "terminal.newSession": "New session",
  "terminal.clear": "Clear screen",
  "terminal.memory": "Guest memory",
  "terminal.memoryMb": "{size} MB",
  "terminal.check": "Check step",
  "terminal.checking": "Checking…",
  "terminal.demoHint": "Virtual filesystem — changes live in this tab only.",
  "mode.simulatedShort": "Simulated",
  "mode.v86Short": "Real VM",
  "mode.simulatedBadge": "Demo",
  "mode.v86Badge": "Real VM",
  "mode.v86Notice":
    "A real Linux guest runs locally through v86. The operator supplies the image files.",
  "mode.switchAria": "Choose terminal mode",

  "status.idle": "Idle",
  "status.probing": "Checking images",
  "status.missing": "Images missing",
  "status.starting": "Starting",
  "status.running": "Running",
  "status.stopped": "Stopped",
  "status.error": "Error",
  "status.simulated": "Ready (demo)",
  "progress.completedSteps": "{done} of {total} steps",
  "progress.reset": "Reset progress",
  "progress.resetTitle": "Reset your progress?",
  "progress.resetBody":
    "Completed steps will be cleared and the lab restarts at Chapter 1. The terminal session is not touched.",
  "progress.resetConfirm": "Reset progress",

  "setup.title": "Linux images are not installed",
  "setup.body":
    "Real-VM mode needs local image files. They are not bundled, and this app never downloads them. Put them in the folder below, then check again.",
  "setup.folder": "Image folder",
  "setup.required": "Required files",
  "setup.missing": "Missing",
  "setup.found": "Found",
  "setup.unknown": "Not checked",
  "setup.biosPurpose": "x86 BIOS (SeaBIOS)",
  "setup.vgaPurpose": "VGA BIOS",
  "setup.cdromPurpose": "Bootable Linux live ISO",
  "setup.hddPurpose": "Optional hard-disk image",
  "setup.docs": "Sources, checksums and licenses are documented in docs/IMAGES.md.",
  "setup.recheck": "Check again",
  "setup.checking": "Checking…",
  "setup.useSimulated": "Use the simulated terminal",
  "setup.sizeHint":
    "The check sends an HTTP HEAD request. HTML responses, such as a dev-server fallback page, are treated as missing files.",
  "setup.simulatedFallback":
    "You can keep learning with the simulated terminal while images are unavailable.",

  "footer.demoNote": "Demo build — sample data.",
  "footer.links": "Product information",
  "footer.about": "About",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.help": "Help",
  "footer.changelog": "Changelog",
  "footer.version": "Version {version}",
  "footer.copyright": "© 2026 Linux Lab. All rights reserved.",
  "footer.credit": "Designed & built by Fedaa Mohamed",

  "info.about.title": "About Linux Lab",
  "info.about.body":
    "Linux Lab is a practice space for the Linux command line, built for Arabic-first learners and classrooms. It runs entirely in the browser.\n\nContact: {email} · {phone}\nAddress: New Cairo, Egypt\n\nVersion {version}.",
  "info.privacy.title": "Privacy",
  "info.privacy.body":
    "No accounts, no trackers, no advertising and no CDN requests.\n\nProgress, language, theme and terminal preferences are stored in this browser's localStorage only. They are never sent to a server. Clearing site data or using “Reset progress” deletes them.\n\nContact: hello@linuxlab.example",
  "info.terms.title": "Terms of use",
  "info.terms.body":
    "Linux Lab is an educational demo provided as is, without warranties of any kind.\n\nUse it for learning and practice only. Do not rely on it for production decisions, certification or assessment records.\n\nThese terms are governed by the laws of the Arab Republic of Egypt. Any dispute is subject to the courts of Cairo.\n\nContact: hello@linuxlab.example",
  "info.help.title": "Help",
  "info.help.body":
    "Start with Chapter 1 on the chapter map. Read the step, type the command in the terminal, and let the lab check your work.\n\nIf a command fails, open the hint. “Check my work” uses read-only checks; it does not change your files.\n\nReal VM mode needs local BIOS/ISO files. Without them, the simulated terminal is the intended path.\n\nProgress is saved in this browser only. Use “Reset progress” to start again.",
  "info.changelog.title": "Changelog",
  "info.changelog.body":
    "v{version} — 24 November 2026\n\nNew notebook and chalkboard identity, chapter map, hand-drawn ticks, Arabic and English copy review, discreet demo mode, privacy/terms/help pages, stronger security headers and responsive layout fixes.",

  "a11y.lessonPanel": "Lesson notebook",
  "a11y.terminalPanel": "Terminal and controls",
  "a11y.progress": "Course progress",
  "a11y.chapterMap": "Chapter map and course progress",
  "a11y.demoNote": "Demo mode notice",
  "a11y.brandHome": "Linux Lab — go to the chapter map",
  "a11y.stepList": "Steps in this chapter",
  "a11y.sectionNav": "Page sections",
  "a11y.footerLinks": "Product information and legal links",

  "mobile.tabLesson": "Notebook",
  "mobile.tabTerminal": "Terminal",

  "toast.stepComplete": "Step complete",
  "toast.lessonComplete": "Chapter complete",
  "toast.progressReset": "Progress reset",
  "toast.demoReset": "Demo data reset",
  "toast.progressRestored": "Progress restored",

  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.undo": "Undo",

  "error.storage": "Progress could not be saved in this browser.",
  "error.unknown": "Something went wrong.",
} as const;

export type TranslationKey = keyof typeof en;
