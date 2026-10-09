import { BRANCH_KEYS, type LayoutBranch, type PanelRect } from "./constellation-layout";

/** Zero-gravity simulation for the Cosmic Board: inertia, elastic tethers and bouncing collisions. */
export const ANCHOR = { x: 520, y: 346 };
export const CORE_RADIUS = 112;
/** Rope pays out freely up to this length, so a node can drift far away and still stay tethered. */
export const TETHER_LENGTH = 470;
const TETHER_STIFFNESS = 9;
const TETHER_DAMPING = 2.4;
const DAMPING = 0.5;
const RESTITUTION = 0.8;
const PAD = 14;
const MAX_SPEED = 2600;
const LIMIT = { minX: -900, minY: -900, maxX: 1940, maxY: 1560 };

export type Vec = { x: number; y: number };
export type Velocities = Record<LayoutBranch, Vec>;

export function zeroVelocities(): Velocities {
  return Object.fromEntries(BRANCH_KEYS.map(key => [key, { x: 0, y: 0 }])) as Velocities;
}

export function tetherState(rect: PanelRect) {
  const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
  const dx = cx - ANCHOR.x, dy = cy - ANCHOR.y;
  const d = Math.hypot(dx, dy) || 1;
  return { cx, cy, dx, dy, d, taut: d >= TETHER_LENGTH };
}

function bounce(v: Vec, nx: number, ny: number) {
  const vn = v.x * nx + v.y * ny;
  if (vn < 0) { v.x -= (1 + RESTITUTION) * vn * nx; v.y -= (1 + RESTITUTION) * vn * ny; }
}

/** Minimum-axis separation between two padded rectangles; null when they do not touch. */
function overlap(a: PanelRect, b: PanelRect) {
  const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
  const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
  const ox = (a.width + b.width) / 2 + PAD - Math.abs(dx);
  const oy = (a.height + b.height) / 2 + PAD - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return null;
  return ox < oy ? { nx: dx >= 0 ? 1 : -1, ny: 0, depth: ox } : { nx: 0, ny: dy >= 0 ? 1 : -1, depth: oy };
}

export function stepPhysics(
  input: Record<LayoutBranch, PanelRect>,
  vel: Velocities,
  dt: number,
  options: { held: LayoutBranch | null; obstacles: PanelRect[] },
) {
  const nodes = Object.fromEntries(BRANCH_KEYS.map(key => [key, { ...input[key] }])) as Record<LayoutBranch, PanelRect>;
  const { held, obstacles } = options;
  let active = held !== null;
  const decay = Math.exp(-DAMPING * dt);

  for (const key of BRANCH_KEYS) {
    if (key === held) continue;
    const v = vel[key], rect = nodes[key];
    const t = tetherState(rect);
    if (t.d > TETHER_LENGTH) {
      const ux = t.dx / t.d, uy = t.dy / t.d;
      const radial = v.x * ux + v.y * uy;
      const pull = TETHER_STIFFNESS * (t.d - TETHER_LENGTH) + TETHER_DAMPING * Math.max(0, radial);
      v.x -= pull * ux * dt; v.y -= pull * uy * dt;
      if (t.d - TETHER_LENGTH > 1) active = true;
    }
    v.x *= decay; v.y *= decay;
    const speed = Math.hypot(v.x, v.y);
    if (speed > MAX_SPEED) { v.x *= MAX_SPEED / speed; v.y *= MAX_SPEED / speed; }
    rect.x += v.x * dt; rect.y += v.y * dt;
    if (rect.x < LIMIT.minX || rect.x + rect.width > LIMIT.maxX) { rect.x = Math.min(LIMIT.maxX - rect.width, Math.max(LIMIT.minX, rect.x)); v.x *= -RESTITUTION; }
    if (rect.y < LIMIT.minY || rect.y + rect.height > LIMIT.maxY) { rect.y = Math.min(LIMIT.maxY - rect.height, Math.max(LIMIT.minY, rect.y)); v.y *= -RESTITUTION; }
    if (speed > 4) active = true;
  }

  for (let iteration = 0; iteration < 4; iteration++) {
    let corrected = false;
    for (const key of BRANCH_KEYS) {
      if (key === held) continue;
      const rect = nodes[key];
      // Central core is a circle: push out along the line from its centre to the nearest rectangle point.
      const px = Math.max(rect.x, Math.min(ANCHOR.x, rect.x + rect.width));
      const py = Math.max(rect.y, Math.min(ANCHOR.y, rect.y + rect.height));
      let nx = px - ANCHOR.x, ny = py - ANCHOR.y;
      let dist = Math.hypot(nx, ny);
      if (dist < CORE_RADIUS + PAD) {
        if (dist < 0.001) { const t = tetherState(rect); nx = t.dx; ny = t.dy; dist = 0; }
        const len = Math.hypot(nx, ny) || 1;
        nx /= len; ny /= len;
        const depth = CORE_RADIUS + PAD - dist;
        rect.x += nx * depth; rect.y += ny * depth;
        bounce(vel[key], nx, ny);
        corrected = true;
      }
      for (const obstacle of obstacles) {
        const hit = overlap(obstacle, rect);
        if (!hit) continue;
        rect.x += hit.nx * hit.depth; rect.y += hit.ny * hit.depth;
        bounce(vel[key], hit.nx, hit.ny);
        corrected = true;
      }
    }
    for (let i = 0; i < BRANCH_KEYS.length; i++) for (let j = i + 1; j < BRANCH_KEYS.length; j++) {
      const ka = BRANCH_KEYS[i], kb = BRANCH_KEYS[j];
      const a = nodes[ka], b = nodes[kb];
      const hit = overlap(a, b);
      if (!hit) continue;
      const ia = ka === held ? 0 : 1, ib = kb === held ? 0 : 1;
      if (ia + ib === 0) continue;
      const share = hit.depth / (ia + ib);
      a.x -= hit.nx * share * ia; a.y -= hit.ny * share * ia;
      b.x += hit.nx * share * ib; b.y += hit.ny * share * ib;
      const va = vel[ka], vb = vel[kb];
      const rel = (vb.x - va.x) * hit.nx + (vb.y - va.y) * hit.ny;
      if (rel < 0) {
        const impulse = -(1 + RESTITUTION) * rel / (ia + ib);
        if (ia) { va.x -= impulse * hit.nx; va.y -= impulse * hit.ny; }
        if (ib) { vb.x += impulse * hit.nx; vb.y += impulse * hit.ny; }
      }
      corrected = true;
    }
    if (!corrected) break;
    active = true;
  }

  if (!active) for (const key of BRANCH_KEYS) { vel[key].x = 0; vel[key].y = 0; }
  return { nodes, settled: !active };
}
