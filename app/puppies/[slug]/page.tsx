import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Img } from '@/components/Img';
import { PawIcon } from '@/components/icons';
import { RevealScope } from '@/components/RevealScope';
import { PupBuddy } from '@/components/pup/PupBuddy';
import { enquiryLabel } from '@/components/puppies/card';
import { EnquiryForm } from '@/components/puppies/EnquiryForm';
import { PuppyGallery } from '@/components/puppies/PuppyGallery';
import { StoryRibbon } from '@/components/puppies/StoryRibbon';
import { getAllPuppies, getAvailablePuppies, getGoneHomePuppies, getPuppy } from '@/lib/content';
import {
  coverImage,
  GENDER_LABEL,
  genderWord,
  hasVideo,
  isGoneHome,
  ORIGIN_LABEL,
  puppyTitle,
  puppyUrl,
  puppyWhatsAppText,
  type Puppy,
} from '@/lib/puppy';
import { site, waLink } from '@/lib/site';
import '@/app/styles/puppies.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPuppies().map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getPuppy(slug);
  if (!p) return {};
  // "Max, Maltipoo puppy" or "Korean Teacup Maltipoo puppy (girl)"
  const title = p.name ? `${p.name}, ${p.breed} puppy` : `${p.breed} puppy (${genderWord(p)})`;
  const where = p.origin === 'imported' ? 'imported' : 'in Dubai';
  const description = `Meet ${p.name || `this ${p.breed}`}: ${p.breed}, ${genderWord(p)}${p.age ? `, ${p.age} old` : ''}, ${where}. Real photos${
    hasVideo(p) ? ' and video' : ''
  } from ${site.brand}.`;
  const cover = coverImage(p);
  return {
    title,
    description,
    alternates: { canonical: `/puppies/${p.slug}` },
    openGraph: { title, description, images: cover.src ? [cover.src] : undefined },
  };
}

const COMES_WITH = [
  'Vaccinated',
  'Dewormed',
  'Verified health certificate from licensed vets',
  'Thoroughly checked before joining your family',
];

const WAY_HOME: Record<Puppy['origin'], { heading: string; steps: { title: string; text: string }[] }> = {
  imported: {
    heading: 'Coming home from abroad',
    steps: [
      { title: 'Reserve your puppy', text: 'Tell us which puppy has captured your heart.' },
      { title: 'Personalized consultation', text: "We finalize details with you and share updates on your puppy's journey." },
      { title: 'Import and arrival', text: 'We manage health checks, travel arrangements, and documentation.' },
      { title: 'Welcome home', text: 'We help your new puppy settle in and ensure a smooth transition into your home.' },
    ],
  },
  dubai: {
    heading: 'Coming home in Dubai',
    steps: [
      { title: 'Choose your puppy', text: 'Tell us which puppy has captured your heart.' },
      { title: 'Meet before you choose', text: 'Visit our Downtown Dubai showroom and spend time bonding.' },
      { title: 'Collection or delivery', text: 'Pick your puppy up from us or have them delivered to your home within Dubai.' },
      { title: 'Welcome home', text: 'We help your new puppy settle in and ensure a smooth transition into your home.' },
    ],
  },
};

function Chapter({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="tp-chapter">
      <span aria-hidden="true" className="tp-chapter__n font-plush">
        {n}
      </span>
      <span className="font-scrawl">{children}</span>
    </p>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 32 32" className="mt-0.5 size-6 shrink-0 text-toffee-deep" aria-hidden="true">
      <path d="M5 17l7 7L27 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Previous pup" / "Next pup" cards; the second mirrors the first on wider screens. */
function PupLink({ pup, label }: { pup: Puppy; label: string }) {
  const cover = coverImage(pup);
  return (
    <Link
      href={`/puppies/${pup.slug}`}
      className="group flex items-center gap-5 rounded-[2rem] border-[3px] border-cocoa bg-milk p-4 transition-transform duration-500 hover:-rotate-1 sm:last:flex-row-reverse sm:last:text-right"
    >
      <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[999px_999px_0.6rem_0.6rem] border-[3px] border-cocoa bg-honey-soft">
        <Img media={cover} sizes="80px" />
      </span>
      <span className="min-w-0">
        <span className="font-scrawl block text-sm text-cocoa-soft">{label}</span>
        <span className="font-plush text-[1.6rem]">{puppyTitle(pup)}</span>
      </span>
    </Link>
  );
}

export default async function PuppyPage({ params }: Params) {
  const { slug } = await params;
  const p = getPuppy(slug);
  if (!p) notFound();

  const gone = isGoneHome(p);
  const title = puppyTitle(p);
  const cover = coverImage(p);
  const wa = waLink(puppyWhatsAppText(p));
  const label = p.name ? `${p.name} (${p.breed})` : p.breed;

  // previous / next within the same shelf (available or gone home), wrapping around
  const shelf = gone ? getGoneHomePuppies() : getAvailablePuppies();
  const i = shelf.findIndex((x) => x.slug === p.slug);
  const prev = shelf.length > 1 ? shelf[(i - 1 + shelf.length) % shelf.length] : null;
  const next = shelf.length > 1 ? shelf[(i + 1) % shelf.length] : null;

  const way = WAY_HOME[p.origin];
  let chapter = 2;
  const wayChapter = gone ? 0 : ++chapter;
  const letterChapter = ++chapter;

  const facts: [string, string][] = [
    ['Breed', p.breed],
    ['Boy or girl', GENDER_LABEL[p.gender]],
    ['Age', p.age],
    ...(p.colour ? ([['Colour', p.colour]] as [string, string][]) : []),
    ['Where', ORIGIN_LABEL[p.origin]],
  ];

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      gone
        ? { '@type': 'ListItem', position: 1, name: 'Gone home', item: `${site.siteUrl}/gone-home` }
        : { '@type': 'ListItem', position: 1, name: 'Puppies', item: `${site.siteUrl}/puppies` },
      { '@type': 'ListItem', position: 2, name: title, item: puppyUrl(p) },
    ],
  };

  return (
    <div data-page="pup" className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <article
        className="tp-storybook"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${cover.color || '#fbe3b4'} 24%, var(--color-milk)) 0, var(--color-milk) 85%)`,
        }}
      >
        <StoryRibbon />
        <RevealScope className="gutter mx-auto max-w-[110rem] pb-20 pt-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="text-[0.95rem] font-semibold text-cocoa-soft">
            <Link className="link-ink" href={gone ? '/gone-home' : '/puppies'}>
              {gone ? 'Gone home' : 'Available puppies'}
            </Link>
            <span aria-hidden="true">{' / '}</span>
            <span aria-current="page">{title}</span>
          </nav>
          <Chapter n={1}>{gone ? 'the day they went home' : "hello, it's me"}</Chapter>

          <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-7">
              <PuppyGallery name={title} media={p.media} />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+5.5rem)]">
                <div className="tp-tag tp-board mt-16 !rounded-[2.2rem_2.2rem_2.2rem_0.6rem] !p-7 md:!p-9 lg:mt-20" data-reveal>
                  <span aria-hidden="true" className="tp-tag__ring" />
                  <PupBuddy pose="peek" className="absolute -top-[4.8rem] right-6 w-[9.5rem]" label={`Teddy, peeking over ${title}'s tag`} />
                  {gone ? (
                    <span className="inline-grid place-items-center rounded-full border-[3px] border-current px-3 py-1 font-scrawl text-sm uppercase tracking-wide -rotate-6 text-toffee-deep">
                      Gone home ♥
                    </span>
                  ) : (
                    <span className="chip">
                      <PawIcon className="size-4 text-toffee" />
                      {p.status === 'reserved' ? 'Reserved' : 'Available'}
                    </span>
                  )}
                  <h1 className="font-plush mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">{title}</h1>
                  {p.name && <p className="mt-2 text-lg font-semibold text-cocoa-soft">{p.breed}</p>}
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
                    {facts.map(([dt, dd]) => (
                      <div key={dt}>
                        <dt className="font-scrawl text-sm text-cocoa-soft">{dt}</dt>
                        <dd className="mt-0.5 text-[1.05rem] font-semibold">{dd}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-8 flex flex-col gap-3">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      {gone ? 'Ask about a puppy like this' : p.name ? `Ask about ${p.name} on WhatsApp` : 'Ask about this puppy on WhatsApp'}
                    </a>
                    <a href={`#enquire-${p.slug}`} className="btn btn-ghost">
                      Send an enquiry
                    </a>
                  </div>
                </div>
                <div className="tp-paper mt-8 -rotate-1">
                  <Chapter n={2}>what comes with {p.name || `this ${p.breed}`}</Chapter>
                  <h2 className="font-plush mt-1 text-[1.9rem]">Every Teddy Pup comes</h2>
                  <ul className="mt-4 space-y-2.5">
                    {COMES_WITH.map((c) => (
                      <li key={c} className="flex items-start gap-3 font-semibold">
                        <Tick />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {!gone && (
            <section aria-labelledby={`home-steps-${p.slug}`} className="mt-20">
              <Chapter n={wayChapter}>the way home</Chapter>
              <h2 id={`home-steps-${p.slug}`} className="font-plush text-big mt-3">
                {way.heading}
              </h2>
              <ol className="tp-trail tp-trail--row tp-trail--paws mt-10">
                {way.steps.map((s, n) => (
                  <li key={s.title}>
                    <span aria-hidden="true" className="tp-trail__num font-plush">
                      {n + 1}
                    </span>
                    <h3 className="font-plush-text text-xl font-bold leading-tight">{s.title}</h3>
                    <p className="mt-2 max-w-[38ch] text-cocoa-soft">{s.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id={`enquire-${p.slug}`} aria-labelledby={`enquire-title-${p.slug}`} className="tp-letter mt-20 grid gap-10 lg:grid-cols-12">
            <span aria-hidden="true" className="tp-letter__stamp">
              <PawIcon className="size-9" />
            </span>
            <div className="lg:col-span-4">
              <Chapter n={letterChapter}>dear TeddyPups…</Chapter>
              <h2 id={`enquire-title-${p.slug}`} className="font-plush text-big mt-2">
                {gone ? 'Looking for a puppy like this?' : p.name ? `Ask about ${p.name}` : 'Ask about this puppy'}
              </h2>
              <p className="mt-4 text-cocoa-soft">
                Leave your details and our team will get back to you promptly — or message us on WhatsApp for the quickest reply.
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm
                puppy={enquiryLabel(p)}
                puppyUrl={puppyUrl(p)}
                source={gone ? 'gone-home-page' : 'puppy-page'}
                defaultMessage={gone ? `Hi! I'm looking for a puppy like ${label}.` : `Hi! I'd love to know more about ${label}.`}
                whatsappHref={wa}
              />
            </div>
          </section>

          {prev && next && (
            <nav aria-label="More puppies" className="mt-16 grid gap-4 sm:grid-cols-2">
              <PupLink pup={prev} label="Previous pup" />
              <PupLink pup={next} label="Next pup" />
            </nav>
          )}
        </RevealScope>
      </article>
    </div>
  );
}
