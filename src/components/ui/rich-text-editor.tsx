"use client";

import { useState } from "react";
import { useEditor, EditorContent, Node, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link2, List, ListOrdered, Quote, Undo2, Redo2, Heading2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "./media-picker";

// Preserve imported inline photographs when the surrounding text is edited.
const InlineImage = Node.create({
  name: "image", group: "inline", inline: true, atom: true, draggable: true,
  addAttributes() { return { src: { default: null }, alt: { default: "" }, title: { default: null } }; },
  parseHTML() { return [{ tag: "img[src]" }]; },
  renderHTML({ HTMLAttributes }) { return ["img", HTMLAttributes]; },
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

function setLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("ลิงก์ (เว้นว่างเพื่อลบ)", previous ?? "https://");
  if (url === null) return;
  if (url === "") editor.chain().focus().unsetLink().run();
  else editor.chain().focus().setLink({ href: url }).run();
}

export function RichTextEditor({ value, onChange, minHeight = 160 }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit bundles its own Link extension; disabled here since we
      // configure Link explicitly below with our own options (no autolink
      // click-through, rel="noopener") — keeping both registers it twice.
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
      InlineImage,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose-risa focus:outline-none px-3 py-2.5 text-sm",
        style: `min-height:${minHeight}px`,
        role: "textbox",
        "aria-label": "เนื้อหาบทความ",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return <div className="h-40 animate-pulse rounded-lg bg-surface" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line-soft bg-surface px-1.5 py-1">
        <ToolbarButton label="ตัวหนา" on={editor.isActive("bold")} action={() => editor.chain().focus().toggleBold().run()}><Bold className="size-3.5" /></ToolbarButton>
        <ToolbarButton label="ตัวเอียง" on={editor.isActive("italic")} action={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-3.5" /></ToolbarButton>
        <ToolbarButton label="หัวข้อ" on={editor.isActive("heading", { level: 2 })} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-3.5" /></ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton label="รายการ" on={editor.isActive("bulletList")} action={() => editor.chain().focus().toggleBulletList().run()}><List className="size-3.5" /></ToolbarButton>
        <ToolbarButton label="รายการตัวเลข" on={editor.isActive("orderedList")} action={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-3.5" /></ToolbarButton>
        <ToolbarButton label="ยกคำพูด" on={editor.isActive("blockquote")} action={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-3.5" /></ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton label="ลิงก์" on={editor.isActive("link")} action={() => setLink(editor)}>
          <Link2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="เพิ่มรูปในเนื้อหา" action={() => setMediaOpen(true)}><ImagePlus className="size-3.5" /></ToolbarButton>
        <span className="ml-auto flex gap-0.5">
          <ToolbarButton label="ย้อนกลับ" action={() => editor.chain().focus().undo().run()}><Undo2 className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="ทำซ้ำ" action={() => editor.chain().focus().redo().run()}><Redo2 className="size-3.5" /></ToolbarButton>
        </span>
      </div>
      <EditorContent editor={editor} className="max-h-72 overflow-y-auto" />
      <MediaPickerDialog open={mediaOpen} onOpenChange={setMediaOpen} onSelect={src => { editor.chain().focus().insertContent({ type: "image", attrs: { src, alt: "" } }).run(); setMediaOpen(false); }} />
    </div>
  );
}
