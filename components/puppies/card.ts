// The small, serialisable view of a puppy used by cards, the filter browser and tickets.
import { coverImage, genderWord, hasVideo, puppyMeta, puppyTitle, slugify, type MediaItem, type Puppy } from '@/lib/puppy';

export const STATUS_LABEL = { available: 'Available', reserved: 'Reserved', 'gone-home': 'Gone home' } as const;

export type PupCard = {
  slug: string;
  title: string;
  breed: string;
  /** always "breed · gender · age" */
  meta: string;
  aria: string;
  status: Puppy['status'];
  gender: Puppy['gender'];
  origin: Puppy['origin'];
  koreanTeacup: boolean;
  breeds: { slug: string; name: string }[];
  cover: Pick<MediaItem, 'src' | 'alt' | 'focus' | 'color'>;
  video: boolean;
};

export function toCard(p: Puppy): PupCard {
  const title = puppyTitle(p);
  const meta = puppyMeta(p);
  const c = coverImage(p);
  return {
    slug: p.slug,
    title,
    breed: p.breed,
    meta,
    // same words as the card shows: "Max, Maltipoo, boy, 3 months, available"
    aria: `${title}, ${puppyMeta(p, ', ')}, ${STATUS_LABEL[p.status].toLowerCase()}`,
    status: p.status,
    gender: p.gender,
    origin: p.origin,
    koreanTeacup: p.koreanTeacup,
    breeds: (p.breeds.length ? p.breeds : [p.breed]).map((name) => ({ slug: slugify(name), name })),
    cover: { src: c.src, alt: c.alt, focus: c.focus, color: c.color },
    video: hasVideo(p),
  };
}

/** "Max (Maltipoo, boy)" or "Toy Poodle (boy & girl)": how a puppy is named in an enquiry */
export const enquiryLabel = (p: Puppy) => (p.name ? `${p.name} (${p.breed}, ${genderWord(p)})` : `${p.breed} (${genderWord(p)})`);
