"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, ChevronRight, FileText, LayoutList, Map, Minus, Plus, RotateCcw, Search, Sparkles, UsersRound, X } from "lucide-react";
import { useAdminLanguage } from "./AdminLanguage";
import { WorkspacePanel } from "./WorkspacePanel";
import { boundRect, defaultWorkspaceLayout, intersects, parseWorkspaceLayout, type PanelRect, resolveCollisions, BRANCH_KEYS, type PanelBounds, type LayoutBranch } from "./constellation-layout";

export type MapRecord = { id: string; title_th: string; title_en: string; slug: string; status: string };
export type MapCollection = "news" | "activities" | "team";
type Branch = MapCollection | "overview";
export type ConstellationData = Record<MapCollection, { records: MapRecord[]; total: number }>;

const branches = [
  { key: "news", th: "ข่าวสาร", en: "News", icon: FileText },
  { key: "activities", th: "กิจกรรม", en: "Activities", icon: CalendarDays },
  { key: "team", th: "บุคลากร", en: "Personnel", icon: UsersRound },
  { key: "overview", th: "ภาพรวม", en: "Overview", icon: LayoutList },
] as const;
const stars = [[42,74],[115,256],[232,102],[360,198],[488,45],[668,164],[884,64],[978,284],[847,510],[654,576],[437,489],[295,588],[105,501],[72,361],[970,604],[768,330],[385,346],[585,212]];

export function ConstellationMap({ data, workspaceKey }: { data: ConstellationData; workspaceKey: string }) {
  const { locale } = useAdminLanguage();
  const th = locale === "th";
  const [active, setActive] = useState<Branch | null>(null);
  const [mode, setMode] = useState<"map" | "list">("map");
  
  const [query, setQuery] = useState("");
  const list = mode === "list" || !!query.trim();
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
    setLayout(current=>{
      if (kind === "panels") return {...current, panels: {...current.panels, [key]: next}};
      const nextNodes = resolveCollisions({...current.nodes, [key]: next}, active, current.panels, nodeBounds, key);
      return {...current, nodes: nextNodes};
    });
  }
  
  useEffect(() => {
    if (!loaded || list) return;
    setLayout(current => {
      const nextNodes = resolveCollisions(current.nodes, active, current.panels, nodeBounds, null);
      if (JSON.stringify(current.nodes) === JSON.stringify(nextNodes)) return current;
      return {...current, nodes: nextNodes};
    });
  }, [active, list, loaded]);
  function adjustLayout(dx:number,dy:number,resize=false){if(!layoutTarget)return;const {kind,key}=layoutTarget;const rect=boundRect(layout[kind][key],kind==="nodes"?nodeBounds:panelBounds);movePanel(kind,key,resize?{...rect,width:rect.width+dx,height:rect.height+dy}:{...rect,x:rect.x+dx,y:rect.y+dy});}
  function resetLayout(){setLayout(defaultWorkspaceLayout());setLayoutTarget(null);reset();}
  function changeZoom(amount: number) { setZoom(value => Math.min(2, Math.max(.3, value + amount))); }
  // Records panel lives in map space beside its parent node, on the side facing away from the centre prompt.
  const PANEL_GAP=72;
  function attachedRect(key: Branch){
    const n=layout.nodes[key];const cy=n.y+n.height/2;
    const w=Math.max(300,layout.panels[key].width);const h=Math.max(260,layout.panels[key].height);
    const left=n.x+n.width/2<460;
    return {x:left?n.x-PANEL_GAP-w:n.x+n.width+PANEL_GAP,y:cy-h/2,width:w,height:h,left};
  }
  const prevView=useRef<{zoom:number;pan:{x:number;y:number}}|null>(null);
  const [easing,setEasing]=useState(false);
  function ease(){setEasing(true);window.setTimeout(()=>setEasing(false),520);}
  /** Zooms out just enough to show the centre prompt, the chosen node and its panel together. */
  function focusOn(key: Branch){
    const n=layout.nodes[key];const p=attachedRect(key);const pad=40;
    const minX=Math.min(408,n.x,p.x),minY=Math.min(234,n.y,p.y),maxX=Math.max(632,n.x+n.width,p.x+p.width),maxY=Math.max(458,n.y+n.height,p.y+p.height);
    const target=Math.min(1,viewSize.width/(maxX-minX+pad*2),viewSize.height/(maxY-minY+pad*2));
    const nextZoom=Math.min(2,Math.max(.3,target/fit));const s=fit*nextZoom;
    setZoom(nextZoom);setPan({x:-s*((minX+maxX)/2-520),y:-s*((minY+maxY)/2-330)});
  }
  function openRecords(key: Branch){if(!active)prevView.current={zoom,pan};setActive(key);ease();focusOn(key);}
  function toggle(key: Branch) { if(active===key)closeRecords();else openRecords(key); }
  function closeRecords(){const key=active;setActive(null);if(prevView.current){ease();setZoom(prevView.current.zoom);setPan(prevView.current.pan);prevView.current=null;}if(key)window.requestAnimationFrame(()=>nodeButtons.current[key]?.focus());}
  function title(record: MapRecord) { return (th ? record.title_th : record.title_en) || record.title_th || record.title_en || (th ? "ไม่มีชื่อ" : "Untitled"); }
  const needle = query.trim().toLocaleLowerCase();
  const collections = branches.filter(branch => branch.key !== "overview");
  function matching(key: MapCollection) { return data[key].records.filter(record => `${record.title_th} ${record.title_en} ${record.slug}`.toLocaleLowerCase().includes(needle)); }
  const searching = !!needle;


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
      </div>
    
    <div className={`constellation-body ${list ? "constellation-list-mode" : ""}`}>
      <div ref={viewport} className="constellation-viewport" tabIndex={list ? -1 : 0} role="region" aria-label={th ? "แผนที่งาน ใช้ปุ่มลูกศรเลื่อน เครื่องหมายบวกหรือลบซูม และเลขศูนย์คืนมุมมอง" : "Task map. Arrow keys pan, plus or minus zoom, and zero resets the view."}
        onKeyDown={event => { if(event.target !== event.currentTarget)return; const key=event.key; if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-","0"].includes(key))event.preventDefault(); if(key === "+" || key === "=")changeZoom(.15);if(key === "-")changeZoom(-.15);if(key === "0")reset();if(key === "Escape")closeRecords();if(key.startsWith("Arrow"))setPan(value => ({x:value.x+(key === "ArrowLeft" ? 30 : key === "ArrowRight" ? -30 : 0),y:value.y+(key === "ArrowUp" ? 30 : key === "ArrowDown" ? -30 : 0)})); }}
        onPointerDown={event => {if((event.target as HTMLElement).closest("button,a,input,.constellation-attached-panel"))return;drag.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event => {if(drag.current)setPan({x:drag.current.panX+event.clientX-drag.current.x,y:drag.current.panY+event.clientY-drag.current.y});}}
        onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}>
        <div className="constellation-scene" style={{transform:`translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${fit*zoom})`,transition:easing?"transform .5s cubic-bezier(.22,.8,.25,1)":undefined}}>
          <svg className="constellation-lines" viewBox="0 0 1040 660" aria-hidden="true" style={{overflow:"visible"}}><g fill="#c7dfff">{stars.map(([x,y],index)=><circle key={index} cx={x} cy={y} r={index%3===0?1.8:1} className="constellation-star" style={{ animationDelay: `-${index % 5}s`, animationDuration: `${3 + (index % 4)}s` }}/>)}</g><g fill="none" strokeWidth="1.5">{branches.map(branch=>{const rect=layout.nodes[branch.key];const x=rect.x+rect.width/2;const y=rect.y+rect.height/2;const dist = Math.sqrt((x-520)**2 + (y-346)**2);const sag = dist * 0.15;return <path key={branch.key} className={branch.key==="news"||branch.key==="overview"?"constellation-violet-line":"constellation-cyan-line"} d={`M520 346 Q ${(520+x)/2} ${(346+y)/2 + sag} ${x} ${y}`}/>;})}</g>{!list&&active&&(()=>{const n=layout.nodes[active];const p=attachedRect(active);const sx=p.left?n.x:n.x+n.width;const sy=n.y+n.height/2;const ex=p.left?p.x+p.width:p.x;const ey=p.y+p.height/2;const dir=p.left?-1:1;const c=PANEL_GAP*.55;const sag=Math.min(28,Math.abs(ex-sx)*.25);return <g className={active==="news"||active==="overview"?"constellation-violet-line":"constellation-cyan-line"} fill="none" strokeWidth="2"><path d={`M${sx} ${sy} C ${sx+dir*c} ${sy+sag}, ${ex-dir*c} ${ey+sag}, ${ex} ${ey}`}/><circle cx={sx} cy={sy} r="4" fill="currentColor" stroke="none"/><circle cx={ex} cy={ey} r="4" fill="currentColor" stroke="none"/></g>;})()}</svg>
          <div className="constellation-center"><Sparkles size={32} aria-hidden /><h1>{th ? "อยากทำอะไร?" : "What would you like to do?"}</h1><p>{th ? "เลือกงานที่ต้องการ" : "Choose a task"}</p></div>
          {branches.map(({key,th:thai,en,icon:Icon}) => {
            const rect = layout.nodes[key];
            const nodeScale = Math.min(rect.width / 220, rect.height / 88);
            return <WorkspacePanel key={key} className="workspace-node" rect={rect} bounds={nodeBounds} scale={fit*zoom} name={th?thai:en} th={th} onChange={rect=>movePanel("nodes",key,rect)} onSelect={()=>setLayoutTarget({kind:"nodes",key})}>
              <button ref={element=>{nodeButtons.current[key]=element;}} type="button" className={`constellation-node constellation-node-${key}`} aria-expanded={active === key} aria-controls="constellation-panel" onClick={() => toggle(key)} style={{ fontSize: `${nodeScale * 24}px`, gap: `${nodeScale * 16}px` }}>
                <Icon size={Math.round(26 * nodeScale)} aria-hidden />
                <span>{th ? thai : en}</span>
                <ChevronRight size={Math.round(18 * nodeScale)} aria-hidden />
              </button>
            </WorkspacePanel>;
          })}
          {!list&&active&&(()=>{const p=attachedRect(active);return <div className="workspace-record-panel constellation-attached-panel" style={{position:"absolute",left:p.x,top:p.y,width:p.width,height:p.height}}>
            <aside id="constellation-panel" className="constellation-panel-content" aria-label={th?"รายการในหมวดที่เลือก":"Selected category records"}>
              <button type="button" className="constellation-close" aria-label={th?"ปิดรายการ":"Close records"} onClick={closeRecords}><X size={18} aria-hidden /></button>
              {active==="overview"?<section className="constellation-overview"><h2>{th?"ภาพรวมเนื้อหา":"Content overview"}</h2><p>{th?"รายการที่มีอยู่ในตัวแก้ไข":"Records in the existing editors"}</p><ul>{collections.map(branch=><li key={branch.key}><Link href={`/admin/${branch.key}`}>{th?branch.th:branch.en}<span>{data[branch.key].total}</span><ChevronRight size={18} aria-hidden /></Link></li>)}</ul></section>:records(active)}
            </aside>
          </div>;})()}
        </div>
        <div className="constellation-zoom" role="group" aria-label={th ? "มุมมองแผนที่" : "Map view"}>
          <button type="button" aria-label={th ? "ซูมออก" : "Zoom out"} disabled={zoom <= .3} onClick={()=>changeZoom(-.15)}><Minus size={18} aria-hidden /></button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label={th ? "ซูมเข้า" : "Zoom in"} disabled={zoom >= 2} onClick={()=>changeZoom(.15)}><Plus size={18} aria-hidden /></button><button type="button" aria-label={th ? "คืนมุมมอง" : "Reset view"} onClick={reset}><RotateCcw size={18} aria-hidden /></button>
        </div>
      </div>
      {list?<aside id="constellation-panel" className="constellation-list-panel"><h1 className="constellation-list-title">{th ? "เลือกงานหรือค้นหารายการ" : "Choose a task or find a record"}</h1>{collections.map(branch=>records(branch.key))}</aside>:!active?<aside id="constellation-panel" className="sr-only">{th?"เลือกหมวดเพื่อแสดงรายการ":"Choose a category to see records"}</aside>:null}
    </div>  </section>;
}
