import { Mail, Phone, UserRound } from "lucide-react";
import { pick, type Locale } from "@/lib/i18n";
import { safePhotoUrl, type StaffProfile } from "@/lib/staff";

/** Shared by the public page and the live admin preview. */
export function StaffCard({ member, locale, preview = false, size = "md" }: { member: StaffProfile; locale: Locale; preview?: boolean; size?: "md" | "sm" }) {
  const name = pick(member, "name", locale) || (locale === "th" ? "ชื่อ-นามสกุล" : "Full name");
  const photo = safePhotoUrl(member.photo_url);
  const position = ["top", "center", "bottom"].includes(member.photo_position) ? member.photo_position : "top";
  const email = member.email.trim();
  const phone = member.phone.trim();
  const isSm = size === "sm";

  return (
    <article className="risa-profile-card min-w-0 overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
      <div className={`border-b border-line bg-surface ${isSm ? "p-2" : "p-3"}`}>
        <div className="overflow-hidden rounded-xl">
          <div className="aspect-[4/5] overflow-hidden bg-[#e8edf2]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} className="size-full object-cover" style={{ objectPosition: position }} loading="lazy" />
            ) : <div className="flex size-full items-center justify-center text-[#64758a]"><UserRound className="size-20" strokeWidth={1} aria-hidden /><span className="sr-only">{locale === "th" ? "ยังไม่มีรูปภาพ" : "No photo yet"}</span></div>}
          </div>
        </div>
      </div>
      <div className={isSm ? "p-3.5" : "p-5"}>
        <h2 className={`break-words font-medium text-ink ${isSm ? "text-base" : "text-xl"}`}>{name}</h2>
        {pick(member, "position", locale) && <p className={`mt-2 break-words text-accent ${isSm ? "text-xs" : "text-sm"}`}>{pick(member, "position", locale)}</p>}
        {pick(member, "department", locale) && <p className={`mt-1 break-words text-muted ${isSm ? "text-[11px]" : "text-sm"}`}>{pick(member, "department", locale)}</p>}
        {pick(member, "bio", locale) && <p className={`mt-3 whitespace-pre-line break-words leading-relaxed text-muted ${isSm ? "text-[11px]" : "text-sm"}`}>{pick(member, "bio", locale)}</p>}
        {(email || phone) && <div className={`mt-4 space-y-1.5 border-t border-line pt-4 ${isSm ? "text-[11px]" : "text-sm"}`}>
          {email && <a href={preview ? undefined : `mailto:${email}`} className="flex items-start gap-2 break-all text-ink hover:text-accent"><Mail className={`mt-0.5 shrink-0 ${isSm ? "size-3.5" : "size-4"}`} aria-hidden /><span>{email}</span></a>}
          {phone && <a href={preview ? undefined : `tel:${phone.replace(/[^+\d]/g, "")}`} className="flex items-start gap-2 break-all text-ink hover:text-accent"><Phone className={`mt-0.5 shrink-0 ${isSm ? "size-3.5" : "size-4"}`} aria-hidden /><span>{phone}</span></a>}
        </div>}
      </div>
    </article>
  );
}
