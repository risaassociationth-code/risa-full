"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSession, destroySession, verifyLogin } from "@/lib/auth";
import { safeLoginReturn } from "@/lib/login-return";

const LoginSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,31}$/, "ชื่อผู้ใช้ไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const user = await verifyLogin(parsed.data.username, parsed.data.password);
  if (!user) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  await createSession(user);
  redirect(safeLoginReturn(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
