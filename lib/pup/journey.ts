// Geometry for PupJourney: finds the PupStops on the page, decides at which scroll positions Teddy
// rests at each one ("holds"), and where he is (and how big) for any scroll position in between.
import { GROUND_Y, VIEW_W } from './rig';

type Box = [left: number, top: number, right: number, bottom: number];
type Rect = { left: number; top: number; right: number; bottom: number };
type Pt = { x: number; y: number };

/** Teddy's feet in rig coordinates: the point we position him by */
export const FEET: Pt = { x: 150, y: GROUND_Y };
/** the visible part of the rig per pose (for keeping him on screen) */
const DEFAULT_BOX: Box = [48, 30, 288, 236];
const POSE_BOX: Record<string, Box> = {
  sit: [50, 26, 284, 234],
  peek: [148, 34, 280, 163],
  snug: [148, 40, 280, 163],
  bow: [58, 56, 292, 236],
};
const boxFor = (pose: string) => POSE_BOX[pose] ?? DEFAULT_BOX;
/** a peeking teddy's ledge line; on the phone lane he sinks this far below the screen edge */
const PEEK_LEDGE_Y = 159;
const PEEK_SINK = FEET.y - PEEK_LEDGE_Y;
/** part of the screen (top..bottom fraction) the stop should be in while Teddy rests there */
const PHONE_BAND: [number, number] = [0.6, 0.86];
const DESKTOP_BAND: [number, number] = [0.42, 0.78];
const PHONE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-height: 519px)';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (v: number) => v * v * (3 - 2 * v);
/** 0 → 1 smoothly as v goes from a to b */
export const ramp = (a: number, b: number, v: number) => (b === a ? +(v >= b) : smoothstep(clamp01((v - a) / (b - a))));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpBox = (a: Box, b: Box, t: number): Box => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
/** smooth max(v, floor) with a soft knee */
const softAtLeast = (v: number, floor: number, soft: number) => {
  const k = (v - floor) / soft;
  return k > 20 ? v : floor + soft * Math.log1p(Math.exp(k));
};
const softAtMost = (v: number, ceil: number, soft: number) => -softAtLeast(-v, -ceil, soft);

function bezier(p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * c1.x + c * c2.x + d * p1.x, y: a * p0.y + b * c1.y + c * c2.y + d * p1.y };
}

/** How a stop moves with scrolling: with the page, fixed on screen, or pinned inside a sticky parent. */
type Track = { kind: 'page'; top: number } | { kind: 'screen'; top: number } | { kind: 'pin'; top: number; from: number; to: number };

export type Stop = {
  /** viewport x of the rig's left edge */
  x: number;
  track: Track;
  /** scale of the rig (1 = 300px wide) */
  s: number;
  /** he sits behind scenery: hops in and out */
  behind: boolean;
  /** how far he sinks below the ledge (phone lane) */
  sink: number;
  box: Box;
};

export type StopMeta = {
  scene: HTMLElement | null;
  pose: string;
  facing: 1 | -1;
  act: string;
  /** things in the scene he glances at ([data-pup-look]) */
  looks: HTMLElement[];
  /** the moving floor for act="treadmill" ([data-treadmill]) */
  track: HTMLElement | null;
};

export type Layout = {
  /** phone mode: only lane stops plus a peeking teddy per scene, pinned to the bottom of the screen */
  lane: boolean;
  stops: Stop[];
  meta: StopMeta[];
  /** [from, to] scroll ranges in which Teddy rests at each stop */
  holds: [number, number][];
  /** scroll distance over which he eases off / onto a moving stop */
  blend: number;
  /** document y of #main (paw prints are positioned inside it) */
  mainTop: number;
};

export type Placement = {
  x: number;
  y: number;
  s: number;
  /** in front of the page content (false while hopping behind scenery) */
  front: boolean;
  airborne: boolean;
  /** stop index and progress (0..1) towards the next stop */
  k: number;
  t: number;
  /** distance walked along the current path */
  walked: number;
};

/** viewport point of the stop's feet at a scroll position */
function feetAt(stop: Stop, scroll: number): Pt {
  const tr = stop.track;
  const top =
    tr.kind === 'page' ? tr.top - scroll : tr.kind === 'screen' ? tr.top : scroll < tr.from ? tr.top - (scroll - tr.from) : scroll > tr.to ? tr.top - (scroll - tr.to) : tr.top;
  return { x: stop.x + FEET.x * stop.s, y: top + FEET.y * stop.s };
}

/** which stop we are at (t = 0) or walking from (0 < t < 1) */
export function segmentAt(holds: [number, number][], scroll: number) {
  if (!holds.length || scroll <= holds[0][1]) return { k: 0, t: 0 };
  for (let i = 0; i < holds.length - 1; i++) {
    const leave = holds[i][1];
    const reach = holds[i + 1][0];
    if (scroll < reach) return { k: i, t: clamp01((scroll - leave) / Math.max(1, reach - leave)) };
    if (scroll <= holds[i + 1][1]) return { k: i + 1, t: 0 };
  }
  return { k: holds.length - 1, t: 0 };
}

/** keep the visible part of Teddy (box at scale s, feet at x,y) inside the safe rect, with soft edges */
function keepInside(x: number, y: number, s: number, box: Box, safe: Rect, soft = 8): Pt {
  const left = (FEET.x - box[0]) * s;
  const right = (box[2] - FEET.x) * s;
  const above = (FEET.y - box[1]) * s;
  const below = (box[3] - FEET.y) * s;
  return {
    x: safe.right - safe.left > left + right ? softAtMost(softAtLeast(x, safe.left + left, soft), safe.right - right, soft) : (safe.left + safe.right) / 2 - (right - left) / 2,
    y: safe.bottom - safe.top > above + below ? softAtMost(softAtLeast(y, safe.top + above, soft), safe.bottom - below, soft) : safe.bottom - below,
  };
}

/** the sticky ancestor (if any) and how the stop travels with it */
function trackFor(el: HTMLElement, rect: DOMRect): Track {
  let sticky: HTMLElement | null = null;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).position === 'sticky') {
      sticky = p;
      break;
    }
  }
  if (!sticky) return { kind: 'page', top: rect.top + scrollY };
  const stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
  const offset = rect.top - sticky.getBoundingClientRect().top;
  // measure where the sticky box sits un-stuck
  const was = sticky.style.position;
  sticky.style.position = 'relative';
  const home = sticky.getBoundingClientRect();
  const parent = sticky.parentElement!;
  const parentBottom = parent.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(parent).paddingBottom) || 0);
  sticky.style.position = was;
  const from = home.top + scrollY - stickTop;
  const to = parentBottom + scrollY - home.height - stickTop;
  return to <= from ? { kind: 'page', top: home.top + scrollY + offset } : { kind: 'pin', top: stickTop + offset, from, to };
}

/** scroll range in which the stop sits comfortably inside the band of the safe area */
function holdRange(stop: Stop, safe: Rect, band: [number, number]): [number, number] {
  if (stop.track.kind === 'pin') return [stop.track.from, stop.track.to];
  const top = stop.track.top;
  const boxTop = top + stop.box[1] * stop.s;
  const boxBottom = top + stop.box[3] * stop.s;
  const mid = (boxTop + boxBottom) / 2;
  const h = safe.bottom - safe.top;
  let from = mid - (safe.top + band[1] * h);
  let to = mid - (safe.top + band[0] * h);
  from = Math.max(from, boxBottom - safe.bottom);
  to = Math.min(to, boxTop - safe.top);
  if (from > to) from = to = mid - (safe.top + h / 2);
  return [from, to];
}

/** Make hold ranges ordered, non-overlapping and at least `gaps[i]` of scrolling apart; open-ended at both ends. */
function spaceHolds(ranges: [number, number][], gaps: number[], maxScroll: number) {
  const holds = ranges.map(([a, b]): [number, number] => (a <= b ? [a, b] : [(a + b) / 2, (a + b) / 2]));
  if (!holds.length) return holds;
  holds[0][0] = -Infinity;
  const last = holds[holds.length - 1];
  last[1] = Infinity;
  last[0] = Math.min(last[0], maxScroll - 1);
  for (let i = 0; i < holds.length - 1; i++) {
    const cur = holds[i];
    const next = holds[i + 1];
    if (next[0] < cur[1]) {
      const mid = (cur[1] + next[0]) / 2;
      cur[1] = Math.max(cur[0], mid);
      next[0] = Math.min(next[1], mid);
      if (next[0] < cur[1]) next[0] = cur[1];
    }
    let short = (gaps[i] ?? 0) - (next[0] - cur[1]);
    if (short > 0) {
      const fromCur = Math.min(short / 2, cur[1] - cur[0]);
      const fromNext = Math.min(short / 2, next[1] - next[0]);
      cur[1] -= fromCur;
      next[0] += fromNext;
      short -= fromCur + fromNext;
      const more = Math.min(short, next[1] - next[0]);
      next[0] += more;
      short -= more;
      if (short > 0) cur[1] -= Math.min(short, cur[1] - cur[0]);
    }
  }
  for (const h of holds) if (h[1] < h[0]) h[1] = h[0];
  return holds;
}

/** Measure every PupStop (and, on phones, every scene) into a Layout. `probe` is a fixed 100svh element. */
export function measureLayout(probe: HTMLElement): Layout {
  const phone = matchMedia(PHONE_QUERY).matches;
  const width = document.documentElement.clientWidth;
  const vh = probe.getBoundingClientRect().height || innerHeight;
  const headerH = document.getElementById('site-header')?.offsetHeight ?? 76;
  const bar = document.querySelector('[data-whatsapp-bar]');
  const safe: Rect = {
    left: 10,
    top: headerH + 10,
    right: width - 10,
    bottom: vh - 10 - (bar?.getClientRects().length ? bar.getBoundingClientRect().height : 0),
  };
  const main = document.getElementById('main');
  const stops: Stop[] = [];
  const meta: StopMeta[] = [];
  const ranges: [number, number][] = [];

  const addStop = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const pose = el.dataset.pose || 'sit';
    const act = el.dataset.act ?? '';
    const unit = rect.width / VIEW_W;
    // the walking teddy is drawn a touch bigger than the resting one (not in the basket or on phones)
    const s = act === 'basket' || phone ? unit : 1.12 * unit;
    const anchor = pose === 'peek' ? { x: FEET.x, y: PEEK_LEDGE_Y } : FEET;
    const track = trackFor(el, rect);
    if (track.kind !== 'screen') track.top += anchor.y * (unit - s);
    const stop: Stop = { x: rect.left + anchor.x * (unit - s), track, s, behind: el.dataset.behind === 'true', sink: 0, box: boxFor(pose) };
    const scene = el.closest<HTMLElement>('[data-pup-scene]');
    stops.push(stop);
    meta.push({
      scene,
      pose,
      facing: el.dataset.facing === 'left' ? -1 : 1,
      act,
      looks: scene ? [...scene.querySelectorAll<HTMLElement>('[data-pup-look]')] : [],
      track: act === 'treadmill' ? (scene?.querySelector<HTMLElement>('[data-treadmill]') ?? null) : null,
    });
    let range = holdRange(stop, safe, phone ? PHONE_BAND : DESKTOP_BAND);
    // desktop: leave a stop inside a scene before the scene scrolls away
    if (!phone && scene && stop.track.kind === 'page' && act !== 'basket' && act !== 'peekaboo') {
      const h = safe.bottom - safe.top;
      const sceneStart = scene.getBoundingClientRect().top + scrollY - safe.top + 0.08 * h;
      const stillVisible = stop.track.top + stop.box[3] * stop.s - safe.bottom;
      if (range[1] > sceneStart) {
        const leave = Math.max(sceneStart, stillVisible + 0.12 * h);
        range = [Math.max(stillVisible, leave - Math.max(range[1] - range[0], 0.2 * h)), leave];
      }
    }
    ranges.push(range);
  };

  const all = [...document.querySelectorAll<HTMLElement>('[data-pup-stop]')].filter((el) => el.getClientRects().length);
  if (phone) {
    // phones: first lane stop, then Teddy peeks up from the bottom edge (alternating sides) in each scene, then the last lane stop
    const lane = all.filter((el) => el.dataset.lane === 'true');
    const first = lane[0];
    const final = lane.length > 1 ? lane[lane.length - 1] : undefined;
    if (first) addStop(first);
    const firstScene = meta[0]?.scene ?? null;
    const scenes = [...document.querySelectorAll<HTMLElement>('#main [data-pup-scene]')].filter((el) => el !== firstScene && el.getClientRects().length);
    const s = Math.min(0.62, Math.max(0.5, width / 650));
    const box = boxFor('peek');
    scenes.forEach((scene, i) => {
      const fromLeft = i % 2 === 0;
      const x = fromLeft ? safe.left + 2 - box[0] * s : safe.right - 2 - box[2] * s;
      stops.push({ x, track: { kind: 'screen', top: 0 }, s, behind: false, sink: PEEK_SINK, box });
      meta.push({ scene, pose: 'peek', facing: fromLeft ? 1 : -1, act: 'lane', looks: [], track: null });
      const r = scene.getBoundingClientRect();
      const from = r.top + scrollY - 0.42 * vh;
      const to = r.bottom + scrollY - 0.58 * vh;
      ranges.push(from <= to ? [from, to] : [(from + to) / 2, (from + to) / 2]);
    });
    if (final) addStop(final);
  } else all.forEach(addStop);

  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  // minimum scroll distance per walk, from how far apart the stops are
  const gaps = stops.slice(1).map((next, i) => {
    const prev = stops[i];
    const minGap = (phone ? 0.32 : 0.5) * vh;
    const dx = Math.abs(next.x + FEET.x * next.s - (prev.x + FEET.x * prev.s));
    return Math.min(1.4 * vh, Math.max(minGap, 1.15 * Math.hypot(dx, (DESKTOP_BAND[1] - DESKTOP_BAND[0]) * vh)));
  });
  return {
    lane: phone,
    stops,
    meta,
    holds: spaceHolds(ranges, gaps, maxScroll),
    blend: 0.12 * vh,
    mainTop: main ? main.getBoundingClientRect().top + scrollY : 0,
  };
}

/** a gentle S-curve path between two feet positions, kept inside the safe area */
function walkPath(a: Pt, b: Pt, safe: Rect) {
  const dx = b.x - a.x;
  const reach = Math.max(0.45 * Math.abs(dx), 0);
  const dir = dx >= 0 ? 1 : -1;
  let c1 = { x: a.x + dir * reach, y: a.y };
  let c2 = { x: b.x - dir * reach, y: b.y };
  const minSwing = 0.14 * (safe.right - safe.left);
  if (Math.abs(dx) < minSwing) {
    // nearly straight down: swing out towards the roomier side
    const swing = ((a.x + b.x) / 2 < (safe.left + safe.right) / 2 ? 1 : -1) * (minSwing - Math.abs(dx)) * 0.9;
    c1 = { x: c1.x + swing, y: lerp(a.y, b.y, 0.2) };
    c2 = { x: c2.x + swing, y: lerp(a.y, b.y, 0.8) };
  }
  const inside = (p: Pt) => ({ x: Math.min(safe.right, Math.max(safe.left, p.x)), y: Math.min(safe.bottom, Math.max(safe.top, p.y)) });
  return { p0: a, c1: inside(c1), c2: inside(c2), p1: b };
}

type Path = ReturnType<typeof walkPath>;

function pathLength(path: Path, upTo: number) {
  let length = 0;
  let prev = path.p0;
  const steps = Math.max(1, Math.ceil(32 * clamp01(upTo)));
  for (let i = 1; i <= steps; i++) {
    const p = bezier(path.p0, path.c1, path.c2, path.p1, (i / steps) * clamp01(upTo));
    length += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return length;
}

/** Where Teddy is at a scroll position. */
export function placeAt(stops: Stop[], holds: [number, number][], scroll: number, opts: { safe: Rect; blend: number }): Placement {
  const { k, t: seg } = segmentAt(holds, scroll);
  if (seg <= 0 || k >= stops.length - 1) {
    const stop = stops[k];
    const feet = feetAt(stop, scroll);
    const p = keepInside(feet.x, feet.y, stop.s, stop.box, opts.safe);
    return { x: p.x, y: p.y, s: stop.s, front: !stop.behind, airborne: false, k, t: 0, walked: 0 };
  }
  const from = stops[k];
  const to = stops[k + 1];
  const leave = holds[k][1];
  const reach = holds[k + 1][0];
  const span = Math.max(1, reach - leave);
  const v = clamp01((scroll - leave) / span);
  const start = feetAt(from, leave);
  const end = feetAt(to, reach);
  const path = walkPath({ x: start.x, y: start.y - from.sink * from.s }, { x: end.x, y: end.y - to.sink * to.s }, opts.safe);
  const eased = v * v * v * (v * (6 * v - 15) + 10); // smootherstep
  const p = bezier(path.p0, path.c1, path.c2, path.p1, eased);
  const s = lerp(from.s, to.s, smoothstep(clamp01(v / 0.65)));
  // follow a stop that keeps moving (pinned / screen) while leaving or reaching it
  const edge = Math.min(0.3, Math.max(0.06, opts.blend / span));
  const followFrom = 1 - ramp(0, edge, v);
  const followTo = ramp(1 - edge, 1, v);
  let y = p.y + followFrom * (feetAt(from, scroll).y - start.y) + followTo * (feetAt(to, scroll).y - end.y);
  const x = p.x;
  y += from.sink * from.s * (1 - ramp(0, 0.22, v)) + to.sink * to.s * ramp(0.78, 1, v);
  // hop out of / into scenery he sits behind
  let airborne = false;
  if (from.behind && v < 0.36) {
    y -= Math.sin((v / 0.36) * Math.PI) * Math.min(64 * from.s, 72);
    airborne = v < 0.32;
  }
  if (to.behind && v > 0.68) {
    y -= Math.sin(((v - 0.68) / 0.32) * Math.PI) * Math.min(56 * to.s, 60);
    airborne = true;
  }
  if (from.sink && v < 0.2) airborne = true;
  const front = !((from.behind && v < 0.12) || (to.behind && v > 0.92));
  const box =
    v < 0.5
      ? lerpBox(from.box, DEFAULT_BOX, ramp(0, from.sink ? 0.22 : from.behind ? 0.36 : 0.06, v))
      : lerpBox(DEFAULT_BOX, to.box, ramp(to.sink ? 0.78 : to.behind ? 0.68 : 0.94, 1, v));
  const kept = keepInside(x, y, s, box, opts.safe);
  return { x: kept.x, y: kept.y, s, front, airborne, k, t: v, walked: pathLength(path, eased) };
}

/**
 * Once scrolling stops, don't leave Teddy mid-hop over scenery: return the scroll position to use,
 * snapped to the nearest end of a hop phase.
 */
export function settledScroll(stops: Stop[], holds: [number, number][], scroll: number) {
  const { k, t } = segmentAt(holds, scroll);
  if (t <= 0 || k >= stops.length - 1) return scroll;
  const from = stops[k];
  const to = stops[k + 1];
  const outEnd = from.sink ? 0.22 : 0.36 * +from.behind;
  const inStart = to.sink ? 0.78 : to.behind ? 0.68 : 1;
  let snapped = t;
  if (t < outEnd) snapped = t < outEnd / 2 ? 0 : outEnd;
  else if (t > inStart) snapped = t > (1 + inStart) / 2 ? 1 : inStart;
  return snapped === t ? scroll : holds[k][1] + snapped * (holds[k + 1][0] - holds[k][1]);
}

/** Point the walking teddy at something (and optionally say a line) while he rests in that element's scene. */
export type PupCue = { look?: Element; say?: string; secs?: number };
export const PUP_CUE_EVENT = 'pup:cue';
export function cuePup(cue: PupCue) {
  dispatchEvent(new CustomEvent<PupCue>(PUP_CUE_EVENT, { detail: cue }));
}
