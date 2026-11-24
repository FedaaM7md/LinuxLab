/*
 * Linux Lab header: a board-green bench strip with the beaker lockup.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { BrandLockup } from "./Brand";
import { GlobeIcon, MoonIcon, SunIcon } from "./Icons";
import { useI18n } from "../i18n/I18nProvider";
import type { Theme } from "../lib/useTheme";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  demoMode: boolean;
}

export function Header({ theme, onToggleTheme, demoMode }: HeaderProps) {
  const { locale, setLocale, t } = useI18n();
  const nextThemeLabel =
    theme === "dark" ? t("header.themeToPaper") : t("header.themeToBoard");

  return (
    <header className="sticky top-0 z-40 border-b-2 border-amber/70 bg-board text-chalk">
      <div className="mx-auto flex h-[var(--header-h)] w-full max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:px-8">
        <a
          href="#chapter-map"
          className="min-w-0 rounded-lg focus-visible:outline-offset-4"
          aria-label={t("a11y.brandHome")}
        >
          <BrandLockup tone="chalk" compact />
        </a>

        <nav className="ms-4 hidden items-center gap-1 md:flex" aria-label={t("a11y.sectionNav")}>
          <a
            href="#chapter-map"
            className="rounded-md px-2.5 py-2 text-xs font-semibold text-chalk/75 transition-colors hover:bg-white/10 hover:text-chalk"
          >
            {t("header.courseMap")}
          </a>
          <a
            href="#lesson"
            className="rounded-md px-2.5 py-2 text-xs font-semibold text-chalk/75 transition-colors hover:bg-white/10 hover:text-chalk"
          >
            {t("header.notebook")}
          </a>
          <a
            href="#terminal"
            className="rounded-md px-2.5 py-2 text-xs font-semibold text-chalk/75 transition-colors hover:bg-white/10 hover:text-chalk"
          >
            {t("header.terminal")}
          </a>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {demoMode && (
            <span className="tag tag-demo hidden sm:inline-flex">{t("demo.badge")}</span>
          )}

          <div
            className="flex items-center rounded-lg border border-chalk/20 bg-white/5 p-0.5"
            role="group"
            aria-label={t("header.language")}
          >
            <span className="hidden px-1.5 text-chalk/50 sm:inline-flex">
              <GlobeIcon className="h-4 w-4" />
            </span>
            <button
              type="button"
              onClick={() => setLocale("ar")}
              aria-pressed={locale === "ar"}
              className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                locale === "ar"
                  ? "bg-amber text-[#222222]"
                  : "text-chalk/70 hover:bg-white/10 hover:text-chalk"
              }`}
            >
              {t("header.langArabic")}
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                locale === "en"
                  ? "bg-amber text-[#222222]"
                  : "text-chalk/70 hover:bg-white/10 hover:text-chalk"
              }`}
            >
              {t("header.langEnglish")}
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-chalk/20 bg-white/5 text-chalk transition-colors hover:bg-white/10"
            aria-label={nextThemeLabel}
            title={nextThemeLabel}
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
