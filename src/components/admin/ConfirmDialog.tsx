"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
};

/** A blocking confirmation dialog — used instead of window.confirm, which the
 * browser's own dialog-suppression rules can silently swallow. */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "ยืนยัน", destructive, pending, onConfirm,
}: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[95] bg-ink/40 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[96] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-paper p-5 shadow-2xl">
          <AlertDialog.Title className="text-[15px] font-semibold">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel
              disabled={pending}
              className="rounded-lg px-3.5 py-2 text-sm text-muted hover:bg-surface disabled:opacity-50"
            ><AdminText>{"ยกเลิก"}</AdminText></AlertDialog.Cancel>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60",
                destructive ? "bg-red-600 hover:bg-red-700" : "bg-ink hover:bg-ink-2",
              )}
            >
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
