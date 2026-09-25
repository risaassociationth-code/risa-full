"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { createRow, deleteRow, updateRow } from "@/actions/collections";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaPickerDialog } from "@/components/ui/media-picker";
import { Icon, ICON_NAMES } from "@/components/site/Icon";
import { sanitizeHtml, slugify } from "@/lib/utils";
import type { CollectionConfig, FieldDef, Row } from "./collection-config";
import { Card, CardHead } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { StaffCard } from "@/components/site/StaffCard";
import type { StaffProfile } from "@/lib/staff";

type Props = {
  config: CollectionConfig;
  /** `null` means creating a new row. */
  initial: Row | null;
  /** Extra columns to inject on create (e.g. `list_key`, `album_id`). */
  scope?: Record<string, string>;
  /** Where to return after save/delete. */
  backHref: string;
  /** Where to go after creating a new row (defaults to backHref). Lets gallery
   * albums land on their own edit page so photos can be added immediately. */
  createdHref?: (id: string) => string;
};

function labelFor(field: FieldDef, lang: "th" | "en") {
  return `${field.label}${field.bilingual ? ` (${lang === "th" ? "ไทย" : "English"})` : ""}`;
}

export function CollectionForm({ config, initial, scope, backHref, createdHref }: Props) {
  const isNew = initial === null;
  const guided = config.key === "news" || config.key === "activities";
  const importedNews = guided && /^mms-hub-\d+$/.test(String(initial?.slug ?? ""));
  const [values, setValues] = useState<Row>(() => ({ ...(initial ?? {}), ...(scope ?? {}) }));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({ ...(initial ?? {}), ...(scope ?? {}) }));
  const [savedAt, setSavedAt] = useState<string>(String(initial?.updated_at ?? ""));
  const [step, setStep] = useState(0);
  const [editLocale, setEditLocale] = useState<"th" | "en">("th");
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const bypassGuard = useRef(false);
  const dirty = JSON.stringify(values) !== savedSnapshot;
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mediaField, setMediaField] = useState<string | null>(null);
  const [iconField, setIconField] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<"th" | "en">("th");
  const router = useRouter();

  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      if (bypassGuard.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function followLink(event: MouseEvent) {
      if (bypassGuard.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.origin === window.location.origin) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setLeaveHref(url.href);
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", followLink, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", followLink, true); };
  }, [dirty]);

  const titleSources = useMemo(
    () => config.fields.filter((f) => f.slugFrom || f.name === config.titleField),
    [config],
  );

  function set(name: string, value: unknown) {
    bypassGuard.current = false;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (guided && step < 3) { setStep(step + 1); return; }
    save();
  }

  function save(status?: "draft" | "published") {
    const next = status ? { ...values, status } : values;
    if (guided && !String(next.title_th ?? "").trim() && !String(next.title_en ?? "").trim()) {
      toast.error("กรุณาใส่หัวข้อก่อนบันทึก"); setStep(0); return;
    }
    startTransition(async () => {
      const res = await (isNew
        ? createRow(config.key, next)
        : updateRow(config.key, String(initial!.id), next)).catch(() => ({ ok: false as const, error: "เชื่อมต่อไม่สำเร็จ ข้อความยังอยู่ในหน้านี้ กรุณาลองบันทึกอีกครั้ง" }));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกแล้ว");
      bypassGuard.current = true;
      setValues(next);
      setSavedSnapshot(JSON.stringify(next));
      setSavedAt(new Date().toISOString());
      if (guided) {
        if (isNew) router.replace(`${config.adminPath}/${res.data.id}`);
        router.refresh();
        return;
      }
      const dest = isNew && createdHref && res.data?.id ? createdHref(res.data.id) : backHref;
      router.push(dest);
      router.refresh();
    });
  }

  function onDelete() {
    if (isNew) return;
    startTransition(async () => {
      const res = await deleteRow(config.key, String(initial!.id));
      if (!res.ok) {
        toast.error(res.error);
        setConfirmDelete(false);
        return;
      }
      toast.success("ลบแล้ว");
      bypassGuard.current = true;
      router.push(backHref);
      router.refresh();
    });
  }

  function renderControl(field: FieldDef, name: string) {
    const raw = values[name];
    const accessibleLabel = field.bilingual ? labelFor(field, name.endsWith("_en") ? "en" : "th") : field.label;

    switch (field.type) {
      case "slug": {
        const source = titleSources.find((f) => f.name === field.slugFrom);
        const seed =
          (source?.bilingual ? String(values[`${field.slugFrom}_en`] ?? values[`${field.slugFrom}_th`] ?? "") : "");
        // `slugify("")` falls back to a Date.now()-based string, which would
        // differ between the server render and client hydration passes and
        // trigger a hydration mismatch — so only call it once there is real
        // input to slugify.
        const placeholder = seed ? slugify(seed) : "จะสร้างอัตโนมัติจากหัวข้อ";
        return (
          <div className="flex gap-2">
            <Input
              aria-label={accessibleLabel}
              value={String(raw ?? "")}
              onChange={(e) => set(name, e.target.value)}
              readOnly={importedNews}
              placeholder={placeholder}
              className="font-mono text-[13px]"
            />
            {isNew && seed && (
              <button
                type="button"
                onClick={() => set(name, slugify(seed))}
                className="shrink-0 rounded-lg border border-line px-3 text-xs text-muted hover:bg-surface"
              >
                สร้างอัตโนมัติ
              </button>
            )}
          </div>
        );
      }
      case "textarea":
        return (
          <Textarea
            aria-label={accessibleLabel}
            value={String(raw ?? "")}
            onChange={(e) => set(name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case "richtext":
        return (
          <RichTextEditor value={String(raw ?? "")} onChange={(html) => set(name, html)} />
        );
      case "number":
        return (
          <Input
            aria-label={accessibleLabel}
            type="number"
            value={raw === null || raw === undefined ? "" : String(raw)}
            onChange={(e) => set(name, e.target.value === "" ? null : Number(e.target.value))}
            placeholder={field.placeholder}
          />
        );
      case "date":
        return (
          <Input
            aria-label={accessibleLabel}
            type="date"
            value={raw ? String(raw).slice(0, 10) : ""}
            onChange={(e) => set(name, e.target.value)}
          />
        );
      case "select":
        return (
          <Select aria-label={accessibleLabel} value={String(raw ?? field.options?.[0]?.value ?? "")} onChange={(e) => set(name, e.target.value)}>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        );
      case "tags":
        return (
          <Input
            aria-label={accessibleLabel}
            value={Array.isArray(raw) ? raw.join(", ") : String(raw ?? "")}
            onChange={(e) => set(name, e.target.value)}
            placeholder={field.placeholder ?? "แท็ก1, แท็ก2"}
          />
        );
      case "latlng": {
        const lngName = field.lngName!;
        return (
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              value={raw === null || raw === undefined ? "" : String(raw)}
              onChange={(e) => set(name, e.target.value === "" ? null : Number(e.target.value))}
              placeholder="ละติจูด (lat)"
            />
            <Input
              type="number"
              step="any"
              value={values[lngName] === null || values[lngName] === undefined ? "" : String(values[lngName])}
              onChange={(e) => set(lngName, e.target.value === "" ? null : Number(e.target.value))}
              placeholder="ลองจิจูด (lng)"
            />
          </div>
        );
      }
      case "icon":
        return (
          <button
            type="button"
            onClick={() => setIconField(name)}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-surface text-muted hover:border-accent hover:text-accent"
          >
            <Icon name={String(raw ?? "")} className="size-6" />
            <span className="text-[11px]">{raw ? String(raw) : "เลือกไอคอน"}</span>
          </button>
        );
      case "image":
        return (
          <button
            type="button"
            onClick={() => setMediaField(name)}
            className="group relative flex h-28 w-full max-w-56 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface"
          >
            {raw ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(raw)} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-muted">
                <ImagePlus className="size-5" />
                <span className="text-xs">อัปโหลด / เลือกจากคลัง</span>
              </span>
            )}
            <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
            {!!raw && <span className="absolute bottom-0 inset-x-0 bg-black/70 p-1.5 text-xs text-white">เปลี่ยนรูปภาพ</span>}
          </button>
        );
      case "file":
        return (
          <div className="flex items-center gap-2">
            <Input
              value={String(raw ?? "")}
              onChange={(e) => set(name, e.target.value)}
              placeholder="/uploads/… หรือวางลิงก์ไฟล์"
              className="font-mono text-[13px]"
            />
            <button
              type="button"
              onClick={() => setMediaField(name)}
              className="shrink-0 rounded-lg border border-line px-3 py-2.5 text-xs text-muted hover:bg-surface"
            >
              เลือกจากคลัง
            </button>
          </div>
        );
      default:
        return (
          <Input
            aria-label={accessibleLabel}
            value={String(raw ?? "")}
            onChange={(e) => set(name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  }

  function renderField(field: FieldDef) {
    const langs = guided ? [editLocale] : (["th", "en"] as const);
    return <div key={field.name}>{field.bilingual ? <div className={guided ? "" : "grid gap-4 sm:grid-cols-2"}>
      {langs.map(lang => <Field key={lang} label={labelFor(field, lang)} required={field.required && lang === "th"} hint={field.help}>{renderControl(field, `${field.name}_${lang}`)}</Field>)}
    </div> : <Field label={field.type === "slug" ? "ที่อยู่ของหน้านี้ (สร้างให้อัตโนมัติ)" : field.label} required={field.required && field.type !== "slug"} hint={field.type === "slug" ? "เว้นว่างได้ ระบบจะสร้างจากหัวข้อ ถ้าเผยแพร่แล้วควรคงที่อยู่เดิมไว้" : field.help}>{renderControl(field, field.name)}</Field>}</div>;
  }

  function leave() {
    if (!leaveHref) return;
    bypassGuard.current = true;
    window.location.assign(leaveHref);
  }

  return (
    <form onSubmit={onSubmit} inert={pending} className="space-y-5 pb-16">
      {guided && <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="text-sm text-accent" onClick={() => dirty ? setLeaveHref(backHref) : router.push(backHref)}>← กลับรายการ{config.singular}</button>
          <p role="status" className="text-xs text-muted">{pending ? "กำลังบันทึก…" : dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : savedAt ? `บันทึกแล้ว · ${new Date(savedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}` : isNew ? "รายการใหม่ — ยังไม่บันทึก" : "ฉบับที่บันทึกไว้ — ยังไม่มีการแก้ไข"}</p>
        </div>
        <nav aria-label="ขั้นตอนการแก้ไข" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["เนื้อหา", "รูปภาพ", "ดูตัวอย่าง", "เผยแพร่"].map((label, index) => <button type="button" key={label} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)} className={`rounded-xl border p-3 text-left text-sm ${step === index ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line bg-paper text-muted"}`}>{index + 1}. {label}</button>)}
        </nav>
        {(step === 0 || step === 2) && <div className="flex gap-2" aria-label="ภาษาที่กำลังแก้ไข">
          {(["th", "en"] as const).map(lang => <button key={lang} type="button" aria-pressed={editLocale === lang} onClick={() => setEditLocale(lang)} className="rounded-lg border border-line px-4 py-2 text-sm aria-pressed:bg-ink aria-pressed:text-white">{lang === "th" ? "ภาษาไทย" : "English"}</button>)}
          <span className="self-center text-xs text-muted">เก็บข้อความทั้งสองภาษาแยกกัน</span>
        </div>}
      </>}
      {config.key === "team" && <Card>
        <CardHead title="ตัวอย่างโปรไฟล์บนเว็บไซต์ / Live profile preview" />
        <div className="p-5">
          <div className="mb-4 flex gap-2" aria-label="ภาษาตัวอย่าง">
            {(["th", "en"] as const).map(lang => <button key={lang} type="button" aria-pressed={previewLocale === lang} onClick={() => setPreviewLocale(lang)} className="rounded border border-line px-3 py-1.5 text-sm aria-pressed:bg-accent aria-pressed:text-accent-ink">{lang === "th" ? "ไทย" : "English"}</button>)}
          </div>
          <div className="max-w-xs"><StaffCard preview locale={previewLocale} member={Object.fromEntries(["name_th", "name_en", "position_th", "position_en", "department_th", "department_en", "bio_th", "bio_en", "photo_url", "photo_position", "email", "phone"].map(key => [key, String(values[key] ?? "")])) as StaffProfile} /></div>
          {values.photo_url ? <button type="button" onClick={() => set("photo_url", "")} className="mt-3 text-sm text-muted underline">เอารูปออกจากโปรไฟล์ (ไฟล์ยังอยู่ในคลัง)</button> : null}
        </div>
      </Card>}
      {importedNews && <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">MMS Hub · เนื้อหาจากเครือข่าย — โปรดคงเครดิตต้นฉบับและตรวจวันจัดกิจกรรม ชื่อบุคคล และบทบาทองค์กรก่อนเผยแพร่ สถานะฉบับร่างซ่อนรายการจากหน้า{config.singular}ของ RISA</p>}
      {guided && step === 3 && <Card>
        <CardHead title="4. เลือกว่าจะให้คนทั่วไปเห็นหรือไม่" />
        <div className="p-5">
          <Field label="การแสดงบนเว็บไซต์">
            <Select aria-label="การแสดงบนเว็บไซต์" value={String(values.status ?? "draft")} onChange={(e) => set("status", e.target.value)}>
              <option value="draft">ฉบับร่าง — เก็บไว้เขียนต่อ ยังไม่แสดงบนหน้าเว็บ</option>
              <option value="published">เผยแพร่ — ทุกคนเห็นบนเว็บไซต์หลังบันทึก</option>
            </Select>
          </Field>
          <p className="mt-4 text-sm text-muted">ตรวจหัวข้อ รูปภาพ และรายละเอียดแล้วกดบันทึกด้านล่าง การเลือกสถานะอย่างเดียวยังไม่เปลี่ยนหน้าเว็บ</p>
          <details className="mt-5 border-t border-line pt-4"><summary className="cursor-pointer text-sm text-muted">ตัวเลือกเพิ่มเติม: ที่อยู่หน้าเว็บ</summary><div className="mt-3">{config.fields.filter(field => field.type === "slug").map(renderField)}</div></details>
          {!isNew && initial?.status === "published" && <a className="mt-4 inline-block text-sm text-accent underline" target="_blank" rel="noreferrer" href={`/th/${config.key}/${initial.slug}`}>ดูฉบับที่บันทึกอยู่บนเว็บไซต์ ↗</a>}
        </div>
      </Card>}
      {guided && step === 2 && <Card>
        <CardHead title="3. ตรวจตัวอย่างเนื้อหา" />
        <div className="p-5"><p className="mb-4 text-sm text-muted">ตัวอย่างจากสิ่งที่กำลังแก้ไข ยังไม่เผยแพร่ การจัดหน้าจริงอาจต่างเล็กน้อย</p><DraftPreview values={values} locale={editLocale} /></div>
      </Card>}
      {(!guided || step < 2) && <Card>
        <CardHead title={guided ? step === 0 ? "1. เขียนเนื้อหาและรายละเอียด" : "2. เลือกภาพหน้าปก" : "รายละเอียด"} />
        <div className="grid gap-5 p-5">
          {guided && step === 1 && <p className="text-sm text-muted">ภาพนี้จะแสดงบนการ์ดและด้านบนของเรื่อง คลิกปุ่มเพื่ออัปโหลดหรือเลือกภาพที่เคยใช้</p>}
          {config.fields.filter(field => !guided || (step === 1 ? field.type === "image" : field.type !== "image" && field.type !== "slug")).map(renderField)}
          {guided && step === 1 && !!values.cover_url && <button type="button" className="w-fit text-sm text-muted underline" onClick={() => set("cover_url", "")}>นำภาพหน้าปกออก (ยังเก็บไฟล์ไว้ในคลัง)</button>}
        </div>
      </Card>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isNew && !importedNews && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              ลบ{config.singular}นี้
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => guided && step > 0 ? setStep(step - 1) : dirty ? setLeaveHref(backHref) : router.push(backHref)}
            className="rounded-lg px-4 py-2.5 text-sm text-muted hover:bg-surface"
          >
            {guided && step > 0 ? "ย้อนกลับ" : "กลับรายการ"}
          </button>
          {guided && step < 3 && initial?.status !== "published" && <button type="button" onClick={() => save("draft")} disabled={pending} className="rounded-lg border border-line px-4 py-2.5 text-sm">บันทึกฉบับร่าง</button>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:brightness-110 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {guided ? step < 3 ? "ถัดไป →" : values.status === "published" ? "บันทึกและเผยแพร่" : "บันทึกฉบับร่าง" : config.key === "team" ? (values.status === "published" ? "บันทึกและเผยแพร่ / Save and publish" : "บันทึกฉบับร่าง / Save draft") : "บันทึก"}
          </button>
        </div>
      </div>

      <MediaPickerDialog
        open={mediaField !== null}
        onOpenChange={(v) => !v && setMediaField(null)}
        kind={mediaField && config.fields.find((f) => f.name === mediaField)?.type === "file" ? "document" : "image"}
        onSelect={(url) => mediaField && set(mediaField, url)}
      />

      <IconPickerDialog
        open={iconField !== null}
        current={iconField ? String(values[iconField] ?? "") : ""}
        onOpenChange={(v) => !v && setIconField(null)}
        onSelect={(name) => { if (iconField) set(iconField, name); setIconField(null); }}
      />

      <ConfirmDialog
        open={leaveHref !== null}
        onOpenChange={(open) => !open && setLeaveHref(null)}
        title="ยังมีการแก้ไขที่ไม่บันทึก"
        description="ถ้าออกจากหน้านี้ การแก้ไขล่าสุดจะหายไป กดยกเลิกเพื่อกลับไปบันทึกก่อน"
        confirmLabel="ออกโดยไม่บันทึก"
        onConfirm={leave}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`ลบ${config.singular}นี้?`}
        description="การลบไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ"
        destructive
        pending={pending}
        onConfirm={onDelete}
      />
    </form>
  );
}

function DraftPreview({ values, locale }: { values: Row; locale: "th" | "en" }) {
  const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
  const title = escape(values[`title_${locale}`] || (locale === "th" ? "ยังไม่มีหัวข้อ" : "No title yet"));
  const excerpt = escape(values[`excerpt_${locale}`]);
  const cover = values.cover_url ? `<img src="${escape(values.cover_url)}" alt="">` : "";
  const details = [values.start_date, values.end_date, values[`venue_${locale}`]].filter(Boolean).map(escape).join(" · ");
  const body = sanitizeHtml(String(values[`body_${locale}`] ?? ""));
  const html = `<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;font:16px/1.7 system-ui,sans-serif;color:#14243a;background:white}h1{font-size:28px;line-height:1.35}img{max-width:100%;height:auto;border-radius:12px}p{overflow-wrap:anywhere}a{color:#315b89}</style></head><body><h1>${title}</h1><p>${excerpt}</p><p>${details}</p>${cover}${body}</body></html>`;
  return <iframe title={locale === "th" ? "ตัวอย่างเนื้อหาภาษาไทย" : "English content preview"} sandbox="" srcDoc={html} className="h-[36rem] w-full rounded-xl border border-line bg-white" />;
}

function IconPickerDialog({
  open, current, onOpenChange, onSelect,
}: { open: boolean; current: string; onOpenChange: (v: boolean) => void; onSelect: (name: string) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button aria-label="ปิด" onClick={() => onOpenChange(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div className="relative max-h-[70vh] w-[min(32rem,100%)] overflow-y-auto rounded-2xl border border-line bg-paper p-4 shadow-2xl">
        <p className="mb-3 text-sm font-semibold">เลือกไอคอน</p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              title={name}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-muted hover:border-accent hover:text-accent ${
                current === name ? "border-accent bg-accent-soft text-accent" : "border-line"
              }`}
            >
              <Icon name={name} className="size-5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
