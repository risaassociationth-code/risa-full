"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { createAdminUser, deleteAdminUser, resetAdminUserPassword, updateAdminUserRole } from "@/actions/admin";
import { Field, Input, Select } from "@/components/ui/field";
import { Card, CardHead, EmptyState, formatThaiDateTime } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";

type User = {
  id: string; username: string; name: string; role: "admin" | "editor";
  created_at: string; last_login_at: string | null;
};

export function UsersScreen({ initial, currentUserId }: { initial: User[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <Card>
        <CardHead
          title="ผู้ดูแลระบบและผู้แก้ไข"
          hint={`${users.length} บัญชี`}
          actions={
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-ink hover:brightness-110"
            >
              <Plus className="size-3.5" /><AdminText>{"เพิ่มผู้ใช้"}</AdminText></button>
          }
        />
        {showNew && (
          <NewUserForm
            onCreated={(u) => { setUsers((prev) => [...prev, u]); setShowNew(false); }}
            onCancel={() => setShowNew(false)}
          />
        )}
        {users.length === 0 ? (
          <EmptyState title="ยังไม่มีผู้ใช้" className="border-0" />
        ) : (
          <div className="divide-y divide-line-soft">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                onRoleChange={(role) => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)))}
                onDeleted={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewUserForm({ onCreated, onCancel }: { onCreated: (u: User) => void; onCancel: () => void }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createAdminUser({ username, name, role, password });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("เพิ่มผู้ใช้แล้ว");
      onCreated({ id: res.data.id, username: username.toLowerCase(), name, role, created_at: new Date().toISOString(), last_login_at: null });
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border-b border-line-soft bg-surface/60 p-5 sm:grid-cols-2">
      <Field label="ชื่อ" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="ชื่อผู้ใช้" required hint="ใช้ a-z, 0-9, _ หรือ - ได้">
        <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required minLength={3} maxLength={32} autoCapitalize="none" spellCheck={false} placeholder="smartlab" />
      </Field>
      <Field label="สิทธิ์การใช้งาน" required>
        <Select value={role} onChange={(e) => setRole(e.target.value as "admin" | "editor")}>
          <option value="editor"><AdminText>{"ผู้แก้ไข"}</AdminText></option>
          <option value="admin"><AdminText>{"ผู้ดูแลระบบ"}</AdminText></option>
        </Select>
      </Field>
      <Field label="รหัสผ่านเริ่มต้น" required hint="อย่างน้อย 8 ตัวอักษร">
        <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </Field>
      <div className="flex items-end gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />}<AdminText>{"บันทึก"}</AdminText></button>
        <button type="button" onClick={onCancel} className="h-10 rounded-lg px-4 text-sm text-muted hover:bg-surface"><AdminText>{"ยกเลิก"}</AdminText></button>
      </div>
    </form>
  );
}

function UserRow({
  user, isSelf, onRoleChange, onDeleted,
}: { user: User; isSelf: boolean; onRoleChange: (r: "admin" | "editor") => void; onDeleted: () => void }) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  function changeRole(role: "admin" | "editor") {
    start(async () => {
      const res = await updateAdminUserRole(user.id, role);
      if (!res.ok) { toast.error(res.error); return; }
      onRoleChange(role);
      toast.success("เปลี่ยนสิทธิ์แล้ว");
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteAdminUser(user.id);
      if (!res.ok) { toast.error(res.error); setConfirmDelete(false); return; }
      onDeleted();
    });
  }

  function resetPassword() {
    start(async () => {
      const res = await resetAdminUserPassword(user.id, newPassword);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("ตั้งรหัสผ่านใหม่แล้ว");
      setConfirmReset(false);
      setNewPassword("");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{user.name} {isSelf && <span className="text-xs text-faint"><AdminText>{"(คุณ)"}</AdminText></span>}</p>
        <p className="truncate text-[13px] text-muted">@{user.username}</p>
      </div>
      <p className="hidden shrink-0 text-xs text-faint sm:block">
        {user.last_login_at ? `เข้าใช้ล่าสุด ${formatThaiDateTime(user.last_login_at)}` : "ยังไม่เคยเข้าใช้"}
      </p>
      <Select
        value={user.role}
        onChange={(e) => changeRole(e.target.value as "admin" | "editor")}
        disabled={pending}
        className="h-8 w-32 shrink-0 text-xs"
      >
        <option value="editor"><AdminText>{"ผู้แก้ไข"}</AdminText></option>
        <option value="admin"><AdminText>{"ผู้ดูแลระบบ"}</AdminText></option>
      </Select>
      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        title="ตั้งรหัสผ่านใหม่"
        aria-label="ตั้งรหัสผ่านใหม่"
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
      >
        <KeyRound className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        disabled={isSelf}
        title={isSelf ? "ไม่สามารถลบบัญชีตัวเองได้" : "ลบผู้ใช้"}
        aria-label="ลบผู้ใช้"
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
      >
        <Trash2 className="size-3.5" />
      </button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`ลบผู้ใช้ "${user.name}"?`}
        confirmLabel="ลบ"
        destructive
        pending={pending}
        onConfirm={remove}
      />

      {confirmReset && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button aria-label="ปิด" onClick={() => setConfirmReset(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
          <div className="relative w-[min(22rem,100%)] rounded-2xl border border-line bg-paper p-5 shadow-2xl">
            <p className="text-[15px] font-semibold"><AdminText>{"ตั้งรหัสผ่านใหม่"}</AdminText></p>
            <p className="mt-1 text-sm text-muted"><AdminText>{"สำหรับ @"}</AdminText>{user.username}</p>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              className="mt-3"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-3.5 py-2 text-sm text-muted hover:bg-surface"><AdminText>{"ยกเลิก"}</AdminText></button>
              <button
                type="button"
                onClick={resetPassword}
                disabled={pending || newPassword.length < 8}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending && <Loader2 className="size-3.5 animate-spin" />}<AdminText>{"ยืนยัน"}</AdminText></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
