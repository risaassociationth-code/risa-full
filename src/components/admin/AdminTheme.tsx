"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Palette } from "lucide-react";

export type AdminThemeId =
  | "obsidian-gold"
  | "cyber-emerald"
  | "starlight-monolith"
  | "cosmic-violet";

export interface AdminThemeOption {
  id: AdminThemeId;
  name_en: string;
  name_th: string;
  accent: string;
  paper: string;
  surface: string;
  previewClass: string;
}

export const ADMIN_THEMES: AdminThemeOption[] = [
  {
    id: "obsidian-gold",
    name_en: "Obsidian Gold",
    name_th: "ทองคำออบซิเดียน",
    accent: "#d6bf91",
    paper: "#090f1d",
    surface: "#0f1a2e",
    previewClass: "bg-[#090f1d] border-[#d6bf91]",
  },
  {
    id: "cyber-emerald",
    name_en: "Cyber Emerald",
    name_th: "ไซเบอร์มรกต",
    accent: "#10b981",
    paper: "#040d12",
    surface: "#0a1b20",
    previewClass: "bg-[#040d12] border-[#10b981]",
  },
  {
    id: "starlight-monolith",
    name_en: "Starlight Monolith",
    name_th: "สตาร์ไลท์โมโนลิธ",
    accent: "#38bdf8",
    paper: "#090d16",
    surface: "#0f172a",
    previewClass: "bg-[#090d16] border-[#38bdf8]",
  },
  {
    id: "cosmic-violet",
    name_en: "Cosmic Violet",
    name_th: "คอสมิกไวโอเลต",
    accent: "#b8a4ff",
    paper: "#0b1528",
    surface: "#142139",
    previewClass: "bg-[#0b1528] border-[#b8a4ff]",
  },
];

const AdminThemeContext = createContext<{
  theme: AdminThemeId;
  setTheme: (t: AdminThemeId) => void;
}>({
  theme: "obsidian-gold",
  setTheme: () => {},
});

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminThemeId>("obsidian-gold");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("risa_admin_theme") as AdminThemeId;
      if (stored && ADMIN_THEMES.some((t) => t.id === stored)) {
        setThemeState(stored);
        document.documentElement.setAttribute("data-admin-theme", stored);
        document.body.setAttribute("data-admin-theme", stored);
      } else {
        document.documentElement.setAttribute("data-admin-theme", "obsidian-gold");
        document.body.setAttribute("data-admin-theme", "obsidian-gold");
      }
    } catch {
      // ignore
    }
  }, []);

  const setTheme = (next: AdminThemeId) => {
    setThemeState(next);
    try {
      localStorage.setItem("risa_admin_theme", next);
      document.documentElement.setAttribute("data-admin-theme", next);
      document.body.setAttribute("data-admin-theme", next);
    } catch {
      // ignore
    }
  };

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeContext);

export function AdminThemeSwitch() {
  const { theme, setTheme } = useAdminTheme();
  const [open, setOpen] = useState(false);

  const current = ADMIN_THEMES.find((t) => t.id === theme) || ADMIN_THEMES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-surface-2"
        title="ธีมหน้าจัดการ / Admin theme"
        aria-label="เลือกธีมหน้าจัดการ"
        aria-expanded={open}
      >
        <span
          className="size-2.5 rounded-full ring-1 ring-white/20"
          style={{ backgroundColor: current.accent }}
        />
        <span className="hidden sm:inline">{current.name_en}</span>
        <Palette className="size-3.5 text-muted" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Admin Themes
            </div>
            {ADMIN_THEMES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  theme === opt.id
                    ? "bg-paper text-ink shadow-sm"
                    : "text-muted hover:bg-paper/60 hover:text-ink"
                }`}
              >
                <span
                  className="size-3.5 shrink-0 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: opt.accent }}
                />
                <span className="flex-1">{opt.name_en}</span>
                {theme === opt.id && (
                  <span className="text-[10px] text-accent">●</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
