/**
 * The collection engine's single source of truth.
 *
 * One typed config per database table drives the list screen, the edit form
 * AND the server actions in `src/actions/collections.ts`. Nothing outside this
 * file is allowed to name a table or a column, which is what makes the generic
 * SQL in the actions safe: every identifier that reaches the database has been
 * matched against a config declared here.
 *
 * Client-safe on purpose — no `server-only`, no `@/lib/db` import — because the
 * table and the form both need it in the browser.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "file"
  | "number"
  | "date"
  | "select"
  | "tags"
  | "slug"
  | "icon"
  | "latlng";

export type SelectOption = { value: string; label: string };

export type FieldDef = {
  /** Column name. For `bilingual` fields this is the base: `title` → `title_th` + `title_en`. */
  name: string;
  label: string;
  type: FieldType;
  bilingual?: boolean;
  options?: readonly SelectOption[];
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** `latlng` only — the column holding longitude (`name` holds latitude). */
  lngName?: string;
  /** `slug` only — base name of the title field the slug is derived from. */
  slugFrom?: string;
};

export type ListColumnKind = "text" | "image" | "date" | "number" | "tags" | "code";

export type ListColumn = {
  name: string;
  label: string;
  kind?: ListColumnKind;
  bilingual?: boolean;
  /** Extra classes on the cell — used to hide low-value columns on narrow screens. */
  className?: string;
};

export type CollectionConfig = {
  /** Route + action key. */
  key: string;
  table: string;
  /** Thai plural, used as the screen title. */
  label: string;
  /** Thai singular, used for "เพิ่ม …" and confirmation copy. */
  singular: string;
  /** Where the list screen lives, for revalidation and back links. */
  adminPath: string;
  hasStatus: boolean;
  hasSort: boolean;
  /** Column this collection is partitioned by (`list_items.list_key`, `gallery_photos.album_id`). */
  scopeColumn?: string;
  /** Writable columns that have no form field (scope keys set by the screen). */
  extraColumns?: readonly string[];
  /** Base name of the field used as the row's human title. */
  titleField: string;
  columns: readonly ListColumn[];
  fields: readonly FieldDef[];
  /** Columns the client-side search box looks at (base names; `_th`/`_en` expanded). */
  searchColumns: readonly string[];
};

/** How a column's value is coerced before it reaches SQL. */
export type ColumnKind = "text" | "richtext" | "number" | "date" | "tags";

// ── shared option sets ──────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "draft", label: "ฉบับร่าง" },
  { value: "published", label: "เผยแพร่" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  draft: "ฉบับร่าง",
  published: "เผยแพร่",
};

export { STATUS_OPTIONS };

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "เต็มเวลา" },
  { value: "part_time", label: "ไม่เต็มเวลา" },
  { value: "contract", label: "สัญญาจ้าง" },
  { value: "internship", label: "ฝึกงาน" },
  { value: "volunteer", label: "อาสาสมัคร" },
] as const;

const COMMITTEE_GROUPS = [
  { value: "president", label: "นายกสมาคม" },
  { value: "committee", label: "กรรมการ" },
  { value: "advisor", label: "ที่ปรึกษา" },
] as const;

const LOCATION_KINDS = [
  { value: "office", label: "สำนักงานใหญ่" },
  { value: "branch", label: "สาขา" },
  { value: "partner", label: "พันธมิตร" },
  { value: "member", label: "สมาชิก" },
] as const;

// ── the collections ─────────────────────────────────────────────────────────

const news: CollectionConfig = {
  key: "news",
  table: "news",
  label: "ข่าวสาร",
  singular: "ข่าว",
  adminPath: "/admin/news",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "excerpt", "slug"],
  columns: [
    { name: "cover_url", label: "ภาพ", kind: "image" },
    { name: "title", label: "หัวข้อ", bilingual: true },
    { name: "published_at", label: "วันที่เผยแพร่", kind: "date", className: "hidden md:table-cell" },
    { name: "tags", label: "แท็ก", kind: "tags", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "title", label: "หัวข้อข่าว", type: "text", bilingual: true, required: true },
    { name: "slug", label: "slug (ส่วนท้าย URL)", type: "slug", slugFrom: "title", required: true,
      help: "ใช้เป็นที่อยู่หน้าเว็บ เช่น /news/annual-meeting-2569" },
    { name: "excerpt", label: "คำโปรย", type: "textarea", bilingual: true },
    { name: "body", label: "เนื้อหา", type: "richtext", bilingual: true },
    { name: "cover_url", label: "ภาพหน้าปก", type: "image" },
    { name: "tags", label: "แท็ก", type: "tags", help: "คั่นแต่ละแท็กด้วยเครื่องหมายจุลภาค (,)" },
    { name: "published_at", label: "วันที่เผยแพร่", type: "date" },
  ],
};

const activities: CollectionConfig = {
  key: "activities",
  table: "activities",
  label: "กิจกรรม",
  singular: "กิจกรรม",
  adminPath: "/admin/activities",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "excerpt", "venue", "slug"],
  columns: [
    { name: "cover_url", label: "ภาพ", kind: "image" },
    { name: "title", label: "ชื่อกิจกรรม", bilingual: true },
    { name: "start_date", label: "เริ่ม", kind: "date", className: "hidden md:table-cell" },
    { name: "venue", label: "สถานที่", bilingual: true, className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "title", label: "ชื่อกิจกรรม", type: "text", bilingual: true, required: true },
    { name: "slug", label: "slug (ส่วนท้าย URL)", type: "slug", slugFrom: "title", required: true },
    { name: "excerpt", label: "คำโปรย", type: "textarea", bilingual: true },
    { name: "body", label: "รายละเอียด", type: "richtext", bilingual: true },
    { name: "cover_url", label: "ภาพหน้าปก", type: "image" },
    { name: "start_date", label: "วันที่เริ่ม", type: "date" },
    { name: "end_date", label: "วันที่สิ้นสุด", type: "date" },
    { name: "venue", label: "สถานที่จัด", type: "text", bilingual: true },
    { name: "register_url", label: "ลิงก์ลงทะเบียน", type: "text", placeholder: "https://" },
  ],
};

const committee: CollectionConfig = {
  key: "committee",
  table: "committee_members",
  label: "คณะกรรมการ",
  singular: "กรรมการ",
  adminPath: "/admin/committee",
  hasStatus: true,
  hasSort: true,
  titleField: "name",
  searchColumns: ["name", "position", "org", "email"],
  columns: [
    { name: "photo_url", label: "รูป", kind: "image" },
    { name: "name", label: "ชื่อ-นามสกุล", bilingual: true },
    { name: "position", label: "ตำแหน่ง", bilingual: true, className: "hidden md:table-cell" },
    { name: "group_key", label: "กลุ่ม", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "name", label: "ชื่อ-นามสกุล", type: "text", bilingual: true, required: true },
    { name: "position", label: "ตำแหน่ง", type: "text", bilingual: true },
    { name: "org", label: "หน่วยงาน / สังกัด", type: "text", bilingual: true },
    { name: "bio", label: "ประวัติโดยย่อ", type: "textarea", bilingual: true },
    { name: "photo_url", label: "รูปถ่าย", type: "image" },
    { name: "group_key", label: "กลุ่ม", type: "select", options: COMMITTEE_GROUPS, required: true },
    { name: "term", label: "วาระ", type: "text", placeholder: "2567–2569" },
    { name: "email", label: "อีเมล", type: "text" },
  ],
};

const team: CollectionConfig = {
  key: "team", table: "staff_members", label: "บุคลากร", singular: "บุคลากร",
  adminPath: "/admin/team", hasStatus: true, hasSort: true, titleField: "name",
  searchColumns: ["name", "position", "department", "email", "phone"],
  columns: [
    { name: "photo_url", label: "รูปถ่าย", kind: "image" },
    { name: "name", label: "ชื่อ-นามสกุล", bilingual: true },
    { name: "position", label: "ตำแหน่ง", bilingual: true },
    { name: "email", label: "อีเมล", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "name", label: "ชื่อ-นามสกุล", type: "text", bilingual: true, required: true, help: "หากไม่ใส่ภาษาอังกฤษ จะใช้ชื่อภาษาไทยแทน" },
    { name: "position", label: "ตำแหน่ง", type: "text", bilingual: true },
    { name: "department", label: "ฝ่าย / หน่วยงาน", type: "text", bilingual: true },
    { name: "photo_url", label: "รูปถ่ายบุคลากร", type: "image", help: "อัปโหลดรูปแนวตั้ง JPG, PNG หรือ WebP ไม่เกิน 4 MB ระบบใส่กรอบให้เอง" },
    { name: "photo_position", label: "ตำแหน่งภาพในกรอบ", type: "select", options: [{ value: "top", label: "เน้นด้านบน / ใบหน้า" }, { value: "center", label: "กึ่งกลาง" }, { value: "bottom", label: "ด้านล่าง" }] },
    { name: "email", label: "อีเมลสำหรับติดต่อ (เปิดเผยบนเว็บไซต์)", type: "text", placeholder: "name@example.org", help: "เว้นว่างได้ ใช้อีเมลที่อนุญาตให้เผยแพร่เท่านั้น" },
    { name: "phone", label: "เบอร์โทรสำหรับติดต่อ (เปิดเผยบนเว็บไซต์)", type: "text", placeholder: "+66 2 000 0000", help: "เว้นว่างได้ ใช้เบอร์ติดต่อสำหรับงานที่อนุญาตให้เผยแพร่" },
    { name: "bio", label: "แนะนำตัวโดยย่อ", type: "textarea", bilingual: true },
    { name: "status", label: "การแสดงผล", type: "select", options: STATUS_OPTIONS, help: "ฉบับร่าง = ยังไม่แสดงบนเว็บ / เผยแพร่ = แสดงรูปและข้อมูลติดต่อให้ทุกคนเห็น" },
  ],
};

const research: CollectionConfig = {
  key: "research",
  table: "research_items",
  label: "งานวิจัย",
  singular: "งานวิจัย",
  adminPath: "/admin/research",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "authors", "venue", "doi"],
  columns: [
    { name: "title", label: "ชื่อผลงาน", bilingual: true },
    { name: "authors", label: "ผู้แต่ง", className: "hidden md:table-cell" },
    { name: "year", label: "ปี", kind: "number", className: "hidden sm:table-cell" },
  ],
  fields: [
    { name: "title", label: "ชื่อผลงาน", type: "text", bilingual: true, required: true },
    { name: "authors", label: "ผู้แต่ง", type: "text", help: "คั่นชื่อด้วยเครื่องหมายจุลภาค" },
    { name: "cover_url", label: "รูปภาพงานวิจัย", type: "image", help: "อัปโหลดหรือเลือกภาพสำหรับผลงานนี้ หากไม่ใส่ภาพจะแสดงเฉพาะข้อความ" },
    { name: "venue", label: "แหล่งเผยแพร่", type: "text", bilingual: true },
    { name: "abstract", label: "บทคัดย่อ", type: "textarea", bilingual: true },
    { name: "year", label: "ปีที่เผยแพร่", type: "number" },
    { name: "doi", label: "DOI", type: "text" },
    { name: "pdf_url", label: "ไฟล์ PDF", type: "file" },
    { name: "tags", label: "แท็ก", type: "tags", help: "คั่นแต่ละแท็กด้วยเครื่องหมายจุลภาค (,)" },
  ],
};

const awards: CollectionConfig = {
  key: "awards",
  table: "awards",
  label: "รางวัล",
  singular: "รางวัล",
  adminPath: "/admin/awards",
  hasStatus: true,
  hasSort: true,
  titleField: "recipient",
  searchColumns: ["category", "recipient", "citation"],
  columns: [
    { name: "photo_url", label: "ภาพ", kind: "image" },
    { name: "recipient", label: "ผู้ได้รับรางวัล", bilingual: true },
    { name: "category", label: "ประเภทรางวัล", bilingual: true, className: "hidden md:table-cell" },
    { name: "year", label: "ปี", kind: "number", className: "hidden sm:table-cell" },
  ],
  fields: [
    { name: "recipient", label: "ผู้ได้รับรางวัล", type: "text", bilingual: true, required: true },
    { name: "category", label: "ประเภทรางวัล", type: "text", bilingual: true },
    { name: "citation", label: "คำประกาศเกียรติคุณ", type: "textarea", bilingual: true },
    { name: "year", label: "ปีที่ได้รับ", type: "number" },
    { name: "photo_url", label: "ภาพประกอบ", type: "image" },
  ],
};

const jobs: CollectionConfig = {
  key: "jobs",
  table: "job_posts",
  label: "ตำแหน่งงาน",
  singular: "ตำแหน่งงาน",
  adminPath: "/admin/jobs",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "org", "location", "slug"],
  columns: [
    { name: "title", label: "ตำแหน่ง", bilingual: true },
    { name: "org", label: "หน่วยงาน", bilingual: true, className: "hidden md:table-cell" },
    { name: "deadline", label: "ปิดรับ", kind: "date", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "title", label: "ชื่อตำแหน่ง", type: "text", bilingual: true, required: true },
    { name: "slug", label: "slug (ส่วนท้าย URL)", type: "slug", slugFrom: "title", required: true },
    { name: "org", label: "หน่วยงานที่รับสมัคร", type: "text", bilingual: true },
    { name: "location", label: "สถานที่ปฏิบัติงาน", type: "text", bilingual: true },
    { name: "description", label: "รายละเอียดงาน", type: "richtext", bilingual: true },
    { name: "employment_type", label: "รูปแบบการจ้าง", type: "select", options: EMPLOYMENT_TYPES },
    { name: "salary_range", label: "ช่วงเงินเดือน", type: "text", placeholder: "25,000–35,000 บาท" },
    { name: "deadline", label: "วันปิดรับสมัคร", type: "date" },
    { name: "apply_url", label: "ลิงก์สมัคร", type: "text", placeholder: "https://" },
  ],
};

const gallery: CollectionConfig = {
  key: "gallery",
  table: "gallery_albums",
  label: "ประมวลภาพ",
  singular: "อัลบั้ม",
  adminPath: "/admin/gallery",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "description", "slug"],
  columns: [
    { name: "cover_url", label: "ภาพ", kind: "image" },
    { name: "title", label: "ชื่ออัลบั้ม", bilingual: true },
    { name: "event_date", label: "วันที่จัด", kind: "date", className: "hidden md:table-cell" },
  ],
  fields: [
    { name: "title", label: "ชื่ออัลบั้ม", type: "text", bilingual: true, required: true },
    { name: "slug", label: "slug (ส่วนท้าย URL)", type: "slug", slugFrom: "title", required: true },
    { name: "description", label: "คำอธิบาย", type: "textarea", bilingual: true },
    { name: "cover_url", label: "ภาพหน้าปก", type: "image" },
    { name: "event_date", label: "วันที่จัดงาน", type: "date" },
  ],
};

const galleryPhotos: CollectionConfig = {
  key: "gallery_photos",
  table: "gallery_photos",
  label: "ภาพในอัลบั้ม",
  singular: "ภาพ",
  adminPath: "/admin/gallery",
  hasStatus: false,
  hasSort: true,
  scopeColumn: "album_id",
  extraColumns: ["album_id"],
  titleField: "caption",
  searchColumns: ["caption"],
  columns: [
    { name: "image_url", label: "ภาพ", kind: "image" },
    { name: "caption", label: "คำบรรยาย", bilingual: true },
  ],
  fields: [
    { name: "image_url", label: "ไฟล์ภาพ", type: "image", required: true },
    { name: "caption", label: "คำบรรยาย", type: "text", bilingual: true },
  ],
};

const documents: CollectionConfig = {
  key: "documents",
  table: "documents",
  label: "เอกสาร",
  singular: "เอกสาร",
  adminPath: "/admin/documents",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "description", "category"],
  columns: [
    { name: "title", label: "ชื่อเอกสาร", bilingual: true },
    { name: "category", label: "หมวด", bilingual: true, className: "hidden md:table-cell" },
    { name: "download_count", label: "ดาวน์โหลด", kind: "number", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "title", label: "ชื่อเอกสาร", type: "text", bilingual: true, required: true },
    { name: "description", label: "คำอธิบาย", type: "textarea", bilingual: true },
    { name: "category", label: "หมวดหมู่", type: "text", bilingual: true },
    { name: "file_url", label: "ไฟล์เอกสาร", type: "file", required: true },
    { name: "mime", label: "ชนิดไฟล์ (MIME)", type: "text", placeholder: "application/pdf",
      help: "ปล่อยว่างได้ ระบบใช้แสดงไอคอนของไฟล์เท่านั้น" },
    { name: "size_bytes", label: "ขนาดไฟล์ (ไบต์)", type: "number", help: "ปล่อยว่างได้" },
  ],
};

const timeline: CollectionConfig = {
  key: "timeline",
  table: "timeline_events",
  label: "เส้นเวลา",
  singular: "เหตุการณ์",
  adminPath: "/admin/timeline",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["year", "title", "body"],
  columns: [
    { name: "year", label: "ปี", bilingual: true },
    { name: "title", label: "หัวข้อ", bilingual: true },
  ],
  fields: [
    { name: "year", label: "ปี", type: "text", bilingual: true, required: true, placeholder: "2540 / 1997" },
    { name: "title", label: "หัวข้อ", type: "text", bilingual: true, required: true },
    { name: "body", label: "รายละเอียด", type: "textarea", bilingual: true },
  ],
};

const stats: CollectionConfig = {
  key: "stats",
  table: "stats",
  label: "ตัวเลขสถิติ",
  singular: "ตัวเลข",
  adminPath: "/admin/stats",
  hasStatus: true,
  hasSort: true,
  titleField: "label",
  searchColumns: ["label", "value"],
  columns: [
    { name: "value", label: "ตัวเลข" },
    { name: "suffix", label: "ต่อท้าย", className: "hidden sm:table-cell" },
    { name: "label", label: "คำอธิบาย", bilingual: true },
  ],
  fields: [
    { name: "value", label: "ตัวเลข", type: "text", required: true, placeholder: "1,200" },
    { name: "suffix", label: "ตัวต่อท้าย", type: "text", placeholder: "+", help: "เช่น + หรือ %" },
    { name: "label", label: "คำอธิบาย", type: "text", bilingual: true, required: true },
  ],
};

const services: CollectionConfig = {
  key: "services",
  table: "service_cards",
  label: "การ์ดบริการ",
  singular: "การ์ดบริการ",
  adminPath: "/admin/services",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "body", "href"],
  columns: [
    { name: "icon", label: "ไอคอน", kind: "code" },
    { name: "title", label: "หัวข้อ", bilingual: true },
    { name: "href", label: "ลิงก์", kind: "code", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "icon", label: "ไอคอน", type: "icon" },
    { name: "title", label: "หัวข้อ", type: "text", bilingual: true, required: true },
    { name: "body", label: "คำอธิบาย", type: "textarea", bilingual: true },
    { name: "href", label: "ลิงก์ปลายทาง", type: "text", placeholder: "/research" },
  ],
};

const locations: CollectionConfig = {
  key: "locations",
  table: "locations",
  label: "สถานที่",
  singular: "สถานที่",
  adminPath: "/admin/locations",
  hasStatus: true,
  hasSort: true,
  titleField: "name",
  searchColumns: ["name", "address"],
  columns: [
    { name: "name", label: "ชื่อสถานที่", bilingual: true },
    { name: "kind", label: "ประเภท", className: "hidden sm:table-cell" },
    { name: "address", label: "ที่อยู่", bilingual: true, className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "name", label: "ชื่อสถานที่", type: "text", bilingual: true, required: true },
    { name: "address", label: "ที่อยู่", type: "textarea", bilingual: true },
    { name: "lat", lngName: "lng", label: "พิกัด", type: "latlng",
      help: "ละติจูด / ลองจิจูด — คัดลอกได้จาก Google Maps" },
    { name: "kind", label: "ประเภท", type: "select", options: LOCATION_KINDS, required: true },
    { name: "url", label: "ลิงก์เพิ่มเติม", type: "text", placeholder: "https://" },
  ],
};

const partners: CollectionConfig = {
  key: "partners",
  table: "partners",
  label: "พันธมิตร",
  singular: "พันธมิตร",
  adminPath: "/admin/partners",
  hasStatus: true,
  hasSort: true,
  titleField: "name",
  searchColumns: ["name", "url"],
  columns: [
    { name: "logo_url", label: "โลโก้", kind: "image" },
    { name: "name", label: "ชื่อองค์กร" },
    { name: "url", label: "เว็บไซต์", kind: "code", className: "hidden lg:table-cell" },
  ],
  fields: [
    { name: "name", label: "ชื่อองค์กร", type: "text", required: true },
    { name: "logo_url", label: "โลโก้", type: "image" },
    { name: "url", label: "เว็บไซต์", type: "text", placeholder: "https://" },
  ],
};

const listItems: CollectionConfig = {
  key: "list_items",
  table: "list_items",
  label: "รายการย่อย",
  singular: "รายการ",
  adminPath: "/admin/lists",
  hasStatus: true,
  hasSort: true,
  scopeColumn: "list_key",
  extraColumns: ["list_key"],
  titleField: "title",
  searchColumns: ["title", "body"],
  columns: [
    { name: "icon", label: "ไอคอน", kind: "code" },
    { name: "title", label: "หัวข้อ", bilingual: true },
  ],
  fields: [
    { name: "icon", label: "ไอคอน", type: "icon" },
    { name: "title", label: "หัวข้อ", type: "text", bilingual: true, required: true },
    { name: "body", label: "คำอธิบาย", type: "textarea", bilingual: true },
    { name: "href", label: "ลิงก์", type: "text", placeholder: "/membership" },
    { name: "image_url", label: "ภาพประกอบ", type: "image" },
  ],
};

const calendar: CollectionConfig = {
  key: "calendar",
  table: "calendar_events",
  label: "ปฏิทินกิจกรรม",
  singular: "ปฏิทิน",
  adminPath: "/admin/calendar",
  hasStatus: true,
  hasSort: true,
  titleField: "title",
  searchColumns: ["title", "approx_date", "body"],
  columns: [
    { name: "approx_date", label: "ช่วงเวลา", bilingual: true },
    { name: "title", label: "หัวข้อกิจกรรม", bilingual: true },
  ],
  fields: [
    { name: "title", label: "หัวข้อกิจกรรม", type: "text", bilingual: true, required: true },
    { name: "approx_date", label: "ช่วงเวลา", type: "text", bilingual: true, required: true, placeholder: "ปลาย มิ.ย. / Late June" },
    { name: "body", label: "รายละเอียด", type: "textarea", bilingual: true },
  ],
};

export const COLLECTIONS = {
  news,
  activities,
  committee,
  team,
  research,
  awards,
  jobs,
  gallery,
  gallery_photos: galleryPhotos,
  documents,
  timeline,
  calendar,
  stats,
  services,
  locations,
  partners,
  list_items: listItems,
} as const satisfies Record<string, CollectionConfig>;

export type CollectionKey = keyof typeof COLLECTIONS;

/** The allow-list every server action validates its `key` argument against. */
export const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[];

export function isCollectionKey(key: string): key is CollectionKey {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, key);
}

/** Throws on anything not declared above — the only way to obtain a table name. */
export function getCollection(key: string): CollectionConfig {
  if (!isCollectionKey(key)) throw new Error(`ไม่รู้จักชุดข้อมูล: ${key}`);
  return COLLECTIONS[key];
}

/** Every column a field writes to, with the coercion it needs. */
export function columnKinds(config: CollectionConfig): Map<string, ColumnKind> {
  const kinds = new Map<string, ColumnKind>();
  for (const field of config.fields) {
    const kind: ColumnKind =
      field.type === "richtext" ? "richtext"
      : field.type === "number" || field.type === "latlng" ? "number"
      : field.type === "date" ? "date"
      : field.type === "tags" ? "tags"
      : "text";
    if (field.bilingual) {
      kinds.set(`${field.name}_th`, kind);
      kinds.set(`${field.name}_en`, kind);
    } else {
      kinds.set(field.name, kind);
      if (field.type === "latlng" && field.lngName) kinds.set(field.lngName, "number");
    }
  }
  for (const extra of config.extraColumns ?? []) kinds.set(extra, "text");
  return kinds;
}

/** Column names a write action is allowed to touch. */
export function writableColumns(config: CollectionConfig): string[] {
  return [...columnKinds(config).keys()];
}

/** The `_th`/`_en` pair for a bilingual field, or the single column otherwise. */
export function fieldColumns(field: FieldDef): string[] {
  if (field.bilingual) return [`${field.name}_th`, `${field.name}_en`];
  if (field.type === "latlng" && field.lngName) return [field.name, field.lngName];
  return [field.name];
}

export type Row = Record<string, unknown>;

/** Best-effort human title for a row, for confirmations and audit entries. */
export function rowTitle(config: CollectionConfig, row: Row): string {
  const candidates = [
    `${config.titleField}_th`,
    `${config.titleField}_en`,
    config.titleField,
    "name",
    "slug",
  ];
  for (const key of candidates) {
    const value = row[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return String(row.id ?? "");
}

/** Columns the client-side search box reads, with bilingual pairs expanded. */
export function searchableColumns(config: CollectionConfig): string[] {
  const bilingual = new Set(config.fields.filter((f) => f.bilingual).map((f) => f.name));
  return config.searchColumns.flatMap((name) =>
    bilingual.has(name) ? [`${name}_th`, `${name}_en`] : [name],
  );
}
