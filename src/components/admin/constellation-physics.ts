import type { PanelRect } from "./constellation-layout";

/** Zero-gravity simulation for the Cosmic Board: inertia, elastic tethers and bouncing collisions. */
export const ANCHOR = { x: 520, y: 346 };
export const CORE_RADIUS = 112;
/** Rope pays out freely up to this length, so a node can drift far away and still stay tethered. */
export const TETHER_LENGTH = 1600;
/** Record tabs hang off their node on a longer rope so they can be parked well away from the map. */
export const PANEL_TETHER_LENGTH = 1800;
const TETHER_STIFFNESS = 9;
const TETHER_DAMPING = 2.4;
const DAMPING = 0.5;
const RESTITUTION = 0.8;
const PAD = 14;
const MAX_SPEED = 2600;
const LIMIT = { minX: -4000, minY: -4000, maxX: 5000, maxY: 5000 };

export type Vec = { x: number; y: number };
/** A moving rectangle. `invMass` 0 = immovable (e.g. while held by the pointer). */
export type Body = { id: string; rect: PanelRect; invMass: number };
/** A rope between two bodies, or from the central core when `from` is null. */
export type Tether = { from: string | null; to: string; length: number };

export function tetherState(rect: PanelRect, anchor: Vec = ANCHOR, length = TETHER_LENGTH) {
  const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
  const dx = cx - anchor.x, dy = cy - anchor.y;
  const d = Math.hypot(dx, dy) || 1;
  return { cx, cy, dx, dy, d, taut: d >= length };
}

/** Point where the ray from the rectangle centre towards (tx,ty) leaves the rectangle. */
export function edgePoint(rect: PanelRect, tx: number, ty: number): Vec {
  const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
  const dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const s = Math.min(dx ? rect.width / 2 / Math.abs(dx) : Infinity, dy ? rect.height / 2 / Math.abs(dy) : Infinity, 1);
  return { x: cx + dx * s, y: cy + dy * s };
}

function overlap(a: PanelRect, b: PanelRect) {
  const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
  const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
  const ox = (a.width + b.width) / 2 + PAD - Math.abs(dx);
  const oy = (a.height + b.height) / 2 + PAD - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return null;
  return ox < oy ? { nx: dx >= 0 ? 1 : -1, ny: 0, depth: ox } : { nx: 0, ny: dy >= 0 ? 1 : -1, depth: oy };
}

const centre = (r: PanelRect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });

/** Advances the world in place. Returns true once everything has come to rest. */
export function stepWorld(bodies: Body[], vel: Record<string, Vec>, tethers: Tether[], dt: number, held: string | null) {
  const byId = new Map(bodies.map(body => [body.id, body]));
  const inv = (body: Body | undefined) => (!body || body.id === held ? 0 : body.invMass);
  const v = (id: string) => (vel[id] ??= { x: 0, y: 0 });
  let active = held !== null;

  for (const tether of tethers) {
    const b = byId.get(tether.to); if (!b) continue;
    const a = tether.from ? byId.get(tether.from) : undefined;
    if (tether.from && !a) continue;
    const pa = a ? centre(a.rect) : ANCHOR, pb = centre(b.rect);
    const dx = pb.x - pa.x, dy = pb.y - pa.y, d = Math.hypot(dx, dy) || 1;
    if (d <= tether.length) continue;
    const ux = dx / d, uy = dy / d;
    const va = a ? v(a.id) : { x: 0, y: 0 }, vb = v(b.id);
    const radial = (vb.x - va.x) * ux + (vb.y - va.y) * uy;
    const pull = TETHER_STIFFNESS * (d - tether.length) + TETHER_DAMPING * Math.max(0, radial);
    const wa = inv(a), wb = inv(b);
    vb.x -= pull * ux * wb * dt; vb.y -= pull * uy * wb * dt;
    va.x += pull * ux * wa * dt; va.y += pull * uy * wa * dt;
    if (d - tether.length > 1) active = true;
  }

  const decay = Math.exp(-DAMPING * dt);
  for (const body of bodies) {
    if (body.id === held) continue;
    const bv = v(body.id), rect = body.rect;
    bv.x *= decay; bv.y *= decay;
    const speed = Math.hypot(bv.x, bv.y);
    if (speed > MAX_SPEED) { bv.x *= MAX_SPEED / speed; bv.y *= MAX_SPEED / speed; }
    rect.x += bv.x * dt; rect.y += bv.y * dt;
    if (rect.x < LIMIT.minX || rect.x + rect.width > LIMIT.maxX) { rect.x = Math.min(LIMIT.maxX - rect.width, Math.max(LIMIT.minX, rect.x)); bv.x *= -RESTITUTION; }
    if (rect.y < LIMIT.minY || rect.y + rect.height > LIMIT.maxY) { rect.y = Math.min(LIMIT.maxY - rect.height, Math.max(LIMIT.minY, rect.y)); bv.y *= -RESTITUTION; }
    if (speed > 4) active = true;
  }

  for (let iteration = 0; iteration < 4; iteration++) {
    let corrected = false;
    for (const body of bodies) {
      if (body.id === held) continue;
      const rect = body.rect;
      // The central core is a circle: push out along the line from its centre to the nearest rectangle point.
      const px = Math.max(rect.x, Math.min(ANCHOR.x, rect.x + rect.width));
      const py = Math.max(rect.y, Math.min(ANCHOR.y, rect.y + rect.height));
      let nx = px - ANCHOR.x, ny = py - ANCHOR.y;
      const dist = Math.hypot(nx, ny);
      if (dist >= CORE_RADIUS + PAD) continue;
      if (dist < 0.001) { const c = centre(rect); nx = c.x - ANCHOR.x || 1; ny = c.y - ANCHOR.y; }
      const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const depth = CORE_RADIUS + PAD - dist;
      rect.x += nx * depth; rect.y += ny * depth;
      const bv = v(body.id), vn = bv.x * nx + bv.y * ny;
      if (vn < 0) { bv.x -= (1 + RESTITUTION) * vn * nx; bv.y -= (1 + RESTITUTION) * vn * ny; }
      corrected = true;
    }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const hit = overlap(a.rect, b.rect); if (!hit) continue;
      const ia = inv(a), ib = inv(b); if (ia + ib === 0) continue;
      const share = hit.depth / (ia + ib);
      a.rect.x -= hit.nx * share * ia; a.rect.y -= hit.ny * share * ia;
      b.rect.x += hit.nx * share * ib; b.rect.y += hit.ny * share * ib;
      const va = v(a.id), vb = v(b.id);
      const rel = (vb.x - va.x) * hit.nx + (vb.y - va.y) * hit.ny;
      if (rel < 0) {
        const impulse = -(1 + RESTITUTION) * rel / (ia + ib);
        va.x -= impulse * hit.nx * ia; va.y -= impulse * hit.ny * ia;
        vb.x += impulse * hit.nx * ib; vb.y += impulse * hit.ny * ib;
      }
      corrected = true;
    }
    if (!corrected) break;
    active = true;
  }

  if (!active) for (const body of bodies) { const bv = v(body.id); bv.x = 0; bv.y = 0; }
  return !active;
}
