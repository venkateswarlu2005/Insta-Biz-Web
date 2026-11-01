'use client';

import Link from 'next/link';
import { m, useScroll, useSpring, useTransform } from 'motion/react';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { PawIcon } from '@/components/icons';
import { Img } from '@/components/Img';
import { PupStop } from '@/components/pup/PupStop';
import { useReducedMotion } from '@/lib/motion';
import type { MediaItem, Status } from '@/lib/puppy';
import { cuePup } from './cue';
import { Scene, TONES } from './Scene';

export type DoorPup = {
  slug: string;
  displayName: string;
  /** "Maltipoo, boy, 3 months, with video" */
  meta: string;
  status: Status;
  cover: MediaItem;
};

const STATUS_LABEL: Record<Status, string> = { available: 'Available', reserved: 'Reserved', 'gone-home': 'Gone home' };
const DOOR_COLOURS = ['#a24a1a', '#5a3a28', '#d4893f', '#b8644a', '#7a4a2e'];

function Door({ pup, index }: { pup: DoorPup; index: number }) {
  return (
    <Link href={`/puppies/${pup.slug}`} className="tp-door__link" style={{ '--door': DOOR_COLOURS[index % DOOR_COLOURS.length] } as CSSProperties}>
      <span className="tp-door__plate">
        <span className="font-plush tp-door__name">{pup.displayName}</span>
        <span className="tp-door__meta">{pup.meta}</span>
      </span>
      <span className="tp-door__frame">
        <span className="tp-door__room">
          <Img media={pup.cover} sizes="(min-width: 1024px) 15rem, 44vw" />
        </span>
        <span aria-hidden="true" className="tp-door__way">
          <span className="tp-door__leaf">
            <PawIcon className="tp-door__peephole" />
            <span className="tp-door__knob" />
          </span>
        </span>
        <span className="tp-door__tag font-scrawl">{STATUS_LABEL[pup.status]}</span>
      </span>
    </Link>
  );
}

type Props = { heading: string; body: string; ctaLabel: string; ctaHref: string; puppies: DoorPup[] };

/**
 * "Meet the pups": on wide screens the scene pins and the hallway of doors slides sideways
 * as you scroll down; each door swings open as it passes Teddy. Elsewhere it is a plain
 * swipeable row with every door open.
 */
export function Meet({ heading, body, ctaLabel, ctaHref, puppies }: Props) {
  const rangeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const hallRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [travel, setTravel] = useState(0);
  const [pinned, setPinned] = useState(false);

  // size the doors to fit the screen height and measure how far the hallway has to slide
  useLayoutEffect(() => {
    const measure = () => {
      const wide = matchMedia('(min-width: 1024px)').matches;
      setPinned(wide && !reduced);
      const track = trackRef.current;
      const hall = hallRef.current;
      if (hall && track && wide && !reduced) {
        const stage = hall.parentElement!;
        const head = stage.querySelector<HTMLElement>('.tp-meet__head');
        const plate = Math.max(64, ...[...track.querySelectorAll<HTMLElement>('.tp-door__plate')].map((el) => el.offsetHeight));
        const floor = hall.querySelector<HTMLElement>('.tp-meet__floor')?.offsetHeight ?? 0;
        const room = stage.clientHeight - (head ? head.offsetTop + head.offsetHeight : 0) - floor - plate - 40;
        const doorW = Math.max(128, Math.min(256, 0.15 * innerWidth, room / 1.3));
        hall.style.setProperty('--door-w', `${doorW.toFixed(0)}px`);
      } else hall?.style.removeProperty('--door-w');
      setTravel(track ? Math.max(0, track.scrollWidth - innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (hallRef.current?.parentElement) ro.observe(hallRef.current.parentElement);
    addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      removeEventListener('resize', measure);
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({ target: rangeRef, offset: ['start start', 'end end'] });
  const eased = useSpring(scrollYProgress, { stiffness: 170, damping: 32, mass: 0.35 });
  const x = useTransform(eased, [0, 1], [0, -travel]);

  // open the doors that have slid past Teddy (36% from the left), and slide the floorboards along
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!pinned) {
      // unpinned (narrow screen or reduced motion): every door stands open
      for (const door of track.children as HTMLCollectionOf<HTMLElement>) door.dataset.open = 'true';
      return;
    }
    const update = (dx: number, cue: boolean) => {
      hallRef.current?.style.setProperty('--floor-x', `${dx.toFixed(1)}px`);
      const line = 0.36 * innerWidth;
      for (const door of track.children as HTMLCollectionOf<HTMLElement>) {
        const open = door.offsetLeft + dx < line;
        if ((door.dataset.open === 'true') !== open) {
          door.dataset.open = String(open);
          if (open && cue) cuePup({ look: door, secs: 0.9 });
        }
      }
    };
    update(x.get(), false);
    return x.on('change', (v) => update(v, true));
  }, [pinned, x]);

  if (!puppies.length) return null;

  return (
    <Scene tone={TONES.meet} aria-labelledby="meet-title" className="tp-meet" data-pinned={pinned || undefined}>
      <div
        ref={rangeRef}
        data-pin-range="true"
        style={{ height: pinned ? `calc(100vh + ${Math.round(0.8 * travel)}px)` : undefined, '--pinned': pinned ? 1 : 0 } as CSSProperties}
      >
        <div className="tp-meet__stage">
          <header className="tp-meet__head gutter">
            <div>
              <h2 id="meet-title" className="font-plush text-huge">
                {heading}
              </h2>
              <p className="text-lede mt-3 max-w-[44ch] text-[var(--ink-soft)]">{body}</p>
            </div>
            <Link href={ctaHref} className="btn btn-primary shrink-0">
              {ctaLabel}
            </Link>
          </header>
          <div ref={hallRef} className="tp-meet__hall">
            <m.ol ref={trackRef} style={pinned ? { x } : undefined} className="tp-meet__track" data-treadmill="true" aria-label="Puppies looking for a family">
              {puppies.map((pup, i) => (
                <li key={pup.slug} className="tp-door" data-open={pinned ? 'false' : 'true'}>
                  <Door pup={pup} index={i} />
                </li>
              ))}
              <li className="tp-door tp-door--all" data-open="true">
                <Link href={ctaHref} className="tp-door__link">
                  <span className="tp-door__frame tp-door__frame--all">
                    <span className="font-plush tp-door__all">Meet them all</span>
                  </span>
                </Link>
              </li>
            </m.ol>
            <div aria-hidden="true" className="tp-meet__floor" />
            <PupStop pose={pinned ? 'walk' : 'sit'} act={pinned ? 'treadmill' : undefined} className="tp-meet__teddy" />
          </div>
        </div>
      </div>
    </Scene>
  );
}
