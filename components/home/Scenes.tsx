// The home page's static scenes (server components). Interactive ones live in their own files.
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Twinkles, TWINKLE_PATH } from '@/components/icons';
import { Img } from '@/components/Img';
import { PupStop } from '@/components/pup/PupStop';
import type { MediaItem } from '@/lib/puppy';
import { waLink } from '@/lib/site';
import { HOME } from './copy';
import { Flight } from './Flight';
import { HeroLineup, type Friend } from './HeroLineup';
import { Scene, TONES } from './Scene';

const WA = { target: '_blank', rel: 'noopener noreferrer' } as const;

/* ---------- 1. Hero: morning, puppies peeking over the quilt ---------- */

export function Hero({ friends }: { friends: Friend[] }) {
  const c = HOME.hero;
  return (
    <Scene tone={TONES.hero} aria-labelledby="hero-title" className="tp-hero" style={{ '--quilt': TONES.hero.bottom } as CSSProperties}>
      <span aria-hidden="true" className="tp-hero__sun" />
      <div className="tp-hero__copy gutter">
        <p className="tp-hero__note font-scrawl">
          {c.note}
          <svg viewBox="0 0 220 24" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-toffee" aria-hidden="true">
            <path
              d="M4 14c18-10 30 8 48-1s28-9 46 0 30 8 48-1 30-9 48 0 18 2 22 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </p>
        <h1 id="hero-title" className="tp-hero__title font-plush">
          <span className="tp-hero__line">{c.titleLines[0]}</span>
          <span className="tp-hero__line tp-hero__line--2">{c.titleLines[1]}</span>
        </h1>
        <p className="tp-hero__lede">{c.lede}</p>
        <div className="tp-hero__actions">
          <Link href={c.primary.href} className="btn btn-primary">
            {c.primary.label}
          </Link>
          <a href={waLink()} {...WA} className="btn btn-ghost">
            {c.whatsappLabel}
          </a>
        </div>
      </div>
      <div className="tp-hero__stage">
        <HeroLineup friends={friends} />
        <PupStop pose="peek" facing="right" act="peekaboo" behind lane label="Teddy, the TeddyPups puppy, peeking over the quilt" className="tp-hero__teddy" />
        <div aria-hidden="true" className="tp-quilt">
          <svg className="tp-quilt__edge" width="100%" height="40" preserveAspectRatio="none">
            <defs>
              <pattern id="tp-scallop" width="76" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40V27A38 25 0 0 1 76 27V40Z" style={{ fill: 'var(--quilt)' }} />
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
            <rect width="100%" height="40" fill="url(#tp-scallop)" />
          </svg>
        </div>
      </div>
    </Scene>
  );
}

/* ---------- 3. Two ways: the signpost, the Dubai window and the flight from Korea ---------- */

export function Paths({ flight }: { flight: { photo?: string; label: string } }) {
  const c = HOME.paths;
  return (
    <Scene tone={TONES.paths} aria-labelledby="paths-title" className="tp-paths">
      <div className="gutter mx-auto max-w-[110rem]">
        <h2 id="paths-title" className="tp-paths__title font-plush text-huge">
          {c.heading}
        </h2>
        <div className="tp-fork">
          <div aria-hidden="true" className="tp-fork__post" />
          <article className="tp-way tp-way--left" aria-labelledby="way-local">
            <h3 id="way-local" className="tp-sign tp-sign--left font-plush">
              {c.local.sign}
            </h3>
            <div className="tp-way__scene" data-pup-look="true">
              <svg viewBox="0 0 300 120" className="tp-way__skyline" aria-hidden="true">
                <path
                  d="M4 116h292M20 116V78h16v38M44 116V60h18v56M70 116V84h12v32M150 116V36l4-6v-14l3-4 3 4v14l4 6v80M118 116V70l12-8v54M174 116V64l14 8v44M200 116V82h18v34M226 116V56h14v60M248 116V88h22v28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <figure className="tp-window">
                <span className="tp-window__glass">
                  <Img media={c.local.photo} sizes="(min-width: 1024px) 16rem, 60vw" />
                </span>
                <figcaption className="font-scrawl">{c.local.caption}</figcaption>
              </figure>
            </div>
            <p className="tp-way__text">{c.local.text}</p>
            <Link href={c.local.cta.href} className="btn btn-primary">
              {c.local.cta.label}
            </Link>
          </article>
          <article className="tp-way tp-way--right" aria-labelledby="way-imported">
            <h3 id="way-imported" className="tp-sign tp-sign--right font-plush">
              {c.imported.sign}
            </h3>
            <div className="tp-way__scene" data-pup-look="true">
              <Flight photo={flight.photo} label={flight.label} />
            </div>
            <p className="tp-way__text">{c.imported.text}</p>
            <Link href={c.imported.cta.href} className="btn btn-primary">
              {c.imported.cta.label}
            </Link>
          </article>
          <PupStop pose="sit" facing="right" className="tp-fork__teddy" />
        </div>
      </div>
    </Scene>
  );
}

/* ---------- 5. Puppy passport: why families trust TeddyPups ---------- */

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const STAMP_ICONS: Record<string, ReactNode> = {
  heart: (
    <>
      <path d="M32 54C16 43 8 34 8 24c0-7 5.4-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 6.6 0 12 5 12 12 0 10-8 19-24 30z" {...line} />
      <path d="M22 30h7l3-7 4 13 3-6h7" {...line} />
    </>
  ),
  plane: (
    <>
      <path d="M6 36l22-3 12-17h6l-6 17 12-1 6-7h3l-2 10 2 10h-3l-6-7-12-1 6 17h-6L28 37 6 36z" {...line} />
      <path d="M8 50c10 4 20 4 30 0" {...line} strokeDasharray="2 7" />
    </>
  ),
  chat: (
    <>
      <path d="M10 14h44v28H30l-12 10v-10h-8z" {...line} />
      <path d="M22 28h0M32 28h0M42 28h0" {...line} strokeWidth={5} />
    </>
  ),
  globe: (
    <>
      <circle cx="32" cy="32" r="22" {...line} />
      <path d="M10 32h44M32 10c-8 8-8 36 0 44M32 10c8 8 8 36 0 44" {...line} />
    </>
  ),
};

export function Passport() {
  const c = HOME.trust;
  return (
    <Scene tone={TONES.passport} aria-labelledby="trust-title" className="tp-passport">
      <div className="gutter mx-auto max-w-[96rem]">
        <div className="tp-book">
          <div className="tp-book__page tp-book__page--left">
            <p aria-hidden="true" className="tp-book__kicker font-scrawl">
              {c.kicker}
            </p>
            <h2 id="trust-title" className="font-plush tp-book__title">
              {c.heading}
            </h2>
            <PupStop pose="sit" facing="right" className="tp-book__teddy" />
          </div>
          <ul className="tp-book__page tp-book__page--right">
            {c.stamps.map((s, i) => (
              <li key={s.title} className="tp-entry" style={{ '--ink-stamp': s.ink, '--tilt': `${s.tilt}deg`, '--i': i } as CSSProperties}>
                <span className={`tp-stamp tp-stamp--${s.shape}`}>
                  <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden="true">
                    {STAMP_ICONS[s.icon]}
                  </svg>
                  <span className="tp-stamp__title font-plush">{s.title}</span>
                </span>
                <p className="tp-entry__text">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Scene>
  );
}

/* ---------- 7. Night: questions under the stars ---------- */

const STARS = [
  { left: '8%', top: '12%', size: 16.2 },
  { left: '22%', top: '30%', size: 9 },
  { left: '41%', top: '8%', size: 12.6 },
  { left: '57%', top: '22%', size: 8.1 },
  { left: '72%', top: '6%', size: 14.4 },
  { left: '88%', top: '18%', size: 10.8 },
  { left: '95%', top: '42%', size: 9 },
  { left: '4%', top: '58%', size: 10.8 },
  { left: '34%', top: '70%', size: 7.2 },
  { left: '63%', top: '84%', size: 9.9 },
  { left: '83%', top: '66%', size: 12.6 },
].map((s, i) => ({ ...s, delay: i * 0.4 }));

export function Night() {
  const c = HOME.questions;
  return (
    <Scene tone={TONES.night} aria-labelledby="questions-title" className="tp-night">
      <Twinkles stars={STARS} className="pointer-events-none tp-night__stars" />
      <div className="tp-night__grid gutter">
        <div className="tp-night__intro">
          <h2 id="questions-title" className="font-plush text-huge">
            {c.heading}
          </h2>
          <Link href={c.ctaHref} className="btn btn-ghost tp-night__cta">
            {c.ctaLabel}
          </Link>
          <div className="tp-night__pup">
            <span aria-hidden="true" className="tp-night__wonder font-plush">
              ?
            </span>
            <PupStop pose="sit" facing="right" act="tilt" className="tp-night__teddy" />
          </div>
        </div>
        <dl className="tp-night__list">
          {c.items.map((item, i) => (
            <div key={item.q} className="tp-qa" data-pup-look={i < 2 ? '' : undefined}>
              <dt className="font-plush tp-qa__q">
                <svg viewBox="0 0 40 40" className="tp-qa__star" aria-hidden="true">
                  <path d={TWINKLE_PATH} fill="currentColor" />
                </svg>
                {item.q}
              </dt>
              <dd className="tp-qa__a">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Scene>
  );
}

/* ---------- 8. Home: the house with a puppy waiting inside ---------- */

export function HomeCta({ inside }: { inside?: { photo: MediaItem; name: string } }) {
  const c = HOME.cta;
  return (
    <Scene tone={TONES.home} aria-labelledby="cta-title" className="tp-home">
      <div className="tp-home__copy gutter">
        <h2 id="cta-title" className="font-plush text-huge">
          {c.heading}
        </h2>
        <p className="tp-home__lede">{c.body}</p>
      </div>
      <div className="tp-house">
        <span aria-hidden="true" className="tp-house__plant tp-house__plant--left" />
        <span aria-hidden="true" className="tp-house__lamp" />
        <div className="tp-house__doorway">
          <span className="tp-house__inside">{inside && <Img media={inside.photo} alt={`${inside.name}, waiting inside`} sizes="16rem" />}</span>
          <span aria-hidden="true" className="tp-house__door">
            <span className="tp-house__peep" />
            <span className="tp-house__knob" />
          </span>
        </div>
        <span aria-hidden="true" className="tp-house__plant tp-house__plant--right" />
        <span aria-hidden="true" className="tp-house__mat font-scrawl">
          welcome home
        </span>
        <PupStop pose="bow" facing="right" className="tp-house__teddy" />
      </div>
      <div className="tp-home__actions gutter">
        <a href={waLink()} {...WA} className="btn btn-whatsapp">
          {c.whatsappLabel}
        </a>
        <Link href={c.secondary.href} className="btn btn-ghost tp-home__ghost">
          {c.secondary.label}
        </Link>
      </div>
    </Scene>
  );
}
