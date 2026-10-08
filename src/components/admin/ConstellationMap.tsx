"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, ChevronRight, FileText, LayoutList, Map, Minus, Plus, RotateCcw, Search, Sparkles, UsersRound, X } from "lucide-react";
import { useAdminLanguage } from "./AdminLanguage";
import { WorkspacePanel } from "./WorkspacePanel";
import { boundRect, defaultWorkspaceLayout, intersects, parseWorkspaceLayout, type PanelRect } from "./constellation-layout";

export type MapRecord = { id: string; title_th: string; title_en: string; slug: string; status: string };
export type MapCollection = "news" | "activities" | "team";
type Branch = MapCollection | "overview";
export type ConstellationData = Record<MapCollection, { records: MapRecord[]; total: number }>;

const branches = [
  { key: "news", th: "ข่าวสาร", en: "News", icon: FileText },
  { key: "activities", th: "กิจกรรม", en: "Activities", icon: CalendarDays },
  { key: "team", th: "บุคลากร", en: "People", icon: UsersRound },
  { key: "overview", th: "ภาพรวม", en: "Overview", icon: LayoutList },
] as const;
const stars = [[42,74],[115,256],[232,102],[360,198],[488,45],[668,164],[884,64],[978,284],[847,510],[654,576],[437,489],[295,588],[105,501],[72,361],[970,604],[768,330],[385,346],[585,212]];

export function ConstellationMap({ data, workspaceKey }: { data: ConstellationData; workspaceKey: string }) {
  const { locale } = useAdminLanguage();
  const th = locale === "th";
  const [active, setActive] = useState<Branch | null>(null);
  const [mode, setMode] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fit, setFit] = useState(1);
  const [viewSize, setViewSize] = useState({width:1040,height:480});
  const [layout,setLayout] = useState(defaultWorkspaceLayout);
  const [loaded,setLoaded] = useState(false);
  const [stored,setStored] = useState(false);
  const [layoutTarget,setLayoutTarget] = useState<{kind:"nodes"|"panels";key:Branch}|null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const nodeButtons = useRef<Partial<Record<Branch,HTMLButtonElement|null>>>({});
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const storageKey=`risa-constellation-layout:${workspaceKey}`;
  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>{try{const raw=localStorage.getItem(storageKey);const saved=parseWorkspaceLayout(raw);setLayout(saved??defaultWorkspaceLayout());if(raw&&!saved)localStorage.removeItem(storageKey);}catch{setStored(false);}setLoaded(true);});
    return ()=>window.cancelAnimationFrame(frame);
  },[storageKey]);
  useEffect(()=>{
    if(!loaded)return;
    const timer=window.setTimeout(()=>{try{localStorage.setItem(storageKey,JSON.stringify(layout));setStored(true);}catch{setStored(false);}},300);
    return ()=>window.clearTimeout(timer);
  },[layout,loaded,storageKey]);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const frame=window.requestAnimationFrame(()=>{if(mobile.matches)setMode("list");});
    return ()=>window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = () => {setFit(Math.max(element.clientWidth < 450 ? .55 : 0, Math.min(element.clientWidth / 1040, element.clientHeight / 660, 1)));setViewSize({width:element.clientWidth,height:element.clientHeight});};
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  function reset() { setPan({ x: 0, y: 0 }); setZoom(1); }
  const nodeBounds={width:1040,height:660,minWidth:180,minHeight:80,maxWidth:320,maxHeight:160};
  const panelBounds={width:viewSize.width,height:viewSize.height,minWidth:240,minHeight:180};
  function movePanel(kind:"nodes"|"panels",key:Branch,rect:PanelRect){
    const next=boundRect(rect,kind==="nodes"?nodeBounds:panelBounds);
    setLayout(current=>{if(kind==="nodes"&&(intersects(next,{x:408,y:234,width:224,height:224})||branches.some(branch=>branch.key!==key&&intersects(next,current.nodes[branch.key]))))return current;return {...current,[kind]:{...current[kind],[key]:next}};});
  }
  function adjustLayout(dx:number,dy:number,resize=false){if(!layoutTarget)return;const {kind,key}=layoutTarget;const rect=boundRect(layout[kind][key],kind==="nodes"?nodeBounds:panelBounds);movePanel(kind,key,resize?{...rect,width:rect.width+dx,height:rect.height+dy}:{...rect,x:rect.x+dx,y:rect.y+dy});}
  function resetLayout(){setLayout(defaultWorkspaceLayout());setLayoutTarget(null);reset();}
  function changeZoom(amount: number) { setZoom(value => Math.min(2, Math.max(.65, value + amount))); }
  function toggle(key: Branch) { setActive(value => value === key ? null : key); }
  function closeRecords(){const key=active;setActive(null);if(key)window.requestAnimationFrame(()=>nodeButtons.current[key]?.focus());}
  function title(record: MapRecord) { return (th ? record.title_th : record.title_en) || record.title_th || record.title_en || (th ? "ไม่มีชื่อ" : "Untitled"); }
  const needle = query.trim().toLocaleLowerCase();
  const collections = branches.filter(branch => branch.key !== "overview");
  function matching(key: MapCollection) { return data[key].records.filter(record => `${record.title_th} ${record.title_en} ${record.slug}`.toLocaleLowerCase().includes(needle)); }
  const searching = !!needle;
  const list = mode === "list" || searching;

  function records(key: MapCollection) {
    const branch = branches.find(item => item.key === key)!;
    const matches = matching(key);
    return <section className="constellation-records" key={key}>
      <div className="constellation-records-heading"><h2>{th ? branch.th : branch.en}</h2><Link className="constellation-add" href={`/admin/${key}/new`}><Plus size={16} aria-hidden />{th ? "เพิ่มรายการ" : "Add record"}</Link></div>
      {matches.length ? <ul>{matches.map(record => <li key={record.id}>
        <FileText size={20} aria-hidden />
        <div className="constellation-record-copy"><h3>{title(record)}</h3><span className="constellation-status">{record.status === "published" ? (th ? "เผยแพร่" : "Published") : (th ? "ฉบับร่าง" : "Draft")}</span></div>
        <Link href={`/admin/${key}/${record.id}`} className="constellation-edit">{th ? "แก้ไข" : "Edit"}<ArrowRight size={14} aria-hidden /></Link>
        {record.status === "published" && key !== "team" && record.slug && <Link href={`/${locale}/${key}/${record.slug}`} target="_blank" rel="noreferrer" className="constellation-preview">{th ? "ดูบนเว็บไซต์" : "View site"}</Link>}
      </li>)}</ul> : <p className="constellation-empty">{searching ? (th ? "ไม่พบรายการที่ค้นหา" : "No matching records") : (th ? "ยังไม่มีรายการ เริ่มต้นด้วยการเพิ่มรายการแรก" : "No records yet. Add your first record.")}</p>}
      <Link href={`/admin/${key}`} className="constellation-all">{th ? "เปิดรายการทั้งหมด" : "Open all records"}<ChevronRight size={16} aria-hidden /></Link>
    </section>;
  }

  return <section lang={locale} className="constellation-workspace">
    <div className="constellation-toolbar">
      <div className="constellation-search"><Search size={17} aria-hidden /><input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label={th ? "ค้นหารายการในแผนที่" : "Search map records"} placeholder={th ? "ค้นหารายการ…" : "Search records…"} /></div>
      <div className="constellation-view-switch" role="group" aria-label={th ? "รูปแบบการแสดง" : "Display mode"}>
        <button type="button" aria-pressed={mode === "map" && !searching} onClick={() => {setMode("map");setQuery("");}}><Map size={16} aria-hidden />{th ? "แผนที่" : "Map"}</button>
        <button type="button" aria-pressed={list} onClick={() => setMode("list")}><LayoutList size={16} aria-hidden />{th ? "รายการ" : "List"}</button>
        <button type="button" onClick={resetLayout}><RotateCcw size={16} aria-hidden />{th ? "คืนตำแหน่ง" : "Reset layout"}</button>
      </div>
    </div>
    {!list && layoutTarget && <div className="workspace-layout-controls" role="group" aria-label={th?"ย้ายและปรับขนาดแผงที่เลือก":"Move and resize selected panel"}>
      <span>{th?branches.find(branch=>branch.key===layoutTarget.key)!.th:branches.find(branch=>branch.key===layoutTarget.key)!.en}</span>
      {[[ArrowLeft,-20,0,th?"เลื่อนซ้าย":"Move left"],[ArrowRight,20,0,th?"เลื่อนขวา":"Move right"],[ArrowUp,0,-20,th?"เลื่อนขึ้น":"Move up"],[ArrowDown,0,20,th?"เลื่อนลง":"Move down"]].map(([Icon,dx,dy,label],index)=>{const ControlIcon=Icon as typeof ArrowLeft;return <button type="button" key={index} aria-label={String(label)} onClick={()=>adjustLayout(Number(dx),Number(dy))}><ControlIcon size={16} aria-hidden /></button>;})}
      <button type="button" onClick={()=>adjustLayout(20,0,true)}>{th?"กว้างขึ้น":"Wider"}</button><button type="button" onClick={()=>adjustLayout(-20,0,true)}>{th?"แคบลง":"Narrower"}</button><button type="button" onClick={()=>adjustLayout(0,20,true)}>{th?"สูงขึ้น":"Taller"}</button><button type="button" onClick={()=>adjustLayout(0,-20,true)}>{th?"เตี้ยลง":"Shorter"}</button>
      <button type="button" aria-label={th?"ปิดปุ่มปรับตำแหน่ง":"Close layout controls"} onClick={()=>setLayoutTarget(null)}><X size={16} aria-hidden /></button>
    </div>}
    <div className={`constellation-body ${list ? "constellation-list-mode" : ""}`}>
      <div ref={viewport} className="constellation-viewport" tabIndex={list ? -1 : 0} role="region" aria-label={th ? "แผนที่งาน ใช้ปุ่มลูกศรเลื่อน เครื่องหมายบวกหรือลบซูม และเลขศูนย์คืนมุมมอง" : "Task map. Arrow keys pan, plus or minus zoom, and zero resets the view."}
        onKeyDown={event => { if(event.target !== event.currentTarget)return; const key=event.key; if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-","0"].includes(key))event.preventDefault(); if(key === "+" || key === "=")changeZoom(.15);if(key === "-")changeZoom(-.15);if(key === "0")reset();if(key === "Escape")setActive(null);if(key.startsWith("Arrow"))setPan(value => ({x:value.x+(key === "ArrowLeft" ? 30 : key === "ArrowRight" ? -30 : 0),y:value.y+(key === "ArrowUp" ? 30 : key === "ArrowDown" ? -30 : 0)})); }}
        onPointerDown={event => {if((event.target as HTMLElement).closest("button,a,input"))return;drag.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event => {if(drag.current)setPan({x:drag.current.panX+event.clientX-drag.current.x,y:drag.current.panY+event.clientY-drag.current.y});}}
        onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}>
        <div className="constellation-scene" style={{transform:`translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${fit*zoom})`}}>
          <svg className="constellation-lines" viewBox="0 0 1040 660" aria-hidden="true"><g fill="#c7dfff">{stars.map(([x,y],index)=><circle key={index} cx={x} cy={y} r={index%3===0?1.8:1} opacity={index%3===0?.8:.5}/>)}</g><g fill="none" strokeWidth="1.5">{branches.map(branch=>{const rect=layout.nodes[branch.key];const x=rect.x+rect.width/2;const y=rect.y+rect.height/2;return <path key={branch.key} className={branch.key==="news"||branch.key==="overview"?"constellation-violet-line":"constellation-cyan-line"} d={`M520 346L${x} ${y}`}/>;})}</g></svg>
          <div className="constellation-center"><Sparkles size={32} aria-hidden /><h1>{th ? "อยากทำอะไร?" : "What would you like to do?"}</h1><p>{th ? "เลือกงานที่ต้องการ" : "Choose a task"}</p></div>
          {branches.map(({key,th:thai,en,icon:Icon}) => <WorkspacePanel key={key} className="workspace-node" rect={layout.nodes[key]} bounds={nodeBounds} scale={fit*zoom} name={th?thai:en} th={th} onChange={rect=>movePanel("nodes",key,rect)} onSelect={()=>setLayoutTarget({kind:"nodes",key})}><button ref={element=>{nodeButtons.current[key]=element;}} type="button" className={`constellation-node constellation-node-${key}`} aria-expanded={active === key} aria-controls="constellation-panel" onClick={() => toggle(key)}><Icon size={26} aria-hidden /><span>{th ? thai : en}</span><ChevronRight size={18} aria-hidden /></button></WorkspacePanel>)}
        </div>
        <div className="constellation-zoom" role="group" aria-label={th ? "มุมมองแผนที่" : "Map view"}>
          <button type="button" aria-label={th ? "ซูมออก" : "Zoom out"} disabled={zoom <= .65} onClick={()=>changeZoom(-.15)}><Minus size={18} aria-hidden /></button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label={th ? "ซูมเข้า" : "Zoom in"} disabled={zoom >= 2} onClick={()=>changeZoom(.15)}><Plus size={18} aria-hidden /></button><button type="button" aria-label={th ? "คืนมุมมอง" : "Reset view"} onClick={reset}><RotateCcw size={18} aria-hidden /></button>
        </div>
      </div>
      {list?<aside id="constellation-panel" className="constellation-list-panel"><h1 className="constellation-list-title">{th ? "เลือกงานหรือค้นหารายการ" : "Choose a task or find a record"}</h1>{collections.map(branch=>records(branch.key))}</aside>:active?<WorkspacePanel className="workspace-record-panel" rect={boundRect(layout.panels[active],panelBounds)} bounds={panelBounds} name={th?branches.find(branch=>branch.key===active)!.th:branches.find(branch=>branch.key===active)!.en} th={th} onChange={rect=>movePanel("panels",active,rect)} onSelect={()=>setLayoutTarget({kind:"panels",key:active})}>
        <aside id="constellation-panel" className="constellation-panel-content" aria-label={th?"รายการในหมวดที่เลือก":"Selected category records"}>
          <button type="button" className="constellation-close" aria-label={th?"ปิดรายการ":"Close records"} onClick={closeRecords}><X size={18} aria-hidden /></button>
          {active==="overview"?<section className="constellation-overview"><h2>{th?"ภาพรวมเนื้อหา":"Content overview"}</h2><p>{th?"รายการที่มีอยู่ในตัวแก้ไข":"Records in the existing editors"}</p><ul>{collections.map(branch=><li key={branch.key}><Link href={`/admin/${branch.key}`}>{th?branch.th:branch.en}<span>{data[branch.key].total}</span><ChevronRight size={18} aria-hidden /></Link></li>)}</ul></section>:records(active)}
        </aside>
      </WorkspacePanel>:<aside id="constellation-panel" className="sr-only">{th?"เลือกหมวดเพื่อแสดงรายการ":"Choose a category to see records"}</aside>}
    </div>
    <p className="constellation-instructions">{th ? "ลากพื้นที่ว่างเพื่อเลื่อน · ใช้ปุ่มซูม หรือเปิดแบบรายการ" : "Drag empty space to pan · Use zoom controls or switch to List"}</p>
    <p className="workspace-storage-status">{stored?(th?"ตำแหน่งบันทึกในเบราว์เซอร์นี้สำหรับบัญชีของคุณ":"Layout saved in this browser for your account"):(th?"ตำแหน่งยังไม่บันทึกในเบราว์เซอร์":"Layout is not saved in this browser")}</p>
  </section>;
}
