/** Shared public profile shape; deliberately excludes admin/audit information. */
export type StaffProfile = {
  name_th: string; name_en: string;
  position_th: string; position_en: string;
  department_th: string; department_en: string;
  bio_th: string; bio_en: string;
  photo_url: string; photo_position: string;
  email: string; phone: string;
  tier: string;
};

export function safePhotoUrl(value: string): string {
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? value : "";
  } catch { return ""; }
}

export function validateStaff(values: Record<string, unknown>): string | null {
  const text = (key: string) => String(values[key] ?? "").trim();
  if (!text("name_th")) return "กรุณาระบุชื่อ-นามสกุลภาษาไทย";
  for (const key of ["name_th", "name_en", "position_th", "position_en", "department_th", "department_en"]) {
    if (text(key).length > 200) return "ชื่อ ตำแหน่ง และฝ่ายต้องไม่เกิน 200 ตัวอักษร";
  }
  if (["bio_th", "bio_en"].some((key) => text(key).length > 2000)) return "ประวัติโดยย่อต้องไม่เกิน 2,000 ตัวอักษร";
  if (text("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text("email"))) return "กรุณาระบุอีเมลที่ถูกต้อง";
  if (text("phone") && !/^[+\d][\d\s().-]{4,39}$/.test(text("phone"))) return "กรุณาระบุหมายเลขโทรศัพท์ที่ถูกต้อง";
  if (text("photo_url") && !safePhotoUrl(text("photo_url"))) return "ลิงก์รูปภาพไม่ถูกต้อง";
  if (text("photo_position") && !["top", "center", "bottom"].includes(text("photo_position"))) return "ตำแหน่งภาพไม่ถูกต้อง";
  if (text("tier") && !["head", "manager", "staff"].includes(text("tier"))) return "ระดับในผังองค์กรไม่ถูกต้อง";
  return null;
}
