# BRAND — Linux Lab / معمل لينكس

Product name: **Linux Lab** (Latin wordmark in both languages). Arabic
descriptor: **معمل لينكس**. The owner credit lives only in the footer.

## 1. Idea

A classroom chalkboard meets a retro terminal. The lesson is a ruled notebook
page; the terminal is a bench instrument. Calm, educational, a little tactile —
not a SaaS dashboard.

## 2. Logo

- **Mark:** an Erlenmeyer beaker drawn in one uneven stroke, with an amber
  terminal prompt `>_` inside. The beaker is the lab; the prompt is the command.
- **Wordmark:** “Linux Lab” set in Changa 700, used in both languages.
  “معمل لينكس” appears as the Arabic descriptor under the wordmark.
- **Lockup:** mark in a soft square, then the Latin wordmark, then the Arabic
  descriptor. No owner name beside the logo.
- **Clear space:** at least half the mark width on all sides.
- **Minimum size:** 24px mark, 96px lockup for the wordmark to stay legible.
- **Do not:** put it in a letter avatar, add gradients/glows, rotate it, or
  recreate it from a stock icon. The source is `src/components/Brand.tsx` and
  `public/favicon.svg`.

## 3. Colour

| Token | Hex | Use |
| --- | --- | --- |
| Board | `#1F3B2D` | Header, filled buttons, chapter accents, dark surface |
| Board deep | `#16291F` / `#12211A` | Terminal frame, dark canvas |
| Chalk | `#F3EFE0` | Text on board, terminal foreground |
| Amber | `#FFB000` | Terminal prompt, primary action, “you are here”, focus on dark |
| Paper | `#FBF8EF` | Light canvas |
| Surface | `#FFFDF6` | Notebook page, cards |
| Ink | `#222222` | Primary text on paper |
| Muted | `#6A6759` | Secondary text on paper (AA at 11px+) |
| Line | `#DED5BF` | Rules and borders |
| Success | `#2C6E4F` | Completed steps |
| Danger | `#A13B2C` | Failed checks, destructive actions |

Contrast notes: ink/paper and chalk/board are high contrast; amber is used for
non-text prompts or with dark ink. Amber text on paper uses `#835600` (darker)
to stay AA. In the chalkboard theme, muted text is `#AEBCAE` on `#1F3B2D`.
Never put small chalk text on amber.

## 4. Type

| Role | Family | Licence | Notes |
| --- | --- | --- | --- |
| Headings / UI | **Changa** | OFL-1.1 | 400/600/700, Arabic + Latin |
| Arabic lesson prose | **Noto Naskh Arabic** | OFL-1.1 | 400/600, only for reading text |
| Terminal / code | **JetBrains Mono** | OFL-1.1 | 400/700, Latin codes and numbers only |

All fonts are self-hosted from `@fontsource/*`. No CDN. System fallbacks:
`Segoe UI, Tahoma` for UI and `Consolas` for mono.

Scale: 10px labels, 11–12px metadata, 13–14px UI, 15–16px lesson prose, 18–20px
step headings, 24–28px chapter titles. Arabic prose line-height ≈ 1.9; English
≈ 1.75. Use `font-variant-numeric: tabular-nums` for counts; keep Western digits
in both locales because terminal output and Linux paths use ASCII digits.

**Arabic typography rule:** never apply letter-spacing, uppercase tracking or a
monospace/Latin-only font to Arabic text. `src/styles/index.css` resets
letter-spacing for RTL content; mono is reserved for commands, paths and
numbers.

## 5. Layout personality

- Asymmetric two-column bench: notebook ~44–46%, terminal ~54–56%.
- Ruled paper background and a margin rule; plenty of vertical rhythm, no
  floating mock cards.
- Chapter map is a route of numbered chapters with per-step ticks, not a KPI
  dashboard. On phones it becomes a horizontal snap row.
- Amber is reserved for the prompt, the current step and the main action.
- Hand-drawn tick (`HandMarks.tsx`) marks completed steps. Use it once per
  completed step, not as decoration.
- Phone priority: content first, then a fixed check action within thumb reach;
  no sidebar or drawer.

## 6. Voice

Patient teacher. Explains *why* a command exists, then shows the smallest
example. Short sentences. Concrete nouns. No hype.

- English: “Read the step again, open the hint, then try. Nothing is lost.”
- Arabic: «اقرأ الخطوة مرة أخرى، وافتح التلميح، ثم حاول. لن يضيع شيء.»

Arabic is clear Modern Standard that reads naturally in Egypt. Avoid Gulf-only
or rare words, literal translations, and filler such as «بكل سهولة» or «حلول
متكاملة». Use Arabic punctuation (، ؛ ؟) in Arabic copy; dates are written out
per locale (24 نوفمبر 2026 / 24 November 2026), never as raw timezone ids.

## 7. Glossary (use consistently)

| English | Arabic | Notes |
| --- | --- | --- |
| terminal | الطرفية | Never «صدفة» for the UI |
| simulated terminal | طرفية تجريبية | The demo shell |
| real VM | جهاز حقيقي | v86 mode |
| chapter | فصل | Course unit |
| step | خطوة | Graded unit |
| check | فحص | Read-only verification |
| progress | تقدّم | Local completion |
| workspace | مساحة العمل | Seeded demo files |
| demo | تجريبي | Small note, never a loud bar |

## 8. Owner credit

- The product stands alone. No “by Fedaa”, “من فداء” or owner name appears near
  the logo, in the header, in page titles or in the app hero.
- Footer bottom line only:
  - Arabic: «© 2026 معمل لينكس. جميع الحقوق محفوظة.» then a muted
    «تصميم وتطوير: فداء محمد» linking to <https://fedaamohamed.com>.
  - English: “© 2026 Linux Lab. All rights reserved.” then a muted
    “Designed & built by Fedaa Mohamed” linking to the same page.
- Legal ownership remains in `LICENSE`, `COPYRIGHT.md`, `README.md` and package
  metadata. The footer credit is the only owner mention in the UI.

## 9. Demo and product depth

- Demo mode is a quiet local-progress note near the chapter map, plus a tiny
  footer line (“نسخة عرض — البيانات افتراضية”). No full-width coloured bar.
- The footer links to About, Privacy, Terms, Help and Changelog. Content is
  short, realistic and Egyptian in context: New Cairo address, reserved
  `@example` email, `01000000000` phone, Egyptian-law terms, localized dates.
- Never use a real company name, logo, address or contact detail.

## 10. Do / don't

**Do**

- Use paper/ink for reading, board/chalk for the terminal and header.
- Keep one amber action per view.
- Show real product UI, real commands and real numbers.
- Use logical CSS (`start/end`) and mirror layouts cleanly in RTL.
- Keep the owner credit small, in the footer, linked.

**Don't**

- Use purple/indigo gradients, glassmorphism, sparkles, emoji icons or pill
  badges on every heading.
- Say “seamless”, “elevate”, “empower”, “unlock”, “all-in-one”, «ارتقِ»,
  «حلول متكاملة», «بضغطة زر».
- Copy another product's layout, copy or palette.
- Present the simulated terminal or missing images as real.
- Name tooling or production machinery in product copy; write as the product
  owner's engineering documentation.

## 11. Ownership

© 2026 Linux Lab. All rights reserved. The brand, logo, UI, lesson text and
documentation are proprietary; see `COPYRIGHT.md` and `LICENSE`. Third-party
fonts and libraries keep their own licences (`THIRD-PARTY-NOTICES.md`).
