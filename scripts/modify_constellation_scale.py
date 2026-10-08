# -*- coding: utf-8 -*-
import re

path = '/Users/cosaque/Documents/Codex/2026-10-08/task-9/risa-admin-recovered/src/components/admin/ConstellationMap.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''              <button ref={element=>{nodeButtons.current[key]=element;}} type="button" className={`constellation-node constellation-node-${key}`} aria-expanded={active === key} aria-controls="constellation-panel" onClick={() => toggle(key)}>
                <Icon size={Math.round(26 * nodeScale)} aria-hidden />
                <span style={{ fontSize: `${nodeScale * 100}%` }}>{th ? thai : en}</span>
                <ChevronRight size={Math.round(18 * nodeScale)} aria-hidden />
              </button>'''

replacement = '''              <button ref={element=>{nodeButtons.current[key]=element;}} type="button" className={`constellation-node constellation-node-${key}`} aria-expanded={active === key} aria-controls="constellation-panel" onClick={() => toggle(key)} style={{ fontSize: `${nodeScale * 100}%`, gap: `${nodeScale * 0.75}rem` }}>
                <Icon size={Math.round(26 * nodeScale)} aria-hidden />
                <span>{th ? thai : en}</span>
                <ChevronRight size={Math.round(18 * nodeScale)} aria-hidden />
              </button>'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
