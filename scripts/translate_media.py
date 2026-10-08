# -*- coding: utf-8 -*-
import re

path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/ui/media-picker.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");', 'throw new Error(data.error ?? (th ? "อัปโหลดไม่สำเร็จ" : "Upload failed"));')
content = content.replace('toast.success("อัปโหลดแล้ว");', 'toast.success(th ? "อัปโหลดแล้ว" : "Uploaded");')
content = content.replace('e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ"', 'e instanceof Error ? e.message : (th ? "อัปโหลดไม่สำเร็จ" : "Upload failed")')
content = content.replace('เลือกรูปภาพหรือเอกสาร · ', '{th ? "เลือกรูปภาพหรือเอกสาร · " : "Select image or document · "}')
content = content.replace('placeholder="ค้นหาชื่อไฟล์"', 'placeholder={th ? "ค้นหาชื่อไฟล์" : "Search files"}')
content = content.replace('<Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}\n              อัปโหลด', '<Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}\n              {th ? "อัปโหลด" : "Upload"}')
content = content.replace('aria-label="ปิด"', 'aria-label={th ? "ปิด" : "Close"}')
content = content.replace('ยังไม่มีไฟล์ในคลัง — อัปโหลดไฟล์แรกได้เลย', '{th ? "ยังไม่มีไฟล์ในคลัง — อัปโหลดไฟล์แรกได้เลย" : "No files in library yet — upload your first file"}')
content = content.replace('เลือกไฟล์\n                </Button>', '{th ? "เลือกไฟล์" : "Select file"}\n                </Button>')
content = content.replace('aria-label="ลบไฟล์"', 'aria-label={th ? "ลบไฟล์" : "Delete file"}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
