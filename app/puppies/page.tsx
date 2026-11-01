import type { Metadata } from 'next';
import Link from 'next/link';
import { RevealScope } from '@/components/RevealScope';
import { PupBuddy } from '@/components/pup/PupBuddy';
import { toCard } from '@/components/puppies/card';
import { PuppyBrowser } from '@/components/puppies/PuppyBrowser';
import { PuppySketch } from '@/components/puppies/PuppySketch';
import { getAvailablePuppies, getGoneHomePuppies } from '@/lib/content';
import { waLink } from '@/lib/site';
import '@/app/styles/puppies.css';

export const metadata: Metadata = {
  title: 'Available puppies',
  description:
    'Teacup and teddy bear puppies available now in Dubai and imported from trusted breeders — every listing shows real photos of the puppy.',
  alternates: { canonical: '/puppies' },
};

export default function PuppiesPage() {
  const puppies = getAvailablePuppies().map(toCard);
  const gone = getGoneHomePuppies().slice(0, 5).map(toCard);

  return (
    <div data-page="pups" className="tp-page">
      <section aria-labelledby="pups-title" className="tp-sketchbook">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          {/* the browser has its own reveal scope (it hydrates later, inside Suspense) */}
          <RevealScope className="tp-sketchbook__head">
            <div className="tp-sketchbook__words">
              <p className="font-scrawl text-lg text-toffee-ink" data-reveal>
                from Teddy&apos;s sketchbook
              </p>
              <h1 id="pups-title" className="font-plush text-giant tp-sketchbook__title" data-reveal>
                Available puppies
                <svg aria-hidden="true" viewBox="0 0 400 24" preserveAspectRatio="none" className="tp-sketchbook__underline">
                  <path d="M4 15c40-9 70 5 112-2s70-9 112 0 74 8 116-1 38-4 52 1" pathLength={1} />
                </svg>
              </h1>
              <p className="tp-sketchbook__lede text-lede mt-6 max-w-[46ch] text-cocoa-soft" data-reveal>
                Every listing shows real photos of the actual puppy. Open a profile to see them all, then ask us about them on WhatsApp.
              </p>
            </div>
            <div className="tp-sketchbook__self" data-reveal>
              <PupBuddy pose="sit" facing="left" label="Teddy, the TeddyPups puppy" />
              <span className="font-scrawl tp-sketchbook__caption">self-portrait</span>
            </div>
          </RevealScope>
          <div className="mt-12">
            <PuppyBrowser puppies={puppies} whatsappHref={waLink()} />
          </div>
        </div>
      </section>

      {gone.length > 0 && (
        <RevealScope>
          <section aria-labelledby="gone-title" className="tp-gone-strip">
            <div className="gutter mx-auto flex max-w-[110rem] flex-col gap-10 md:flex-row md:items-center">
              <div className="md:w-1/3" data-reveal>
                <h2 id="gone-title" className="font-plush text-big">
                  Already gone home
                </h2>
                <p className="mt-3 text-cocoa-soft">These puppies have found their families.</p>
                <Link href="/gone-home" className="btn btn-primary mt-6">
                  See the puppies who&apos;ve gone home
                </Link>
              </div>
              <ul className="tp-gone-strip__row" aria-label="Some puppies who have gone home">
                {gone.map((p, i) => (
                  <li key={p.slug}>
                    <PuppySketch pup={p} index={i} small sizes="(min-width: 768px) 11rem, 30vw" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </RevealScope>
      )}
    </div>
  );
}
