"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role }: { role: "admin" | "editor" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation. Adjusting state during render
  // (rather than in an effect) avoids the extra post-navigation render pass.
  const [priorPathname, setPriorPathname] = useState(pathname);
  if (pathname !== priorPathname) {
    setPriorPathname(pathname);
    if (open) setOpen(false);
  }

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="เมนูผู้ดูแลระบบ">
      {ADMIN_NAV.map((group) => (
        <div key={group.label} className="mt-5 first:mt-2">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            {group.label}
          </p>
          <ul>
            {group.links.filter((link) => role === "admin" || link.href !== "/admin/codex").map((link) => {
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
                    {link.label}
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
      <span className="text-[10px] tracking-[.2em] text-faint">CONTENT STUDIO</span>
      <span className="sr-only">ไปยังแดชบอร์ด</span>
    </Link>
  );

  return (
    <>
      {/*
        Fixed (not in-flow): the topbar uses backdrop-blur, and any ancestor
        with a backdrop-filter/filter/transform becomes a new containing block
        for `position: fixed` descendants — nesting this in the topbar's flow
        would re-anchor the desktop rail below to that bar instead of the
        viewport. Positioning by viewport coordinates sidesteps that.
      */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        aria-expanded={open}
        className="fixed left-4 top-2.5 z-40 rounded-lg border border-line bg-paper p-2 text-ink-2 hover:bg-surface lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      {/* desktop rail */}
      <aside className="admin-rail fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line lg:flex">
        {lockup}
        {nav}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="admin-rail absolute inset-y-0 left-0 flex w-64 flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-line-soft">
              {lockup}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดเมนู"
                className="mr-3 rounded-lg p-2 text-muted hover:bg-surface"
              >
                <X className="size-4" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
