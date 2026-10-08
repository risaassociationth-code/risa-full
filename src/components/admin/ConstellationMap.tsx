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
const stars = [[228,25],[563,250],[457,142],[209,558],[178,604],[864,32],[61,95],[447,238],[1034,616],[54,574],[407,558],[859,225],[919,603],[569,6],[326,432],[696,284],[318,220],[689,104],[189,389],[198,367],[704,618],[541,44],[940,549],[255,387],[161,565],[600,643],[740,591],[393,71],[93,233],[592,81],[476,103],[778,284],[928,650],[747,166],[758,363],[429,273],[146,623],[350,546],[501,167],[946,388],[552,655],[449,332],[114,234],[65,323],[821,274],[135,216],[644,217],[1022,405],[939,146],[542,142],[505,574],[538,598],[877,597],[817,370],[449,141],[1010,93],[96,112],[313,642],[327,432],[130,394],[781,610],[958,541],[514,566],[23,117],[546,656],[696,114],[601,445],[323,464],[6,269],[1025,182],[1039,108],[611,654],[1039,623],[407,156],[765,165],[1,613],[663,500],[39,114],[743,314],[490,59],[493,580],[161,87],[995,70],[257,131],[973,562],[338,271],[866,216],[411,319],[817,382],[897,529],[924,123],[507,230],[131,346],[43,602],[471,602],[451,7],[145,646],[120,234],[138,32],[676,72],[487,285],[994,219],[270,584],[968,248],[968,416],[389,96],[198,441],[725,433],[841,478],[110,100],[124,412],[694,111],[509,196],[389,549],[918,143],[864,187],[570,473],[511,77],[907,563],[200,51],[30,95],[484,170],[832,497],[985,218],[821,60],[337,388],[4,399],[543,465],[584,433],[996,158],[388,303],[445,59],[124,321],[117,51],[976,514],[322,58],[1040,82],[380,70],[139,240],[826,122],[504,592],[81,634],[167,429],[647,267],[418,321],[488,271],[810,134],[614,468],[647,74],[19,469],[204,75],[436,518],[543,135],[714,70],[500,378],[583,161],[897,556],[619,626],[16,567],[613,106],[275,270],[236,109],[318,278],[577,619],[431,351],[416,649],[540,517],[1000,257],[104,94],[867,283],[90,3],[683,133],[536,165],[904,564],[875,574],[19,114],[154,152],[73,378],[303,440],[261,42],[631,373],[81,366],[430,255],[210,362],[832,635],[316,242],[332,181],[844,25],[367,340],[843,254],[546,163],[221,391],[79,481],[455,204],[942,358],[625,233],[456,24],[395,408],[672,285],[142,285],[719,656],[818,549],[678,28],[236,267],[365,594],[543,39],[222,610],[889,353],[642,446],[236,394],[389,260],[90,446],[3,532],[403,372],[883,71],[676,638],[642,127],[615,519],[633,418],[668,412],[605,567],[260,196],[861,388],[356,630],[616,415],[0,311],[587,215],[880,593],[659,476],[904,452],[437,523],[969,173],[173,290],[686,95],[481,317],[460,203],[301,25],[94,250],[973,625],[149,466],[848,644],[398,393],[1012,409],[499,151],[11,109],[870,224],[360,530],[951,51],[510,124],[934,136]];

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
