'use client';

import { cancelFrame, frame } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { PAW_PATH } from '@/components/icons';
import { PupFigure } from '@/components/pup/PupBuddy';
import { prefersReducedMotion } from '@/lib/motion';
import { PupDriver } from '@/lib/pup/driver';
import { FEET, measureLayout, placeAt, PUP_CUE_EVENT, settledScroll, type Layout, type Placement, type PupCue, type StopMeta } from '@/lib/pup/journey';
import { POSES, VIEW_W } from '@/lib/pup/rig';
import { burstHearts, pickTrick, TRICKS, type Step, type TrickContext, type TrickName } from '@/lib/pup/tricks';

const PRINT_COUNT = 24;
/** tricks while walking between stops */
const STRAY_TRICKS = ['jump', 'woof', 'love', 'sneeze'] as const;
type StrayTrick = (typeof STRAY_TRICKS)[number];

const setData = (el: HTMLElement, key: string, value: string) => {
  if (el.dataset[key] !== value) el.dataset[key] = value;
};
const pickOther = <T,>(list: readonly T[], not: T | null) => {
  const options = list.filter((x) => x !== not);
  return options[Math.floor(Math.random() * options.length)];
};
const nowSecs = () => performance.now() / 1000;

/** cleanup of the mounted journey, so a fresh mount never runs alongside an old one */
let teardownActive: (() => void) | null = null;

/**
 * The walking teddy. When a page has two or more PupStops, the stops' own teddies are hidden
 * (html[data-pup]) and one teddy walks between them as you scroll, leaving paw prints, resting and
 * playing at each stop. Phones use a "lane": he peeks up from the bottom edge in each scene.
 * Off with reduced motion. Remounted per route, as in the original (where only the home page had it).
 */
export function PupJourney() {
  const pathname = usePathname();
  return <Journey key={pathname} />;
}

function Journey() {
  const layerRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const bubbleAtRef = useRef<HTMLSpanElement>(null);
  const printsRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    teardownActive?.();
    const layer = layerRef.current!;
    const actor = actorRef.current!;
    const body = bodyRef.current!;
    const bubble = bubbleRef.current!;
    const bubbleAt = bubbleAtRef.current!;
    const printsEl = printsRef.current!;
    const probe = probeRef.current!;
    const svg = body.querySelector('svg')!;
    const html = document.documentElement;
    const header = document.getElementById('site-header');
    const prints = [...printsEl.children] as SVGSVGElement[];

    let layout: Layout | null = null;
    let driver: PupDriver | null = null;
    let live = false;
    let remeasureTimer: ReturnType<typeof setTimeout> | undefined;
    let printIndex = 0;
    let bubbleUntil = 0;
    let pointer: { x: number; y: number; t: number } | null = null;
    let gaze: { el: Element; until: number } | null = null;

    const say = (text: string, now: number, secs = 1.4) => {
      bubble.textContent = text;
      bubble.dataset.show = 'true';
      bubbleUntil = now + secs;
    };

    let lastTime = nowSecs();
    let lastScroll = scrollY;
    let lastPos: { x: number; y: number } | null = null;
    let current: Placement | null = null;
    /** decaying correction so re-layouts and snaps never make him jump */
    const offset = { x: 0, y: 0, s: 0 };
    let stillFor = 0;
    let heldIndex = -1;
    let arrivedAt = 0;
    let lastActivity = 0;
    let queue: Step[] = [];
    let lastLook = 0;
    let lookIndex = -1;
    let treadmillLeft: number | null = null;
    let treadmillStill = 0;
    let printSegment = -1;
    let printStep = 0;
    let nextFidget = 0;
    let lastScrollAt = nowSecs();
    let scrollDir = 1;
    let wasSettled = false;
    /** phone lane: smoothed position relative to the bottom bar */
    let laneFollow: { x: number; y: number } | null = null;
    let lastBarTop = 0;
    let laneWalked = 0;
    let layerTop = 0;

    const barTop = () => {
      const bar = document.querySelector('[data-whatsapp-bar]');
      const r = bar?.getClientRects().length ? bar.getBoundingClientRect() : null;
      return r && r.height ? r.top : innerHeight - 6;
    };

    const placeFor = (l: Layout, scroll: number) => {
      if (l.lane) {
        const top = barTop();
        for (const stop of l.stops) if (stop.track.kind === 'screen') stop.track.top = top - 159 * stop.s;
      }
      const left = 10;
      const top = (header?.offsetHeight ?? 76) + 10;
      const right = html.clientWidth - 10;
      let bottom: number;
      if (l.lane) bottom = barTop() + 40;
      else {
        const bar = document.querySelector('[data-whatsapp-bar]');
        const barY = bar?.getClientRects().length ? bar.getBoundingClientRect().top : innerHeight;
        bottom = Math.min(innerHeight, barY) - 10;
      }
      return placeAt(l.stops, l.holds, scroll, { safe: { left, top, right, bottom }, blend: l.blend });
    };

    const trickContext = (meta: StopMeta): TrickContext => ({
      d: driver!,
      rest: POSES[meta.pose as keyof typeof POSES] ?? POSES.sit,
      facing: meta.facing,
      say: (text, secs) => say(text, nowSecs(), secs),
      hearts: () => {
        if (!current || !driver) return;
        burstHearts(
          layer,
          current.x - FEET.x * current.s + (driver.facingDir > 0 ? 212 : VIEW_W - 212) * current.s,
          current.y - (FEET.y - 40) * current.s - layerTop,
        );
      },
    });

    const tick = () => {
      if (!layout || !driver) return;
      const d = driver;
      const now = nowSecs();
      const dt = Math.min(0.05, now - lastTime);
      lastTime = now;
      const scroll = scrollY;
      const scrolled = scroll - lastScroll;
      lastScroll = scroll;
      if (Math.abs(scrolled) > 0.5) {
        lastScrollAt = now;
        scrollDir = scrolled > 0 ? 1 : -1;
      }
      while (queue.length && queue[0][0] <= now) queue.shift()![1](now);

      const effective = now - lastScrollAt > 0.25 ? settledScroll(layout.stops, layout.holds, scroll) : scroll;
      const place = placeFor(layout, effective);
      let onLane = false;
      if (layout.lane) {
        const from = layout.stops[place.k];
        const to = place.t > 0 ? layout.stops[place.k + 1] : from;
        onLane = from.track.kind === 'screen' && to?.track.kind === 'screen';
      }
      const decay = Math.exp(-dt / 0.28);
      offset.x *= decay;
      offset.y *= decay;
      offset.s *= decay;
      if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05) offset.x = offset.y = 0;
      const settled = effective !== scroll;
      if (settled !== wasSettled && lastPos && !onLane) {
        offset.x = lastPos.x - place.x;
        offset.y = lastPos.y - place.y;
      }
      wasSettled = settled;

      const s = place.s + offset.s;
      let x = place.x + offset.x;
      let y = place.y + offset.y;
      const bar = layout.lane ? barTop() : 0;
      let caughtUp = true;
      if (onLane) {
        // on the phone lane he trots after his target instead of sticking to it
        if (!laneFollow) laneFollow = lastPos ? { x: lastPos.x, y: lastPos.y - lastBarTop } : { x, y: y - bar };
        const k = 1 - Math.exp(-dt / 0.14);
        laneFollow.x += (x - laneFollow.x) * k;
        laneFollow.y += (y - bar - laneFollow.y) * k;
        caughtUp = Math.hypot(x - laneFollow.x, y - bar - laneFollow.y) < 1.5;
        x = laneFollow.x;
        y = bar + laneFollow.y;
      } else if (laneFollow) {
        offset.x = (lastPos?.x ?? x) - place.x;
        offset.y = (lastPos?.y ?? y) - place.y;
        x = place.x + offset.x;
        y = place.y + offset.y;
        laneFollow = null;
      }
      lastBarTop = bar;
      current = { ...place, x, y, s };
      setData(layer, 'anchor', onLane ? 'bottom' : 'top');
      layerTop = onLane ? layer.getBoundingClientRect().top : 0;

      const holding = place.t === 0 && caughtUp;
      const k = place.k;
      if (holding) {
        if (heldIndex !== k) {
          // just arrived at stop k
          const meta = layout.meta[k];
          queue = [];
          gaze = null;
          heldIndex = k;
          arrivedAt = now;
          lastActivity = now;
          treadmillLeft = null;
          d.reset();
          d.setPose(meta.pose);
          d.face(meta.facing, 0.14);
          d.stride(0);
          d.wag(meta.act === 'basket' ? 0.3 : 0.7);
          d.jolt(0.4);
          nextFidget = now + 2.4;
        }
        const meta = layout.meta[k];
        if (meta.track && !queue.length) {
          // treadmill: walk on the spot while the floor moves
          const left = meta.track.getBoundingClientRect().left;
          const moved = treadmillLeft === null ? 0 : left - treadmillLeft;
          treadmillLeft = left;
          d.walkedTo(-left / s);
          if (Math.abs(moved) > 0.15) {
            treadmillStill = 0;
            d.setPose('walk');
            d.stride(1);
            d.face(moved < 0 ? 1 : -1, 0.16);
          } else if ((treadmillStill += dt) > 0.25) {
            d.setPose('stand');
            d.stride(0);
          }
        }
        if (meta.act === 'tilt' && !queue.length && now - arrivedAt > 1.2) d.cock(Math.sin(0.9 * now) > 0.35 ? 13 : Math.sin(0.9 * now) < -0.35 ? -10 : 0);
        if (meta.act === 'basket' && !queue.length && now > nextFidget) {
          nextFidget = now + 4.5 + 3 * Math.random();
          if (Math.random() < 0.7) d.jolt(0.55);
          else d.yawn(now, 0.7);
        }
        const busy = (gaze && gaze.until > now) || (pointer && now - pointer.t < 2.5);
        if (meta.looks.length && !busy && now - arrivedAt > 0.8 && now - lastLook > 1.7) {
          lastLook = now;
          lookIndex = (lookIndex + 1) % (meta.looks.length + 1);
          if (lookIndex < meta.looks.length) gaze = { el: meta.looks[lookIndex], until: now + 1.4 };
        }
        if (Math.abs(scrolled) > 0.5) lastActivity = now;
        if (!queue.length && !meta.track && meta.act !== 'basket' && now - lastActivity > 9) {
          lastActivity = now;
          queue =
            Math.random() < 0.55
              ? TRICKS.tilt(trickContext(meta), now)
              : [
                  [now, () => d.wag(1)],
                  [now + 2.4, () => d.wag(0.7)],
                ];
        }
      } else {
        if (heldIndex !== -1) {
          heldIndex = -1;
          queue = [];
          d.reset();
        }
        const moved = lastPos ? Math.hypot(x - lastPos.x, y - lastPos.y) : 0;
        stillFor = moved > 0.25 ? 0 : stillFor + dt;
        let airborne = place.airborne;
        if (layout.lane && place.t > 0) {
          const from = layout.stops[k];
          const to = layout.stops[k + 1];
          if (from.sink && place.t < 0.22) airborne = scrollDir > 0;
          else if (to?.sink && place.t > 0.78) airborne = scrollDir < 0;
        }
        if (airborne) {
          d.setPose('hop');
          d.stride(0);
        } else if (stillFor > 0.3) {
          // stopped scrolling halfway: he waits for you
          d.setPose('stand');
          d.stride(0);
          if (stillFor > 2.6 && stillFor - dt <= 2.6) say('coming?', now);
        } else {
          d.setPose('walk');
          d.stride(1);
        }
        d.walkedTo((onLane ? (laneWalked += moved) : place.walked) / Math.max(0.05, s));
        if (lastPos) {
          const dx = x - lastPos.x;
          if (Math.abs(dx) > 0.6 && Math.abs(dx) > 0.35 * Math.abs(y - lastPos.y)) d.face(dx > 0 ? 1 : -1, 0.16);
        }
        if (!layout.lane) {
          // paw prints, alternating front / back foot
          const step = Math.floor(place.walked / (34 * s));
          if (printSegment === k && step !== printStep && !place.airborne && lastPos) {
            const odd = step & 1;
            const footX = odd ? 186 : 110;
            const left = x - FEET.x * s;
            const top = y - FEET.y * s;
            const px = left + (d.facingDir > 0 ? footX : VIEW_W - footX) * s;
            const py = top + 226 * s + scroll - layout.mainTop + (odd ? -4 : 4) * s;
            const angle = Math.atan2(y - lastPos.y + scrolled, x - lastPos.x) + Math.PI / 2;
            const size = 14 * Math.max(0.75, 1.5 * s);
            const print = prints[printIndex++ % prints.length];
            print.style.transform = `translate(${(px - size / 2).toFixed(1)}px, ${(py - size / 2).toFixed(1)}px) rotate(${angle.toFixed(3)}rad)`;
            print.style.width = print.style.height = `${size.toFixed(1)}px`;
            print.animate([{ opacity: 0 }, { opacity: 0.45, offset: 0.08 }, { opacity: 0.45, offset: 0.5 }, { opacity: 0 }], { duration: 2600, easing: 'ease-out' });
          }
          printSegment = k;
          printStep = step;
        }
      }
      lastPos = { x, y };

      // scenes know whether Teddy is here / has been here (CSS reacts to it)
      layout.meta.forEach((m, i) => {
        if (!m.scene) return;
        setData(m.scene, 'here', String(holding && i === k));
        setData(m.scene, 'visited', String(i <= k || (i === k + 1 && place.t > 0.92)));
      });

      if (gaze && gaze.until > now) {
        const r = gaze.el.getBoundingClientRect();
        d.lookAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      } else d.lookAt(pointer && now - pointer.t < 2.5 ? pointer : null);

      actor.style.transform = `translate3d(${(x - FEET.x * s).toFixed(2)}px, ${(y - FEET.y * s - layerTop).toFixed(2)}px, 0)`;
      body.style.transform = `scale(${s.toFixed(4)})`;
      setData(layer, 'front', String(place.front));
      setData(actor, 'holding', String(holding));
      if (bubble.dataset.show === 'true') {
        if (now > bubbleUntil) bubble.dataset.show = 'false';
        const bx = (d.facingDir > 0 ? 214 : VIEW_W - 214) * s;
        bubbleAt.style.transform = `translate(${bx.toFixed(1)}px, ${(30 * s).toFixed(1)}px)`;
      }
      d.tick(dt, now);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') pointer = { x: e.clientX, y: e.clientY, t: nowSecs() };
    };
    const onCue = (e: Event) => {
      const cue = (e as CustomEvent<PupCue>).detail;
      const scene = heldIndex >= 0 ? layout?.meta[heldIndex]?.scene : null;
      if (!scene || (cue.look && !scene.contains(cue.look))) return;
      const now = nowSecs();
      if (cue.look) gaze = { el: cue.look, until: now + (cue.secs ?? 1.6) };
      if (cue.say) say(cue.say, now);
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.matches('a, button, input, textarea, select, summary')) gaze = { el: t, until: nowSecs() + 1.4 };
    };

    let clicks = 0;
    let lastClick = 0;
    let lastTrick: TrickName | StrayTrick | null = null;
    const onClick = () => {
      if (!driver || !layout) return;
      const d = driver;
      const now = nowSecs();
      clicks = now - lastClick < 0.7 ? clicks + 1 : 1;
      lastClick = now;
      lastActivity = now;
      if (heldIndex < 0) {
        // walking: quick tricks only
        const meta = layout.meta[Math.max(0, current?.k ?? 0)];
        const trick = pickOther(STRAY_TRICKS, lastTrick as StrayTrick | null);
        lastTrick = trick;
        const ctx = trickContext(meta);
        queue =
          trick === 'jump'
            ? [
                [now, () => (d.hop(1.35), ctx.say(pickOther(['wheee!', 'boing!', 'yip!'], null)))],
                [now + 0.5, () => d.hop(0.7)],
              ]
            : trick === 'woof'
              ? [
                  [now, (t) => (d.woof(t), ctx.say('woof!'))],
                  [now + 0.4, (t) => d.woof(t)],
                ]
              : trick === 'love'
                ? [[now, () => (d.wag(1), d.hop(0.5), ctx.hearts(), ctx.say('I like you!'))]]
                : [[now, (t) => (d.jolt(1.4), d.hop(0.4), d.yawn(t, 0.22), ctx.say('achoo!'))]];
        return;
      }
      const meta = layout.meta[heldIndex];
      let trick: TrickName;
      if (meta.track) trick = pickOther<TrickName>(['woof', 'hop', 'love'], lastTrick as TrickName | null);
      else if (meta.act === 'basket') trick = pickOther<TrickName>(['tilt', 'love', 'sneeze', 'woof'], lastTrick as TrickName | null);
      else if (meta.pose === 'peek') trick = pickOther<TrickName>(['peekaboo', 'woof', 'tilt', 'sneeze'], lastTrick as TrickName | null);
      else {
        trick = pickTrick(lastTrick as TrickName | null, clicks);
        if (trick === 'zoomies') trick = 'spin'; // no room to run around a stop
      }
      if (trick === 'peekaboo' && queue.length) return;
      lastTrick = trick;
      d.reset();
      queue = TRICKS[trick](trickContext(meta), now);
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && driver && heldIndex >= 0) {
        driver.petting(true);
        driver.wag(1);
      }
    };
    const onLeave = () => {
      if (!driver) return;
      driver.petting(false);
      if (heldIndex >= 0) driver.wag(layout?.meta[heldIndex]?.act === 'basket' ? 0.3 : 0.7);
    };

    const start = () => {
      if (live || prefersReducedMotion()) return;
      const l = measureLayout(probe);
      if (l.stops.length < 2) return;
      layout = l;
      live = true;
      html.dataset.pup = l.lane ? 'lane' : 'live';
      layer.hidden = false;
      const first = l.meta[0];
      driver = new PupDriver(svg, first.pose, first.facing);
      lastScroll = scrollY;
      lastPos = null;
      lastScrollAt = lastTime = nowSecs();
      wasSettled = false;
      laneFollow = null;
      const t0 = lastTime;
      const at = placeFor(l, scrollY);
      if (at.k === 0 && at.t === 0 && first.act === 'peekaboo') {
        // first visit: he pops up from behind the hero and looks at his friends
        heldIndex = 0;
        arrivedAt = t0;
        const hidden = { ...POSES.peek, headY: 120 };
        const friends = first.scene?.querySelectorAll('[data-pup-friend]') ?? [];
        const firstFriend = friends[0];
        const lastFriend = friends[friends.length - 1];
        const d = driver;
        queue = [
          [t0 + 0.1, () => d.setPose(hidden)],
          [t0 + 0.7, (now) => (d.setPose('peek'), d.jolt(1.2), say('peekaboo!', now, 1.6))],
          [t0 + 1.5, (now) => firstFriend && (gaze = { el: firstFriend, until: now + 0.8 })],
          [t0 + 2.3, (now) => lastFriend && (gaze = { el: lastFriend, until: now + 0.8 })],
          [t0 + 3.1, () => ((gaze = null), d.wag(1))],
        ];
      } else heldIndex = -1;
      addEventListener('pointermove', onPointerMove, { passive: true });
      addEventListener(PUP_CUE_EVENT, onCue);
      addEventListener('focusin', onFocusIn);
      actor.addEventListener('click', onClick);
      actor.addEventListener('pointerenter', onEnter);
      actor.addEventListener('pointerleave', onLeave);
      frame.update(tick, true);
    };

    const stop = () => {
      if (!live) return;
      live = false;
      cancelFrame(tick);
      delete html.dataset.pup;
      layer.hidden = true;
      delete layer.dataset.anchor;
      layerTop = 0;
      layout?.meta.forEach((m) => {
        if (m.scene) {
          delete m.scene.dataset.here;
          delete m.scene.dataset.visited;
        }
      });
      layout = null;
      driver = null;
      heldIndex = -1;
      removeEventListener('pointermove', onPointerMove);
      removeEventListener(PUP_CUE_EVENT, onCue);
      removeEventListener('focusin', onFocusIn);
      actor.removeEventListener('click', onClick);
      actor.removeEventListener('pointerenter', onEnter);
      actor.removeEventListener('pointerleave', onLeave);
    };

    // re-measure (debounced) whenever the page reflows
    const remeasure = () => {
      clearTimeout(remeasureTimer);
      remeasureTimer = setTimeout(() => {
        if (!live || !layout) return;
        const l = measureLayout(probe);
        if (l.stops.length < 2) return stop();
        const was = current;
        const laneChanged = l.lane !== layout.lane;
        layout = l;
        html.dataset.pup = l.lane ? 'lane' : 'live';
        if (laneChanged) heldIndex = -1;
        if (was) {
          const now = placeFor(l, scrollY);
          offset.x = was.x - now.x;
          offset.y = was.y - now.y;
          offset.s = was.s - now.s;
        }
      }, 120);
    };
    const resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(document.body);
    addEventListener('resize', remeasure);
    addEventListener('load', remeasure);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const onReduceChange = () => (prefersReducedMotion() ? stop() : start());
    reduce.addEventListener('change', onReduceChange);
    start();
    document.fonts?.ready.then(remeasure);

    const teardown = () => {
      stop();
      clearTimeout(remeasureTimer);
      resizeObserver.disconnect();
      removeEventListener('resize', remeasure);
      removeEventListener('load', remeasure);
      reduce.removeEventListener('change', onReduceChange);
      if (teardownActive === teardown) teardownActive = null;
    };
    teardownActive = teardown;
    return teardown;
  }, []);

  return (
    <>
      <div ref={probeRef} aria-hidden="true" className="pup-probe" />
      <div ref={printsRef} aria-hidden="true" className="pup-prints">
        {Array.from({ length: PRINT_COUNT }, (_, i) => (
          <svg key={i} viewBox="0 0 64 64">
            <path d={PAW_PATH} />
          </svg>
        ))}
      </div>
      <div ref={layerRef} aria-hidden="true" className="pup-layer" hidden data-front="true">
        <div ref={actorRef} className="pup-actor">
          <div ref={bodyRef} className="pup-actor__body">
            <PupFigure pose="peek" />
          </div>
          <span ref={bubbleAtRef} className="pup-bubble-at">
            <span ref={bubbleRef} className="pup-bubble" data-show="false" />
          </span>
        </div>
      </div>
    </>
  );
}
