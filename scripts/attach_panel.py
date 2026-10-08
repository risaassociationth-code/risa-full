# -*- coding: utf-8 -*-
path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/admin/ConstellationMap.tsx'
s = open(path, encoding='utf-8').read()

def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)

# Escape closes with view restore
rep('if(key === "Escape")setActive(null);', 'if(key === "Escape")closeRecords();')
# Panning ignores the attached panel so its list can be scrolled/selected
rep('closest("button,a,input"))return;drag.current', 'closest("button,a,input,.constellation-attached-panel"))return;drag.current')
# Smooth camera move only during auto-fit
rep('style={{transform:`translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${fit*zoom})`}}',
    'style={{transform:`translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${fit*zoom})`,transition:easing?"transform .5s cubic-bezier(.22,.8,.25,1)":undefined}}')
# SVG may draw outside the base scene box (panel connector)
rep('<svg className="constellation-lines" viewBox="0 0 1040 660" aria-hidden="true">',
    '<svg className="constellation-lines" viewBox="0 0 1040 660" aria-hidden="true" style={{overflow:"visible"}}>')
# Connector from parent node to its panel
rep('d={`M520 346 Q ${(520+x)/2} ${(346+y)/2 + sag} ${x} ${y}`}/>;})}</g></svg>',
    'd={`M520 346 Q ${(520+x)/2} ${(346+y)/2 + sag} ${x} ${y}`}/>;})}</g>'
    '{!list&&active&&(()=>{const n=layout.nodes[active];const p=attachedRect(active);const sx=p.left?n.x:n.x+n.width;const sy=n.y+n.height/2;const ex=p.left?p.x+p.width:p.x;const ey=p.y+p.height/2;const dir=p.left?-1:1;const c=PANEL_GAP*.55;const sag=Math.min(28,Math.abs(ex-sx)*.25);'
    'return <g className={active==="news"||active==="overview"?"constellation-violet-line":"constellation-cyan-line"} fill="none" strokeWidth="2"><path d={`M${sx} ${sy} C ${sx+dir*c} ${sy+sag}, ${ex-dir*c} ${ey+sag}, ${ex} ${ey}`}/><circle cx={sx} cy={sy} r="4" fill="currentColor" stroke="none"/><circle cx={ex} cy={ey} r="4" fill="currentColor" stroke="none"/></g>;})()}'
    '</svg>')

# Attached panel rendered inside the scene, right after the nodes
old_nodes_end = '''            </WorkspacePanel>;
          })}
        </div>'''
new_nodes_end = '''            </WorkspacePanel>;
          })}
          {!list&&active&&(()=>{const p=attachedRect(active);return <div className="workspace-record-panel constellation-attached-panel" style={{position:"absolute",left:p.x,top:p.y,width:p.width,height:p.height}}>
            <aside id="constellation-panel" className="constellation-panel-content" aria-label={th?"รายการในหมวดที่เลือก":"Selected category records"}>
              <button type="button" className="constellation-close" aria-label={th?"ปิดรายการ":"Close records"} onClick={closeRecords}><X size={18} aria-hidden /></button>
              {active==="overview"?<section className="constellation-overview"><h2>{th?"ภาพรวมเนื้อหา":"Content overview"}</h2><p>{th?"รายการที่มีอยู่ในตัวแก้ไข":"Records in the existing editors"}</p><ul>{collections.map(branch=><li key={branch.key}><Link href={`/admin/${branch.key}`}>{th?branch.th:branch.en}<span>{data[branch.key].total}</span><ChevronRight size={18} aria-hidden /></Link></li>)}</ul></section>:records(active)}
            </aside>
          </div>;})()}
        </div>'''
rep(old_nodes_end, new_nodes_end)

# Remove the old floating (unattached) panel
start = s.index(':active?<WorkspacePanel className="workspace-record-panel"')
end_marker = '</WorkspacePanel>:<aside id="constellation-panel" className="sr-only">'
end = s.index(end_marker, start)
s = s[:start] + ':!active?<aside id="constellation-panel" className="sr-only">' + s[end+len(end_marker):]
rep('{th?"เลือกหมวดเพื่อแสดงรายการ":"Choose a category to see records"}</aside>}',
    '{th?"เลือกหมวดเพื่อแสดงรายการ":"Choose a category to see records"}</aside>:null}')

open(path, 'w', encoding='utf-8').write(s)
print("ok")
