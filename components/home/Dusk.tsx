'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { usePhotoViewer } from '@/components/families/PhotoViewer';
import { Polaroid, type PolaroidMedia } from '@/components/families/Polaroid';
import { PupStop } from '@/components/pup/PupStop';
import { RevealScope } from '@/components/RevealScope';
import { Scene, TONES } from './Scene';

const SIZES = '(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw';
/** prints land in this order (x 110ms) so the wall fills in scattered, not left to right */
const LANDING = [3, 0, 5, 1, 6, 2, 7, 4];

export type Testimonial = { quote: string; author: string; location?: string };

type Props = {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  testimonial?: Testimonial;
  /** every family photo; the first 8 go on the wall, the viewer pages through all of them */
  photos: PolaroidMedia[];
};

/** "Happy families & puppies": a dusk street with a wall of polaroids, a lamp and a door. */
export function Dusk({ heading, body, ctaLabel, ctaHref, testimonial, photos }: Props) {
  const { open, viewer } = usePhotoViewer(photos, SIZES);
  if (!photos.length) return null;

  return (
    <Scene tone={TONES.dusk} aria-labelledby="dusk-title" className="tp-dusk">
      <div className="tp-dusk__sky gutter">
        <div className="tp-dusk__head">
          <h2 id="dusk-title" className="font-plush text-huge">
            {heading}
          </h2>
          {body && <p className="text-lede mt-5 max-w-[50ch] text-[var(--ink-soft)]">{body}</p>}
        </div>
        {testimonial && (
          <figure className="tp-dusk__note">
            <blockquote className="font-plush-text">“{testimonial.quote}”</blockquote>
            <figcaption className="font-scrawl">
              {testimonial.author}
              {testimonial.location ? `, ${testimonial.location}` : ''}
            </figcaption>
          </figure>
        )}
      </div>
      <div className="tp-photowall">
        <RevealScope className="tp-photowall__wall">
          <ul className="tp-photowall__prints" aria-label="Photos from TeddyPups families">
            {photos.slice(0, 8).map((photo, i) => (
              <li
                key={photo.src}
                data-reveal="true"
                data-pup-look={i === 1 || i === 4 ? '' : undefined}
                style={{ '--d': `${110 * LANDING[i]}ms` } as CSSProperties}
              >
                <button
                  type="button"
                  className="tp-photowall__print"
                  onClick={() => open(i)}
                  aria-label={`Open photo ${i + 1} of ${photos.length}${photo.caption ? `: ${photo.caption}` : ''}`}
                >
                  <Polaroid media={photo} order={i} sizes={SIZES} />
                </button>
              </li>
            ))}
          </ul>
          <div className="tp-facade__ground">
            <span aria-hidden="true" className="tp-facade__door" />
            <span aria-hidden="true" className="tp-lamp">
              <span className="tp-lamp__light" />
            </span>
            {ctaLabel && (
              <Link href={ctaHref} className="btn btn-primary tp-facade__cta">
                {ctaLabel}
              </Link>
            )}
            <PupStop pose="sit" facing="right" className="tp-dusk__teddy" />
          </div>
        </RevealScope>
        <div aria-hidden="true" className="tp-street__pavement" />
      </div>
      {viewer}
    </Scene>
  );
}
