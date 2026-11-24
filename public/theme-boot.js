/*
 * Linux Lab — pre-paint theme and locale bootstrap.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 *
 * Kept in an external file so the production CSP can forbid inline scripts.
 * Values are non-sensitive UI preferences. Optional ?lang=ar|en and
 * ?theme=paper|board parameters are useful for screenshots and QA.
 */

(function () {
  try {
    var THEME_KEY = "fedaa.linuxlab.theme.v1";
    var LOCALE_KEY = "fedaa.linuxlab.locale.v1";
    var params = new URLSearchParams(window.location.search);

    var lang = params.get("lang");
    if (lang === "ar" || lang === "en") {
      localStorage.setItem(LOCALE_KEY, lang);
    }

    var theme = params.get("theme");
    if (theme === "paper") localStorage.setItem(THEME_KEY, "light");
    if (theme === "board") localStorage.setItem(THEME_KEY, "dark");

    var storedTheme = localStorage.getItem(THEME_KEY);
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = storedTheme === "dark" || (storedTheme !== "light" && prefersDark);
    if (dark) document.documentElement.classList.add("dark");

    var storedLocale = localStorage.getItem(LOCALE_KEY);
    var locale = storedLocale === "en" || storedLocale === "ar" ? storedLocale : "ar";
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  } catch (_) {
    /* Preferences are optional. The app still renders with defaults. */
  }
})();
