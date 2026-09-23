"use client";

import { Moon, Sun } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function ThemeToggle({ locale }: { locale: Locale }) {
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("risa-theme", next);
  };

  const label = locale === "th" ? "สลับโหมดสี" : "Toggle color theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="theme-toggle inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface"
    >
      <Sun className="theme-icon-light size-[18px]" aria-hidden="true" />
      <Moon className="theme-icon-dark size-[18px]" aria-hidden="true" />
    </button>
  );
}
