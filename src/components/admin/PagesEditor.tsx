"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { saveContentBlock } from "@/actions/content";
import { Field, Input, Textarea } from "@/components/ui/field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaPickerDialog } from "@/components/ui/media-picker";
import { Mono } from "./ui";
import type { SectionDef } from "@/content/registry";

type Value = { th: string; en: string };
type Values = Record<string, Value>;

export function PagesEditor({ sections, initial }: { sections: SectionDef[]; initial: Values }) {
  const [values, setValues] = useState<Values>(initial);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  function set(key: string, lang: "th" | "en", v: string) {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [lang]: v } }));
    setDirty((prev) => ({ ...prev, [key]: true }));
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <SectionCard
          key={section.section}
          section={section}
          values={values}
          dirty={dirty}
          onChange={set}
          onSaved={(keys) =>
            setDirty((prev) => {
              const next = { ...prev };
              for (const k of keys) delete next[k];
              return next;
            })
          }
        />
      ))}
    </div>
  );
}

function SectionCard({
  section, values, dirty, onChange, onSaved,
}: {
  section: SectionDef;
  values: Values;
  dirty: Record<string, boolean>;
  onChange: (key: string, lang: "th" | "en", v: string) => void;
  onSaved: (keys: string[]) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [mediaKey, setMediaKey] = useState<string | null>(null);
  const dirtyKeys = section.blocks.filter((b) => dirty[b.key]).map((b) => b.key);

  function saveSection() {
    startTransition(async () => {
      const results = await Promise.all(
        dirtyKeys.map(async (key) => {
          const v = values[key];
          const res = await saveContentBlock(key, v?.th ?? "", v?.en ?? "");
          return { key, res };
        }),
      );
      const failed = results.filter((r) => !r.res.ok);
      if (failed.length > 0) {
        toast.error(`บันทึกไม่สำเร็จ ${failed.length} รายการ`);
      } else {
        toast.success(`บันทึก "${section.label}" แล้ว`);
        onSaved(dirtyKeys);
      }
    });
  }

  return (
    <div className="rounded-xl border border-line bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
        <h2 className="text-sm font-semibold">{section.label}</h2>
        <button
          type="button"
          onClick={saveSection}
          disabled={pending || dirtyKeys.length === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-ink disabled:opacity-40"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}<AdminText>{"บันทึก"}</AdminText>{dirtyKeys.length > 0 ? ` (${dirtyKeys.length})` : ""}
        </button>
      </div>
      <div className="space-y-5 p-5">
        {section.blocks.map((block) => {
          const v = values[block.key] ?? { th: "", en: "" };
          return (
            <div key={block.key}>
              <div className="mb-1.5 flex items-center gap-2">
                <Mono>{block.key}</Mono>
                {dirty[block.key] && (
                  <span className="size-1.5 rounded-full bg-accent" title="มีการแก้ไขที่ยังไม่บันทึก" />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={`${block.label} (ไทย)`}>
                  {block.type === "richtext" ? (
                    <RichTextEditor value={v.th} onChange={(html) => onChange(block.key, "th", html)} />
                  ) : block.type === "image" ? (
                    <ImageField value={v.th} onPick={() => setMediaKey(`${block.key}:th`)} />
                  ) : v.th.length > 70 || block.type === "text" ? (
                    <Textarea
                      value={v.th}
                      onChange={(e) => onChange(block.key, "th", e.target.value)}
                      rows={v.th.includes("\n") ? 4 : 2}
                    />
                  ) : (
                    <Input value={v.th} onChange={(e) => onChange(block.key, "th", e.target.value)} />
                  )}
                </Field>
                <Field label={`${block.label} (English)`}>
                  {block.type === "richtext" ? (
                    <RichTextEditor value={v.en} onChange={(html) => onChange(block.key, "en", html)} />
                  ) : block.type === "image" ? (
                    <ImageField value={v.en} onPick={() => setMediaKey(`${block.key}:en`)} />
                  ) : v.en.length > 70 || block.type === "text" ? (
                    <Textarea
                      value={v.en}
                      onChange={(e) => onChange(block.key, "en", e.target.value)}
                      rows={v.en.includes("\n") ? 4 : 2}
                    />
                  ) : (
                    <Input value={v.en} onChange={(e) => onChange(block.key, "en", e.target.value)} />
                  )}
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <MediaPickerDialog
        open={mediaKey !== null}
        onOpenChange={(v) => !v && setMediaKey(null)}
        onSelect={(url) => {
          if (!mediaKey) return;
          const [key, lang] = mediaKey.split(":") as [string, "th" | "en"];
          onChange(key, lang, url);
        }}
      />
    </div>
  );
}

function ImageField({ value, onPick }: { value: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex h-24 w-full max-w-48 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface text-xs text-muted hover:border-accent"
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="size-full object-cover" />
      ) : (
        "เลือกรูปภาพ"
      )}
    </button>
  );
}
