# -*- coding: utf-8 -*-
import re

path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/admin/ConstellationMap.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''<g fill="none" strokeWidth="1.5">{branches.map(branch=>{const rect=layout.nodes[branch.key];const x=rect.x+rect.width/2;const y=rect.y+rect.height/2;return <path key={branch.key} className={branch.key==="news"||branch.key==="overview"?"constellation-violet-line":"constellation-cyan-line"} d={`M520 346L${x} ${y}`}/>;})}</g>'''

replacement = '''<g fill="none" strokeWidth="1.5">{branches.map(branch=>{const rect=layout.nodes[branch.key];const x=rect.x+rect.width/2;const y=rect.y+rect.height/2;const dist = Math.sqrt((x-520)**2 + (y-346)**2);const sag = dist * 0.15;return <path key={branch.key} className={branch.key==="news"||branch.key==="overview"?"constellation-violet-line":"constellation-cyan-line"} d={`M520 346 Q ${(520+x)/2} ${(346+y)/2 + sag} ${x} ${y}`}/>;})}</g>'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
