"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={cn("min-h-full transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-60")}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {children}
    </div>
  );
}
