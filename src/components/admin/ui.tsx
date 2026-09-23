import { cn } from "@/lib/utils";
import { AdminText } from './AdminLanguage';

/** Small presentational pieces shared by every admin screen. */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="admin-page-header mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-[-0.01em]"><AdminText>{title}</AdminText></h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-muted"><AdminText>{description}</AdminText></p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("admin-card rounded-xl border border-line bg-paper", className)}>{children}</section>
  );
}

export function CardHead({
  title,
  hint,
  actions,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{typeof title==='string'?<AdminText>{title}</AdminText>:title}</h2>
        {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-6 py-14 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-ink-2"><AdminText>{title}</AdminText></p>
      {hint && <p className="max-w-sm text-[13px] text-muted"><AdminText>{hint}</AdminText></p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        published ? "bg-green-50 text-green-700" : "bg-surface-2 text-muted",
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", published ? "bg-green-600" : "bg-faint")}
      />
      {published ? "เผยแพร่" : "ฉบับร่าง"}
    </span>
  );
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code className={cn("rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted", className)}>
      {children}
    </code>
  );
}

/** Thai-formatted date/time for tables and logs. */
export function formatThaiDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatThaiDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
