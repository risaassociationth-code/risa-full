"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";
import { useAdminLanguage } from "./AdminLanguage";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { locale } = useAdminLanguage();
  const englishLabels: Record<string, string> = { "/admin": "Task map", "/admin/news": "News", "/admin/activities": "Activities", "/admin/team": "People" };
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation. Adjusting state during render
  // (rather than in an effect) avoids the extra post-navigation render pass.
  const [priorPathname, setPriorPathname] = useState(pathname);
  if (pathname !== priorPathname) {
    setPriorPathname(pathname);
    if (open) setOpen(false);
  }

  const nav = (
    <nav lang={locale} className="flex-1 overflow-y-auto px-3 pb-6" aria-label={locale === "th" ? "เมนูผู้ดูแลระบบ" : "Admin navigation"}>
      {ADMIN_NAV.map((group) => (
        <div key={group.label} className="mt-5 first:mt-2">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            {locale === "th" ? group.label : "Content"}
          </p>
          <ul>
            {group.links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-[13.5px] transition-colors",
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-ink-2 hover:bg-surface hover:text-ink",
                    )}
                  >
                    {locale === "th" ? link.label : englishLabels[link.href] || link.label}
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
    <Link href="/admin" className="flex flex-col items-start gap-3 px-6 py-7">
      <Image
        src="/risa-lockup.png"
        alt="RISA"
        width={104}
        height={28}
        className="h-7 w-auto"
        priority
      />
      <span lang={locale} className="admin-brand-caption">{locale === "th" ? "จัดการเว็บไซต์ RISA" : "RISA content workspace"}</span>
      <span className="sr-only">ไปยังแดชบอร์ด</span>
    </Link>
  );

  return (
    <>
      {/* desktop rail */}
      <aside className="admin-rail fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line lg:flex">
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
