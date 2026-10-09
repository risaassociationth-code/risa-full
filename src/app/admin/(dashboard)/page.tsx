import { requireUser } from "@/lib/auth";
import { listRows } from "@/components/admin/collection-data";
import { ConstellationMap, type ConstellationData, type MapCollection } from "@/components/admin/ConstellationMap";

export const metadata = { title: "หน้าหลักผู้ดูแล · RISA Admin" };

import { sql } from "@/lib/db";

export default async function DashboardPage() {
  try {
    const count = await sql`SELECT COUNT(*) FROM calendar_events`;
    if (count[0].count === '0') {
      const events = [
        { sort: 1, th: 'I New Gen', en: 'I New Gen', th_date: 'มกราคม - กุมภาพันธ์', en_date: 'January - February', body_th: 'แข่งนวัตกรรม\nจัดบูธ\nเวิร์คช็อป\nจัดงานแข่ง\nผู้เข้าร่วม: นักวิจัย, ม.ปลาย, ชาวต่างชาติ', body_en: 'Innovation Competition\nBooths\nWorkshops\nCompetition Event\nParticipants: Researchers, High school students, Foreigners' },
        { sort: 2, th: 'กรมวิทย์', en: 'Department of Science', th_date: 'ปลาย มิ.ย.', en_date: 'Late June', body_th: '', body_en: '' },
        { sort: 3, th: 'Thailand Research Expo', en: 'Thailand Research Expo', th_date: 'มิ.ย.', en_date: 'June', body_th: '', body_en: '' },
        { sort: 4, th: 'สกสว.', en: 'TSRI', th_date: 'มิ.ย.', en_date: 'June', body_th: '', body_en: '' },
        { sort: 5, th: 'MedSpark Innovation Competition (MSIC)', en: 'MedSpark Innovation Competition (MSIC)', th_date: 'มี.ค.', en_date: 'March', body_th: '', body_en: '' },
        { sort: 6, th: 'MEDiHack 2027', en: 'MEDiHack 2027', th_date: 'ต.ค. - พ.ย.', en_date: 'October - November', body_th: '', body_en: '' },
        { sort: 7, th: 'วันนักประดิษฐ์', en: 'Inventors\' Day', th_date: 'กุมภาพันธ์', en_date: 'February', body_th: '', body_en: '' },
        { sort: 8, th: 'วันเด็ก', en: 'Children\'s Day', th_date: '2 มกราคม', en_date: 'January 2', body_th: '', body_en: '' },
        { sort: 9, th: 'แข่งต่างประเทศ', en: 'International Competitions', th_date: 'มีนาคม - พฤศจิกายน', en_date: 'March - November', body_th: '- Geneva (มี.ค.)\n- One stock open house (มี.ค.)\n- โปแลนด์ (มิ.ย.)\n- จีน (มิ.ย.) @ Shanghai\n- ญี่ปุ่น (ก.ค.)\n- เกาหลี (ส.ค.)\n- America (ก.ค.)\n- ไต้หวัน (พ.ย.)\n- ฮ่องกง (พ.ย.)\n- Germany (ต.ค.)', body_en: '- Geneva (Mar)\n- One stock open house (Mar)\n- Poland (Jun)\n- China (Jun) @ Shanghai\n- Japan (Jul)\n- Korea (Aug)\n- America (Jul)\n- Taiwan (Nov)\n- Hong Kong (Nov)\n- Germany (Oct)' },
        { sort: 11, th: 'STS', en: 'STS', th_date: 'เมษายน', en_date: 'April', body_th: 'Science and technology society.', body_en: 'Science and technology society.' }
      ];
      for (const e of events) {
        await sql`INSERT INTO calendar_events (title_th, title_en, approx_date_th, approx_date_en, body_th, body_en, sort_order) VALUES (${e.th}, ${e.en}, ${e.th_date}, ${e.en_date}, ${e.body_th}, ${e.body_en}, ${e.sort})`;
      }
    }
  } catch (e) {
    console.error("Seed error", e);
  }

  const user = await requireUser();
  const keys: MapCollection[] = ["news", "activities", "calendar", "team"];
  const entries = await Promise.all(keys.map(async key => {
    const rows = await listRows(key);
    const title = key === "team" ? "name" : "title";
    return [key, { total: rows.length, records: rows.map(row => ({
      id: String(row.id), title_th: String(row[`${title}_th`] ?? ""), title_en: String(row[`${title}_en`] ?? ""),
      slug: String(row.slug ?? ""), status: String(row.status ?? "draft"),
    })) }] as const;
  }));
  return <ConstellationMap workspaceKey={user.id} data={Object.fromEntries(entries) as ConstellationData} />;
}
