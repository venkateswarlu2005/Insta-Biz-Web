import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { LetterForm, type PuppyOption } from '@/components/contact/LetterForm';
import { Skyline } from '@/components/how-it-works/StepIcons';
import { PawIcon } from '@/components/icons';
import { Img } from '@/components/Img';
import { PupBuddy } from '@/components/pup/PupBuddy';
import copy from '@/content/contact.json';
import { getAvailablePuppies } from '@/lib/content';
import { genderWord, puppyUrl, type Puppy } from '@/lib/puppy';
import { site, telLink, waLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Visit & contact',
  description: 'Visit TeddyPups in Downtown Dubai or get in touch on WhatsApp, by phone or email.',
};

/** "Max (Maltipoo, boy)" or, for unnamed puppies, "Maltipoo (girl)". */
const optionLabel = (p: Puppy) => (p.name ? `${p.name} (${p.breed}, ${genderWord(p)})` : `${p.breed} (${genderWord(p)})`);

export default function ContactPage() {
  const puppies: PuppyOption[] = getAvailablePuppies().map((p) => ({ id: p.slug, label: optionLabel(p), url: puppyUrl(p) }));

  return (
    <div data-page="contact" className="tp-page">
      <section
        data-pup-scene="true"
        data-tone="light"
        className="tp-scene "
        style={{ '--sky-top': '#fff9ee', '--sky-bottom': '#f9dca4' } as CSSProperties}
        aria-labelledby="contact-title"
      >
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <h1 id="contact-title" className="font-plush text-giant max-w-[12ch] lg:col-span-7">
              {copy.title}
            </h1>
            <p className="text-lede text-[var(--ink-soft)] lg:col-span-5 lg:pb-3">{copy.intro}</p>
          </header>

          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
              <LetterForm puppies={puppies} success={copy.success} fallback={copy.fallback} whatsappHref={waLink()} />
              <PupBuddy pose="sit" facing="left" className="ml-auto mr-6 -mt-3 w-36 md:w-40" label="Teddy, waiting for your letter" />
            </div>

            <div className="lg:col-span-5 lg:row-start-1">
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full sm:w-auto">
                WhatsApp {site.phone}
              </a>
              <dl className="mt-10 space-y-6">
                <div>
                  <dt className="font-scrawl text-[var(--ink-soft)]">call us</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    <a className="link-ink" href={telLink}>
                      {site.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-scrawl text-[var(--ink-soft)]">email</dt>
                  <dd className="mt-1 break-all text-lg font-semibold">
                    <a className="link-ink" href={`mailto:${site.email}`}>
                      {site.email}
                    </a>
                  </dd>
                </div>
              </dl>

              <section aria-labelledby="visit-title" className="tp-shopfront mt-12">
                <Skyline className="absolute -bottom-1 right-0 w-3/4 text-toffee/30" />
                <div className="tp-visit relative p-7 pt-6">
                  <div>
                    <h2 id="visit-title" className="font-plush text-[2rem] leading-tight">
                      {copy.visit.title}
                    </h2>
                    <p className="mt-3 max-w-[38ch] text-cocoa-soft">{copy.visit.text}</p>
                    <p className="mt-4 flex items-center gap-2 font-semibold">
                      <PawIcon className="size-5 shrink-0 text-toffee-deep" />
                      {site.address}
                    </p>
                    <a href={copy.visit.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-6 !bg-milk">
                      Open in Google Maps
                    </a>
                  </div>
                  <figure className="tp-visit__photo">
                    <Img media={copy.visit.photo} sizes="(min-width: 640px) 11rem, 90vw" />
                  </figure>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
