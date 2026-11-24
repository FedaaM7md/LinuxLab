/*
 * Linux Lab — original source file.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { createRoot } from "react-dom/client";
import "@xterm/xterm/css/xterm.css";
import "./styles/index.css";
import App from "./App";
import { I18nProvider } from "./i18n/I18nProvider";

const container = document.getElementById("root");
if (!container) throw new Error("Root container is missing");

createRoot(container).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
);
