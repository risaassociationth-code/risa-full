"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, ChevronRight, FileText, LayoutList, Map, Minus, Plus, RotateCcw, Search, Sparkles, UsersRound, X } from "lucide-react";
import { useAdminLanguage } from "./AdminLanguage";
import { WorkspacePanel } from "./WorkspacePanel";
import { boundRect, defaultWorkspaceLayout, parseWorkspaceLayout, type PanelRect, type PanelBounds, NODE_BOUNDS, BRANCH_KEYS, type WorkspaceLayout } from "./constellation-layout";
import { ANCHOR, CORE_RADIUS, PANEL_TETHER_LENGTH, TETHER_LENGTH, edgePoint, stepWorld, tetherState, type Body, type Tether, type Vec } from "./constellation-physics";

/** Record tabs float freely in map space; size limits keep them readable. */
const PANEL_BOUNDS: PanelBounds = { minX: -4000, minY: -4000, width: 9000, height: 9000, minWidth: 300, minHeight: 260, maxWidth: 900, maxHeight: 800 };

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
/** Star positions as viewport percentages so the sky always fills the visible area at any zoom/pan. */
const stars: [number, number][] = [[32.38,15.08],[65.09,7.24],[53.59,36.57],[5.80,50.74],[3.75,43.36],[6.99,9.07],[42.45,82.69],[12.38,22.32],[62.74,94.77],[57.71,39.67],[97.63,4.66],[85.85,28.96],[14.43,11.78],[30.85,81.61],[18.07,58.16],[63.89,37.24],[54.77,6.28],[5.96,20.60],[68.04,42.76],[31.41,58.56],[45.32,29.98],[79.44,69.90],[24.41,57.44],[52.52,87.51],[72.94,28.79],[98.02,11.81],[41.81,75.71],[15.20,48.90],[3.92,66.82],[76.46,57.30],[87.55,31.37],[69.53,59.44],[57.99,45.62],[84.00,94.47],[47.41,66.42],[6.07,70.15],[64.71,99.31],[82.19,28.46],[38.58,66.87],[2.26,46.17],[16.80,11.71],[5.90,76.82],[12.93,24.76],[39.09,87.14],[8.06,44.92],[54.94,88.34],[81.93,86.40],[27.84,41.53],[35.88,88.42],[95.77,15.09],[17.62,23.20],[23.33,48.50],[58.91,26.27],[0.41,41.89],[36.93,56.63],[95.31,69.05],[51.55,61.76],[67.62,5.40],[89.95,78.00],[87.45,79.79],[39.24,39.90],[10.35,63.43],[6.22,6.73],[20.88,16.23],[34.01,5.26],[0.02,15.13],[10.15,36.36],[2.55,87.43],[61.41,14.86],[25.23,34.74],[36.42,12.28],[84.89,99.31],[46.60,48.38],[8.59,10.22],[34.26,26.48],[82.89,16.14],[2.31,95.10],[52.83,14.66],[54.32,2.70],[52.81,97.85],[86.33,69.62],[26.11,36.67],[16.70,77.19],[53.26,77.91],[32.97,22.30],[81.15,98.49],[85.26,80.61],[81.83,73.99],[22.67,51.76],[35.56,2.90],[2.79,27.94],[25.92,69.25],[95.65,44.72],[93.70,98.80],[95.50,36.46],[22.05,22.68],[19.67,20.44],[62.41,90.03],[84.04,47.95],[65.30,79.96],[8.48,66.06],[90.98,78.23],[75.01,47.80],[17.85,78.91],[33.25,80.08],[97.17,39.58],[40.14,94.68],[72.48,17.00],[12.70,15.12],[90.49,80.65],[14.62,82.65],[98.03,65.73],[35.04,54.87],[13.10,1.42],[97.09,64.97],[52.66,93.36],[43.38,87.17],[82.62,21.10],[25.18,29.30],[24.05,58.64],[25.94,41.90],[13.11,91.00],[35.38,45.82],[58.33,90.43],[42.06,91.77],[50.16,53.18],[52.35,1.87],[44.01,18.31],[0.39,79.92],[17.23,47.35],[72.52,55.65],[32.60,51.83],[55.54,78.43],[10.61,56.03],[24.85,27.69],[77.23,50.77],[56.17,76.00],[91.25,44.32],[61.25,50.56],[51.22,69.27],[45.23,53.33],[47.80,94.15],[69.92,87.65],[94.22,25.96],[55.95,94.33],[84.00,13.71],[12.16,44.21],[7.25,24.06],[7.31,66.95],[78.39,89.70],[15.44,71.61],[66.03,14.30],[88.28,96.75],[21.96,95.25],[39.83,48.73],[98.99,83.24],[16.15,43.15],[51.56,33.91],[19.57,31.85],[72.22,1.95],[55.41,44.05],[1.81,33.15],[62.39,51.23],[6.43,98.51],[78.84,97.17],[10.48,26.56],[3.96,77.90],[27.04,12.96],[42.23,91.14],[81.90,25.86],[14.94,91.92],[57.06,70.04],[8.95,5.75],[68.82,42.53],[7.24,93.83],[63.44,80.16],[8.37,85.62],[6.66,86.28],[45.38,33.92],[55.31,92.67],[26.79,12.92],[52.69,23.84],[10.95,16.14],[5.04,20.18],[31.20,30.50],[75.95,29.00],[50.01,17.79],[34.70,1.82],[25.04,1.53],[73.31,55.10],[18.95,47.48],[93.46,10.63],[81.89,43.22],[49.50,83.46],[39.31,50.67],[68.77,98.24],[34.27,83.23],[70.67,63.60],[40.47,34.76],[5.44,12.98],[7.07,74.09],[25.56,16.32],[8.45,84.13],[87.05,67.05],[28.19,24.22],[29.31,45.95],[15.75,44.58],[26.32,96.18],[97.26,54.71],[24.44,96.57],[30.95,35.66],[0.11,38.16],[47.46,50.28],[20.10,50.47],[0.50,26.42],[8.98,39.95],[4.17,2.25],[30.42,23.28],[58.56,52.92],[75.05,65.75],[71.60,87.91],[38.95,32.61],[98.47,14.95],[72.42,64.32],[4.38,83.53],[89.19,62.73],[73.39,81.22],[13.93,52.38],[50.44,83.49],[80.47,82.64],[58.41,89.28],[68.29,69.33],[22.99,3.12],[13.31,36.07],[10.49,83.58],[55.85,62.78],[62.62,68.07],[48.93,0.33],[79.77,74.83],[50.30,53.52],[65.93,6.61],[73.68,25.22],[7.44,26.56],[72.93,20.52],[73.98,97.57],[49.39,38.26],[47.90,68.37],[76.70,61.70],[64.28,7.75],[14.74,25.39],[74.32,30.44],[56.78,1.25],[6.07,26.88],[67.20,69.22],[67.57,29.09],[51.65,46.47],[46.63,11.85],[89.37,19.93],[97.81,93.63],[1.75,45.90],[81.99,96.81],[44.95,26.87],[20.98,94.56],[21.07,58.15],[14.17,52.41],[95.27,13.26],[82.02,50.87],[88.69,70.33],[23.14,89.77],[48.61,2.48],[0.36,49.17],[45.08,30.20],[14.07,34.40],[31.61,84.02],[0.17,75.07],[83.91,12.00],[92.64,71.30],[90.16,28.98],[37.22,39.29],[99.88,58.92],[36.07,42.81],[27.52,4.83],[10.17,83.47],[28.56,93.56],[24.93,26.57],[51.10,18.98],[37.33,95.62],[88.43,81.20],[63.09,91.34],[94.07,54.92],[71.96,4.95],[73.24,45.09],[75.27,64.45],[28.62,4.90],[92.68,12.73],[47.22,34.37],[29.78,73.90],[97.63,26.02],[65.60,30.08],[55.73,39.44],[16.73,16.17],[20.79,90.60],[49.71,22.00],[90.63,99.65],[45.00,13.96],[19.24,9.07],[34.20,9.11],[23.91,25.84],[56.96,88.73],[74.97,41.28],[41.39,52.42],[37.69,33.82],[6.21,27.75],[96.77,12.59],[50.34,62.96],[86.29,21.60],[27.10,24.85],[39.98,44.59],[95.39,84.87],[87.29,2.18]];

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
  const [viewSize, setViewSize] = useState({width: 0, height: 0});
  const [layout,setLayout] = useState(defaultWorkspaceLayout);
  const [loaded,setLoaded] = useState(false);
  const [stored,setStored] = useState(false);
  const [layoutTarget,setLayoutTarget] = useState<{kind:"nodes"|"panels";key:Branch}|null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const nodeButtons = useRef<Partial<Record<Branch,HTMLButtonElement|null>>>({});
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasFramed = useRef(false);
  const storageKey=`risa-constellation-layout:${workspaceKey}`;
  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>{try{const raw=localStorage.getItem(storageKey);const saved=parseWorkspaceLayout(raw);setLayout(saved??defaultWorkspaceLayout());if(raw&&!saved)localStorage.removeItem(storageKey);}catch{setStored(false);}setLoaded(true);});
    return ()=>window.cancelAnimationFrame(frame);
  },[storageKey]);
  useEffect(()=>{
    if (loaded && viewSize.width > 0 && fit > 0 && !hasFramed.current) {
      hasFramed.current = true;
      const pad = 60;
      let minX = 408, minY = 234, maxX = 632, maxY = 458; // core bounds
      for (const key of BRANCH_KEYS) {
        const n = layout.nodes[key];
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x + n.width > maxX) maxX = n.x + n.width;
        if (n.y + n.height > maxY) maxY = n.y + n.height;
      }
      const target = Math.min(1, viewSize.width / (maxX - minX + pad * 2), viewSize.height / (maxY - minY + pad * 2));
      const nextZoom = Math.min(2, Math.max(.3, target / fit));
      const s = fit * nextZoom;
      setZoom(nextZoom);
      setPan({x: -s * ((minX + maxX) / 2 - 520), y: -s * ((minY + maxY) / 2 - 330)});
    }
  }, [loaded, viewSize, fit, layout]);
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
  const nodeBounds=NODE_BOUNDS;
  // ── Zero-gravity physics: nodes and the open record tab keep momentum when thrown,
  // bounce off each other and drift on slack tethers (nodes → core, tab → its node).
  const layoutRef=useRef(layout);
  const activeRef=useRef<Branch|null>(null);
  const listRef=useRef(false);
  const velocity=useRef<Record<string,Vec>>({});
  const held=useRef<{id:string;rect:PanelRect;t:number}|null>(null);
  const frame=useRef<number|null>(null);
  useLayoutEffect(()=>{layoutRef.current=layout;activeRef.current=active;listRef.current=list;});
  function kick(){
    if(frame.current!==null||typeof window==="undefined")return;
    let last=performance.now();
    const tick=(now:number)=>{
      const dt=Math.min(1/30,Math.max(0.001,(now-last)/1000));last=now;
      const current=layoutRef.current;const grip=held.current;
      const open=activeRef.current&&!listRef.current?activeRef.current:null;
      const pick=(id:string,rect:PanelRect)=>({...(grip?.id===id?grip.rect:rect)});
      const bodies:Body[]=BRANCH_KEYS.map(key=>({id:key,rect:pick(key,current.nodes[key]),invMass:1}));
      const tethers:Tether[]=BRANCH_KEYS.map(key=>({from:null,to:key,length:TETHER_LENGTH}));
      if(open){bodies.push({id:"panel",rect:pick("panel",current.panels[open]),invMass:.6});tethers.push({from:open,to:"panel",length:PANEL_TETHER_LENGTH});}
      const settled=stepWorld(bodies,velocity.current,tethers,dt,grip?.id??null);
      const nodes=Object.fromEntries(BRANCH_KEYS.map((key,index)=>[key,bodies[index].rect])) as WorkspaceLayout["nodes"];
      const panelRect=open?bodies[bodies.length-1].rect:null;
      const merge=(value:WorkspaceLayout):WorkspaceLayout=>({...value,nodes,panels:open&&panelRect?{...value.panels,[open]:panelRect}:value.panels});
      layoutRef.current=merge(current);
      setLayout(merge);
      frame.current=settled?null:window.requestAnimationFrame(tick);
    };
    frame.current=window.requestAnimationFrame(tick);
  }
  useEffect(()=>()=>{if(frame.current!==null)window.cancelAnimationFrame(frame.current);},[]);
  function rectOf(id:string){const open=activeRef.current;return id==="panel"&&open?layoutRef.current.panels[open]:layoutRef.current.nodes[id as Branch];}
  function grab(id:string){held.current={id,rect:rectOf(id),t:performance.now()};velocity.current[id]={x:0,y:0};kick();}
  function release(id:string){
    const grip=held.current;if(!grip||grip.id!==id)return;
    const still=performance.now()-grip.t>90||window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(still)velocity.current[id]={x:0,y:0};
    held.current=null;kick();
  }
  function movePanel(kind:"nodes"|"panels",key:Branch,rect:PanelRect){
    const next=boundRect(rect,kind==="nodes"?nodeBounds:PANEL_BOUNDS);
    const id=kind==="panels"?"panel":key;
    const grip=held.current;
    if(grip&&grip.id===id){
      const now=performance.now();const span=Math.max(8,now-grip.t)/1000;const v=(velocity.current[id]??={x:0,y:0});
      v.x=v.x*.35+((next.x-grip.rect.x)/span)*.65;v.y=v.y*.35+((next.y-grip.rect.y)/span)*.65;
      grip.rect=next;grip.t=now;
    }
    const apply=(value:WorkspaceLayout):WorkspaceLayout=>({...value,[kind]:{...value[kind],[key]:next}});
    layoutRef.current=apply(layoutRef.current);
    setLayout(apply);
    kick();
  }
  useEffect(()=>{if(loaded&&!list)kick();},[active,list,loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  function adjustLayout(dx:number,dy:number,resize=false){if(!layoutTarget)return;const {kind,key}=layoutTarget;const rect=boundRect(layout[kind][key],kind==="nodes"?nodeBounds:PANEL_BOUNDS);movePanel(kind,key,resize?{...rect,width:rect.width+dx,height:rect.height+dy}:{...rect,x:rect.x+dx,y:rect.y+dy});}
  function resetLayout(){setLayout(defaultWorkspaceLayout());setLayoutTarget(null);reset();}
  function changeZoom(amount: number) { setZoom(value => Math.min(2, Math.max(.3, value + amount))); }
  // A newly opened tab appears beside its node, on the side facing away from the centre prompt.
  const PANEL_GAP=72;
  function spawnRect(source: WorkspaceLayout, key: Branch): PanelRect {
    const n=source.nodes[key];const cy=n.y+n.height/2;
    const w=Math.min(900,Math.max(300,source.panels[key].width));const h=Math.min(800,Math.max(260,source.panels[key].height));
    const left=n.x+n.width/2<ANCHOR.x-60;
    return {x:left?n.x-PANEL_GAP-w:n.x+n.width+PANEL_GAP,y:cy-h/2,width:w,height:h};
  }
  const prevView=useRef<{zoom:number;pan:{x:number;y:number}}|null>(null);
  const [easing,setEasing]=useState(false);
  function ease(){setEasing(true);window.setTimeout(()=>setEasing(false),520);}
  /** Zooms out just enough to show the centre prompt, the chosen node and its tab together. */
  function focusOn(key: Branch, p: PanelRect){
    const n=layoutRef.current.nodes[key];const pad=40;
    const minX=Math.min(408,n.x,p.x),minY=Math.min(234,n.y,p.y),maxX=Math.max(632,n.x+n.width,p.x+p.width),maxY=Math.max(458,n.y+n.height,p.y+p.height);
    const target=Math.min(1,viewSize.width/(maxX-minX+pad*2),viewSize.height/(maxY-minY+pad*2));
    const nextZoom=Math.min(2,Math.max(.3,target/fit));const s=fit*nextZoom;
    setZoom(nextZoom);setPan({x:-s*((minX+maxX)/2-520),y:-s*((minY+maxY)/2-330)});
  }
  function openRecords(key: Branch){
    if(!active)prevView.current={zoom,pan};
    const spawn=spawnRect(layoutRef.current,key);
    const apply=(value:WorkspaceLayout):WorkspaceLayout=>({...value,panels:{...value.panels,[key]:spawn}});
    layoutRef.current=apply(layoutRef.current);setLayout(apply);
    velocity.current.panel={x:0,y:0};
    setActive(key);ease();focusOn(key,spawn);
  }
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
      </li>)}</ul> : <p className="constellation-empty">{searching ? (th ? "ไม่พบรายการที่ค้นหา" : "No matching records") : (th ? "ยังไม่มีรายการ เริ่มต้นด้วยการเพิ่มรายการแรก" : "No records yet. Add your first record.")}</p>}
      <Link href={`/admin/${key}`} className="constellation-all">{th ? "เปิดรายการทั้งหมด" : "Open all records"}<ChevronRight size={16} aria-hidden /></Link>
    </section>;
  }

  return <section lang={locale} className="constellation-workspace">
    <div className="constellation-toolbar">
      <div className="constellation-search"><Search size={17} aria-hidden /><input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label={th ? "ค้นหารายการในแผนที่" : "Search map records"} placeholder={th ? "ค้นหารายการ…" : "Search records…"} /></div>
      <div className="flex items-center gap-2 pr-2">
        <Sparkles className="size-5 text-[#b8a4ff]" aria-hidden="true" />
        <h2 className="text-[15px] font-bold tracking-wide text-[#f4f6ff]">
          {th ? "กระดานจักรวาล" : "Cosmic Board"}
        </h2>
      </div>
    </div>
    
    <div className={`constellation-body ${list ? "constellation-list-mode" : ""}`}>
      <div ref={viewport} className="constellation-viewport" tabIndex={list ? -1 : 0} role="region" aria-label={th ? "แผนที่งาน ใช้ปุ่มลูกศรเลื่อน เครื่องหมายบวกหรือลบซูม และเลขศูนย์คืนมุมมอง" : "Task map. Arrow keys pan, plus or minus zoom, and zero resets the view."}
        onKeyDown={event => { if(event.target !== event.currentTarget)return; const key=event.key; if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-","0"].includes(key))event.preventDefault(); if(key === "+" || key === "=")changeZoom(.15);if(key === "-")changeZoom(-.15);if(key === "0")reset();if(key === "Escape")closeRecords();if(key.startsWith("Arrow"))setPan(value => ({x:value.x+(key === "ArrowLeft" ? 30 : key === "ArrowRight" ? -30 : 0),y:value.y+(key === "ArrowUp" ? 30 : key === "ArrowDown" ? -30 : 0)})); }}
        onPointerDown={event => {if((event.target as HTMLElement).closest("button,a,input,.constellation-attached-panel"))return;drag.current={x:event.clientX,y:event.clientY,panX:pan.x,panY:pan.y};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event => {if(drag.current)setPan({x:drag.current.panX+event.clientX-drag.current.x,y:drag.current.panY+event.clientY-drag.current.y});}}
        onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}}>
        <svg className="constellation-starfield" aria-hidden="true"><g fill="#c7dfff">{stars.map(([x,y],index)=><circle key={index} cx={`${x}%`} cy={`${y}%`} r={index%3===0?1.6:0.9} className="constellation-star" style={{animationDelay:`-${(index*0.37)%6}s`,animationDuration:`${3+(index%5)}s`}}/>)}</g></svg>
        <div className="constellation-scene" style={{transform:`translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${fit*zoom})`,transition:easing?"transform .5s cubic-bezier(.22,.8,.25,1)":undefined}}>
          <svg className="constellation-lines" viewBox="0 0 1040 660" aria-hidden="true" style={{overflow:"visible"}}>
            <defs><filter id="constellation-glow" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <g fill="none" filter="url(#constellation-glow)">{branches.map((branch,index)=>{
              // Slack ropes bow sideways; once fully paid out they pull straight and glow brighter.
              const n=layout.nodes[branch.key];
              const t=tetherState(n);if(t.d<=CORE_RADIUS)return null;
              const ux=t.dx/t.d,uy=t.dy/t.d;const sx=ANCHOR.x+ux*CORE_RADIUS,sy=ANCHOR.y+uy*CORE_RADIUS;
              const end=edgePoint(n,sx,sy);
              const bow=Math.min(70,Math.max(0,TETHER_LENGTH-t.d)*.14)*(index%2?1:-1);
              const mx=(sx+end.x)/2-uy*bow,my=(sy+end.y)/2+ux*bow;
              const className = `${branch.key==="news"||branch.key==="overview"?"constellation-violet-line":"constellation-cyan-line"}${t.taut?" constellation-taut":""}`;
              return <g key={branch.key} className={className}><path d={`M${sx} ${sy} Q ${mx} ${my} ${end.x} ${end.y}`}/><circle cx={sx} cy={sy} r="4" fill="currentColor" stroke="none"/><circle cx={end.x} cy={end.y} r="4" fill="currentColor" stroke="none"/></g>;
            })}</g>{!list&&active&&(()=>{
              // Tab tether: node edge → tab edge, slack bow until fully extended, then straight and bright.
              const n=layout.nodes[active],p=layout.panels[active];
              const nc={x:n.x+n.width/2,y:n.y+n.height/2},pc={x:p.x+p.width/2,y:p.y+p.height/2};
              const d=Math.hypot(pc.x-nc.x,pc.y-nc.y)||1;const taut=d>=PANEL_TETHER_LENGTH;
              const start=edgePoint(n,pc.x,pc.y),end=edgePoint(p,nc.x,nc.y);
              const ux=(pc.x-nc.x)/d,uy=(pc.y-nc.y)/d;const bow=Math.min(60,Math.max(0,PANEL_TETHER_LENGTH-d)*.18);
              const mx=(start.x+end.x)/2-uy*bow,my=(start.y+end.y)/2+ux*bow;
              return <g className={`${active==="news"||active==="overview"?"constellation-violet-line":"constellation-cyan-line"}${taut?" constellation-taut":""}`} fill="none" filter="url(#constellation-glow)"><path className={taut?"constellation-taut":undefined} d={`M${start.x} ${start.y} Q ${mx} ${my} ${end.x} ${end.y}`}/><circle cx={start.x} cy={start.y} r="4" fill="currentColor" stroke="none"/><circle cx={end.x} cy={end.y} r="4" fill="currentColor" stroke="none"/></g>;
            })()}</svg>
          <div className="constellation-center"><span className="constellation-orbit constellation-orbit-outer" aria-hidden /><span className="constellation-orbit constellation-orbit-inner" aria-hidden /><Sparkles size={32} aria-hidden /><h1>{th ? "อยากทำอะไร?" : "What would you like to do?"}</h1></div>
          {branches.map(({key,th:thai,en,icon:Icon}) => {
            const rect = layout.nodes[key];
            const nodeScale = Math.min(rect.width / 220, rect.height / 88);
            return <WorkspacePanel key={key} className={`workspace-node workspace-node-${key}`} rect={rect} bounds={nodeBounds} scale={fit*zoom} name={th?thai:en} th={th} onChange={rect=>movePanel("nodes",key,rect)} onSelect={()=>setLayoutTarget({kind:"nodes",key})} onGrab={()=>grab(key)} onRelease={()=>release(key)}>
              <button ref={element=>{nodeButtons.current[key]=element;}} type="button" className={`constellation-node constellation-node-${key}`} aria-expanded={active === key} aria-controls="constellation-panel" onClick={() => toggle(key)} style={{ fontSize: `${nodeScale * 28}px`, gap: `${nodeScale * 8}px`, padding: `0 ${nodeScale * 14}px` }}>
                <span className="constellation-node-icon" style={{ width: `${Math.round(40 * nodeScale)}px`, height: `${Math.round(40 * nodeScale)}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={Math.round(24 * nodeScale)} aria-hidden /></span>
                <span>{th ? thai : en}</span>
                <ChevronRight size={Math.round(20 * nodeScale)} aria-hidden style={{ marginLeft: 'auto' }} />
              </button>
            </WorkspacePanel>;
          })}
          {!list&&active&&(()=>{const p=layout.panels[active];const branch=branches.find(item=>item.key===active)!;return <WorkspacePanel key={`panel-${active}`} className="workspace-record-panel constellation-attached-panel workspace-floating-panel" rect={p} bounds={PANEL_BOUNDS} scale={fit*zoom} name={th?branch.th:branch.en} th={th} onChange={rect=>movePanel("panels",active,rect)} onSelect={()=>setLayoutTarget({kind:"panels",key:active})} onGrab={()=>grab("panel")} onRelease={()=>release("panel")}>
            <aside id="constellation-panel" className="constellation-panel-content" aria-label={th?"รายการในหมวดที่เลือก":"Selected category records"}>
              <button type="button" className="constellation-close" aria-label={th?"ปิดรายการ":"Close records"} onClick={closeRecords}><X size={18} aria-hidden /></button>
              {active==="overview"?<section className="constellation-overview"><h2>{th?"ภาพรวมเนื้อหา":"Content overview"}</h2><p>{th?"รายการที่มีอยู่ในตัวแก้ไข":"Records in the existing editors"}</p><ul>{collections.map(branch=><li key={branch.key}><Link href={`/admin/${branch.key}`}>{th?branch.th:branch.en}<span>{data[branch.key].total}</span><ChevronRight size={18} aria-hidden /></Link></li>)}</ul></section>:records(active)}
            </aside>
          </WorkspacePanel>;})()}
        </div>
        <div className="constellation-zoom" role="group" aria-label={th ? "มุมมองแผนที่" : "Map view"}>
          <button type="button" aria-label={th ? "ซูมออก" : "Zoom out"} disabled={zoom <= .3} onClick={()=>changeZoom(-.15)}><Minus size={18} aria-hidden /></button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label={th ? "ซูมเข้า" : "Zoom in"} disabled={zoom >= 2} onClick={()=>changeZoom(.15)}><Plus size={18} aria-hidden /></button><button type="button" aria-label={th ? "คืนมุมมอง" : "Reset view"} onClick={reset}><RotateCcw size={18} aria-hidden /></button>
        </div>
      </div>
      {list?<aside id="constellation-panel" className="constellation-list-panel"><h1 className="constellation-list-title">{th ? "เลือกงานหรือค้นหารายการ" : "Choose a task or find a record"}</h1>{collections.map(branch=>records(branch.key))}</aside>:!active?<aside id="constellation-panel" className="sr-only">{th?"เลือกหมวดเพื่อแสดงรายการ":"Choose a category to see records"}</aside>:null}
    </div>  </section>;
}
