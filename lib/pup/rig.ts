// The procedural teddy: SVG shapes, named poses, pose blending and the per-frame transforms.
// Everything is drawn in a 300×240 box with the feet on y=228. Ported 1:1 from the original rig.

export const VIEW_W = 300;
export const VIEW_H = 240;
/** y of the ground line the paws stand on */
export const GROUND_Y = 228;
/** y of the eye centres */
export const EYE_Y = 98;

export const COLORS = {
  ink: '#2a170e',
  fur: '#f2be6b',
  furShade: '#e4a352',
  cream: '#fbe3b4',
  blush: '#f9b9a6',
  collar: '#a24a1a',
  tongue: '#e98c8c',
  mouth: '#6b2a1c',
} as const;

type Point = readonly [number, number];

const HEAD_PIVOT: Point = [212, 100];
const BODY_PIVOT: Point = [196, 206];
export const JOINTS = {
  shoulderN: [186, 194] as Point,
  shoulderF: [168, 192] as Point,
  hipN: [110, 194] as Point,
  hipF: [94, 192] as Point,
  tailBase: [84, 150] as Point,
};
const EAR_L_PIVOT: Point = [174, 82];
const EAR_R_PIVOT: Point = [250, 82];
/** where the eyes sit (used to aim the gaze) */
export const EYE_ORIGIN = HEAD_PIVOT;

/** A fluffy ellipse: `bumps` quadratic scallops puffed out by `puff`, optionally rotated. */
function fluff(cx: number, cy: number, rx: number, ry: number, bumps: number, puff: number, start = -Math.PI / 2, rotDeg = 0) {
  const rot = (rotDeg * Math.PI) / 180;
  const at = (angle: number, out: number) => {
    const x = Math.cos(angle) * (rx + out);
    const y = Math.sin(angle) * (ry + (ry / rx) * out);
    return `${(cx + x * Math.cos(rot) - y * Math.sin(rot)).toFixed(1)} ${(cy + x * Math.sin(rot) + y * Math.cos(rot)).toFixed(1)}`;
  };
  let d = '';
  for (let i = 0; i < bumps; i++) {
    const a0 = start + (i / bumps) * Math.PI * 2;
    const a1 = start + ((i + 1) / bumps) * Math.PI * 2;
    d += `${i === 0 ? `M${at(a0, 0)}` : ''}Q${at((a0 + a1) / 2, 2.1 * puff)} ${at(a1, 0)}`;
  }
  return `${d}Z`;
}

export const SHAPES = {
  body: fluff(140, 170, 64, 36, 15, 3.4, 0.95 * Math.PI),
  chest: fluff(192, 166, 30, 32, 9, 3.2, 0.6 * Math.PI),
  tail: fluff(70, 126, 17, 16, 9, 3.2),
  tailStem: 'M86 152 C80 146 76 140 74 136',
  haunch: fluff(110, 204, 30, 24, 10, 3.2, Math.PI),
  haunchPaw: 'M112 214 C126 212 142 214 146 221 C148 226 144 229 136 229 L116 229 C108 229 104 224 106 219 Z',
  head: fluff(212, 100, 51, 46, 16, 3.6),
  topknot: fluff(212, 52, 17, 12, 8, 2.9, Math.PI),
  earL: fluff(170, 112, 19, 34, 10, 3.2, -Math.PI / 2, 12),
  earR: fluff(254, 112, 19, 34, 10, 3.2, -Math.PI / 2, -12),
  muzzle: 'M188 120 C188 106 200 100 212 100 C224 100 236 106 236 120 C236 133 225 140 212 140 C199 140 188 133 188 120 Z',
  nose: 'M204.5 111.5 Q212 107.2 219.5 111.5 Q218.2 118.4 212 120 Q205.8 118.4 204.5 111.5 Z',
  mouth: 'M212 120 V124.5 M212 124.5 Q207.2 129.6 202.8 125.2 M212 124.5 Q216.8 129.6 221.2 125.2',
  mouthOpen: 'M203 126 Q212 122 221 126 Q219 138 212 139 Q205 138 203 126 Z',
  tongue: 'M207.6 127.4 Q212 136.6 216.4 127.4 Z',
  collar: 'M178 146 Q212 162 246 146 L246 154 Q212 170 178 154 Z',
  tag: 'M212 160 C212 156 206 155 206 159.4 C206 163 212 166.6 212 168.4 C212 166.6 218 163 218 159.4 C218 155 212 156 212 160 Z',
  ledgePaws:
    'M175 159 C175 148 181 142 190 142 C199 142 205 148 205 159 Z M219 159 C219 148 225 142 234 142 C243 142 249 148 249 159 Z',
  ledgeToes: 'M186 153 v-4.5 M194 153 v-4.5 M230 153 v-4.5 M238 153 v-4.5',
  happyEyes: 'M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101',
  shutEyes: 'M186.5 97 Q194 103.5 201.5 97 M222.5 97 Q230 103.5 237.5 97',
  mouthTongue: 'M206.5 133.5 Q212 130 217.5 133.5 Q215 138 212 138 Q209 138 206.5 133.5 Z',
  haunchToes: 'M132 222v5M139 222v5',
  shadow: { cx: 150, cy: 230, rx: 92, ry: 7 },
};

/** A leg hanging from its joint at (0,0), `length` long, paw at the bottom. */
function leg(width: number, length: number) {
  const h = width / 2;
  return `M${-h} -14 C${-h} 4 -12 ${length - 18} -12 ${length - 9} C-12 ${length - 2} -7 ${length} 0 ${length} C9 ${length} 13 ${length - 3} 13 ${length - 9} C13 ${length - 18} ${h} 4 ${h} -14`;
}

export const LEGS = {
  front: leg(24, GROUND_Y - JOINTS.shoulderN[1]),
  frontFar: leg(22, GROUND_Y - JOINTS.shoulderF[1]),
  back: leg(30, GROUND_Y - JOINTS.hipN[1]),
  backFar: leg(28, GROUND_Y - JOINTS.hipF[1]),
};

/** the two toe lines drawn on a paw at the end of a leg of the given length */
export const toeLines = (length: number) => `M-3.5 ${length - 7} v5 M4.5 ${length - 7} v5`;

const BASE_POSE = {
  bodyRot: 0,
  bodyX: 0,
  bodyY: 0,
  stretch: 1,
  headX: 0,
  headY: 0,
  headRot: 0,
  earL: 0,
  earR: 0,
  tail: 0,
  /** near / far front and back leg angles */
  fn: 0,
  ff: 0,
  bn: 0,
  bf: 0,
  /** 1 = sitting on the haunch */
  sit: 0,
  /** 1 = eyes open */
  eyes: 1,
  happy: 0,
  tongue: 0,
  mouth: 0,
  /** 1 = facing the viewer over a ledge (peek / snug) */
  front: 0,
};

export type Pose = typeof BASE_POSE;
export type PoseName = 'stand' | 'walk' | 'sit' | 'peek' | 'snug' | 'lie' | 'sleep' | 'settle' | 'hop' | 'sniff' | 'bow' | 'beg';

export const POSES: Record<PoseName, Pose> = {
  stand: BASE_POSE,
  walk: { ...BASE_POSE, tail: -6, tongue: 1 },
  sit: { ...BASE_POSE, bodyRot: -24, bodyY: -2, headX: -10, headY: -6, tail: 34, sit: 1, tongue: 1 },
  peek: { ...BASE_POSE, headY: 4, earL: -6, earR: 6, tail: -20, front: 1, tongue: 1 },
  snug: { ...BASE_POSE, headY: 9, headRot: 4, earL: 3, earR: -3, tail: -20, front: 1, tongue: 0 },
  lie: { ...BASE_POSE, bodyRot: -5, bodyY: 22, headX: 12, headY: 40, headRot: 3, fn: -84, ff: -80, sit: 1, tail: 58, tongue: 0 },
  sleep: { ...BASE_POSE, bodyRot: -5, bodyY: 22, headX: 14, headY: 44, headRot: -8, fn: -84, ff: -80, sit: 1, tail: 64, eyes: 0, earL: 4, earR: -4 },
  settle: { ...BASE_POSE, bodyRot: -5, bodyY: 22, headX: 10, headY: 16, fn: -84, ff: -80, sit: 1, tail: 40, tongue: 1 },
  hop: { ...BASE_POSE, bodyRot: -9, stretch: 1.06, headY: -6, fn: -42, ff: -32, bn: 40, bf: 30, earL: -26, earR: 26, tail: -24, tongue: 1 },
  sniff: { ...BASE_POSE, bodyRot: 7, headX: 16, headY: 32, headRot: 9, tail: -14, fn: 6, ff: 4 },
  bow: { ...BASE_POSE, bodyRot: 15, bodyY: 2, headX: 14, headY: 30, fn: -58, ff: -52, tail: -32, happy: 1, tongue: 1 },
  beg: { ...BASE_POSE, bodyRot: -36, bodyY: -6, headX: -18, headY: -18, sit: 1, fn: -70, ff: -64, tail: 30, happy: 1, tongue: 1 },
};

/** Look up a pose by name; unknown names fall back to sitting (the original would crash). */
export const poseByName = (name: string): Pose => POSES[name as PoseName] ?? POSES.sit;

const POSE_KEYS = Object.keys(BASE_POSE) as (keyof Pose)[];

/** Continuous motion state layered on top of a pose. */
export type Motion = {
  /** walk cycle phase (radians) */
  phase: number;
  /** 0 = standing still, 1 = full stride */
  stride: number;
  /** seconds, drives idle breathing and the tail wag */
  time: number;
  /** 0..1 tail wag energy */
  wag: number;
  gazeX: number;
  gazeY: number;
  /** 0..1 eyelid closure */
  blink: number;
  /** ear flop offset (degrees, spring driven) */
  ear: number;
};

export const IDLE_MOTION: Motion = { phase: 0, stride: 0, time: 0, wag: 0, gazeX: 0, gazeY: 0, blink: 0, ear: 0 };

/** blend pose `from` towards `to` by `t` */
export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  const out = { ...from };
  for (const k of POSE_KEYS) out[k] = from[k] + (to[k] - from[k]) * t;
  return out;
}

const r2 = (n: number) => Math.round(100 * n) / 100;
const rotateAbout = (deg: number, [x, y]: Point) => `rotate(${r2(deg)} ${x} ${y})`;

export type Frame = ReturnType<typeof poseFrame>;

/** SVG transforms and opacities for every rig part, for a pose plus motion state. */
export function poseFrame(pose: Pose, m: Motion = IDLE_MOTION) {
  const swingA = Math.sin(m.phase);
  const swingB = Math.sin(m.phase + Math.PI);
  const swing = 20 + 10 * m.stride;
  const bob = (1 - Math.cos(2 * m.phase)) / 2;
  const walking = +(m.stride > 0.01);
  const breathe = Math.sin(2.4 * m.time) * (1 - walking);
  const bodyY = pose.bodyY - bob * (2.5 + 4 * m.stride) * walking + 0.6 * breathe;
  const bodyRot = pose.bodyRot + 1.6 * Math.sin(m.phase) * walking;
  const counter = -pose.bodyRot;
  const wagAmp = 5 + 17 * m.wag;
  const wagHz = 1.2 + 2.6 * m.wag;
  const tail = pose.tail + Math.sin(m.time * wagHz * Math.PI * 2) * wagAmp;
  const headBob = (-(1 - Math.cos(2 * m.phase - 0.7)) / 2) * (2 + 3 * m.stride) * walking + 0.9 * breathe;
  const [sNx, sNy] = JOINTS.shoulderN;
  const [sFx, sFy] = JOINTS.shoulderF;
  const [hNx, hNy] = JOINTS.hipN;
  const [hFx, hFy] = JOINTS.hipF;
  return {
    body: `translate(${r2(pose.bodyX)} ${r2(bodyY)}) ${rotateAbout(bodyRot, BODY_PIVOT)} translate(${BODY_PIVOT[0]} 0) scale(${r2(pose.stretch)} 1) translate(${-BODY_PIVOT[0]} 0)`,
    fn: `translate(${sNx} ${sNy}) rotate(${r2(pose.fn + counter + swingA * swing * walking)})`,
    ff: `translate(${sFx} ${sFy}) rotate(${r2(pose.ff + counter + swingB * swing * walking)})`,
    bn: `translate(${hNx} ${hNy}) rotate(${r2(pose.bn + swingB * swing * walking)})`,
    bf: `translate(${hFx} ${hFy}) rotate(${r2(pose.bf + swingA * swing * walking)})`,
    tail: rotateAbout(tail, JOINTS.tailBase),
    haunch: `translate(0 ${r2(-(0.06 * pose.bodyRot))})`,
    head: `translate(${r2(pose.headX)} ${r2(pose.headY + headBob)}) ${rotateAbout(pose.headRot + 1.4 * Math.sin(m.phase) * walking, HEAD_PIVOT)}`,
    earL: rotateAbout(pose.earL + m.ear + 4 * Math.sin(2 * m.phase) * walking, EAR_L_PIVOT),
    earR: rotateAbout(pose.earR - m.ear - 4 * Math.sin(2 * m.phase) * walking, EAR_R_PIVOT),
    eyes: `translate(${r2(3.4 * m.gazeX)} ${r2(2.6 * m.gazeY)})`,
    blink: `translate(0 ${r2(EYE_Y * m.blink * 0.92)}) scale(1 ${r2(1 - 0.92 * m.blink)})`,
    openEyes: r2(Math.max(0, pose.eyes - pose.happy)),
    happyEyes: r2(Math.min(pose.happy, pose.eyes)),
    shutEyes: r2(1 - pose.eyes),
    tongue: r2(pose.tongue * (1 - pose.mouth)),
    mouth: r2(pose.mouth),
    backLegs: r2(1 - pose.sit),
    haunchOpacity: r2(pose.sit * (1 - pose.front)),
    side: r2(1 - pose.front),
    ledge: r2(pose.front),
    shadow: `translate(${r2(0.6 * pose.bodyX)} 0) scale(${r2(1 - 0.05 * bob * walking)} 1)`,
    shadowOpacity: r2(0.12 * (1 - pose.front)),
  };
}
