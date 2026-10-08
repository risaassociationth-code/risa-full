"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AdminLocale = "th" | "en";
const AdminLanguage = createContext<{ locale: AdminLocale; setLocale: (locale: AdminLocale) => void }>({ locale: "th", setLocale: () => {} });

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AdminLocale>("th");
  return <AdminLanguage.Provider value={{ locale, setLocale }}>{children}</AdminLanguage.Provider>;
}

export const useAdminLanguage = () => useContext(AdminLanguage);

export function AdminLanguageSwitch() {
  const { locale, setLocale } = useAdminLanguage();
  return <div className="admin-language-switch" role="group" aria-label="ภาษาหน้าจัดการ / Admin language">
    {(["th", "en"] as const).map(value => <button key={value} type="button" lang={value} aria-pressed={locale === value} onClick={() => setLocale(value)}>{value.toUpperCase()}</button>)}
  </div>;
}
