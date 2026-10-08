# -*- coding: utf-8 -*-

import re

path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/admin/CollectionTable.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    'import { ManageImportedNewsButton } from "./ManageImportedNewsButton";',
    'import { ManageImportedNewsButton } from "./ManageImportedNewsButton";\nimport { useAdminLanguage } from "./AdminLanguage";'
)

# Add hook
content = content.replace(
    'export function CollectionTable({ config, rows: initialRows, scopeValue, hrefFor, newHref, hideNew }: Props) {\n  const [rows, setRows] = useState(initialRows);',
    'export function CollectionTable({ config, rows: initialRows, scopeValue, hrefFor, newHref, hideNew }: Props) {\n  const { locale } = useAdminLanguage();\n  const th = locale === "th";\n  const [rows, setRows] = useState(initialRows);'
)

# Replace literals
content = content.replace('toast.success(next === "published" ? "เผยแพร่แล้ว" : "เปลี่ยนเป็นฉบับร่างแล้ว");', 'toast.success(next === "published" ? (th ? "เผยแพร่แล้ว" : "Published") : (th ? "เปลี่ยนเป็นฉบับร่างแล้ว" : "Changed to draft"));')
content = content.replace('toast.success("ทำสำเนาแล้ว");', 'toast.success(th ? "ทำสำเนาแล้ว" : "Duplicated");')
content = content.replace('res.ok ? res.data.title : "รายการนี้"', 'res.ok ? res.data.title : (th ? "รายการนี้" : "this record")')
content = content.replace('toast.success("ลบแล้ว");', 'toast.success(th ? "ลบแล้ว" : "Deleted");')
content = content.replace('placeholder="ค้นหา…"', 'placeholder={th ? "ค้นหา…" : "Search..."}')
content = content.replace('aria-label={`ค้นหา${config.label}`}', 'aria-label={th ? `ค้นหา${config.label}` : `Search ${config.label}`}')
content = content.replace('{s === "all" ? "ทั้งหมด" : STATUS_LABEL[s]}', '{s === "all" ? (th ? "ทั้งหมด" : "All") : (th ? STATUS_LABEL[s] : s === "published" ? "Published" : "Draft")}')
content = content.replace('เพิ่ม{config.singular}', '{th ? `เพิ่ม${config.singular}` : `Add ${config.singular}`}')
content = content.replace('เปลี่ยนสถานะ: เปิดตัวแก้ไข → ขั้นตอนเผยแพร่ → เลือกสถานะ → บันทึก', '{th ? "เปลี่ยนสถานะ: เปิดตัวแก้ไข → ขั้นตอนเผยแพร่ → เลือกสถานะ → บันทึก" : "To change status: open editor → publish step → select status → save"}')
content = content.replace('title={rows.length === 0 ? `ยังไม่มี${config.singular}` : "ไม่พบรายการที่ค้นหา"}', 'title={rows.length === 0 ? (th ? `ยังไม่มี${config.singular}` : `No ${config.singular} yet`) : (th ? "ไม่พบรายการที่ค้นหา" : "No records found")}')
content = content.replace('hint={rows.length === 0 ? `เริ่มต้นด้วยการเพิ่ม${config.singular}รายการแรก` : undefined}', 'hint={rows.length === 0 ? (th ? `เริ่มต้นด้วยการเพิ่ม${config.singular}รายการแรก` : `Get started by adding your first ${config.singular}`) : undefined}')
content = content.replace('<th className="w-16 px-4 py-2.5">ลำดับ</th>', '<th className="w-16 px-4 py-2.5">{th ? "ลำดับ" : "Sort"}</th>')
content = content.replace('<th className="px-4 py-2.5">สถานะ</th>', '<th className="px-4 py-2.5">{th ? "สถานะ" : "Status"}</th>')
content = content.replace('<th className="px-4 py-2.5 text-right">จัดการ</th>', '<th className="px-4 py-2.5 text-right">{th ? "จัดการ" : "Manage"}</th>')
content = content.replace('aria-label="เลื่อนขึ้น"', 'aria-label={th ? "เลื่อนขึ้น" : "Move up"}')
content = content.replace('aria-label="เลื่อนลง"', 'aria-label={th ? "เลื่อนลง" : "Move down"}')
content = content.replace('|| "(ไม่มีชื่อ)"', '|| (th ? "(ไม่มีชื่อ)" : "(Untitled)")')
content = content.replace('<span className="text-faint">(ไม่มีชื่อ)</span>', '<span className="text-faint">{th ? "(ไม่มีชื่อ)" : "(Untitled)"}</span>')
content = content.replace('title={config.key === "team" ? "เปิดหน้าต่างยืนยันการเผยแพร่หรือซ่อนโปรไฟล์" : "คลิกเพื่อสลับสถานะ"}', 'title={config.key === "team" ? (th ? "เปิดหน้าต่างยืนยันการเผยแพร่หรือซ่อนโปรไฟล์" : "Toggle profile visibility") : (th ? "คลิกเพื่อสลับสถานะ" : "Click to toggle status")}')
content = content.replace('text-accent">แก้ไข</Link>', 'text-accent">{th ? "แก้ไข" : "Edit"}</Link>')
content = content.replace('`/th/${config.key}/', '`/${th ? "th" : "en"}/${config.key}/')
content = content.replace('`/th/mms-hub/', '`/${th ? "th" : "en"}/mms-hub/')
content = content.replace('`/th/news/', '`/${th ? "th" : "en"}/news/')
content = content.replace('text-accent underline">ดูบนเว็บไซต์ ↗</Link>', 'text-accent underline">{th ? "ดูบนเว็บไซต์ ↗" : "View site ↗"}</Link>')
content = content.replace('text-accent hover:underline">ดูหน้าเว็บ ↗</Link>', 'text-accent hover:underline">{th ? "ดูหน้าเว็บ ↗" : "View site ↗"}</Link>')
content = content.replace('title="ทำสำเนา"', 'title={th ? "ทำสำเนา" : "Duplicate"}')
content = content.replace('aria-label="ทำสำเนา"', 'aria-label={th ? "ทำสำเนา" : "Duplicate"}')
content = content.replace('title="ลบ"', 'title={th ? "ลบ" : "Delete"}')
content = content.replace('aria-label="ลบ"', 'aria-label={th ? "ลบ" : "Delete"}')
content = content.replace('title={visibilityChange?.status === "published" ? "ซ่อนโปรไฟล์จากเว็บไซต์? / Hide this profile?" : "เผยแพร่โปรไฟล์นี้? / Publish this profile?"}', 'title={visibilityChange?.status === "published" ? (th ? "ซ่อนโปรไฟล์จากเว็บไซต์?" : "Hide this profile?") : (th ? "เผยแพร่โปรไฟล์นี้?" : "Publish this profile?")}')
content = content.replace('description={visibilityChange ? `${cellText(visibilityChange, "name", true)} — ${visibilityChange.status === "published" ? "บุคคลทั่วไปจะไม่เห็นโปรไฟล์นี้ ข้อมูลยังเก็บไว้แก้ไขได้ / The profile will be hidden; its information remains saved." : "ทุกคนจะเห็นรูป ประวัติ และข้อมูลติดต่อที่กรอกไว้บนเว็บไซต์ โปรดตรวจสอบว่าอนุญาตให้เผยแพร่ / The photo, biography and entered contact details will be public. Confirm they may be shared."}` : ""}', 'description={visibilityChange ? `${cellText(visibilityChange, "name", true)} — ${visibilityChange.status === "published" ? (th ? "บุคคลทั่วไปจะไม่เห็นโปรไฟล์นี้ ข้อมูลยังเก็บไว้แก้ไขได้" : "The profile will be hidden; its information remains saved.") : (th ? "ทุกคนจะเห็นรูป ประวัติ และข้อมูลติดต่อที่กรอกไว้บนเว็บไซต์ โปรดตรวจสอบว่าอนุญาตให้เผยแพร่" : "The photo, biography and entered contact details will be public. Confirm they may be shared.")}` : ""}')
content = content.replace('confirmLabel={visibilityChange?.status === "published" ? "ยืนยันซ่อน / Hide profile" : "ยืนยันเผยแพร่ / Publish profile"}', 'confirmLabel={visibilityChange?.status === "published" ? (th ? "ยืนยันซ่อน" : "Hide profile") : (th ? "ยืนยันเผยแพร่" : "Publish profile")}')
content = content.replace('title={`ลบ${config.singular}นี้?`}', 'title={th ? `ลบ${config.singular}นี้?` : `Delete this ${config.singular}?`}')
content = content.replace('description={confirm ? `"${confirm.title}" จะถูกลบอย่างถาวรและกู้คืนไม่ได้` : ""}', 'description={confirm ? (th ? `"${confirm.title}" จะถูกลบอย่างถาวรและกู้คืนไม่ได้` : `"${confirm.title}" will be permanently deleted.`) : ""}')
content = content.replace('confirmLabel="ลบ"', 'confirmLabel={th ? "ลบ" : "Delete"}')

with open(path, 'w') as f:
    f.write(content)
