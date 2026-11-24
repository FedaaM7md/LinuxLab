/*
 * Real-VM image setup screen.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { buildImageSpecs, type ImageFileSpec, type LabImageConfig } from "../emulator/images";
import type { V86State } from "../emulator/v86Controller";
import { useI18n } from "../i18n/I18nProvider";
import { AlertIcon, CheckIcon, CloseIcon, FolderIcon, InfoIcon } from "./Icons";

interface SetupScreenProps {
  state: V86State;
  config: LabImageConfig;
  checking: boolean;
  onRetry: () => void;
  onUseSimulated: () => void;
}

function folderLabel(basePath: string): string {
  const clean = basePath.replace(/^\/+/, "");
  return `public/${clean}`;
}

export function SetupScreen({
  state,
  config,
  checking,
  onRetry,
  onUseSimulated,
}: SetupScreenProps) {
  const { t } = useI18n();
  const isError = state.status === "error";
  const details =
    state.images.length > 0
      ? state.images
      : buildImageSpecs(config).map((spec: ImageFileSpec) => ({
          ...spec,
          url: "",
          found: null,
          sizeBytes: null,
        }));

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-board-deep/85 p-3 sm:p-5">
      <div
        role="alertdialog"
        aria-labelledby="setup-title"
        aria-describedby="setup-body"
        className="paper my-auto w-full max-w-2xl p-4 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-soft text-amber-ink">
            {isError ? <AlertIcon className="h-5 w-5" /> : <FolderIcon className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="setup-title" className="text-lg font-bold text-ink">
              {isError ? t("status.error") : t("setup.title")}
            </h2>
            <p id="setup-body" className="lesson-prose mt-1 text-xs sm:text-sm">
              {isError && state.message ? state.message : t("setup.body")}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-line bg-canvas px-3 py-2">
          <p className="eyebrow">{t("setup.folder")}</p>
          <code dir="ltr" className="mt-0.5 block truncate font-mono text-xs text-amber-ink">
            {folderLabel(state.basePath || config.basePath)}
          </code>
        </div>

        <div className="mt-4">
          <p className="eyebrow">{t("setup.required")}</p>
          <ul className="mt-2 space-y-1.5">
            {details.map((detail) => {
              const found = detail.found === true;
              const unknown = detail.found === null;
              const detailError = "error" in detail ? detail.error : undefined;
              return (
                <li
                  key={detail.key}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-line bg-surface-2 px-2.5 py-2"
                  title={detailError}
                >
                  <div className="min-w-0 flex-1">
                    <code dir="ltr" className="block truncate font-mono text-xs font-semibold text-ink">
                      {detail.filename}
                    </code>
                    <span className="text-[10px] text-muted">{t(detail.purposeKey)}</span>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                      found
                        ? "border-success/35 bg-success-soft text-success"
                        : unknown
                          ? "border-line-strong bg-canvas text-muted"
                          : "border-danger/35 bg-danger-soft text-danger"
                    }`}
                  >
                    {found ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : unknown ? (
                      <InfoIcon className="h-3 w-3" />
                    ) : (
                      <CloseIcon className="h-3 w-3" />
                    )}
                    {found ? t("setup.found") : unknown ? t("setup.unknown") : t("setup.missing")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 space-y-1 text-[10px] leading-relaxed text-muted">
          <p className="flex items-start gap-1.5">
            <InfoIcon className="mt-0.5 h-3 w-3 shrink-0" />
            {t("setup.docs")}
          </p>
          <p>{t("setup.sizeHint")}</p>
          <p>{t("setup.simulatedFallback")}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-amber flex-1 sm:flex-none" onClick={onRetry} disabled={checking}>
            {checking ? t("setup.checking") : t("setup.recheck")}
          </button>
          <button type="button" className="btn-outline flex-1 sm:flex-none" onClick={onUseSimulated}>
            {t("setup.useSimulated")}
          </button>
        </div>
      </div>
    </div>
  );
}
