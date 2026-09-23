"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useActionState } from "react";
import { Loader2, Lock, UserRound } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="ชื่อผู้ใช้" required>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input name="username" aria-label="ชื่อผู้ใช้" required autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus className="pl-9" placeholder="smartlab" />
        </div>
      </Field>
      <Field label="รหัสผ่าน" required>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input name="password" aria-label="รหัสผ่าน" type="password" required autoComplete="current-password" className="pl-9" />
        </div>
      </Field>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-medium text-white transition-colors hover:bg-ink-2 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}<AdminText>{"เข้าสู่ระบบ"}</AdminText></button>
    </form>
  );
}
