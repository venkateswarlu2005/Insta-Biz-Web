// Drives one rendered teddy SVG (see PupFigure): eases between poses, walks, wags, blinks, looks
// around and writes the changed attributes straight to the DOM every frame.
import { EYE_ORIGIN, EYE_Y, IDLE_MOTION, lerpPose, poseByName, poseFrame, VIEW_H, VIEW_W, type Frame, type Motion, type Pose } from './rig';

export type Facing = 1 | -1;

/** [data-p part, attribute, frame key] written each tick */
const BINDINGS: [string, 'transform' | 'opacity', keyof Frame | 'root'][] = [
  ['root', 'transform', 'root'],
  ['shadow', 'transform', 'shadow'],
  ['shadow', 'opacity', 'shadowOpacity'],
  ['body', 'transform', 'body'],
  ['body', 'opacity', 'side'],
  ['bf', 'transform', 'bf'],
  ['bf', 'opacity', 'backLegs'],
  ['bn', 'transform', 'bn'],
  ['bn', 'opacity', 'backLegs'],
  ['ff', 'transform', 'ff'],
  ['fn', 'transform', 'fn'],
  ['tail', 'transform', 'tail'],
  ['haunch', 'transform', 'haunch'],
  ['haunch', 'opacity', 'haunchOpacity'],
  ['head', 'transform', 'head'],
  ['earL', 'transform', 'earL'],
  ['earR', 'transform', 'earR'],
  ['eyes', 'transform', 'eyes'],
  ['open', 'opacity', 'openEyes'],
  ['blink', 'transform', 'blink'],
  ['happy', 'opacity', 'happyEyes'],
  ['shut', 'opacity', 'shutEyes'],
  ['tongue', 'opacity', 'tongue'],
  ['mouth', 'opacity', 'mouth'],
  ['ledge', 'opacity', 'ledge'],
];

/** exponential approach factor for a time step and time constant */
const approach = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);
const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

export class PupDriver {
  private readonly svg: SVGSVGElement;
  private readonly els = new Map<string, Element>();
  private readonly written = new Map<string, string>();
  private pose: Pose;
  private target: Pose;
  private readonly m: Motion = { ...IDLE_MOTION };
  private facing: number;
  private facingTarget: Facing;
  private turn = 0.07;
  private strideTarget = 0;
  private wagTarget = 0.35;
  private gazeTarget = { x: 0, y: 0 };
  private tilt = 0;
  private tiltTarget = 0;
  private earV = 0;
  private nextBlink = 1.2;
  private blinkAt = -1;
  private mouthOpenUntil = 0;
  private bounce = 0;
  private bounceV = 0;
  private offset = 0;
  private offsetTarget = 0;
  private pet = 0;
  private petTarget = 0;
  private readonly lean = 0;

  constructor(svg: SVGSVGElement, pose = 'sit', facing: Facing = 1) {
    this.svg = svg;
    svg.querySelectorAll<SVGElement>('[data-p]').forEach((el) => this.els.set(el.dataset.p!, el));
    this.pose = { ...poseByName(pose) };
    this.target = this.pose;
    this.facing = facing;
    this.facingTarget = facing;
  }

  setPose(pose: string | Pose) {
    this.target = typeof pose === 'string' ? poseByName(pose) : pose;
  }

  /** snap to a pose (no easing) */
  jump(pose: string, facing?: Facing) {
    this.pose = { ...poseByName(pose) };
    this.target = poseByName(pose);
    if (facing) this.facing = this.facingTarget = facing;
  }

  /** turn around; `turn` is the easing time constant */
  face(dir: Facing, turn = 0.07) {
    this.facingTarget = dir;
    this.turn = turn;
  }

  get facingDir() {
    return this.facingTarget;
  }

  stride(amount: number) {
    this.strideTarget = clamp(amount, 0, 1);
  }

  /** move the walk cycle on by a distance (px in rig units) */
  advance(distance: number) {
    this.m.phase += (distance / 46) * Math.PI;
  }

  /** set the walk cycle from the total distance walked */
  walkedTo(distance: number) {
    this.m.phase = (distance / 46) * Math.PI;
  }

  wag(amount: number) {
    this.wagTarget = clamp(amount, 0, 1);
  }

  /** head tilt in degrees */
  cock(deg: number) {
    this.tiltTarget = deg;
  }

  /** look towards a viewport point, or straight ahead with null */
  lookAt(point: { x: number; y: number } | null) {
    if (!point) {
      this.gazeTarget = { x: 0, y: 0 };
      return;
    }
    const box = this.svg.getBoundingClientRect();
    const eyeX = this.facingTarget > 0 ? EYE_ORIGIN[0] : VIEW_W - EYE_ORIGIN[0];
    const ex = box.left + (eyeX / VIEW_W) * box.width;
    const ey = box.top + (EYE_Y / VIEW_H) * box.height;
    const dx = point.x - ex;
    const dy = point.y - ey;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, dist / 160);
    this.gazeTarget = { x: (dx / dist) * reach * this.facingTarget, y: (dy / dist) * reach };
  }

  woof(now: number) {
    this.mouthOpenUntil = now + 0.34;
    this.bounceV = -150;
    this.earV += 260;
  }

  /** flick the ears */
  jolt(strength = 1) {
    this.earV += 220 * strength;
  }

  hop(strength = 1) {
    this.bounceV = -230 * strength;
    this.earV += 200 * strength;
  }

  /** hold the mouth open for a while */
  yawn(now: number, secs = 0.9) {
    this.mouthOpenUntil = now + secs;
  }

  /** run sideways to an x offset (rig units) */
  dash(offset: number) {
    this.offsetTarget = offset;
  }

  petting(on: boolean) {
    this.petTarget = on ? 1 : 0;
  }

  reset() {
    this.offsetTarget = 0;
    this.tiltTarget = 0;
    this.petTarget = 0;
  }

  tick(dtRaw: number, now: number) {
    const dt = Math.min(dtRaw, 0.05);
    const m = this.m;
    m.time = now;
    this.pose = lerpPose(this.pose, this.target, approach(dt, 0.16));
    this.facing += (this.facingTarget - this.facing) * approach(dt, this.turn);
    m.stride += (this.strideTarget - m.stride) * approach(dt, 0.12);
    if (m.stride < 0.012 && this.strideTarget === 0) m.stride = 0;
    m.wag += (this.wagTarget - m.wag) * approach(dt, 0.4);
    m.gazeX += (this.gazeTarget.x - m.gazeX) * approach(dt, 0.07);
    m.gazeY += (this.gazeTarget.y - m.gazeY) * approach(dt, 0.07);
    this.tilt += (this.tiltTarget + 3 * m.gazeX - this.tilt) * approach(dt, 0.18);
    // springy ears and body bounce
    this.earV += (-150 * m.ear - 10 * this.earV) * dt;
    m.ear = clamp(m.ear + this.earV * dt, -28, 28);
    this.bounceV += (-260 * this.bounce - 16 * this.bounceV) * dt;
    this.bounce += this.bounceV * dt;

    const prevOffset = this.offset;
    this.offset += (this.offsetTarget - this.offset) * approach(dt, 0.2);
    if (Math.abs(this.offsetTarget - this.offset) < 0.05) this.offset = this.offsetTarget;
    const moved = Math.abs(this.offset - prevOffset);
    if (moved) this.advance(moved);
    const dashStride = dt > 0 ? Math.min(1, moved / dt / 180) : 0;

    this.pet += (this.petTarget - this.pet) * approach(dt, 0.15);

    if (now > this.nextBlink && this.pose.eyes > 0.6) {
      this.blinkAt = now;
      this.nextBlink = now + 2.2 + 3.8 * Math.random();
      if (Math.random() < 0.18) this.nextBlink = now + 0.32; // double blink
    }
    const b = (now - this.blinkAt) / 0.15;
    m.blink = b >= 0 && b <= 1 ? Math.sin(b * Math.PI) : 0;

    const pose: Pose = {
      ...this.pose,
      headRot: this.pose.headRot + this.tilt,
      bodyRot: this.pose.bodyRot + this.lean,
      bodyY: this.pose.bodyY + this.bounce,
      headY: this.pose.headY + 1.15 * this.bounce,
      mouth: now < this.mouthOpenUntil ? 1 : this.pose.mouth,
      happy: Math.max(this.pose.happy, this.pet),
    };
    const frame = poseFrame(pose, dashStride > m.stride ? { ...m, stride: dashStride } : m);
    // flip by squashing x through 0 so turning around reads as a turn
    const flip = Math.abs(this.facing) < 0.02 ? 0.02 * Math.sign(this.facing || 1) : this.facing;
    const root = `translate(${this.offset.toFixed(1)} 0) translate(${VIEW_W / 2} 0) scale(${flip.toFixed(3)} 1) translate(${-VIEW_W / 2} 0)`;
    for (const [part, attr, key] of BINDINGS) {
      const el = this.els.get(part);
      if (!el) continue;
      const value = key === 'root' ? root : String(frame[key]);
      const id = `${part}:${attr}`;
      if (this.written.get(id) !== value) {
        el.setAttribute(attr, value);
        this.written.set(id, value);
      }
    }
  }
}
