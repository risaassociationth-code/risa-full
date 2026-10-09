export const BRANCH_KEYS = ["news", "activities", "team", "overview"] as const;
export type LayoutBranch = typeof BRANCH_KEYS[number];
export type PanelRect = { x: number; y: number; width: number; height: number };
export type WorkspaceLayout = { version: 1; nodes: Record<LayoutBranch, PanelRect>; panels: Record<LayoutBranch, PanelRect> };
export type PanelBounds = { width: number; height: number; minWidth: number; minHeight: number; maxWidth?: number; maxHeight?: number; minX?: number; minY?: number };
/** Nodes may float well outside the starting board; their tether keeps them in reach. */
export const NODE_BOUNDS: PanelBounds = { minX: -4000, minY: -4000, width: 9000, height: 9000, minWidth: 180, minHeight: 80, maxWidth: 320, maxHeight: 160 };

export function defaultWorkspaceLayout(): WorkspaceLayout {
  return { version: 1, nodes: {
    news: {x:410,y:58,width:220,height:88}, activities: {x:92,y:296,width:220,height:88},
    team: {x:729,y:296,width:220,height:88}, overview: {x:410,y:526,width:220,height:88},
  }, panels: Object.fromEntries(BRANCH_KEYS.map(key => [key,{x:520,y:20,width:360,height:340}])) as Record<LayoutBranch,PanelRect> };
}

export function boundRect(rect: PanelRect, bounds: PanelBounds): PanelRect {
  const width=Math.min(bounds.width, bounds.maxWidth??bounds.width, Math.max(Math.min(bounds.minWidth,bounds.width),rect.width));
  const height=Math.min(bounds.height, bounds.maxHeight??bounds.height, Math.max(Math.min(bounds.minHeight,bounds.height),rect.height));
  return {width,height,x:Math.max(bounds.minX??0,Math.min(bounds.width-width,rect.x)),y:Math.max(bounds.minY??0,Math.min(bounds.height-height,rect.y))};
}

export function intersects(a: PanelRect, b: PanelRect) {
  return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
}

/** Only known finite rectangles are accepted; preferences cannot supply styles or content. */
export function parseWorkspaceLayout(raw: string | null): WorkspaceLayout | null {
  if (!raw || raw.length > 20000) return null;
  try {
    const value=JSON.parse(raw);
    if(value?.version !== 1)return null;
    const out=defaultWorkspaceLayout();
    for(const kind of ["nodes","panels"] as const)for(const key of BRANCH_KEYS){
      const rect=value[kind]?.[key];
      if(!rect || !["x","y","width","height"].every(field=>typeof rect[field]==="number" && Number.isFinite(rect[field])))return null;
      if(rect.x<-4000||rect.y<-4000||rect.width<1||rect.height<1||rect.x>5000||rect.y>5000||rect.width>4000||rect.height>4000)return null;
      out[kind][key]=boundRect(rect,kind==="nodes"?NODE_BOUNDS:{minX:-4000,minY:-4000,width:9000,height:9000,minWidth:240,minHeight:180,maxWidth:1000,maxHeight:800});
    }
    // The centre prompt is a circle (centre 520,346, radius 112).
    const coversCore=(r:PanelRect)=>Math.hypot(Math.max(r.x,Math.min(520,r.x+r.width))-520,Math.max(r.y,Math.min(346,r.y+r.height))-346)<112;
    for(const key of BRANCH_KEYS){if(coversCore(out.nodes[key]))return null;for(const other of BRANCH_KEYS)if(other!==key&&intersects(out.nodes[key],out.nodes[other]))return null;}
    return out;
  } catch { return null; }
}

export function resolveCollisions(
  nodes: Record<LayoutBranch, PanelRect>, 
  active: LayoutBranch | null, 
  panels: Record<LayoutBranch, PanelRect>,
  nodeBounds: PanelBounds,
  primaryNode: LayoutBranch | null
): Record<LayoutBranch, PanelRect> {
  const nextNodes = { ...nodes } as Record<LayoutBranch, PanelRect>;
  for (const k of BRANCH_KEYS) nextNodes[k] = { ...nodes[k] };
  const center = {x: 408, y: 234, width: 224, height: 224};
  
  const getAttached = (k: LayoutBranch) => {
    const n = nextNodes[k];
    const w = Math.max(300, panels[k].width);
    const h = Math.max(260, panels[k].height);
    const left = n.x + n.width/2 < 460;
    return {x: left ? n.x - 72 - w : n.x + n.width + 72, y: n.y + n.height/2 - h/2, width: w, height: h};
  };

  const push = (a: PanelRect, b: PanelRect, weightA: number, weightB: number) => {
    if (!intersects(a, b)) return;
    const pad = 16;
    const cxA = a.x + a.width/2, cyA = a.y + a.height/2;
    const cxB = b.x + b.width/2, cyB = b.y + b.height/2;
    const hw = (a.width + b.width) / 2 + pad;
    const hh = (a.height + b.height) / 2 + pad;
    const dx = cxB - cxA;
    const dy = cyB - cyA;
    const ox = hw - Math.abs(dx);
    const oy = hh - Math.abs(dy);
    
    if (ox > 0 && oy > 0) {
      let px = 0, py = 0;
      if (ox < oy) px = dx > 0 ? ox : -ox;
      else py = dy > 0 ? oy : -oy;
      
      const tw = weightA + weightB;
      if (tw > 0) {
        if (weightA > 0) { a.x -= px * (weightA / tw); a.y -= py * (weightA / tw); }
        if (weightB > 0) { b.x += px * (weightB / tw); b.y += py * (weightB / tw); }
      }
    }
  };

  for (let iter = 0; iter < 12; iter++) {
    let changed = false;
    const snap = JSON.stringify(nextNodes);
    
    if (active) {
      const p = getAttached(active);
      for (const k of BRANCH_KEYS) {
        if (k === active) continue;
        push(p, nextNodes[k], 0, k === primaryNode ? 0 : 1);
      }
    }
    
    for (const k of BRANCH_KEYS) push(center, nextNodes[k], 0, k === primaryNode ? 0 : 1);
    
    for (let i = 0; i < BRANCH_KEYS.length; i++) {
      for (let j = i + 1; j < BRANCH_KEYS.length; j++) {
        const ki = BRANCH_KEYS[i];
        const kj = BRANCH_KEYS[j];
        push(nextNodes[ki], nextNodes[kj], ki === primaryNode ? 0 : 1, kj === primaryNode ? 0 : 1);
      }
    }
    
    for (const k of BRANCH_KEYS) nextNodes[k] = boundRect(nextNodes[k], nodeBounds);
    
    if (snap === JSON.stringify(nextNodes)) break;
  }
  
  return nextNodes;
}
