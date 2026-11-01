import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Flight } from '@/components/how-it-works/Flight';
import { Journeys, type Journey } from '@/components/how-it-works/Journeys';
import { ChatIcon, HeartIcon, PlaneIcon } from '@/components/how-it-works/PromiseIcons';
import { Skyline } from '@/components/how-it-works/StepIcons';
import { PupBuddy } from '@/components/pup/PupBuddy';
import copy from '@/content/how-it-works.json';
import '@/app/styles/pages.css';
import { waLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Meet a local puppy in our Downtown Dubai showroom or reserve a premium teacup breed imported for you — every step, from choosing to coming home.',
};

const ON_THIS_PAGE = [
  { href: '#two-ways', label: 'Two ways home' },
  { href: '#promise', label: copy.promise.title },
  { href: '#delivery', label: copy.delivery.title },
  { href: '#why', label: copy.why.title },
];

// Passport stamps: shape, ink and tilt per entry, as in the original.
const STAMPS: { shape: string; ink: string; tilt: string; icon: ReactNode }[] = [
  { shape: 'round', ink: '#a24a1a', tilt: '-8deg', icon: <HeartIcon /> },
  { shape: 'ticket', ink: '#1f6b45', tilt: '5deg', icon: <PlaneIcon /> },
  { shape: 'oval', ink: '#5a3a28', tilt: '-4deg', icon: <ChatIcon /> },
];

const WHY_ICONS = [<PlaneIcon key="p" />, <ChatIcon key="c" />, <HeartIcon key="h" />];

export default function HowItWorksPage() {
  return (
    <div data-page="how" className="tp-page">
      <section
        data-pup-scene="true"
        data-tone="light"
        className="tp-scene "
        style={{ '--sky-top': '#fffbf3', '--sky-bottom': '#f6cc85' } as CSSProperties}
        aria-labelledby="how-title"
      >
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="grid gap-8 md:grid-cols-12 md:items-end">
            <h1 id="how-title" className="font-plush text-giant md:col-span-7">
              {copy.title}
            </h1>
            <p className="text-lede text-[var(--ink-soft)] md:col-span-5 md:pb-4">{copy.intro}</p>
          </header>

          <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2">
            {ON_THIS_PAGE.map((l, i) => (
              <a key={l.href} href={l.href} className="chip h-11 border-2 border-cocoa !bg-milk px-4 hover:!bg-honey-soft">
                <span className="font-plush text-toffee">{i + 1}</span>
                {l.label}
              </a>
            ))}
          </nav>

          <div id="two-ways">
            <Journeys journeys={copy.journeys as Journey[]} />
          </div>

          <section id="promise" aria-labelledby="promise-title" className="tp-paper mt-24 -rotate-[0.6deg]">
            <p aria-hidden="true" className="font-scrawl text-lg text-toffee-ink">
              {copy.promise.kicker}
            </p>
            <h2 id="promise-title" className="font-plush text-huge mt-1 max-w-[16ch]">
              {copy.promise.title}
            </h2>
            <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {copy.promise.entries.map((e, i) => {
                const stamp = STAMPS[i % STAMPS.length];
                return (
                  <li key={e.title} className="tp-entry" style={{ '--ink-stamp': stamp.ink, '--tilt': stamp.tilt, '--i': i } as CSSProperties}>
                    <span className={`tp-stamp tp-stamp--${stamp.shape}`}>
                      <svg viewBox="0 0 64 64" className="tp-stamp__icon" aria-hidden="true">
                        {stamp.icon}
                      </svg>
                      <span className="tp-stamp__title font-plush">{e.title}</span>
                    </span>
                    <p className="tp-entry__text">{e.text}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section id="delivery" aria-labelledby="delivery-title" className="mt-24 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 id="delivery-title" className="font-plush text-huge">
                {copy.delivery.title}
              </h2>
              <p className="text-lede mt-5 text-[var(--ink-soft)]">{copy.delivery.intro}</p>
              <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {copy.delivery.items.map((d) => (
                  <li key={d.title}>
                    <h3 className="font-plush-text text-[1.3rem] font-bold leading-snug">{d.title}</h3>
                    <p className="mt-1.5 text-[var(--ink-soft)]">{d.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-[clamp(14rem,30vw,22rem)] lg:col-span-6">
              <Skyline className="absolute inset-x-0 bottom-0 w-full text-cocoa/25" />
              <Flight photo={null} label="A plane flying puppies from Korea to Dubai" />
            </div>
          </section>

          <section id="why" aria-labelledby="why-title" className="mt-24 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="why-title" className="font-plush text-huge">
                {copy.why.title}
              </h2>
              <p className="text-lede mt-6 text-[var(--ink-soft)]">{copy.why.intro}</p>
            </div>
            <ul className="space-y-8 lg:col-span-6 lg:col-start-7">
              {copy.why.items.map((w, i) => (
                <li key={w.title} className="flex gap-5">
                  <svg viewBox="0 0 64 64" className="size-14 shrink-0 text-toffee-deep" aria-hidden="true">
                    {WHY_ICONS[i % WHY_ICONS.length]}
                  </svg>
                  <div>
                    <h3 className="font-plush text-[1.7rem]">{w.title}</h3>
                    <p className="mt-2 text-[var(--ink-soft)]">{w.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* text / actions / teddy are grid areas (pages.css) so the two buttons stay side by side on tablets */}
          <section aria-labelledby="care-title" className="tp-board tp-care mt-24 grid items-center gap-8 md:grid-cols-[1fr_auto] md:!p-12">
            <div className="tp-care__text">
              <h2 id="care-title" className="font-plush text-big">
                {copy.care.title}
              </h2>
              <p className="text-lede measure mt-5 text-cocoa-soft">{copy.care.text}</p>
            </div>
            <div className="tp-care__actions flex flex-wrap gap-3">
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                Ask us on WhatsApp
              </a>
              <Link className="btn btn-ghost" href="/puppies">
                See available puppies
              </Link>
            </div>
            <PupBuddy pose="bow" facing="left" className="tp-care__teddy mx-auto w-48 md:w-56" label="Teddy, ready to play" />
          </section>
        </div>
      </section>
    </div>
  );
}
