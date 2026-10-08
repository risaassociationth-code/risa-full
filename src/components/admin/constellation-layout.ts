export const BRANCH_KEYS = ["news", "activities", "team", "overview"] as const;
export type LayoutBranch = typeof BRANCH_KEYS[number];
export type PanelRect = { x: number; y: number; width: number; height: number };
export type WorkspaceLayout = { version: 1; nodes: Record<LayoutBranch, PanelRect>; panels: Record<LayoutBranch, PanelRect> };
export type PanelBounds = { width: number; height: number; minWidth: number; minHeight: number; maxWidth?: number; maxHeight?: number };

export function defaultWorkspaceLayout(): WorkspaceLayout {
  return { version: 1, nodes: {
    news: {x:410,y:58,width:220,height:88}, activities: {x:92,y:296,width:220,height:88},
    team: {x:729,y:296,width:220,height:88}, overview: {x:410,y:526,width:220,height:88},
  }, panels: Object.fromEntries(BRANCH_KEYS.map(key => [key,{x:520,y:20,width:360,height:340}])) as Record<LayoutBranch,PanelRect> };
}

export function boundRect(rect: PanelRect, bounds: PanelBounds): PanelRect {
  const width=Math.min(bounds.width, bounds.maxWidth??bounds.width, Math.max(Math.min(bounds.minWidth,bounds.width),rect.width));
  const height=Math.min(bounds.height, bounds.maxHeight??bounds.height, Math.max(Math.min(bounds.minHeight,bounds.height),rect.height));
  return {width,height,x:Math.max(0,Math.min(bounds.width-width,rect.x)),y:Math.max(0,Math.min(bounds.height-height,rect.y))};
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
      if(rect.x<0||rect.y<0||rect.width<1||rect.height<1||rect.x>2000||rect.y>2000||rect.width>2000||rect.height>2000)return null;
      out[kind][key]=boundRect(rect,kind==="nodes"?{width:1040,height:660,minWidth:180,minHeight:80,maxWidth:320,maxHeight:160}:{width:2000,height:2000,minWidth:240,minHeight:180,maxWidth:1000,maxHeight:800});
    }
    const center={x:408,y:234,width:224,height:224};
    for(const key of BRANCH_KEYS){if(intersects(out.nodes[key],center))return null;for(const other of BRANCH_KEYS)if(other!==key&&intersects(out.nodes[key],out.nodes[other]))return null;}
    return out;
  } catch { return null; }
}
