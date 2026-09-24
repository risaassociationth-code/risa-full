"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { createRow, deleteRow, updateRow } from "@/actions/collections";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaPickerDialog } from "@/components/ui/media-picker";
import { Icon, ICON_NAMES } from "@/components/site/Icon";
import { slugify } from "@/lib/utils";
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
  const importedNews = config.key === "news" && /^mms-hub-\d+$/.test(String(initial?.slug ?? ""));
  const [values, setValues] = useState<Row>(() => ({ ...(initial ?? {}), ...(scope ?? {}) }));
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mediaField, setMediaField] = useState<string | null>(null);
  const [iconField, setIconField] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<"th" | "en">("th");
  const router = useRouter();

  const titleSources = useMemo(
    () => config.fields.filter((f) => f.slugFrom || f.name === config.titleField),
    [config],
  );

  function set(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = isNew
        ? await createRow(config.key, values)
        : await updateRow(config.key, String(initial!.id), values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("บันทึกแล้ว");
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
      router.push(backHref);
      router.refresh();
    });
  }

  function renderControl(field: FieldDef, name: string) {
    const raw = values[name];

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
            type="number"
            value={raw === null || raw === undefined ? "" : String(raw)}
            onChange={(e) => set(name, e.target.value === "" ? null : Number(e.target.value))}
            placeholder={field.placeholder}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={raw ? String(raw).slice(0, 10) : ""}
            onChange={(e) => set(name, e.target.value)}
          />
        );
      case "select":
        return (
          <Select value={String(raw ?? field.options?.[0]?.value ?? "")} onChange={(e) => set(name, e.target.value)}>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        );
      case "tags":
        return (
          <Input
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
                <span className="text-xs">เลือกรูปภาพ</span>
              </span>
            )}
            <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
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
            value={String(raw ?? "")}
            onChange={(e) => set(name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 pb-16">
      {config.key === "team" && <Card>
        <CardHead title="ตัวอย่างกรอบรูปและข้อมูลบนเว็บไซต์" />
        <div className="p-5">
          <div className="mb-4 flex gap-2" aria-label="ภาษาตัวอย่าง">
            {(["th", "en"] as const).map(lang => <button key={lang} type="button" aria-pressed={previewLocale === lang} onClick={() => setPreviewLocale(lang)} className="rounded border border-line px-3 py-1.5 text-sm aria-pressed:bg-accent aria-pressed:text-accent-ink">{lang === "th" ? "ไทย" : "English"}</button>)}
          </div>
          <div className="max-w-xs"><StaffCard preview locale={previewLocale} member={Object.fromEntries(["name_th", "name_en", "position_th", "position_en", "department_th", "department_en", "bio_th", "bio_en", "photo_url", "photo_position", "email", "phone"].map(key => [key, String(values[key] ?? "")])) as StaffProfile} /></div>
          {values.photo_url ? <button type="button" onClick={() => set("photo_url", "")} className="mt-3 text-sm text-muted underline">เอารูปออกจากโปรไฟล์ (ไฟล์ยังอยู่ในคลัง)</button> : null}
        </div>
      </Card>}
      {importedNews && <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">ข่าวนี้นำเข้าจาก MMS Hub และคงเครดิตต้นฉบับไว้ เปลี่ยนสถานะเป็น “ฉบับร่าง” เพื่อซ่อนจากหน้าข่าวของ RISA</p>}
      <Card>
        <CardHead title="รายละเอียด" />
        <div className="grid gap-5 p-5">
          {config.fields.map((field) => (
            <div key={field.name}>
              {field.bilingual ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["th", "en"] as const).map((lang) => (
                    <Field key={lang} label={labelFor(field, lang)} required={field.required && lang === "th"} hint={lang === "en" ? field.help : undefined}>
                      {renderControl(field, `${field.name}_${lang}`)}
                    </Field>
                  ))}
                </div>
              ) : (
                <Field label={field.label} required={field.required} hint={field.help}>
                  {renderControl(field, field.name)}
                </Field>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="rounded-lg px-4 py-2.5 text-sm text-muted hover:bg-surface"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:brightness-110 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            บันทึก
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
