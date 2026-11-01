'use client';

import { cancelFrame, frame } from 'motion/react';
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { PupDriver, type Facing } from '@/lib/pup/driver';
import { COLORS, EYE_Y, GROUND_Y, LEGS, poseByName, poseFrame, SHAPES, toeLines, VIEW_H, VIEW_W } from '@/lib/pup/rig';
import { burstHearts, pickTrick, TRICKS, type Step, type TrickContext, type TrickName } from '@/lib/pup/tricks';

export type PupPose = 'sit' | 'stand' | 'walk' | 'peek' | 'snug' | 'settle' | 'beg' | 'bow' | 'hop' | 'lie' | 'sleep' | 'sniff' | (string & {});
export type PupFacing = 'left' | 'right';

export type PupBuddyProps = {
  pose?: PupPose;
  facing?: PupFacing;
  /** idle behaviour, e.g. "tilt" (keeps cocking his head) */
  act?: string;
  /** accessible description; omit for decorative teddies */
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** rendered inside a PupStop: rests while the walking teddy (PupJourney) stands in for it */
  asStop?: boolean;
};

const STROKE = { stroke: COLORS.ink, strokeWidth: 3.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const LINE = { ...STROKE, fill: 'none' } as const;

function Leg({ part, d, length, fill, transform, opacity }: { part: string; d: string; length: number; fill: string; transform: string; opacity?: number }) {
  return (
    <g data-p={part} transform={transform} opacity={opacity}>
      <path d={`${d}Z`} fill={fill} />
      <path d={d} {...LINE} />
      <path d={toeLines(length)} {...LINE} strokeWidth={2.4} />
    </g>
  );
}

function OpenEyes() {
  return (
    <>
      <ellipse cx={194} cy={EYE_Y} rx={7.4} ry={8.6} fill={COLORS.ink} />
      <ellipse cx={230} cy={EYE_Y} rx={7.4} ry={8.6} fill={COLORS.ink} />
      <circle cx={196.6} cy={EYE_Y - 3.4} r={2.7} fill="#fff" />
      <circle cx={232.6} cy={EYE_Y - 3.4} r={2.7} fill="#fff" />
      <circle cx={192} cy={EYE_Y + 3.2} r={1.2} fill="#fff" />
      <circle cx={228} cy={EYE_Y + 3.2} r={1.2} fill="#fff" />
    </>
  );
}

type FigureProps = { pose?: string; facing?: PupFacing; className?: string; label?: string; style?: CSSProperties };

/** The teddy SVG in a static pose. Every animated part carries data-p for PupDriver. */
export function PupFigure({ pose = 'sit', facing = 'right', className, label, style }: FigureProps) {
  const f = poseFrame(poseByName(pose));
  const flip = facing === 'left' ? `translate(${VIEW_W} 0) scale(-1 1)` : undefined;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ overflow: 'visible', ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
      focusable="false"
    >
      <g data-p="root" transform={flip}>
        <ellipse
          data-p="shadow"
          {...SHAPES.shadow}
          fill={COLORS.ink}
          opacity={f.shadowOpacity}
          transform={f.shadow}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <g data-p="body" transform={f.body} opacity={f.side}>
          <Leg part="bf" d={LEGS.backFar} length={GROUND_Y - 192} fill={COLORS.furShade} transform={f.bf} opacity={f.backLegs} />
          <Leg part="ff" d={LEGS.frontFar} length={GROUND_Y - 192} fill={COLORS.furShade} transform={f.ff} />
          <g data-p="tail" transform={f.tail}>
            <path d={SHAPES.tailStem} {...LINE} strokeWidth={9} />
            <path d={SHAPES.tailStem} stroke={COLORS.fur} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={SHAPES.tail} fill={COLORS.fur} {...STROKE} />
          </g>
          <Leg part="bn" d={LEGS.back} length={GROUND_Y - 194} fill={COLORS.fur} transform={f.bn} opacity={f.backLegs} />
          <path d={SHAPES.body} fill={COLORS.fur} {...STROKE} />
          <path d={SHAPES.chest} fill={COLORS.fur} {...STROKE} />
          <Leg part="fn" d={LEGS.front} length={GROUND_Y - 194} fill={COLORS.fur} transform={f.fn} />
        </g>
        <g data-p="haunch" opacity={f.haunchOpacity} transform={f.haunch}>
          <path d={SHAPES.haunch} fill={COLORS.fur} {...STROKE} />
          <path d={SHAPES.haunchPaw} fill={COLORS.fur} {...STROKE} />
          <path d={SHAPES.haunchToes} {...LINE} strokeWidth={2.4} />
        </g>
        <g data-p="head" transform={f.head}>
          <path d={SHAPES.collar} fill={COLORS.collar} {...STROKE} strokeWidth={3} />
          <path d={SHAPES.tag} fill={COLORS.cream} {...STROKE} strokeWidth={2.4} />
          <path data-p="earL" d={SHAPES.earL} fill={COLORS.furShade} {...STROKE} transform={f.earL} />
          <path data-p="earR" d={SHAPES.earR} fill={COLORS.furShade} {...STROKE} transform={f.earR} />
          <path d={SHAPES.head} fill={COLORS.fur} {...STROKE} />
          <path d={SHAPES.topknot} fill={COLORS.fur} {...STROKE} strokeWidth={3} />
          <path d={SHAPES.muzzle} fill={COLORS.cream} />
          <circle cx={181} cy={116} r={7} fill={COLORS.blush} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={COLORS.blush} opacity={0.85} />
          <g data-p="eyes" transform={f.eyes}>
            <g data-p="open" opacity={f.openEyes}>
              <g data-p="blink" transform={f.blink}>
                <OpenEyes />
              </g>
            </g>
          </g>
          <path data-p="happy" d={SHAPES.happyEyes} {...LINE} opacity={f.happyEyes} />
          <path data-p="shut" d={SHAPES.shutEyes} {...LINE} opacity={f.shutEyes} />
          <path d={SHAPES.nose} fill={COLORS.ink} />
          <path d={SHAPES.mouth} {...LINE} strokeWidth={3} />
          <path data-p="tongue" d={SHAPES.tongue} fill={COLORS.tongue} stroke={COLORS.ink} strokeWidth={2.2} strokeLinejoin="round" opacity={f.tongue} />
          <g data-p="mouth" opacity={f.mouth}>
            <path d={SHAPES.mouthOpen} fill={COLORS.mouth} {...STROKE} strokeWidth={2.6} />
            <path d={SHAPES.mouthTongue} fill={COLORS.tongue} />
          </g>
        </g>
        <g data-p="ledge" opacity={f.ledge}>
          <path d={SHAPES.ledgePaws} fill={COLORS.fur} {...STROKE} />
          <path d={SHAPES.ledgeToes} {...LINE} strokeWidth={2.4} />
        </g>
      </g>
    </svg>
  );
}

const REDUCE = '(prefers-reduced-motion: reduce)';
const subscribeReduce = (cb: () => void) => {
  const mq = matchMedia(REDUCE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
/** Like useReducedMotion, but the server render assumes "reduce": the static teddy is SSR'd and comes alive after hydration. */
const useStillTeddy = () => useSyncExternalStore(subscribeReduce, () => matchMedia(REDUCE).matches, () => true);

/** clicking a peeking / snug teddy only does tricks that work from behind a ledge */
const PEEK_TRICKS: TrickName[] = ['peekaboo', 'woof', 'tilt', 'sneeze'];
const SNUG_TRICKS: TrickName[] = ['tilt', 'love', 'sneeze', 'woof'];

const nowSecs = () => performance.now() / 1000;

/**
 * Teddy, the site mascot. Breathes, blinks and wags while on screen, follows the mouse with his eyes,
 * gets happy when petted (hover) and does a trick on every click.
 */
export function PupBuddy({ pose = 'sit', facing = 'right', act, label, className = '', style, asStop = false }: PupBuddyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const still = useStillTeddy();

  useEffect(() => {
    if (still) return;
    const root = rootRef.current!;
    const bubble = bubbleRef.current!;
    const dir: Facing = facing === 'left' ? -1 : 1;
    const driver = new PupDriver(root.querySelector('svg')!, pose, dir);
    driver.wag(0.6);

    let queue: Step[] = [];
    let last = nowSecs();
    let idleSince = last;
    let bubbleUntil = 0;
    let pointer: { x: number; y: number; t: number } | null = null;
    let lastTrick: TrickName | null = null;
    let clicks = 0;
    let lastClick = 0;
    let playing = false;
    let playingUntil = 0;

    const ctx: TrickContext = {
      d: driver,
      rest: poseByName(pose),
      facing: dir,
      say: (text, secs = 1.4) => {
        bubble.textContent = text;
        bubble.dataset.show = 'true';
        bubbleUntil = nowSecs() + secs;
      },
      hearts: () => burstHearts(root, root.clientWidth * (dir > 0 ? 0.7 : 0.3), 0.25 * root.clientHeight),
    };

    const tick = () => {
      const now = nowSecs();
      const dt = Math.min(0.05, now - last);
      last = now;
      while (queue.length && queue[0][0] <= now) queue.shift()![1](now);
      if (playing !== now < playingUntil) {
        playing = !playing;
        root.toggleAttribute('data-playing', playing);
      }
      driver.lookAt(pointer && now - pointer.t < 3 ? pointer : null);
      if (act === 'tilt' && !queue.length) driver.cock(Math.sin(0.9 * now) > 0.35 ? 13 : Math.sin(0.9 * now) < -0.35 ? -10 : 0);
      // every ~9s of nothing, a little head tilt or a happy wag
      if (!queue.length && now - idleSince > 9) {
        idleSince = now;
        queue =
          Math.random() < 0.5
            ? TRICKS.tilt(ctx, now)
            : [
                [now, () => driver.wag(1)],
                [now + 2.2, () => driver.wag(0.6)],
              ];
      }
      if (bubble.dataset.show === 'true' && now > bubbleUntil) bubble.dataset.show = 'false';
      driver.tick(dt, now);
    };

    // only animate while visible, and not while the walking teddy stands in for this stop
    let running = false;
    const run = (on: boolean) => {
      if (asStop && document.documentElement.dataset.pup) on = false;
      if (on === running) return;
      running = on;
      if (on) {
        last = nowSecs();
        frame.update(tick, true);
      } else cancelFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => run(entry.isIntersecting));
    io.observe(root);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') pointer = { x: e.clientX, y: e.clientY, t: nowSecs() };
    };
    const onClick = () => {
      const now = nowSecs();
      clicks = now - lastClick < 0.7 ? clicks + 1 : 1;
      lastClick = now;
      const pool = pose === 'peek' ? PEEK_TRICKS : pose === 'snug' ? SNUG_TRICKS : null;
      const options = pool?.filter((t) => t !== lastTrick) ?? [];
      const trick = pool ? options[Math.floor(Math.random() * options.length)] : pickTrick(lastTrick, clicks);
      lastTrick = trick;
      driver.reset();
      queue = TRICKS[trick](ctx, now);
      playingUntil = queue[queue.length - 1][0] + 0.4;
      idleSince = now;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        driver.petting(true);
        driver.wag(1);
      }
    };
    const onLeave = () => {
      driver.petting(false);
      driver.wag(0.6);
    };

    addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('click', onClick);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      run(false);
      root.removeAttribute('data-playing');
      io.disconnect();
      removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('click', onClick);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [still, pose, facing, act, asStop]);

  return (
    <div ref={rootRef} className={`pup-buddy ${className}`} style={style} data-live={still ? undefined : ''} data-facing={facing}>
      {/* remount the SVG when motion is toggled so the driver's attribute writes are discarded */}
      <PupFigure key={String(still)} pose={pose} facing={facing} label={label} />
      <span ref={bubbleRef} aria-hidden="true" className="pup-bubble" data-show="false" />
    </div>
  );
}
