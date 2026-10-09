"use client";

import { useRef, type ReactNode } from "react";
import { GripVertical, MoveDiagonal2 } from "lucide-react";
import { boundRect, type PanelRect, type PanelBounds } from "./constellation-layout";

/** Drag/resize handles never contain content actions; arrows also operate each handle. */
export function WorkspacePanel({rect,bounds,scale=1,name,th,className,children,onChange,onSelect,onGrab,onRelease}:{rect:PanelRect;bounds:PanelBounds;scale?:number;name:string;th:boolean;className:string;children:ReactNode;onChange:(rect:PanelRect)=>void;onSelect:()=>void;onGrab?:()=>void;onRelease?:()=>void}) {
  const gesture=useRef<{x:number;y:number;rect:PanelRect;resize:boolean}|null>(null);
  const update=(dx:number,dy:number,resize:boolean,base=rect)=>onChange(boundRect(resize?{...base,width:base.width+dx,height:base.height+dy}:{...base,x:base.x+dx,y:base.y+dy},bounds));
  function handle(resize:boolean){return <button type="button" className={resize?"workspace-resize-handle":"workspace-drag-handle"}
    aria-label={th?`${resize?"ปรับขนาด":"ย้าย"}${name} — ใช้ปุ่มลูกศรหรือปุ่มควบคุม`:`${resize?"Resize":"Move"} ${name} — use arrow keys or layout controls`}
    onClick={event=>{event.stopPropagation();onSelect();}}
    onPointerDown={event=>{event.stopPropagation();onSelect();onGrab?.();gesture.current={x:event.clientX,y:event.clientY,rect,resize};event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event=>{if(!gesture.current)return;event.stopPropagation();const start=gesture.current;update((event.clientX-start.x)/scale,(event.clientY-start.y)/scale,start.resize,start.rect);}}
    onPointerUp={event=>{event.stopPropagation();if(gesture.current)onRelease?.();gesture.current=null;}} onPointerCancel={()=>{if(gesture.current)onRelease?.();gesture.current=null;}}
    onKeyDown={event=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();event.stopPropagation();onSelect();update(event.key==="ArrowLeft"?-20:event.key==="ArrowRight"?20:0,event.key==="ArrowUp"?-20:event.key==="ArrowDown"?20:0,resize);}}>
    {resize?<MoveDiagonal2 size={16} aria-hidden />:<GripVertical size={16} aria-hidden />}
  </button>;}
  return <div className={`workspace-panel ${className}`} style={{left:rect.x,top:rect.y,width:rect.width,height:rect.height}}>{handle(false)}{children}{handle(true)}</div>;
}
