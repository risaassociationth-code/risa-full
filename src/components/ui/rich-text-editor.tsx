"use client";

import { useState } from "react";
import { useEditor, EditorContent, Node, Mark, Extension, mergeAttributes, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Heading2,
  ImagePlus,
  IndentIncrease,
  IndentDecrease,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "./media-picker";
import { useAdminLanguage } from "@/components/admin/AdminLanguage";

// Preserve imported inline photographs when the surrounding text is edited.
const InlineImage = Node.create({
  name: "image", group: "inline", inline: true, atom: true, draggable: true,
  addAttributes() { return { src: { default: null }, alt: { default: "" }, title: { default: null } }; },
  parseHTML() { return [{ tag: "img[src]" }]; },
  renderHTML({ HTMLAttributes }) { return ["img", HTMLAttributes]; },
});

const TextSizeMark = Mark.create({
  name: "textSize",
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => {
          if (el.classList.contains("risa-text-sm")) return "sm";
          if (el.classList.contains("risa-text-lg")) return "lg";
          if (el.classList.contains("risa-text-xl")) return "xl";
          return null;
        },
        renderHTML: (attrs) => {
          if (!attrs.size) return {};
          return { class: `risa-text-${attrs.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [
      { tag: "span.risa-text-sm" },
      { tag: "span.risa-text-lg" },
      { tag: "span.risa-text-xl" },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const IndentExtension = Extension.create({
  name: "risaIndent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              for (let i = 1; i <= 4; i++) {
                if (el.classList.contains(`risa-indent-${i}`)) return i;
              }
              return 0;
            },
            renderHTML: (attrs) => {
              const level = Number(attrs.indent || 0);
              if (level < 1 || level > 4) return {};
              return { class: `risa-indent-${level}` };
            },
          },
        },
      },
    ];
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.sinkListItem("listItem");
        }
        const type = this.editor.isActive("heading") ? "heading" : "paragraph";
        const curr = Number(this.editor.getAttributes(type).indent || 0);
        if (curr < 4) {
          return this.editor.commands.updateAttributes(type, { indent: curr + 1 });
        }
        return true;
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("listItem")) {
          return this.editor.commands.liftListItem("listItem");
        }
        const type = this.editor.isActive("heading") ? "heading" : "paragraph";
        const curr = Number(this.editor.getAttributes(type).indent || 0);
        if (curr > 0) {
          return this.editor.commands.updateAttributes(type, { indent: curr - 1 });
        }
        return true;
      },
    };
  },
});

type Props = { value: string; onChange: (html: string) => void; minHeight?: number };

function ToolbarButton({
  on, action, children, label,
}: { on?: boolean; action: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={action}
      className={cn(
        "rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink",
        on && "bg-ink text-white hover:bg-ink hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function setLink(editor: Editor, th: boolean) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt(th ? "ลิงก์ (เว้นว่างเพื่อลบ)" : "Link (leave blank to remove)", previous ?? "https://");
  if (url === null) return;
  if (url === "") editor.chain().focus().unsetLink().run();
  else editor.chain().focus().setLink({ href: url }).run();
}

function getActiveTextSize(editor: Editor): string {
  const size = editor.getAttributes("textSize").size as string | undefined;
  return size || "normal";
}

function applyTextSize(editor: Editor, value: string) {
  const { empty, $from } = editor.state.selection;
  if (empty && $from.parent.isTextblock && $from.parent.content.size > 0) {
    const from = $from.start();
    const to = $from.end();
    if (value === "normal") {
      editor.chain().focus().setTextSelection({ from, to }).unsetMark("textSize").setTextSelection($from.pos).run();
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setMark("textSize", { size: value })
        .setTextSelection($from.pos)
        .run();
    }
    return;
  }

  if (value === "normal") {
    editor.chain().focus().unsetMark("textSize").run();
  } else {
    editor.chain().focus().setMark("textSize", { size: value }).run();
  }
}

function changeIndent(editor: Editor, delta: 1 | -1) {
  if (editor.isActive("listItem")) {
    if (delta > 0) editor.chain().focus().sinkListItem("listItem").run();
    else editor.chain().focus().liftListItem("listItem").run();
    return;
  }
  const type = editor.isActive("heading") ? "heading" : "paragraph";
  const curr = Number(editor.getAttributes(type).indent || 0);
  const next = Math.max(0, Math.min(4, curr + delta));
  editor.chain().focus().updateAttributes(type, { indent: next }).run();
}

export function RichTextEditor({ value, onChange, minHeight = 160 }: Props) {
  const { locale } = useAdminLanguage();
  const th = locale === "th";
  const [mediaOpen, setMediaOpen] = useState(false);
  const [, setTick] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit bundles its own Link and Underline extensions; Link is configured explicitly below.
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
      InlineImage,
      TextSizeMark,
      IndentExtension,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose-risa focus:outline-none px-3 py-2.5 text-sm",
        style: `min-height:${minHeight}px`,
        role: "textbox",
        "aria-label": th ? "เนื้อหาบทความ" : "Article content",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: () => setTick((n) => n + 1),
  });

  if (!editor) {
    return <div className="h-40 animate-pulse rounded-lg bg-surface" />;
  }

  const activeSize = getActiveTextSize(editor);
  const currentIndent = Number(
    editor.getAttributes(editor.isActive("heading") ? "heading" : "paragraph").indent || 0,
  );

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line-soft bg-surface px-1.5 py-1">
        <ToolbarButton label={th ? "ตัวหนา" : "Bold"} on={editor.isActive("bold")} action={() => editor.chain().focus().toggleBold().run()}><Bold className="size-3.5" /></ToolbarButton>
        <ToolbarButton label={th ? "ตัวเอียง" : "Italic"} on={editor.isActive("italic")} action={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-3.5" /></ToolbarButton>
        <ToolbarButton label={th ? "ขีดเส้นใต้" : "Underline"} on={editor.isActive("underline")} action={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-3.5" /></ToolbarButton>
        <ToolbarButton label={th ? "หัวข้อ" : "Heading"} on={editor.isActive("heading", { level: 2 })} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-3.5" /></ToolbarButton>

        <span className="mx-1 h-4 w-px bg-line" />

        {/* Text Size Selector */}
        <label className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted hover:bg-surface-2 hover:text-ink" title={th ? "ขนาดตัวอักษร" : "Text size"}>
          <Type className="size-3.5 shrink-0" />
          <select
            aria-label={th ? "ขนาดตัวอักษร" : "Text size"}
            value={activeSize}
            onChange={(e) => applyTextSize(editor, e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-medium text-ink focus:outline-none"
          >
            <option value="sm">{th ? "ขนาด: เล็ก" : "Size: Small"}</option>
            <option value="normal">{th ? "ขนาด: ปกติ" : "Size: Normal"}</option>
            <option value="lg">{th ? "ขนาด: ใหญ่" : "Size: Large"}</option>
            <option value="xl">{th ? "ขนาด: ใหญ่มาก" : "Size: Extra Large"}</option>
          </select>
        </label>

        <span className="mx-1 h-4 w-px bg-line" />

        {/* Indentation Controls */}
        <ToolbarButton
          label={th ? "ลดย่อหน้า (Shift+Tab)" : "Decrease indent (Shift+Tab)"}
          on={false}
          action={() => changeIndent(editor, -1)}
        >
          <IndentDecrease className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label={th ? "เพิ่มย่อหน้า (Tab)" : "Increase indent (Tab)"}
          on={currentIndent > 0}
          action={() => changeIndent(editor, 1)}
        >
          <IndentIncrease className="size-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-line" />

        <ToolbarButton label={th ? "รายการ" : "Bullet list"} on={editor.isActive("bulletList")} action={() => editor.chain().focus().toggleBulletList().run()}><List className="size-3.5" /></ToolbarButton>
        <ToolbarButton label={th ? "รายการตัวเลข" : "Numbered list"} on={editor.isActive("orderedList")} action={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-3.5" /></ToolbarButton>
        <ToolbarButton label={th ? "ยกคำพูด" : "Blockquote"} on={editor.isActive("blockquote")} action={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-3.5" /></ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton label={th ? "ลิงก์" : "Link"} on={editor.isActive("link")} action={() => setLink(editor, th)}>
          <Link2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label={th ? "เพิ่มรูปในเนื้อหา" : "Insert image"} action={() => setMediaOpen(true)}><ImagePlus className="size-3.5" /></ToolbarButton>
        <span className="ml-auto flex gap-0.5">
          <ToolbarButton label={th ? "ย้อนกลับ" : "Undo"} action={() => editor.chain().focus().undo().run()}><Undo2 className="size-3.5" /></ToolbarButton>
          <ToolbarButton label={th ? "ทำซ้ำ" : "Redo"} action={() => editor.chain().focus().redo().run()}><Redo2 className="size-3.5" /></ToolbarButton>
        </span>
      </div>
      <EditorContent editor={editor} className="max-h-72 overflow-y-auto" />
      <MediaPickerDialog open={mediaOpen} onOpenChange={setMediaOpen} onSelect={src => { editor.chain().focus().insertContent({ type: "image", attrs: { src, alt: "" } }).run(); setMediaOpen(false); }} />
    </div>
  );
}

