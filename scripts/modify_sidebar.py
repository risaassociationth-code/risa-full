# -*- coding: utf-8 -*-
import re

path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/admin/Sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace(
    'import { Menu, X } from "lucide-react";',
    'import { Menu, X, ChevronRight, ChevronLeft } from "lucide-react";'
)

# Modify Sidebar signature
content = content.replace(
    'export function Sidebar() {',
    'export function Sidebar({ collapsed = false, setCollapsed }: { collapsed?: boolean; setCollapsed?: (v: boolean) => void }) {'
)

# Modify nav
nav_search = '''  const nav = (
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
  );'''

nav_replace = '''  const nav = (
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
  );'''
content = content.replace(nav_search, nav_replace)

# Modify lockup
lockup_search = '''  const lockup = (
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
  );'''

lockup_replace = '''  const lockup = (
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
  );'''
content = content.replace(lockup_search, lockup_replace)

# Modify desktop rail
desktop_search = '''      {/* desktop rail */}
      <aside className="admin-rail fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line lg:flex">
        {lockup}
        {nav}
      </aside>'''

desktop_replace = '''      {/* desktop rail */}
      <aside className={cn("admin-rail fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line lg:flex transition-all duration-300", collapsed ? "w-16" : "w-60")}>
        {setCollapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3.5 top-8 z-40 flex size-7 items-center justify-center rounded-full border border-line bg-paper text-muted shadow-sm transition-colors hover:text-ink hover:border-accent"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        )}
        {lockup}
        {nav}
      </aside>'''
content = content.replace(desktop_search, desktop_replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
