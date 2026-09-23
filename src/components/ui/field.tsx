import { cn } from "@/lib/utils";
import { AdminText } from '@/components/admin/AdminLanguage';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-medium text-ink-2", className)}
      {...props}
    />
  );
}

const control =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent disabled:bg-surface disabled:text-muted";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 resize-y leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "appearance-none pr-8", className)} {...props} />;
}

export function Field({
  label, hint, required, children, className,
}: {
  label: string; hint?: string; required?: boolean;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <Label>
        <AdminText>{label}</AdminText>
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint"><AdminText>{hint}</AdminText></p>}
    </div>
  );
}
