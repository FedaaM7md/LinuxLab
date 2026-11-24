/*
 * Quiet colophon: product information, demo scope and the owner credit.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { useCallback, useEffect, useState } from "react";
import { APP_VERSION, OWNER_URL } from "../lib/appMeta";
import { useI18n } from "../i18n/I18nProvider";
import { BrandLockup } from "./Brand";
import { InfoDialog, type InfoSection } from "./InfoDialog";

const SECTIONS: InfoSection[] = ["about", "privacy", "terms", "help", "changelog"];

function sectionFromHash(): InfoSection | null {
  const value = window.location.hash.replace(/^#/, "");
  return SECTIONS.includes(value as InfoSection) ? (value as InfoSection) : null;
}

export function Footer({ demoMode }: { demoMode: boolean }) {
  const { t } = useI18n();
  const [info, setInfo] = useState<InfoSection | null>(sectionFromHash);

  const openInfo = useCallback((section: InfoSection) => {
    setInfo(section);
    window.history.replaceState(null, "", `#${section}`);
  }, []);

  const closeInfo = useCallback(() => {
    setInfo(null);
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", `${pathname}${search}`);
  }, []);

  useEffect(() => {
    const onHashChange = () => setInfo(sectionFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <footer className="mx-auto mt-8 w-full max-w-[1500px] px-3 pb-8 sm:px-5 lg:px-8">
      <div className="rounded-lg border border-line bg-surface/70 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <BrandLockup compact />
          {demoMode && (
            <p className="text-[10px] leading-relaxed text-muted sm:text-end">
              {t("footer.demoNote")}
            </p>
          )}
        </div>

        <nav
          aria-label={t("a11y.footerLinks")}
          className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3"
        >
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => openInfo(section)}
              className="cursor-pointer text-[11px] font-semibold text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {t(`footer.${section}`)}
            </button>
          ))}
          <span className="ms-auto text-[10px] text-muted">
            {t("footer.version", { version: APP_VERSION })}
          </span>
        </nav>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-3">
          <p className="text-[11px] font-semibold text-ink">{t("footer.copyright")}</p>
          <a
            href={OWNER_URL}
            rel="noopener noreferrer"
            className="text-[10px] text-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink"
          >
            {t("footer.credit")}
          </a>
        </div>
      </div>

      <InfoDialog section={info} onSelect={openInfo} onClose={closeInfo} />
    </footer>
  );
}
