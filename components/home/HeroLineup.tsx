'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Img } from '@/components/Img';
import type { MediaItem } from '@/lib/puppy';
import { prefersReducedMotion } from '@/lib/motion';

export type Friend = { slug: string; displayName: string; breed: string; cover: MediaItem };

// Seat layout along the quilt: [left %, photo width rem, how far it peeks up, tilt deg]
const SEATS: [number, number, number, number][] = [
  [9, 8.6, 0.62, -5],
  [22.5, 10.4, 0.8, 3],
  [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3],
  [77.5, 10.6, 0.82, -3],
  [91, 8.4, 0.6, 4],
];

/** Gaps between pops, in ms; uneven so the line-up never feels mechanical. */
const BEATS = [1900, 2500, 1700, 2300, 2000, 2800, 1800];

type SeatState = 'duck' | 'pop' | undefined;

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const seatStyle = (i: number) => {
  const [x, w, peek, tilt] = SEATS[i];
  return { '--x': `${x}%`, '--w': `${w}rem`, '--peek': peek, '--tilt': `${tilt}deg`, '--i': i } as CSSProperties;
};

/**
 * Puppy photos peeking over the hero quilt. Once they have peeked in, one seat at a time
 * ducks down and pops back up, and when there are more puppies than seats a different
 * puppy (and name tag) comes up in its place. The next puppy's photo waits, preloaded,
 * in the hidden "wings" so the swap never shows an empty frame.
 */
export function HeroLineup({ friends }: { friends: Friend[] }) {
  const count = Math.min(SEATS.length, friends.length);
  const [seats, setSeats] = useState(() => friends.slice(0, count).map((_, i) => i));
  const [states, setStates] = useState<Record<number, SeatState>>({});
  const [popTag, setPopTag] = useState<number | null>(null);
  const [hoverTag, setHoverTag] = useState<number | null>(null);
  const [wingsFor, setWingsFor] = useState<number | null>(friends.length > count ? count : null);
  const listRef = useRef<HTMLUListElement>(null);
  const wingsRef = useRef<HTMLSpanElement>(null);
  const seatsRef = useRef(seats);

  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !count || prefersReducedMotion()) return;
    const swapping = friends.length > count;
    const scene = list.closest<HTMLElement>('[data-pup-scene]');
    let visible = true;
    let quietUntil = 0;
    let alive = true;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(list);
    // hold still while the visitor is scrolling, tapping or pointing at a puppy
    const hush = () => (quietUntil = performance.now() + 1200);
    addEventListener('scroll', hush, { passive: true });
    addEventListener('pointerdown', hush, { passive: true });
    list.addEventListener('pointerover', hush, { passive: true });

    const benched = () => friends.map((_, i) => i).filter((i) => !seatsRef.current.includes(i));
    const firstBench = benched();
    let queue = firstBench.includes(count) ? [count, ...shuffle(firstBench.filter((i) => i !== count))] : shuffle(firstBench);
    let order: number[] = [];
    let lastSeat = -1;
    let beat = 0;
    let tries = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    const tick = (): void => {
      if (document.hidden || !visible || performance.now() <= quietUntil || scene?.dataset.here === 'false') return later(tick, 900);
      if (!swapping) return pop();
      if (!queue.length) queue = shuffle(benched());
      // only swap once the next puppy's photo is loaded and decoded
      const wings = wingsRef.current;
      const img = wings?.dataset.for === String(queue[0]) ? wings.querySelector('img') : null;
      if (!img || !img.complete || !img.naturalWidth) {
        if (++tries < 15) return later(tick, 400);
        queue.push(queue.shift()!);
        setWingsFor(queue[0] ?? null);
        tries = 0;
        return later(tick, 800);
      }
      tries = 0;
      img.decode().then(pop, pop);
    };

    const pop = () => {
      if (!order.length) {
        const shown = [...list.children].map((el, i) => (el.getClientRects().length ? i : -1)).filter((i) => i >= 0);
        order = shuffle(shown).filter((s, i, a) => !(i === 0 && s === lastSeat && a.length > 1));
      }
      const seat = order.shift();
      if (seat === undefined) return later(tick, 2000);
      lastSeat = seat;
      const incoming = swapping ? queue.shift()! : seatsRef.current[seat];
      setStates((s) => ({ ...s, [seat]: 'duck' }));
      later(() => {
        if (swapping) {
          const outgoing = seatsRef.current[seat];
          setSeats((s) => s.map((f, i) => (i === seat ? incoming : f)));
          queue.push(outgoing);
          setWingsFor(queue[0] ?? null);
        }
        setStates((s) => ({ ...s, [seat]: 'pop' }));
        setPopTag(seat);
        later(() => setPopTag((t) => (t === seat ? null : t)), 1800);
        later(() => setStates((s) => ({ ...s, [seat]: undefined })), 700);
      }, 360);
      later(tick, BEATS[beat++ % BEATS.length]);
    };

    if (swapping) setWingsFor(queue[0] ?? null);

    // start once every photo has finished its first peek
    const peeks = [...list.querySelectorAll('.tp-lineup__pup')]
      .flatMap((el) => el.getAnimations())
      .filter((a) => (a as CSSAnimation).animationName === 'tp-peek');
    const start = () => alive && later(tick, 250);
    Promise.all(peeks.map((a) => a.finished)).then(start, start);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      timers = [];
      io.disconnect();
      removeEventListener('scroll', hush);
      removeEventListener('pointerdown', hush);
      list.removeEventListener('pointerover', hush);
    };
  }, [friends, count]);

  if (!count) return null;
  const hideTag = (i: number) => () => setHoverTag((t) => (t === i ? null : t));

  return (
    <>
      <ul ref={listRef} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {seats.map((f, i) => {
          const pup = friends[f];
          return (
            <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
              <Link
                href={`/puppies/${pup.slug}`}
                className="tp-lineup__pup"
                data-pup-friend="true"
                data-state={states[i]}
                aria-label={`Meet ${pup.displayName}, ${pup.breed}`}
                onPointerEnter={() => setHoverTag(i)}
                onPointerLeave={hideTag(i)}
                onFocus={() => setHoverTag(i)}
                onBlur={hideTag(i)}
              >
                <span className="tp-lineup__photo">
                  <Img key={pup.slug} media={pup.cover} sizes="11rem" {...(i < 2 ? { priority: true } : { loading: 'eager' })} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul aria-hidden="true" className="tp-lineup tp-lineup--tags">
        {seats.map((f, i) => (
          <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
            <span className="tp-lineup__ghost" data-state={states[i]} data-tag={popTag === i || hoverTag === i ? 'show' : undefined}>
              <span className="tp-lineup__name font-scrawl">{friends[f].displayName}</span>
            </span>
          </li>
        ))}
      </ul>
      {wingsFor !== null && (
        <span ref={wingsRef} aria-hidden="true" className="tp-lineup__wings" data-for={wingsFor}>
          <Img media={friends[wingsFor].cover} sizes="11rem" alt="" loading="eager" />
        </span>
      )}
    </>
  );
}
