"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateSettings } from "@/actions/admin";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MediaPickerDialog } from "@/components/ui/media-picker";
import { Card, CardHead } from "./ui";
import type { SiteSettings } from "@/lib/content";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [values, setValues] = useState<SiteSettings>(initial);
  const [pending, start] = useTransition();
  const [mediaField, setMediaField] = useState<"logo_url" | "favicon_url" | null>(null);

  function set<K extends keyof SiteSettings>(key: K, v: SiteSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function save() {
    start(async () => {
      const res = await updateSettings(values);
      if (!res.ok) toast.error(res.error);
      else toast.success("บันทึกการตั้งค่าแล้ว");
    });
  }

  return (
    <div className="space-y-6 pb-16">
      <Card>
        <CardHead title="องค์กร" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="ชื่อองค์กร (ไทย)" required>
            <Input value={values.org_name_th} onChange={(e) => set("org_name_th", e.target.value)} />
          </Field>
          <Field label="ชื่อองค์กร (English)">
            <Input value={values.org_name_en} onChange={(e) => set("org_name_en", e.target.value)} />
          </Field>
          <Field label="ชื่อย่อ" required hint="ใช้แสดงในโลโก้ข้อความและหัวเรื่องเว็บไซต์">
            <Input value={values.org_short} onChange={(e) => set("org_short", e.target.value)} />
          </Field>
          <div />
          <Field label="แท็กไลน์ (ไทย)">
            <Input value={values.tagline_th} onChange={(e) => set("tagline_th", e.target.value)} />
          </Field>
          <Field label="แท็กไลน์ (English)">
            <Input value={values.tagline_en} onChange={(e) => set("tagline_en", e.target.value)} />
          </Field>
          <Field label="โลโก้">
            <button
              type="button"
              onClick={() => setMediaField("logo_url")}
              className="flex h-16 items-center gap-3 rounded-lg border border-line bg-surface px-3 text-sm text-muted hover:border-accent"
            >
              {values.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.logo_url} alt="" className="h-8 w-auto" />
              ) : "เลือกโลโก้"}
            </button>
          </Field>
          <Field label="Favicon">
            <button
              type="button"
              onClick={() => setMediaField("favicon_url")}
              className="flex h-16 items-center gap-3 rounded-lg border border-line bg-surface px-3 text-sm text-muted hover:border-accent"
            >
              {values.favicon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.favicon_url} alt="" className="size-8" />
              ) : "เลือก favicon"}
            </button>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="แบรนด์" hint="สีหลักที่ใช้ทั่วทั้งเว็บไซต์" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="สีเน้น (Accent)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values.color_accent}
                onChange={(e) => set("color_accent", e.target.value)}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-line"
              />
              <Input value={values.color_accent} onChange={(e) => set("color_accent", e.target.value)} className="font-mono" />
            </div>
          </Field>
          <Field label="สีตัวอักษรหลัก (Ink)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values.color_ink}
                onChange={(e) => set("color_ink", e.target.value)}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-line"
              />
              <Input value={values.color_ink} onChange={(e) => set("color_ink", e.target.value)} className="font-mono" />
            </div>
          </Field>
          <Field label="ความโค้งขอบ (Radius)">
            <Input value={values.radius} onChange={(e) => set("radius", e.target.value)} placeholder="10px" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="ติดต่อ" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="ที่อยู่ (ไทย)">
            <Textarea value={values.address_th} onChange={(e) => set("address_th", e.target.value)} />
          </Field>
          <Field label="ที่อยู่ (English)">
            <Textarea value={values.address_en} onChange={(e) => set("address_en", e.target.value)} />
          </Field>
          <Field label="โทรศัพท์">
            <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="อีเมล">
            <Input value={values.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="LINE Official ID">
            <Input value={values.line_id} onChange={(e) => set("line_id", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="โซเชียลมีเดีย" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Facebook URL">
            <Input value={values.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="X (Twitter) URL">
            <Input value={values.x_url} onChange={(e) => set("x_url", e.target.value)} placeholder="https://x.com/…" />
          </Field>
          <Field label="YouTube URL">
            <Input value={values.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} placeholder="https://youtube.com/…" />
          </Field>
          <Field label="LinkedIn URL">
            <Input value={values.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/…" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="แผนที่" hint="ใช้กำหนดจุดสำนักงานบนหน้าติดต่อเราและแผนที่เครือข่าย" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="ละติจูด (lat)">
            <Input type="number" step="any" value={values.map_lat} onChange={(e) => set("map_lat", Number(e.target.value))} />
          </Field>
          <Field label="ลองจิจูด (lng)">
            <Input type="number" step="any" value={values.map_lng} onChange={(e) => set("map_lng", Number(e.target.value))} />
          </Field>
          <Field label="ระดับซูม (zoom)">
            <Input type="number" value={values.map_zoom} onChange={(e) => set("map_zoom", Number(e.target.value))} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="อื่น ๆ" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Google Analytics ID" hint="เว้นว่างได้หากยังไม่ใช้งาน">
            <Input value={values.ga_id} onChange={(e) => set("ga_id", e.target.value)} placeholder="G-XXXXXXXXXX" />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink shadow-lg hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}<AdminText>{"บันทึกการตั้งค่า"}</AdminText></button>
      </div>

      <MediaPickerDialog
        open={mediaField !== null}
        onOpenChange={(v) => !v && setMediaField(null)}
        onSelect={(url) => mediaField && set(mediaField, url)}
      />
    </div>
  );
}
