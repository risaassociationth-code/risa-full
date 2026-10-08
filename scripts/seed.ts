import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import postgres from "postgres";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { ALL_BLOCKS } from "../src/content/registry";

const sql = postgres(process.env.DATABASE_URL!, {
  transform: { undefined: null },
  onnotice: () => {},
});

const P = (n: number) => Math.round(n);

async function main() {
  // ─────────────────────────────────────────────────────────────── settings
  await sql`
    insert into settings (id, org_name_th, org_name_en, org_short, tagline_th, tagline_en,
      address_th, address_en, phone, email, line_id, facebook_url, youtube_url, linkedin_url,
      map_lat, map_lng, map_zoom)
    values (true,
      'สมาคมส่งเสริมการวิจัยและมาตรฐานทางอุตสาหกรรม',
      'Research and Industry Standards Advancement Association',
      'RISA',
      'ยกระดับอุตสาหกรรมไทยด้วยงานวิจัยและมาตรฐาน',
      'Raising Thai industry through research and standards',
      '', '',
      '082-793-4431', 'risa.association.th@gmail.com', '',
      '', '', '',
      null, null, 16)
    on conflict (id) do nothing`;

  // ───────────────────────────────────────────────────────── content blocks
  // Metadata (label/type/grouping) always refreshes; values are only written
  // when the row is new or the admin has left them blank.
  for (const b of ALL_BLOCKS) {
    await sql`
      insert into content_blocks (key, page, section, label, type, value_th, value_en, sort)
      values (${b.key}, ${b.page}, ${b.section}, ${b.label}, ${b.type}, ${b.th}, ${b.en}, ${b.sort})
      on conflict (key) do update set
        page = excluded.page, section = excluded.section,
        label = excluded.label, type = excluded.type, sort = excluded.sort,
        value_th = case when content_blocks.value_th = '' then excluded.value_th else content_blocks.value_th end,
        value_en = case when content_blocks.value_en = '' then excluded.value_en else content_blocks.value_en end`;
  }
  console.log(`  content_blocks: ${ALL_BLOCKS.length} keys upserted`);

  // ───────────────────────────────────────────────────────────── navigation
  const nav: [string, string, string, [string, string, string][]][] = [
    ["หน้าแรก", "Home", "/", []],
    ["เกี่ยวกับสมาคม", "About", "", [
      ["ประวัติสมาคม", "Our history", "/about"],
      ["คณะกรรมการ", "Committee", "/committee"],
      ["แผนที่เครือข่าย", "Network map", "/map"],
    ]],
    ["ข่าวและกิจกรรม", "News & activities", "", [
      ["ข่าวสาร", "News", "/news"],
      ["กิจกรรม", "Activities", "/activities"],
      ["ประมวลภาพ", "Gallery", "/gallery"],
    ]],
    ["วิชาการ", "Knowledge", "", [
      ["งานวิจัย", "Research", "/research"],
      ["รางวัล", "Awards", "/awards"],
      ["เอกสารดาวน์โหลด", "Downloads", "/downloads"],
    ]],
    ["สมาชิก", "Membership", "", [
      ["สมัครสมาชิก", "Become a member", "/membership"],
      ["ตำแหน่งงาน", "Careers", "/careers"],
    ]],
    ["ติดต่อเรา", "Contact", "/contact", []],
  ];
  if ((await sql`select count(*)::int as n from nav_items`)[0].n === 0) {
    let s = 0;
    for (const [th, en, href, kids] of nav) {
      const [row] = await sql<{ id: string }[]>`
        insert into nav_items (label_th, label_en, href, sort) values (${th}, ${en}, ${href}, ${s++})
        returning id`;
      let cs = 0;
      for (const [cth, cen, chref] of kids) {
        await sql`insert into nav_items (label_th, label_en, href, parent_id, sort)
                  values (${cth}, ${cen}, ${chref}, ${row.id}, ${cs++})`;
      }
    }
    console.log("  nav_items seeded");
  }

  if ((await sql`select count(*)::int as n from footer_links`)[0].n === 0) {
    const footer: [string, string, string, string][] = [
      ["menu", "หน้าแรก", "Home", "/"],
      ["menu", "ประวัติสมาคม", "Our history", "/about"],
      ["menu", "คณะกรรมการ", "Committee", "/committee"],
      ["menu", "ข่าวสาร", "News", "/news"],
      ["menu", "กิจกรรม", "Activities", "/activities"],
      ["resources", "งานวิจัย", "Research", "/research"],
      ["resources", "รางวัล", "Awards", "/awards"],
      ["resources", "เอกสารดาวน์โหลด", "Downloads", "/downloads"],
      ["resources", "ประมวลภาพ", "Gallery", "/gallery"],
      ["resources", "ตำแหน่งงาน", "Careers", "/careers"],
    ];
    let i = 0;
    for (const [col, th, en, href] of footer) {
      await sql`insert into footer_links (column_key, label_th, label_en, href, sort)
                values (${col}, ${th}, ${en}, ${href}, ${i++})`;
    }
    console.log("  footer_links seeded");
  }

  // ────────────────────────────────────────────────────────────────── stats
  if ((await sql`select count(*)::int as n from stats`)[0].n === 0) {
    const rows: [string, string, string, string][] = [
      ["12", "+", "ปีที่ดำเนินงาน", "Years active"],
      ["480", "+", "สมาชิกทั่วประเทศ", "Members nationwide"],
      ["65", "+", "มาตรฐานที่ร่วมพัฒนา", "Standards contributed to"],
      ["30", "+", "กิจกรรมต่อปี", "Activities each year"],
    ];
    let i = 0;
    for (const [v, sfx, th, en] of rows)
      await sql`insert into stats (value, suffix, label_th, label_en, sort) values (${v}, ${sfx}, ${th}, ${en}, ${i++})`;
  }

  // ────────────────────────────────────────────────────────── service cards
  if ((await sql`select count(*)::int as n from service_cards`)[0].n === 0) {
    const rows: [string, string, string, string, string, string][] = [
      ["UserPlus", "สมาชิกภาพ", "Membership", "เข้าร่วมเครือข่ายนักวิจัยและผู้ประกอบการกว่า 480 ราย พร้อมสิทธิพิเศษในทุกกิจกรรม", "Join 480+ researchers and manufacturers, with member rates on everything we run.", "/membership"],
      ["BookOpen", "งานวิจัยและวารสาร", "Research & journals", "คลังผลงานวิจัยประยุกต์และบทความด้านมาตรฐานที่สมาชิกเข้าถึงได้เต็มรูปแบบ", "A repository of applied research and standards papers, open to members in full.", "/research"],
      ["GraduationCap", "อบรมและสัมมนา", "Training & seminars", "หลักสูตรระยะสั้นด้านระบบมาตรฐาน การทดสอบ และการรับรองคุณภาพ", "Short courses on standards systems, testing and quality certification.", "/activities"],
      ["Award", "รางวัลและเกียรติคุณ", "Awards", "ยกย่องผลงานวิจัยและนวัตกรรมที่สร้างผลกระทบต่ออุตสาหกรรมไทย", "Recognising research and innovation that moved Thai industry forward.", "/awards"],
      ["Briefcase", "ศูนย์อาชีพ", "Career centre", "ประกาศรับสมัครงานจากหน่วยงานสมาชิกและพันธมิตรทั่วประเทศ", "Openings from member organisations and partners across the country.", "/careers"],
      ["Users", "คณะทำงานเฉพาะด้าน", "Working groups", "ร่วมเป็นคณะทำงานยกร่างมาตรฐานและข้อเสนอเชิงนโยบาย", "Join the groups that draft standards and shape policy proposals.", "/committee"],
    ];
    let i = 0;
    for (const [icon, tth, ten, bth, ben, href] of rows)
      await sql`insert into service_cards (icon, title_th, title_en, body_th, body_en, href, sort)
                values (${icon}, ${tth}, ${ten}, ${bth}, ${ben}, ${href}, ${i++})`;
  }

  // ──────────────────────────────────────────────────────────────── lists
  if ((await sql`select count(*)::int as n from list_items`)[0].n === 0) {
    const lists: [string, string, string, string, string, string][] = [
      ["home.mission", "Microscope", "ส่งเสริมงานวิจัยประยุกต์", "Advance applied research", "สนับสนุนงานวิจัยที่ตอบโจทย์ปัญหาจริงของภาคการผลิต และผลักดันให้เกิดการนำไปใช้", "Back research that answers real production problems — and see it put to use."],
      ["home.mission", "Ruler", "พัฒนามาตรฐานอุตสาหกรรม", "Develop industrial standards", "ร่วมยกร่างและทบทวนมาตรฐานร่วมกับหน่วยงานกำกับดูแลและผู้ประกอบการ", "Draft and review standards alongside regulators and manufacturers."],
      ["home.mission", "Network", "เชื่อมโยงเครือข่าย", "Connect the network", "สร้างพื้นที่พบปะระหว่างนักวิจัย ภาคอุตสาหกรรม และภาครัฐอย่างต่อเนื่อง", "Keep researchers, industry and government in the same room, regularly."],
      ["home.mission", "GraduationCap", "พัฒนาบุคลากร", "Build capability", "จัดอบรมและถ่ายทอดองค์ความรู้ด้านมาตรฐานและการทดสอบให้แก่บุคลากร", "Train people in standards, testing and certification practice."],

      ["about.objectives", "Target", "ส่งเสริมการวิจัยที่ใช้ได้จริง", "Promote research that works", "สนับสนุนทุน เวที และความร่วมมือให้งานวิจัยเดินทางถึงสายการผลิต", "Fund, host and broker the collaborations that carry research to the factory floor."],
      ["about.objectives", "ShieldCheck", "ยกระดับมาตรฐานและการรับรอง", "Raise standards and certification", "ร่วมพัฒนามาตรฐานที่สอดคล้องกับสากลและเหมาะกับบริบทของไทย", "Develop standards that meet international practice and fit Thai conditions."],
      ["about.objectives", "Handshake", "สร้างความร่วมมือระหว่างภาคส่วน", "Build cross-sector cooperation", "เป็นตัวกลางระหว่างสถาบันการศึกษา ภาคเอกชน และหน่วยงานภาครัฐ", "Act as the honest broker between universities, business and government."],
      ["about.objectives", "Megaphone", "เผยแพร่องค์ความรู้สู่สาธารณะ", "Share knowledge publicly", "เผยแพร่ผลงาน บทความ และแนวปฏิบัติที่ดีสู่สังคมวงกว้าง", "Publish findings, papers and good practice for everyone."],

      ["membership.benefits", "Percent", "อัตราพิเศษทุกกิจกรรม", "Member rates on everything", "ส่วนลดค่าลงทะเบียนอบรมและสัมมนาตลอดทั้งปี", "Discounted registration on every course and seminar, all year."],
      ["membership.benefits", "FileText", "เข้าถึงคลังงานวิจัย", "Full repository access", "อ่านและดาวน์โหลดผลงานวิจัยและเอกสารมาตรฐานได้เต็มรูปแบบ", "Read and download research and standards documents in full."],
      ["membership.benefits", "Users", "เครือข่ายวิชาชีพ", "A professional network", "พบปะผู้เชี่ยวชาญและผู้ประกอบการในสาขาเดียวกันอย่างสม่ำเสมอ", "Meet specialists and manufacturers in your field, regularly."],
      ["membership.benefits", "Vote", "สิทธิออกเสียงในที่ประชุมใหญ่", "A vote at the AGM", "ร่วมกำหนดทิศทางของสมาคมในการประชุมใหญ่สามัญประจำปี", "Help set the association's direction at the annual general meeting."],

      ["membership.types", "User", "สมาชิกสามัญ", "Ordinary member", "สำหรับบุคคลทั่วไปที่ทำงานหรือศึกษาด้านวิจัยและมาตรฐานอุตสาหกรรม · 800 บาท/ปี", "For individuals working or studying in research and industrial standards · THB 800/year"],
      ["membership.types", "GraduationCap", "สมาชิกนักศึกษา", "Student member", "สำหรับนิสิตนักศึกษาที่กำลังศึกษาอยู่ · 300 บาท/ปี", "For enrolled students · THB 300/year"],
      ["membership.types", "Building2", "สมาชิกนิติบุคคล", "Corporate member", "สำหรับองค์กร บริษัท และสถาบัน พร้อมสิทธิ์ผู้แทน 5 ท่าน · 8,000 บาท/ปี", "For companies and institutions, covering five nominated representatives · THB 8,000/year"],
      ["membership.types", "Star", "สมาชิกกิตติมศักดิ์", "Honorary member", "โดยการเชิญของคณะกรรมการสมาคม", "By invitation of the committee."],

      ["membership.steps", "FilePen", "กรอกใบสมัคร", "Complete the form", "กรอกแบบฟอร์มออนไลน์ด้านล่าง หรือดาวน์โหลดแบบฟอร์มจากหน้าเอกสาร", "Use the online form below, or download the paper form from the Downloads page."],
      ["membership.steps", "Search", "รอการพิจารณา", "We review it", "เจ้าหน้าที่ตรวจสอบข้อมูลและติดต่อกลับภายใน 5 วันทำการ", "Our office checks your details and replies within five working days."],
      ["membership.steps", "CreditCard", "ชำระค่าบำรุง", "Pay the annual fee", "ชำระผ่านบัญชีสมาคมตามอัตราของประเภทสมาชิกที่เลือก", "Transfer the fee for your chosen membership tier."],
      ["membership.steps", "BadgeCheck", "รับสถานะสมาชิก", "You are in", "รับบัตรสมาชิกและสิทธิ์เข้าถึงคลังความรู้ทันที", "Receive your card and immediate access to the repository."],

      ["contact.channels", "Mail", "อีเมล", "Email", "risa.association.th@gmail.com", "risa.association.th@gmail.com"],
      ["contact.channels", "Phone", "โทรศัพท์", "Phone", "082-793-4431", "+66 82 793 4431"],
    ];
    const counters: Record<string, number> = {};
    for (const [lk, icon, tth, ten, bth, ben] of lists) {
      counters[lk] = (counters[lk] ?? 0) + 1;
      await sql`insert into list_items (list_key, icon, title_th, title_en, body_th, body_en, sort)
                values (${lk}, ${icon}, ${tth}, ${ten}, ${bth}, ${ben}, ${counters[lk]})`;
    }
  }

  // ──────────────────────────────────────────────────────────────  timeline
  if ((await sql`select count(*)::int as n from timeline_events`)[0].n === 0) {
    const rows: [string, string, string, string, string, string][] = [
      ["2556", "2013", "ก่อตั้งเป็นชมรม", "Founded as a club", "นักวิจัยและวิศวกรจากหลายสถาบันรวมตัวกันในนาม “ชมรมส่งเสริมการวิจัยและมาตรฐาน” เพื่อแลกเปลี่ยนความรู้ด้านการทดสอบและรับรองคุณภาพ", "Researchers and engineers from several institutions came together to exchange knowledge on testing and quality certification."],
      ["2560", "2017", "จดทะเบียนเป็นสมาคม", "Registered as an association", "จดทะเบียนอย่างเป็นทางการเมื่อวันที่ 9 มีนาคม พร้อมคณะกรรมการชุดแรกจำนวน 11 ท่าน", "Formally registered on 9 March, with a first committee of eleven members."],
      ["2563", "2020", "เปิดคลังงานวิจัยออนไลน์", "Online repository opened", "เปิดคลังผลงานวิจัยและเอกสารมาตรฐานให้สมาชิกเข้าถึงได้เต็มรูปแบบ", "The research and standards repository opened to members in full."],
      ["2568", "2025", "ย้ายสำนักงานใหญ่", "New head office", "ย้ายสำนักงานมายังอาคารวิจัยและมาตรฐาน ถนนพระรามที่ 6 พร้อมห้องประชุมและพื้นที่จัดอบรม", "Moved to the Research & Standards Building on Rama VI Road, with meeting and training space."],
    ];
    let i = 0;
    for (const [yth, yen, tth, ten, bth, ben] of rows)
      await sql`insert into timeline_events (year_th, year_en, title_th, title_en, body_th, body_en, sort)
                values (${yth}, ${yen}, ${tth}, ${ten}, ${bth}, ${ben}, ${i++})`;
  }

  // ───────────────────────────────────────────────────────────── committee
  if ((await sql`select count(*)::int as n from committee_members`)[0].n === 0) {
    const rows: [string, string, string, string, string, string, string][] = [
      ["president", "รศ.ดร. ธนกฤต วิริยะพงศ์", "Assoc. Prof. Dr. Thanakrit Wiriyapong", "นายกสมาคม", "President", "คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", "Faculty of Engineering, KMUTT"],
      ["committee", "ดร. ปวีณา สุขเจริญ", "Dr. Paweena Sukcharoen", "อุปนายก", "Vice President", "สถาบันมาตรวิทยาแห่งชาติ", "National Institute of Metrology"],
      ["committee", "คุณ อรรถพล เกียรติวงศ์", "Mr. Attapol Kiattiwong", "เลขาธิการ", "Secretary General", "สภาอุตสาหกรรมแห่งประเทศไทย", "Federation of Thai Industries"],
      ["committee", "ผศ.ดร. ณัฐริกา บุญมั่น", "Asst. Prof. Dr. Nattarika Boonman", "เหรัญญิก", "Treasurer", "คณะวิทยาศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย", "Faculty of Science, Chulalongkorn University"],
      ["committee", "ดร. กิตติพงษ์ ศรีสุวรรณ", "Dr. Kittipong Srisuwan", "นายทะเบียน", "Registrar", "ศูนย์ทดสอบผลิตภัณฑ์อุตสาหกรรม", "Industrial Product Testing Centre"],
      ["committee", "คุณ สุภาวดี ทองอินทร์", "Ms. Supawadee Thong-in", "ประชาสัมพันธ์", "Public Relations", "สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม", "Thai Industrial Standards Institute"],
      ["committee", "ดร. วีรภัทร อินทรโชติ", "Dr. Weerapat Intarachot", "กรรมการวิชาการ", "Academic Affairs", "สถาบันวิจัยวิทยาศาสตร์และเทคโนโลยีแห่งประเทศไทย", "TISTR"],
      ["advisor", "ศ.ดร. บรรจง เลิศวัฒนา", "Prof. Dr. Banjong Lertwattana", "ที่ปรึกษา", "Advisor", "ราชบัณฑิตยสภา", "The Royal Society of Thailand"],
      ["advisor", "คุณ มานพ ชัยศิริกุล", "Mr. Manop Chaisirikul", "ที่ปรึกษา", "Advisor", "อดีตผู้อำนวยการ สมอ.", "Former Director, TISI"],
      ["advisor", "รศ.ดร. จิราภรณ์ พงษ์พันธ์", "Assoc. Prof. Dr. Jiraporn Pongpan", "ที่ปรึกษา", "Advisor", "มหาวิทยาลัยเชียงใหม่", "Chiang Mai University"],
    ];
    let i = 0;
    for (const [g, nth, nen, pth, pen, oth, oen] of rows)
      await sql`insert into committee_members (group_key, name_th, name_en, position_th, position_en, org_th, org_en, term, sort)
                values (${g}, ${nth}, ${nen}, ${pth}, ${pen}, ${oth}, ${oen}, '2567–2570', ${i++})`;
  }

  console.log("  collections (part 1) seeded");
  await seedContent();
  await seedAdmin();
  await sql.end();
}

async function seedContent() {
  // ─────────────────────────────────────────────────────────────────── news
  if ((await sql`select count(*)::int as n from news`)[0].n === 0) {
    const rows: [string, string, string, string, string, string, string, number, string[]][] = [
      ["agm-2568", "ประชุมใหญ่สามัญประจำปี 2568", "Annual General Meeting 2025",
        "สรุปผลการดำเนินงานรอบปี พร้อมรับฟังข้อเสนอแนะจากสมาชิกและเลือกตั้งคณะกรรมการชุดใหม่",
        "A review of the year, member feedback, and the election of the incoming committee.",
        "<p>สมาคมจัดการประชุมใหญ่สามัญประจำปี 2568 ณ ห้องประชุมใหญ่ อาคารวิจัยและมาตรฐาน โดยมีสมาชิกเข้าร่วมกว่า 180 ท่าน</p><p>ที่ประชุมได้รับรองรายงานผลการดำเนินงานประจำปี งบการเงิน และแผนงานปี 2569 ซึ่งให้ความสำคัญกับการยกร่างมาตรฐานด้านการทดสอบวัสดุและการรับรองห้องปฏิบัติการ</p>",
        "<p>The 2025 AGM was held in the main hall of the Research &amp; Standards Building, with more than 180 members attending.</p><p>The meeting approved the annual report, the accounts, and the 2026 plan — which puts materials testing standards and laboratory accreditation at the centre of the year ahead.</p>",
        8, ["ประชุมใหญ่", "สมาคม"]],
      ["ai-standards-seminar", "สัมมนา: AI กับการตรวจสอบคุณภาพในสายการผลิต", "Seminar: AI in production-line quality control",
        "เวทีแลกเปลี่ยนการนำปัญญาประดิษฐ์มาใช้ตรวจจับข้อบกพร่องและควบคุมคุณภาพในโรงงาน",
        "How manufacturers are using machine vision to catch defects and hold quality on the line.",
        "<p>สัมมนาครั้งนี้รวบรวมกรณีศึกษาจากโรงงานผลิตชิ้นส่วนยานยนต์และอิเล็กทรอนิกส์ที่นำระบบตรวจจับด้วยภาพมาใช้จริง</p><p>ประเด็นสำคัญคือการวางเกณฑ์ยอมรับที่สอดคล้องกับมาตรฐานเดิม และการจัดเก็บหลักฐานเพื่อการตรวจประเมิน</p>",
        "<p>The session gathered case studies from automotive-parts and electronics plants already running machine-vision inspection.</p><p>The hard part, everyone agreed, is writing acceptance criteria that reconcile with existing standards — and keeping evidence an auditor will accept.</p>",
        22, ["สัมมนา", "AI"]],
      ["research-award-2568", "ประกาศผลรางวัลผลงานวิจัยดีเด่น ประจำปี 2568", "Outstanding Research Award 2025 announced",
        "ผลงานด้านการทดสอบวัสดุคอมโพสิตคว้ารางวัลชนะเลิศ จากผลงานที่ส่งเข้าประกวดทั้งสิ้น 47 ผลงาน",
        "A composite-materials testing project takes first place from a field of 47 entries.",
        "<p>คณะกรรมการตัดสินพิจารณาจากความแปลกใหม่ ความเป็นไปได้ในการนำไปใช้จริง และผลกระทบต่อภาคอุตสาหกรรม</p><p>ผลงานที่ได้รับรางวัลจะได้รับการเผยแพร่ในคลังงานวิจัยของสมาคม และนำเสนอในการประชุมวิชาการประจำปี</p>",
        "<p>Judges weighed originality, practical feasibility, and the likely effect on industry.</p><p>Winning entries are published in the association's repository and presented at the annual conference.</p>",
        36, ["รางวัล", "งานวิจัย"]],
      ["mou-tisi", "ลงนามความร่วมมือกับหน่วยงานมาตรฐาน", "Memorandum of understanding signed with the standards body",
        "ความร่วมมือด้านการพัฒนาบุคลากรและการยกร่างมาตรฐานผลิตภัณฑ์อุตสาหกรรม",
        "A partnership on workforce development and the drafting of industrial product standards.",
        "<p>บันทึกความเข้าใจฉบับนี้ครอบคลุมการแลกเปลี่ยนผู้เชี่ยวชาญ การจัดอบรมร่วม และการเปิดให้สมาชิกสมาคมเข้าร่วมคณะทำงานยกร่างมาตรฐาน</p>",
        "<p>The memorandum covers exchanges of specialists, jointly run training, and a route for association members onto standards drafting groups.</p>",
        58, ["ความร่วมมือ"]],
    ];
    for (const [slug, tth, ten, eth, een, bth, ben, daysAgo, tags] of rows)
      await sql`insert into news (slug, title_th, title_en, excerpt_th, excerpt_en, body_th, body_en, tags, published_at, status)
                values (${slug}, ${tth}, ${ten}, ${eth}, ${een}, ${bth}, ${ben}, ${tags},
                        current_date - (${P(daysAgo)})::int, 'published')`;
  }

  // ───────────────────────────────────────────────────────────── activities
  if ((await sql`select count(*)::int as n from activities`)[0].n === 0) {
    const rows: [string, string, string, string, string, string, string, number, number][] = [
      ["iso-17025-workshop", "อบรมเชิงปฏิบัติการ ISO/IEC 17025 สำหรับห้องปฏิบัติการ", "ISO/IEC 17025 workshop for laboratories",
        "หลักสูตร 2 วัน ครอบคลุมข้อกำหนด การจัดทำเอกสาร และการเตรียมรับการตรวจประเมิน",
        "Two days on the requirements, the documentation, and getting ready for assessment.",
        "ห้องประชุม 801 อาคารวิจัยและมาตรฐาน", "Room 801, Research & Standards Building", 21, 22],
      ["annual-conference-2569", "การประชุมวิชาการประจำปี 2569", "Annual Conference 2026",
        "เวทีนำเสนอผลงานวิจัยด้านมาตรฐานและการทดสอบ พร้อมปาฐกถาพิเศษจากผู้ทรงคุณวุฒิ",
        "The year's research on standards and testing, plus keynote addresses.",
        "ศูนย์ประชุมแห่งชาติสิริกิติ์ กรุงเทพฯ", "Queen Sirikit National Convention Center, Bangkok", 74, 76],
      ["factory-visit-rayong", "ศึกษาดูงานโรงงานต้นแบบ จังหวัดระยอง", "Plant study visit, Rayong",
        "เยี่ยมชมสายการผลิตที่ใช้ระบบควบคุมคุณภาพอัตโนมัติเต็มรูปแบบ",
        "A look at a line running fully automated quality control.",
        "นิคมอุตสาหกรรมมาบตาพุด จังหวัดระยอง", "Map Ta Phut Industrial Estate, Rayong", 40, 40],
      ["metrology-shortcourse", "หลักสูตรระยะสั้น: มาตรวิทยาเชิงอุตสาหกรรม", "Short course: industrial metrology",
        "พื้นฐานการสอบเทียบ ความไม่แน่นอนของการวัด และการสอบกลับได้",
        "Calibration fundamentals, measurement uncertainty and traceability.",
        "อบรมออนไลน์ผ่าน Zoom", "Online via Zoom", -30, -29],
    ];
    for (const [slug, tth, ten, eth, een, vth, ven, d1, d2] of rows)
      await sql`insert into activities (slug, title_th, title_en, excerpt_th, excerpt_en, body_th, body_en,
                                        venue_th, venue_en, start_date, end_date, register_url, status)
                values (${slug}, ${tth}, ${ten}, ${eth}, ${een},
                        ${"<p>" + eth + "</p>"}, ${"<p>" + een + "</p>"},
                        ${vth}, ${ven}, current_date + (${P(d1)})::int, current_date + (${P(d2)})::int, '/contact', 'published')`;
  }

  // ─────────────────────────────────────────────────────────────── research
  if ((await sql`select count(*)::int as n from research_items`)[0].n === 0) {
    const rows: [string, string, string, number, string, string][] = [
      ["การประเมินความไม่แน่นอนของการวัดในการทดสอบแรงดึงของเหล็กเส้น", "Measurement uncertainty in tensile testing of steel reinforcement bars", "ธนกฤต วิริยะพงศ์, ปวีณา สุขเจริญ", 2025, "วารสารมาตรฐานและการทดสอบ", "Journal of Standards and Testing"],
      ["การพัฒนาวิธีทดสอบวัสดุคอมโพสิตสำหรับชิ้นส่วนยานยนต์", "A test method for composite materials in automotive components", "กิตติพงษ์ ศรีสุวรรณ และคณะ", 2025, "การประชุมวิชาการประจำปี RISA", "RISA Annual Conference"],
      ["ระบบตรวจจับข้อบกพร่องด้วยภาพสำหรับสายการผลิตอิเล็กทรอนิกส์", "Machine-vision defect detection for electronics assembly lines", "วีรภัทร อินทรโชติ", 2024, "วารสารวิศวกรรมอุตสาหการ", "Journal of Industrial Engineering"],
      ["แนวทางการรับรองห้องปฏิบัติการขนาดเล็กในภูมิภาค", "Accrediting small regional laboratories: a practical route", "ณัฐริกา บุญมั่น", 2024, "รายงานวิจัยสมาคม", "RISA Research Report"],
      ["ผลกระทบของมาตรฐานสากลต่อผู้ผลิตขนาดกลางและขนาดย่อม", "How international standards land on Thai SMEs", "อรรถพล เกียรติวงศ์", 2023, "วารสารนโยบายอุตสาหกรรม", "Journal of Industrial Policy"],
    ];
    let i = 0;
    for (const [tth, ten, authors, year, vth, ven] of rows)
      await sql`insert into research_items (title_th, title_en, authors, year, venue_th, venue_en,
                  abstract_th, abstract_en, status, sort)
                values (${tth}, ${ten}, ${authors}, ${year}, ${vth}, ${ven},
                        'บทคัดย่อฉบับเต็มเปิดให้สมาชิกเข้าถึงได้ในคลังงานวิจัยของสมาคม',
                        'The full abstract is available to members in the association repository.',
                        'published', ${i++})`;
  }

  // ───────────────────────────────────────────────────────────────── awards
  if ((await sql`select count(*)::int as n from awards`)[0].n === 0) {
    const rows: [number, string, string, string, string, string, string][] = [
      [2025, "ผลงานวิจัยดีเด่น", "Outstanding Research", "ทีมวิจัยวัสดุคอมโพสิต มจธ.", "Composite Materials Group, KMUTT", "จากการพัฒนาวิธีทดสอบที่ลดเวลาการตรวจสอบลงกว่าครึ่ง", "For a test method that halved inspection time."],
      [2025, "นวัตกรรมเพื่ออุตสาหกรรม", "Industrial Innovation", "บริษัท ไทยพรีซิชั่น จำกัด", "Thai Precision Co., Ltd.", "จากระบบสอบเทียบอัตโนมัติที่พัฒนาขึ้นใช้เองภายในโรงงาน", "For an in-house automated calibration system."],
      [2024, "บุคคลดีเด่นด้านมาตรฐาน", "Standards Champion", "ศ.ดร. บรรจง เลิศวัฒนา", "Prof. Dr. Banjong Lertwattana", "จากการอุทิศตนพัฒนามาตรฐานอุตสาหกรรมไทยตลอดสามทศวรรษ", "For three decades of work on Thai industrial standards."],
      [2024, "ผลงานนักวิจัยรุ่นใหม่", "Young Researcher", "ดร. วีรภัทร อินทรโชติ", "Dr. Weerapat Intarachot", "จากงานวิจัยด้านการตรวจจับข้อบกพร่องด้วยภาพ", "For research on machine-vision defect detection."],
    ];
    let i = 0;
    for (const [y, cth, cen, rth, ren, zth, zen] of rows)
      await sql`insert into awards (year, category_th, category_en, recipient_th, recipient_en, citation_th, citation_en, status, sort)
                values (${y}, ${cth}, ${cen}, ${rth}, ${ren}, ${zth}, ${zen}, 'published', ${i++})`;
  }

  // ────────────────────────────────────────────────────────────── job posts
  if ((await sql`select count(*)::int as n from job_posts`)[0].n === 0) {
    const rows: [string, string, string, string, string, string, string, string][] = [
      ["quality-engineer-rayong", "วิศวกรควบคุมคุณภาพ", "Quality Engineer", "บริษัท ไทยพรีซิชั่น จำกัด", "Thai Precision Co., Ltd.", "ระยอง", "Rayong", "full_time"],
      ["lab-technician-bangkok", "นักวิทยาศาสตร์ห้องปฏิบัติการทดสอบ", "Testing Laboratory Scientist", "ศูนย์ทดสอบผลิตภัณฑ์อุตสาหกรรม", "Industrial Product Testing Centre", "กรุงเทพมหานคร", "Bangkok", "full_time"],
      ["standards-researcher", "นักวิจัยด้านมาตรฐานอุตสาหกรรม", "Industrial Standards Researcher", "สถาบันวิจัยแห่งชาติ", "National Research Institute", "ปทุมธานี", "Pathum Thani", "contract"],
    ];
    let i = 0;
    for (const [slug, tth, ten, oth, oen, lth, len, type] of rows)
      await sql`insert into job_posts (slug, title_th, title_en, org_th, org_en, location_th, location_en,
                  employment_type, description_th, description_en, deadline, apply_url, status, sort)
                values (${slug}, ${tth}, ${ten}, ${oth}, ${oen}, ${lth}, ${len}, ${type},
                  '<p>รับผิดชอบงานตรวจสอบคุณภาพ จัดทำเอกสารระบบมาตรฐาน และประสานงานการตรวจประเมิน</p><p>คุณสมบัติ: ปริญญาตรีสาขาที่เกี่ยวข้อง มีประสบการณ์อย่างน้อย 2 ปี</p>',
                  '<p>Responsible for quality inspection, standards documentation and coordinating assessments.</p><p>Requirements: a relevant bachelor''s degree and at least two years of experience.</p>',
                  current_date + 45, '/contact', 'published', ${i++})`;
  }

  // ────────────────────────────────────────────────────────────── documents
  if ((await sql`select count(*)::int as n from documents`)[0].n === 0) {
    const rows: [string, string, string, string][] = [
      ["ใบสมัครสมาชิกสมาคม (แบบฟอร์ม)", "Membership application form", "แบบฟอร์ม", "Forms"],
      ["ข้อบังคับสมาคม พ.ศ. 2560", "Association rules (2017)", "ระเบียบข้อบังคับ", "Regulations"],
      ["รายงานประจำปี 2567", "Annual report 2024", "รายงาน", "Reports"],
      ["แนวปฏิบัติการยกร่างมาตรฐาน", "Guidelines for drafting standards", "คู่มือ", "Guides"],
      ["กำหนดการประชุมวิชาการประจำปี", "Annual conference programme", "กิจกรรม", "Events"],
    ];
    let i = 0;
    for (const [tth, ten, cth, cen] of rows)
      await sql`insert into documents (title_th, title_en, category_th, category_en, description_th, description_en, mime, status, sort)
                values (${tth}, ${ten}, ${cth}, ${cen},
                  'อัปโหลดไฟล์จริงได้ที่หน้าจัดการเอกสารในระบบหลังบ้าน',
                  'Upload the real file from the Documents screen in the admin console.',
                  'application/pdf', 'published', ${i++})`;
  }

  // ────────────────────────────────────────────────────────────── locations
  if ((await sql`select count(*)::int as n from locations`)[0].n === 0) {
    const rows: [string, string, string, string, number, number, string][] = [
      ["ศูนย์ภูมิภาคภาคเหนือ", "Northern regional centre", "มหาวิทยาลัยเชียงใหม่ จังหวัดเชียงใหม่", "Chiang Mai University, Chiang Mai", 18.8008, 98.9527, "branch"],
      ["ศูนย์ภูมิภาคภาคตะวันออก", "Eastern regional centre", "นิคมอุตสาหกรรมมาบตาพุด จังหวัดระยอง", "Map Ta Phut Industrial Estate, Rayong", 12.7018, 101.1543, "branch"],
      ["สถาบันมาตรวิทยาแห่งชาติ", "National Institute of Metrology", "คลองห้า จังหวัดปทุมธานี", "Khlong Ha, Pathum Thani", 14.0742, 100.6188, "partner"],
      ["มหาวิทยาลัยเทคโนโลยีสุรนารี", "Suranaree University of Technology", "จังหวัดนครราชสีมา", "Nakhon Ratchasima", 14.8818, 102.0212, "member"],
      ["มหาวิทยาลัยสงขลานครินทร์", "Prince of Songkla University", "อำเภอหาดใหญ่ จังหวัดสงขลา", "Hat Yai, Songkhla", 7.0083, 100.4986, "member"],
    ];
    let i = 0;
    for (const [nth, nen, ath, aen, lat, lng, kind] of rows)
      await sql`insert into locations (name_th, name_en, address_th, address_en, lat, lng, kind, sort)
                values (${nth}, ${nen}, ${ath}, ${aen}, ${lat}, ${lng}, ${kind}, ${i++})`;
  }

  // ─────────────────────────────────────────────────────────────── partners
  if ((await sql`select count(*)::int as n from partners`)[0].n === 0) {
    const names = ["สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม", "สถาบันมาตรวิทยาแห่งชาติ",
      "สภาอุตสาหกรรมแห่งประเทศไทย", "สถาบันวิจัยวิทยาศาสตร์และเทคโนโลยีแห่งประเทศไทย",
      "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", "จุฬาลงกรณ์มหาวิทยาลัย"];
    let i = 0;
    for (const n of names)
      await sql`insert into partners (name, sort) values (${n}, ${i++})`;
  }

  // ──────────────────────────────────────────────────────────────── gallery
  if ((await sql`select count(*)::int as n from gallery_albums`)[0].n === 0) {
    const albums: [string, string, string, number][] = [
      ["agm-2568", "ประชุมใหญ่สามัญประจำปี 2568", "Annual General Meeting 2025", 8],
      ["iso-workshop-2568", "อบรมเชิงปฏิบัติการ ISO/IEC 17025", "ISO/IEC 17025 workshop", 45],
      ["factory-visit-2567", "ศึกษาดูงานโรงงานต้นแบบ", "Plant study visit", 160],
    ];
    for (const [slug, tth, ten, daysAgo] of albums) {
      const [album] = await sql<{ id: string }[]>`
        insert into gallery_albums (slug, title_th, title_en, description_th, description_en, event_date, status)
        values (${slug}, ${tth}, ${ten},
                'ภาพบรรยากาศจากกิจกรรมของสมาคม', 'Photographs from the event.',
                current_date - (${P(daysAgo)})::int, 'published') returning id`;
      for (let p = 0; p < 6; p++)
        await sql`insert into gallery_photos (album_id, caption_th, caption_en, sort)
                  values (${album.id}, ${"ภาพที่ " + (p + 1)}, ${"Photo " + (p + 1)}, ${p})`;
    }
  }

  console.log("  collections (part 2) seeded");
}

async function seedAdmin() {
  const existing = await sql`select count(*)::int as n from admin_users`;
  if (existing[0].n > 0) {
    console.log("  admin_users: already present, left untouched");
    return;
  }
  const username = (process.env.ADMIN_USERNAME ?? "smartlab").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(9).toString("base64url");
  await sql`insert into admin_users (username, password_hash, name, role)
            values (${username}, ${await bcrypt.hash(password, 12)}, 'ผู้ดูแลระบบ', 'admin')`;
  console.log("\n  ┌──────────────────────────────────────────────");
  console.log("  │  ADMIN ACCOUNT CREATED — save these now");
  console.log(`  │  username: ${username}`);
  console.log(`  │  password: ${password}`);
  console.log("  │  Change the password from /admin/users.");
  console.log("  └──────────────────────────────────────────────\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
