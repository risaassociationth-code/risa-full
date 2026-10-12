"use server";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function setTeamTier(id: string, tier: string) {
  await requireUser();
  await sql`update staff_members set tier = ${tier} where id = ${id}`;
  revalidatePath("/th/team");
  revalidatePath("/en/team");
  revalidatePath("/admin/team");
  revalidatePath("/admin");
  return { ok: true };
}
