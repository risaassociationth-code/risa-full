"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavNode = { label: string; href: string; newTab: boolean; children: NavNode[] };

type Props = { items: NavNode[]; ctaLabel: string; ctaHref: string; menuLabel: string };

export function HeaderNav({ items, ctaLabel, ctaHref, menuLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Close the mobile sheet on navigation. Adjusting state during render
  // (rather than in an effect) avoids the extra post-navigation render pass.
  const [priorPathname, setPriorPathname] = useState(pathname);
  if (pathname !== priorPathname) {
    setPriorPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isHome = (href: string) => /^\/(?:th|en)\/?$/.test(href) || href === "/";
  const isActive = (href: string) =>
    href !== "" && (pathname === href || (!isHome(href) && pathname.startsWith(href + "/")));
  const activeBranch = (node: NavNode) =>
    isActive(node.href) || node.children.some((c) => isActive(c.href));

  return (
    <>
      <nav aria-label="เมนูหลัก" className="hidden lg:block">
        <ul className="flex items-center gap-0.5">
          {items.map((item) => (
            <li key={item.label} className="group relative">
              {item.children.length === 0 ? (
                <Link
                  href={item.href || "#"}
                  aria-label={isHome(item.href) ? item.label : undefined}
                  title={isHome(item.href) ? item.label : undefined}
                  className={cn(
                    "flex h-16 items-center whitespace-nowrap rounded-md px-3 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink",
                    activeBranch(item) && "text-accent",
                  )}
                >
                  {isHome(item.href) ? <Home className="size-5" aria-hidden="true" /> : item.label}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    aria-haspopup="true"
                    className={cn(
                      "flex h-16 items-center gap-1 whitespace-nowrap rounded-md px-3 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink group-focus-within:text-ink",
                      activeBranch(item) && "text-accent",
                    )}
                  >
                    {item.label}
                    <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 min-w-56 translate-y-1 rounded-xl border border-line bg-paper p-1.5 opacity-0 shadow-[0_14px_40px_-12px_rgb(10_10_11/0.2)] transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <ul>
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href || "#"}
                            target={child.newTab ? "_blank" : undefined}
                            className={cn(
                              "block whitespace-nowrap rounded-lg px-3 py-2 text-[14px] text-ink-2 transition-colors hover:bg-surface hover:text-ink",
                              isActive(child.href) && "text-accent",
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {ctaHref && ctaLabel && <Link
        href={ctaHref}
        className="hidden h-9 shrink-0 items-center rounded-lg bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-ink-2 lg:inline-flex"
      >
        {ctaLabel}
      </Link>}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-ink hover:bg-surface lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-paper shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
              <span className="text-sm font-semibold">{menuLabel}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดเมนู"
                className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg hover:bg-surface"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="เมนูหลัก">
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.children.length === 0 ? (
                      <Link
                        href={item.href || "#"}
                  aria-label={isHome(item.href) ? item.label : undefined}
                  title={isHome(item.href) ? item.label : undefined}
                        className={cn(
                          "block rounded-lg px-3 py-2.5 text-[15px] font-medium",
                          activeBranch(item) ? "bg-surface text-accent" : "text-ink",
                        )}
                      >
                        {isHome(item.href) ? <Home className="size-5" aria-hidden="true" /> : item.label}
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                          aria-expanded={expanded === item.label}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15px] font-medium",
                            activeBranch(item) ? "text-accent" : "text-ink",
                          )}
                        >
                          {item.label}
                          <ChevronDown
                            className={cn("size-4 transition-transform", expanded === item.label && "rotate-180")}
                          />
                        </button>
                        {expanded === item.label && (
                          <ul className="mb-1 ml-3 space-y-0.5 border-l border-line pl-3">
                            {item.children.map((child) => (
                              <li key={child.label}>
                                <Link
                                  href={child.href || "#"}
                                  className={cn(
                                    "block rounded-lg px-3 py-2 text-[14px]",
                                    isActive(child.href) ? "text-accent" : "text-ink-2",
                                  )}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {ctaHref && ctaLabel && <Link
                href={ctaHref}
                className="mt-4 flex h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white"
              >
                {ctaLabel}
              </Link>}
            </nav>
          </div>
        </div>, document.body
      )}
    </>
  );
}
