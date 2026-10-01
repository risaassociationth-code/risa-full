"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { switchLocaleHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { LOCALES, type Locale } from "@/lib/i18n";

const SHORT: Record<Locale, string> = { th: "ไทย", en: "EN" };

export function LocaleSwitch({ current }: { current: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  return (
    <div
      className="flex items-center rounded-lg border border-line p-0.5"
      role="group"
      aria-label="เปลี่ยนภาษา / Change language"
    >
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={switchLocaleHref(pathname, search, l)}
          lang={l}
          hrefLang={l}
          aria-current={l === current ? "true" : undefined}
          onClick={() => {
            document.cookie = `risa_locale=${l};path=/;max-age=31536000;samesite=lax`;
          }}
          className={cn(
            "rounded-[6px] px-2 py-1 text-xs font-medium transition-colors",
            l === current ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          {SHORT[l]}
        </Link>
      ))}
    </div>
  );
}
