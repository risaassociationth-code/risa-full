# -*- coding: utf-8 -*-
import re

path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/ui/rich-text-editor.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    'import { MediaPickerDialog } from "./media-picker";',
    'import { MediaPickerDialog } from "./media-picker";\nimport { useAdminLanguage } from "@/components/admin/AdminLanguage";'
)

# Modify setLink signature
content = content.replace(
    'function setLink(editor: Editor) {',
    'function setLink(editor: Editor, th: boolean) {'
)
content = content.replace(
    'const url = window.prompt("ลิงก์ (เว้นว่างเพื่อลบ)", previous ?? "https://");',
    'const url = window.prompt(th ? "ลิงก์ (เว้นว่างเพื่อลบ)" : "Link (leave blank to remove)", previous ?? "https://");'
)

# Modify RichTextEditor hook
content = content.replace(
    'export function RichTextEditor({ value, onChange, minHeight = 160 }: Props) {\n  const [mediaOpen, setMediaOpen] = useState(false);',
    'export function RichTextEditor({ value, onChange, minHeight = 160 }: Props) {\n  const { locale } = useAdminLanguage();\n  const th = locale === "th";\n  const [mediaOpen, setMediaOpen] = useState(false);'
)

# Modify editor aria-label
content = content.replace(
    '"aria-label": "เนื้อหาบทความ",',
    '"aria-label": th ? "เนื้อหาบทความ" : "Article content",'
)

# Replace labels
content = content.replace('label="ตัวหนา"', 'label={th ? "ตัวหนา" : "Bold"}')
content = content.replace('label="ตัวเอียง"', 'label={th ? "ตัวเอียง" : "Italic"}')
content = content.replace('label="หัวข้อ"', 'label={th ? "หัวข้อ" : "Heading"}')
content = content.replace('label="รายการ"', 'label={th ? "รายการ" : "Bullet list"}')
content = content.replace('label="รายการตัวเลข"', 'label={th ? "รายการตัวเลข" : "Numbered list"}')
content = content.replace('label="ยกคำพูด"', 'label={th ? "ยกคำพูด" : "Blockquote"}')
content = content.replace('label="ลิงก์"', 'label={th ? "ลิงก์" : "Link"}')
content = content.replace('label="เพิ่มรูปในเนื้อหา"', 'label={th ? "เพิ่มรูปในเนื้อหา" : "Insert image"}')
content = content.replace('label="ย้อนกลับ"', 'label={th ? "ย้อนกลับ" : "Undo"}')
content = content.replace('label="ทำซ้ำ"', 'label={th ? "ทำซ้ำ" : "Redo"}')

# Update setLink call
content = content.replace('setLink(editor)', 'setLink(editor, th)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
