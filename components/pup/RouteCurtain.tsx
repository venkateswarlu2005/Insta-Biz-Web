'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { PAW_PATH } from '@/components/icons';
import { introElapsed } from '@/lib/curtain';
import { EVENTS, prefersReducedMotion } from '@/lib/motion';
import { COLORS, GROUND_Y, JOINTS, LEGS, SHAPES, toeLines, VIEW_H, VIEW_W } from '@/lib/pup/rig';

const STROKE = { stroke: COLORS.ink, strokeWidth: 3.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const LINE = { ...STROKE, fill: 'none' } as const;

function RunnerLeg({ cls, at, d, length, fill }: { cls: string; at: readonly [number, number]; d: string; length: number; fill: string }) {
  return (
    <g className={`tp-runner__leg ${cls}`} style={{ transformOrigin: `${at[0]}px ${at[1]}px` }}>
      <g transform={`translate(${at[0]} ${at[1]})`}>
        <path d={`${d}Z`} fill={fill} />
        <path d={d} {...LINE} />
        <path d={toeLines(length)} {...LINE} strokeWidth={2.4} />
      </g>
    </g>
  );
}

/** The happy running teddy on the curtain, animated purely by CSS (tp-runner-*). */
function Runner() {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="tp-runner " aria-hidden="true" focusable="false" style={{ overflow: 'visible' }}>
      <ellipse cx={150} cy={GROUND_Y + 2} rx={86} ry={7} fill={COLORS.ink} opacity={0.12} className="tp-runner__shadow" />
      <g className="tp-runner__body">
        <RunnerLeg cls="tp-runner__leg--bf" at={JOINTS.hipF} d={LEGS.backFar} length={GROUND_Y - 192} fill={COLORS.furShade} />
        <RunnerLeg cls="tp-runner__leg--ff" at={JOINTS.shoulderF} d={LEGS.frontFar} length={GROUND_Y - 192} fill={COLORS.furShade} />
        <g className="tp-runner__tail" style={{ transformOrigin: `${JOINTS.tailBase[0]}px ${JOINTS.tailBase[1]}px` }}>
          <path d={SHAPES.tailStem} {...LINE} strokeWidth={9} />
          <path d={SHAPES.tailStem} stroke={COLORS.fur} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={SHAPES.tail} fill={COLORS.fur} {...STROKE} />
        </g>
        <RunnerLeg cls="tp-runner__leg--bn" at={JOINTS.hipN} d={LEGS.back} length={GROUND_Y - 194} fill={COLORS.fur} />
        <path d={SHAPES.body} fill={COLORS.fur} {...STROKE} />
        <path d={SHAPES.chest} fill={COLORS.fur} {...STROKE} />
        <RunnerLeg cls="tp-runner__leg--fn" at={JOINTS.shoulderN} d={LEGS.front} length={GROUND_Y - 194} fill={COLORS.fur} />
        <g className="tp-runner__head">
          <path d={SHAPES.collar} fill={COLORS.collar} {...STROKE} strokeWidth={3} />
          <path d={SHAPES.tag} fill={COLORS.cream} {...STROKE} strokeWidth={2.4} />
          <path d={SHAPES.earL} fill={COLORS.furShade} {...STROKE} className="tp-runner__ear" style={{ transformOrigin: '174px 82px' }} />
          <path d={SHAPES.earR} fill={COLORS.furShade} {...STROKE} className="tp-runner__ear tp-runner__ear--r" style={{ transformOrigin: '250px 82px' }} />
          <path d={SHAPES.head} fill={COLORS.fur} {...STROKE} />
          <path d={SHAPES.topknot} fill={COLORS.fur} {...STROKE} strokeWidth={3} />
          <path d={SHAPES.muzzle} fill={COLORS.cream} />
          <circle cx={181} cy={116} r={7} fill={COLORS.blush} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={COLORS.blush} opacity={0.85} />
          <path d={SHAPES.happyEyes} {...LINE} />
          <path d={SHAPES.nose} fill={COLORS.ink} />
          <path d={SHAPES.mouth} {...LINE} strokeWidth={3} />
          <path d={SHAPES.tongue} fill={COLORS.tongue} stroke={COLORS.ink} strokeWidth={2.2} strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

/** paw prints left behind by the runner: [left %, top px, angle deg] */
const PRINTS: [number, number, number][] = [
  [18, 6, -76],
  [27, -4, -84],
  [36, 7, -72],
  [45, -3, -86],
  [54, 6, -74],
];

type CurtainState = 'intro' | 'covering' | 'covered' | 'snap' | 'lifting' | 'idle';

/**
 * The page-transition blanket. It is down on first load (state "intro", lifted by CSS), and on every
 * internal link click it slides down, the route changes underneath, then it lifts again.
 * Mirrors its state on <html data-curtain> (which holds scrolling still) and fires
 * EVENTS.navigate when a navigation starts and EVENTS.arrived when the new page is showing.
 * Links with data-no-curtain are left alone; reduced motion turns it off entirely.
 */
export function RouteCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const pendingHref = useRef<string | null>(null);
  const coveredAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastPath = useRef(pathname);
  const focusMain = useRef(false);
  const liftRef = useRef<() => void>(() => {});

  useEffect(() => {
    const curtain = curtainRef.current!;
    const html = document.documentElement;
    const setState = (state: CurtainState) => {
      curtain.dataset.state = state;
      if (state === 'idle') delete html.dataset.curtain;
      else html.dataset.curtain = state;
    };
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

    const lift = () => {
      const state = curtain.dataset.state;
      if (state === 'idle' || state === 'lifting') return;
      clearTimers();
      pendingHref.current = null;
      setState('lifting');
      dispatchEvent(new Event(EVENTS.arrived));
      if (focusMain.current) {
        // keyboard navigation: move focus to the new content
        focusMain.current = false;
        document.getElementById('main')?.focus({ preventScroll: true });
      }
      later(() => setState('idle'), 460);
    };

    const go = (href: string) => {
      const url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.search === location.search) {
        // same page: just scroll back to the top under the blanket
        pendingHref.current = null;
        scrollTo({ top: 0, behavior: 'instant' });
        later(lift, 120);
        return;
      }
      router.push(url.pathname + url.search + url.hash);
      later(lift, 6000); // never leave the page blocked
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download') || link.dataset.noCurtain !== undefined) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || /^\/(admin|api|media|_next)(\/|$)/.test(url.pathname)) return;
      // in-page anchors (same path with a hash) scroll normally
      if (url.pathname === location.pathname && (url.hash || url.search !== location.search)) return;
      if (prefersReducedMotion()) return;

      e.preventDefault();
      e.stopPropagation();
      focusMain.current = e.detail === 0;
      router.prefetch(url.pathname + url.search);
      dispatchEvent(new Event(EVENTS.navigate));

      const state = curtain.dataset.state;
      pendingHref.current = url.href;
      if (state === 'covered' || state === 'snap') go(url.href);
      else if (state === 'covering') return;
      else {
        clearTimers();
        if (state === 'intro' && introElapsed() < 1080) {
          // the intro blanket is still (partly) down: navigate straight away
          setState('covered');
          coveredAt.current = performance.now();
          go(url.href);
        } else {
          setState('covering');
          later(() => {
            setState('covered');
            coveredAt.current = performance.now();
            if (pendingHref.current) go(pendingHref.current);
          }, 300);
        }
      }
    };

    // back / forward: show the blanket instantly, lift once the route has rendered
    const onPopState = () => {
      if (prefersReducedMotion() || location.pathname === lastPath.current) return;
      clearTimers();
      setState('snap');
      coveredAt.current = performance.now();
      later(lift, 1400);
    };
    // restored from the back/forward cache: never come back to a covered page
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        clearTimers();
        setState('idle');
      }
    };

    if (curtain.dataset.state === 'intro') {
      const elapsed = introElapsed();
      later(() => dispatchEvent(new Event(EVENTS.arrived)), Math.max(0, 560 - elapsed));
      later(() => curtain.dataset.state === 'intro' && setState('idle'), Math.max(0, 1080 - elapsed));
    }
    if (prefersReducedMotion()) setState('idle');

    addEventListener('click', onClick, true);
    addEventListener('popstate', onPopState);
    addEventListener('pageshow', onPageShow);
    liftRef.current = lift;
    return () => {
      clearTimers();
      delete html.dataset.curtain;
      removeEventListener('click', onClick, true);
      removeEventListener('popstate', onPopState);
      removeEventListener('pageshow', onPageShow);
    };
  }, [router]);

  // the new route has rendered: lift (giving the blanket a moment to finish covering)
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    const state = curtainRef.current?.dataset.state;
    if (state !== 'covered' && state !== 'snap' && state !== 'covering') return;
    const wait = Math.max(0, 140 - (performance.now() - coveredAt.current));
    const timer = setTimeout(() => requestAnimationFrame(() => liftRef.current()), state === 'covering' ? 340 : wait);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div ref={curtainRef} className="tp-curtain" data-state="intro" aria-hidden="true">
      <div className="tp-curtain__blanket">
        <svg className="tp-curtain__edge tp-curtain__edge--top" width="100%" height="40" preserveAspectRatio="none">
          <defs>
            <pattern id="tp-curtain-scallop" width="76" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40V27A38 25 0 0 1 76 27V40Z" fill="#fbe3b4" />
              <path d="M0 27A38 25 0 0 1 76 27" fill="none" stroke="#2a170e" strokeWidth="3" />
              <path
                d="M11 33A27 19 0 0 1 65 33"
                fill="none"
                stroke="#2a170e"
                strokeWidth="1.6"
                strokeDasharray="3.5 5.5"
                strokeLinecap="round"
                opacity=".42"
              />
            </pattern>
          </defs>
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
        <div className="tp-curtain__stage">
          <div className="tp-curtain__prints">
            {PRINTS.map(([left, top, angle], i) => (
              <svg
                key={i}
                viewBox="0 0 64 64"
                className="tp-curtain__print"
                style={{ left: `${left}%`, top: `${top}px`, rotate: `${angle + 90}deg`, animationDelay: `${0.16 + 0.12 * i}s` }}
              >
                <path d={PAW_PATH} />
              </svg>
            ))}
          </div>
          <div className="tp-curtain__runner">
            <Runner />
          </div>
          <p className="tp-curtain__note font-scrawl">every puppy is family</p>
        </div>
        <svg className="tp-curtain__edge tp-curtain__edge--bottom" width="100%" height="40" preserveAspectRatio="none">
          <rect width="100%" height="40" fill="url(#tp-curtain-scallop)" />
        </svg>
      </div>
    </div>
  );
}
