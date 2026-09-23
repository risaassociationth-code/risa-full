import { Mail, Phone, UserRound } from "lucide-react";
import { pick, type Locale } from "@/lib/i18n";
import { safePhotoUrl, type StaffProfile } from "@/lib/staff";

/** Shared by the public page and the live admin preview. */
export function StaffCard({ member, locale, preview = false }: { member: StaffProfile; locale: Locale; preview?: boolean }) {
  const name = pick(member, "name", locale) || (locale === "th" ? "ชื่อ-นามสกุล" : "Full name");
  const photo = safePhotoUrl(member.photo_url);
  const position = ["top", "center", "bottom"].includes(member.photo_position) ? member.photo_position : "top";
  const email = member.email.trim();
  const phone = member.phone.trim();
  return (
    <article className="min-w-0">
      <div className="border border-line bg-surface p-2 shadow-[0_5px_18px_rgba(38,43,33,0.08)]">
        <div className="border border-line bg-paper p-3 sm:p-4">
          <div className="aspect-[4/5] overflow-hidden bg-surface-2">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} className="size-full object-cover" style={{ objectPosition: position }} loading="lazy" />
            ) : <div className="flex size-full items-center justify-center text-faint"><UserRound className="size-20" strokeWidth={1} aria-hidden /><span className="sr-only">{locale === "th" ? "ยังไม่มีรูปภาพ" : "No photo yet"}</span></div>}
          </div>
        </div>
      </div>
      <div className="px-1 pb-3 pt-5">
        <h2 className="break-words text-xl font-medium text-ink">{name}</h2>
        {pick(member, "position", locale) && <p className="mt-2 break-words text-sm text-accent">{pick(member, "position", locale)}</p>}
        {pick(member, "department", locale) && <p className="mt-1 break-words text-sm text-muted">{pick(member, "department", locale)}</p>}
        {pick(member, "bio", locale) && <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted">{pick(member, "bio", locale)}</p>}
        {(email || phone) && <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {email && <a href={preview ? undefined : `mailto:${email}`} className="flex items-start gap-2 break-all text-ink hover:text-accent"><Mail className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{email}</span></a>}
          {phone && <a href={preview ? undefined : `tel:${phone.replace(/[^+\d]/g, "")}`} className="flex items-start gap-2 break-all text-ink hover:text-accent"><Phone className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{phone}</span></a>}
        </div>}
      </div>
    </article>
  );
}
