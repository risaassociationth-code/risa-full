"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, ChevronLeft } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";
import { useAdminLanguage } from "./AdminLanguage";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ collapsed = false, setCollapsed }: { collapsed?: boolean; setCollapsed?: (v: boolean) => void }) {
  const pathname = usePathname();
  const { locale } = useAdminLanguage();
  const englishLabels: Record<string, string> = { "/admin": "Task map", "/admin/news": "News", "/admin/activities": "Activities", "/admin/team": "Personnel" };
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation. Adjusting state during render
  // (rather than in an effect) avoids the extra post-navigation render pass.
  const [priorPathname, setPriorPathname] = useState(pathname);
  if (pathname !== priorPathname) {
    setPriorPathname(pathname);
    if (open) setOpen(false);
  }

  const nav = (
    <nav lang={locale} className={cn("flex-1 overflow-y-auto pb-6", collapsed ? "px-2" : "px-3")} aria-label={locale === "th" ? "เมนูผู้ดูแลระบบ" : "Admin navigation"}>
      {ADMIN_NAV.map((group) => (
        <div key={group.label} className="mt-5 first:mt-2">
          <p className={cn("pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint transition-all duration-300 overflow-hidden whitespace-nowrap", collapsed ? "px-1 opacity-0 h-0" : "px-3 opacity-100 h-auto")}>
            {locale === "th" ? group.label : "Content"}
          </p>
          <ul className="space-y-1">
            {group.links.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-1.5 text-[13.5px] transition-all duration-300 overflow-hidden",
                      collapsed ? "px-2.5 justify-center" : "px-3",
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-ink-2 hover:bg-surface hover:text-ink",
                    )}
                    title={collapsed ? (locale === "th" ? link.label : englishLabels[link.href] || link.label) : undefined}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className={cn("whitespace-nowrap transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                      {locale === "th" ? link.label : englishLabels[link.href] || link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const lockup = (
    <Link href="/admin" className={cn("flex flex-col gap-3 py-7 transition-all duration-300 overflow-hidden", collapsed ? "items-center px-2" : "items-start px-6")}>
      <Image
        src="/risa-lockup.png"
        alt="RISA"
        width={104}
        height={28}
        className={cn("h-7 transition-all duration-300", collapsed ? "w-7 object-cover object-left" : "w-auto")}
        priority
      />
      <span lang={locale} className={cn("admin-brand-caption whitespace-nowrap transition-all duration-300", collapsed ? "w-0 opacity-0 h-0" : "w-auto opacity-100 h-auto")}>
        {locale === "th" ? "จัดการเว็บไซต์ RISA" : "RISA content workspace"}
      </span>
      <span className="sr-only">ไปยังแดชบอร์ด</span>
    </Link>
  );

  return (
    <>
      {/* desktop rail */}
      <aside className={cn("admin-rail fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line lg:flex transition-all duration-300", collapsed ? "w-16" : "w-60")}>
        
        {lockup}
        {nav}
      </aside>

      {/* Radix supplies focus containment, Escape and trigger focus return. */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button type="button" aria-label="เปิดเมนู" className="fixed left-4 top-2.5 z-40 flex size-11 items-center justify-center border border-line bg-paper text-ink-2 hover:bg-surface lg:hidden">
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-mobile-overlay" />
          <Dialog.Content className="admin-rail admin-mobile-drawer" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">เมนูผู้ดูแลระบบ</Dialog.Title>
            <div className="flex items-center justify-between border-b border-line-soft">
              {lockup}
              <Dialog.Close asChild>
                <button type="button" aria-label="ปิดเมนู" className="mr-3 flex size-11 shrink-0 items-center justify-center text-muted hover:bg-surface">
                  <X aria-hidden="true" className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            {nav}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
