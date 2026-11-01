'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
import { PAW_PATH } from '@/components/icons';
import { Img } from '@/components/Img';
import { PupStop } from '@/components/pup/PupStop';
import { useReducedMotion } from '@/lib/motion';
import type { MediaItem } from '@/lib/puppy';
import { cuePup, useMediaQuery } from './cue';
import { Scene, TONES } from './Scene';

export type ChatStep = { title: string; text: string };
export type ChatClipMedia = { src: string; poster?: string; alt: string };

type Props = {
  heading: string;
  body: string;
  steps: readonly ChatStep[];
  ctaLabel: string;
  ctaHref: string;
  business: string;
  greeting: string;
  whatsappHref: string;
  breeds: { slug: string; name: string }[];
  snaps: readonly MediaItem[];
  clip?: ChatClipMedia;
};

/** A video bubble with a tap-to-play button. */
function ChatClip({ media }: { media: ChatClipMedia }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused)
      v.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    else {
      v.pause();
      setPlaying(false);
    }
  };
  return (
    <div className="tp-msg tp-msg--them tp-msg--media">
      <div className="tp-clip">
        <video
          ref={video}
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={media.alt || 'A puppy video'}
          onEnded={() => setPlaying(false)}
        />
        <button type="button" className="tp-clip__play" onClick={toggle} aria-pressed={playing} aria-label={playing ? 'Pause video' : 'Play video'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={playing ? 'M7 5h3v14H7zM14 5h3v14h-3z' : 'M8 5v14l11-7z'} />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Little doodle under the last message: a dotted route, paw prints and a house with a heart. */
function RouteDoodle() {
  return (
    <svg viewBox="0 0 220 70" className="tp-route" aria-hidden="true">
      <path d="M14 52 C 60 6, 120 70, 170 28" className="tp-route__line" />
      <circle cx="14" cy="52" r="5" className="tp-route__dot" />
      <path d="M164 32 l12 -12 l12 12 v14 h-24 z" className="tp-route__home" />
      <path d="M176 42 c-2-3-7-2-6 2c1 3 6 5 6 5s5-2 6-5c1-4-4-5-6-2z" className="tp-route__heart" />
      <path d={PAW_PATH} transform="translate(70 22) scale(.3) rotate(70 32 32)" className="tp-route__paw" />
      <path d={PAW_PATH} transform="translate(104 38) scale(.3) rotate(100 32 32)" className="tp-route__paw" />
    </svg>
  );
}

/**
 * "Your puppy journey": the three steps on the left, and a WhatsApp chat on a phone that
 * plays the conversation step by step as each one scrolls past (desktop). On phones and
 * with reduced motion the whole conversation is simply shown.
 */
export function Chat({ heading, body, steps, ctaLabel, ctaHref, business, greeting, whatsappHref, breeds, snaps, clip }: Props) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const still = useReducedMotion() || !wide;
  const [reached, setReached] = useState(-1);
  const [typing, setTyping] = useState(false);
  const stepsRef = useRef<HTMLOListElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const current = still ? steps.length - 1 : reached;

  // the step in the band 28%–38% down the screen is the current one
  useEffect(() => {
    if (still || !stepsRef.current) return;
    const items = [...stepsRef.current.children];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setReached(items.indexOf(e.target));
      },
      { rootMargin: '-28% 0px -62% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [still, steps.length]);

  // moving forward: show "typing…" for a moment, then the reply
  const lastRef = useRef(-1);
  useEffect(() => {
    if (still) return;
    const forward = reached > lastRef.current;
    lastRef.current = reached;
    if (!forward || reached < 0) return;
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      const group = screenRef.current?.querySelector(`[data-step="${reached}"]`);
      if (group) cuePup({ look: group, secs: 1.4, say: reached === 1 ? 'ooh, photos!' : reached === 2 ? 'home soon!' : undefined });
    }, 750);
    return () => clearTimeout(t);
  }, [reached, still]);

  return (
    <Scene tone={TONES.chat} aria-labelledby="journey-title" className="tp-chat">
      <div className="tp-chat__grid gutter" data-pin-range="true">
        <div className="tp-chat__story">
          <h2 id="journey-title" className="font-plush text-huge">
            {heading}
          </h2>
          {body && <p className="text-lede mt-5 max-w-[42ch] text-[var(--ink-soft)]">{body}</p>}
          <ol ref={stepsRef} className="tp-chat__steps">
            {steps.map((s, i) => (
              <li key={s.title} className="tp-chat__step" data-active={i === current || undefined} data-done={i < current || undefined}>
                <span className="tp-chat__num font-plush" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="font-plush tp-chat__title">{s.title}</h3>
                <p className="tp-chat__text">{s.text}</p>
              </li>
            ))}
          </ol>
          {ctaLabel && (
            <Link href={ctaHref} className="btn btn-ghost tp-chat__cta">
              {ctaLabel}
            </Link>
          )}
        </div>
        <div className="tp-chat__side">
          <div className="tp-phone" aria-label={`A WhatsApp conversation with ${business}`} role="group">
            <div className="tp-phone__bar">
              <Image src="/brand/logo.png" alt="" width={40} height={40} className="tp-phone__avatar" />
              <span>
                <span className="tp-phone__name">{business}</span>
                <span className="tp-phone__status">{typing ? 'typing…' : 'online'}</span>
              </span>
            </div>
            <div ref={screenRef} className="tp-phone__screen">
              <p className="tp-msg tp-msg--me">{greeting}</p>
              {steps.map((s, i) => (
                <div key={s.title} className="tp-msg-group" data-step={i} data-show={i < current || (i === current && !typing) ? 'true' : 'false'}>
                  {i === 0 && breeds.length > 0 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{s.text}</p>
                      <ul className="tp-chips" aria-label="Breeds we have now">
                        {breeds.slice(0, 6).map((b) => (
                          <li key={b.slug}>
                            <Link href={`/puppies?breed=${b.slug}`}>{b.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {i === 1 && (
                    <Fragment>
                      {snaps.length > 0 && (
                        <div className="tp-msg tp-msg--them tp-msg--media">
                          <div className="tp-snaps">
                            {snaps.map((p) => (
                              <span key={p.src} className="tp-snaps__one">
                                <Img media={p} sizes="9rem" />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {clip && <ChatClip media={clip} />}
                      <p className="tp-msg tp-msg--them">{s.text}</p>
                    </Fragment>
                  )}
                  {i === 2 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{s.text}</p>
                      <RouteDoodle />
                    </div>
                  )}
                  {(i > 2 || (i === 0 && !breeds.length)) && <p className="tp-msg tp-msg--them">{s.text}</p>}
                </div>
              ))}
              <p className="tp-typing" data-show={typing ? 'true' : 'false'} aria-hidden="true">
                <span />
                <span />
                <span />
              </p>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="tp-phone__compose">
              <span>Say hello on WhatsApp</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
              </svg>
            </a>
          </div>
          <PupStop pose="sit" facing="right" className="tp-chat__teddy" />
        </div>
      </div>
    </Scene>
  );
}
