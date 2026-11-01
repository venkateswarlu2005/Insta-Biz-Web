// Click tricks: each returns a timeline of [time, action] steps for a PupDriver.
import type { Facing, PupDriver } from './driver';
import { POSES, type Pose } from './rig';

export type TrickContext = {
  d: PupDriver;
  /** the pose Teddy returns to afterwards */
  rest: Pose;
  facing: Facing;
  say: (text: string, secs?: number) => void;
  hearts: () => void;
};

/** a scheduled step; the action receives the current time (seconds) */
export type Step = [at: number, run: (now: number) => void];

const flip = (f: Facing): Facing => (f === 1 ? -1 : 1);

export const TRICKS = {
  woof: ({ d, say }: TrickContext, t: number): Step[] => [
    [t, (now) => (d.woof(now), say('woof!'))],
    [t + 0.42, (now) => (d.woof(now), say('woof woof!'))],
  ],
  spin: ({ d, rest, facing, say }: TrickContext, t: number): Step[] => [
    [t, () => (d.setPose('stand'), d.hop(0.5))],
    [t + 0.14, () => d.face(flip(facing))],
    [t + 0.38, () => d.face(facing)],
    [t + 0.62, () => d.face(flip(facing))],
    [t + 0.86, () => (d.face(facing), say('wheee!'))],
    [t + 1.3, () => d.setPose(rest)],
  ],
  beg: ({ d, rest, say }: TrickContext, t: number): Step[] => [
    [t, () => (d.setPose('beg'), d.wag(1), say('treat, please?', 1.7))],
    [t + 1.9, () => (d.setPose(rest), d.wag(0.7))],
  ],
  bow: ({ d, rest, say }: TrickContext, t: number): Step[] => [
    [t, () => (d.setPose('bow'), d.wag(1), say('play with me!'))],
    [t + 0.55, () => d.hop(0.45)],
    [t + 1.7, () => (d.setPose(rest), d.wag(0.7))],
  ],
  hop: ({ d, rest, say }: TrickContext, t: number): Step[] => [
    [t, () => (d.setPose('hop'), d.hop(1.1), say('boing!'))],
    [t + 0.36, () => d.setPose(rest)],
    [t + 0.62, () => (d.setPose('hop'), d.hop(0.8))],
    [t + 0.98, () => d.setPose(rest)],
  ],
  love: ({ d, rest, say, hearts }: TrickContext, t: number): Step[] => [
    [t, () => (d.setPose({ ...rest, happy: 1, tongue: 1 }), d.wag(1), hearts(), say('I like you!', 1.5))],
    [t + 1.9, () => (d.setPose(rest), d.wag(0.7))],
  ],
  tilt: ({ d, say }: TrickContext, t: number): Step[] => [
    [t, () => (d.cock(-14), say('hm?'))],
    [t + 0.8, () => d.cock(12)],
    [t + 1.6, () => d.cock(0)],
  ],
  sneeze: ({ d, say }: TrickContext, t: number): Step[] => [
    [t, () => d.cock(-8)],
    [t + 0.32, (now) => (d.cock(10), d.jolt(1.4), d.hop(0.35), d.yawn(now, 0.22), say('achoo!'))],
    [t + 0.8, () => d.cock(0)],
  ],
  zoomies: ({ d, rest, facing, say }: TrickContext, t: number): Step[] => [
    [t, () => (d.setPose('walk'), d.wag(1), say('zoomies!', 2))],
    [t + 0.05, () => (d.face(1), d.dash(70))],
    [t + 0.5, () => (d.face(-1), d.dash(-70))],
    [t + 0.98, () => (d.face(1), d.dash(50))],
    [t + 1.4, () => (d.face(-1), d.dash(-30))],
    [t + 1.78, () => (d.face(1), d.dash(0))],
    [t + 2.25, () => (d.face(facing), d.setPose(rest), d.wag(0.7))],
  ],
  peekaboo: ({ d, say }: TrickContext, t: number): Step[] => [
    [t, () => d.setPose({ ...POSES.peek, headY: 120 })],
    [t + 0.55, () => (d.setPose('peek'), d.jolt(1.2), say('peekaboo!'))],
  ],
  wake: ({ d, rest, say }: TrickContext, t: number): Step[] => [
    [t, (now) => (d.setPose('settle'), d.yawn(now, 0.9), say('*yaaawn*'))],
    [t + 1.25, () => (d.setPose({ ...POSES.settle, happy: 1 }), d.wag(0.8), say('five more minutes…', 1.6))],
    [t + 3.1, () => (d.setPose(rest), d.wag(0), say('zzz', 2))],
  ],
};

export type TrickName = keyof typeof TRICKS;

/** tricks shuffled into a bag for ordinary clicks */
const BAG_TRICKS: TrickName[] = ['woof', 'spin', 'beg', 'bow', 'hop', 'love', 'tilt', 'sneeze'];
let bag: TrickName[] = [];

/** Next trick from a shuffled bag; four quick clicks in a row set off the zoomies. */
export function pickTrick(last: TrickName | null, clicks: number): TrickName {
  if (clicks >= 4) return 'zoomies';
  if (!bag.length) bag = BAG_TRICKS.filter((t) => t !== last).sort(() => Math.random() - 0.5);
  return bag.pop()!;
}

/** Five hearts float up from (x, y) inside `host` (which must be positioned). */
export function burstHearts(host: HTMLElement, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('span');
    heart.className = 'pup-heart';
    heart.textContent = '♥';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    host.append(heart);
    const dx = (Math.random() - 0.5) * 90;
    const dy = -70 - 60 * Math.random();
    heart
      .animate(
        [
          { transform: 'translate(-50%, 0) scale(0.4)', opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: `translate(calc(-50% + ${dx.toFixed(0)}px), ${dy.toFixed(0)}px) scale(1.1)`, opacity: 0 },
        ],
        { duration: 1150 + 110 * i, delay: 80 * i, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' },
      )
      .finished.then(
        () => heart.remove(),
        () => heart.remove(),
      );
  }
}
