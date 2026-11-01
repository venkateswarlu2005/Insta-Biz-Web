// Hand-drawn look of a puppy card: a wobbly photo mask, ink outline, a retrace stroke,
// a watercolour wash and 2-3 doodles, all derived from the puppy's slug so every card
// keeps the same drawing on every render (server and client). Ported from the original PuppyBrowser.

const f2 = (n: number) => n.toFixed(2);

type Pt = [number, number];
type Rand = () => number;

/** FNV-1a seed + a small PRNG, so the same slug always draws the same sketch */
function seeded(s: string): Rand {
  let h = 0x811c9dc5;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 0x1000193);
  let a = h >>> 0;
  return () => {
    let e = (a = (a + 0x6d2b79f5) >>> 0);
    e = Math.imul(e ^ (e >>> 15), 1 | e);
    return (((e ^= e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ (e >>> 14)) >>> 0) / 0x100000000;
  };
}

/** points on a wobbly circle around (50, 50) */
function blob(rand: Rand, r: number, amp: number, n = 40, start = 0, span = 2 * Math.PI): Pt[] {
  const ph = [6.28 * rand(), 6.28 * rand(), 6.28 * rand()];
  const squash = 1 + (rand() - 0.5) * 0.05;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / (span >= 2 * Math.PI ? n : n - 1)) * span;
    const d = r + amp * (0.55 * Math.sin(2 * a + ph[0]) + 0.3 * Math.sin(3 * a + ph[1]) + 0.15 * Math.sin(5 * a + ph[2]));
    pts.push([50 + Math.cos(a) * d * squash, 50 + (Math.sin(a) * d) / squash]);
  }
  return pts;
}

/** Catmull-Rom through the points, as cubic Béziers */
function smooth(pts: Pt[], closed: boolean) {
  const n = pts.length;
  const at = (i: number) => pts[closed ? (i + n) % n : Math.min(n - 1, Math.max(0, i))];
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

const WASHES = ['#f2be6b', '#f9cdbf', '#bfddf5', '#fbe3b4', '#e8c39a'];
const INKS = ['#c2622b', '#a24a1a', '#2a170e', '#d4893f'];
const KINDS = ['sparkle', 'heart', 'dashes', 'swirl', 'dots', 'paw'] as const;

export type DoodleKind = (typeof KINDS)[number];
export type Doodle = { kind: DoodleKind; x: number; y: number; rot: number; size: number; ink: string };

export type Sketch = {
  /** CSS mask-image value for the photo */
  mask: string;
  outline: string;
  retrace: string;
  wash: { d: string; dx: number; dy: number; color: string };
  tilt: number;
  doodles: Doodle[];
};

const maskUrl = (d: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="#000"/></svg>`,
  )}")`;

const cache = new Map<string, Sketch>();

export function sketchFor(slug: string): Sketch {
  const hit = cache.get(slug);
  if (hit) return hit;
  const t = seeded(slug);
  const mask = smooth(blob(t, 45.5, 2.6), true);
  const outline = smooth(blob(t, 47.8, 3.1), true);
  const from = t() * Math.PI * 2;
  const retrace = smooth(blob(t, 49, 3.4, 30, from, Math.PI * (1.15 + 0.5 * t())), false);
  const washD = smooth(blob(t, 46.5, 3.6), true);
  const wash = { d: washD, dx: (t() - 0.5) * 9, dy: 3 + 4 * t(), color: WASHES[Math.floor(t() * WASHES.length)] };
  const tilt = (t() - 0.5) * 5;
  // three arcs around the frame where doodles may sit, in random order
  const arcs = (
    [
      [0.86, 1.08],
      [1.16, 1.42],
      [-0.08, 0.16],
    ] as Pt[]
  )
    .map((z) => ({ z, k: t() }))
    .sort((a, b) => a.k - b.k)
    .map((a) => a.z);
  const count = 2 + Math.floor(2 * t());
  const doodles: Doodle[] = [];
  const used = new Set<DoodleKind>();
  for (let i = 0; i < count; i++) {
    let kind: DoodleKind = KINDS[Math.floor(t() * KINDS.length)];
    if (used.has(kind)) kind = KINDS.find((k) => !used.has(k))!;
    used.add(kind);
    const [lo, hi] = arcs[i];
    const a = Math.PI * (lo + t() * (hi - lo));
    const r = 55 + 4 * t();
    doodles.push({
      kind,
      x: 50 + Math.cos(a) * r,
      y: 50 + Math.sin(a) * r,
      rot: (t() - 0.5) * 50,
      size: 0.85 + 0.35 * t(),
      ink: INKS[Math.floor(t() * INKS.length)],
    });
  }
  const s: Sketch = { mask: maskUrl(mask), outline, retrace, wash, tilt, doodles };
  cache.set(slug, s);
  return s;
}
