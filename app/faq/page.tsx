import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { NoticeBoard, type Faq } from '@/components/faq/NoticeBoard';
import copy from '@/content/faq.json';
import { waLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Questions & answers',
  description: 'Answers about TeddyPups puppies: health checks and vaccinations, meeting local puppies, imported teacup breeds and delivery.',
};

export default function FaqPage() {
  return (
    <div data-page="faq" className="tp-page">
      <section
        data-pup-scene="true"
        data-tone="dark"
        className="tp-scene tp-faqroom overflow-hidden"
        style={{ '--sky-top': '#a95e32', '--sky-bottom': '#331c11' } as CSSProperties}
        aria-labelledby="faq-title"
      >
        <div className="gutter relative mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="max-w-4xl">
            <h1 id="faq-title" className="font-plush text-giant">
              {copy.title}
            </h1>
            <p className="text-lede mt-6 max-w-[52ch] text-[var(--ink-soft)]">{copy.intro}</p>
          </header>
          <div className="mt-12 md:mt-16">
            <NoticeBoard faqs={copy.faqs as Faq[]} askHref={waLink(copy.askText)} />
          </div>
        </div>
      </section>
    </div>
  );
}
