// Puppy types and display helpers. Safe to import from client components.
import { site } from '@/lib/site';

export type MediaItem = {
  type: 'image' | 'video';
  src: string;
  /** video only: still frame shown before playing */
  poster?: string;
  alt: string;
  /** CSS object-position, e.g. "52.5% 42.6%" */
  focus?: string;
  /** placeholder colour while loading */
  color?: string;
};

export type Status = 'available' | 'reserved' | 'gone-home';
export type Gender = 'boy' | 'girl' | 'boy-girl';
export type Origin = 'dubai' | 'imported';

export type Puppy = {
  slug: string;
  /** pet name, e.g. "Max"; empty when the puppy is listed by breed only */
  name: string;
  /** breed as shown, e.g. "Korean Teacup Maltipoo" */
  breed: string;
  /** breed tags used by the filters, e.g. ["Maltipoo", "Cavapoo"] */
  breeds: string[];
  gender: Gender;
  age: string;
  colour: string;
  origin: Origin;
  koreanTeacup: boolean;
  status: Status;
  /** shown in the home page hero line-up */
  hero: boolean;
  order: number;
  description: string;
  media: MediaItem[];
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Headline name: the pet name, or the breed when there is none. */
export const puppyTitle = (p: Puppy) => p.name || p.breed;

export const GENDER_LABEL: Record<Gender, string> = { boy: 'Boy', girl: 'Girl', 'boy-girl': 'Boy & girl' };
export const genderWord = (p: Puppy) => GENDER_LABEL[p.gender].toLowerCase();

export const ORIGIN_LABEL: Record<Origin, string> = { dubai: 'In Dubai', imported: 'Imported for you' };

export const isGoneHome = (p: Puppy) => p.status === 'gone-home';

/** Short line used under names everywhere, always in the same order: breed · gender · age */
export const puppyMeta = (p: Puppy, sep = ' · ') => [p.breed, genderWord(p), p.age].filter(Boolean).join(sep);

/** The image that represents the puppy in lists (first photo, or the first video's poster). */
export function coverImage(p: Puppy): MediaItem {
  const m = p.media.find((x) => x.type === 'image') ?? p.media[0];
  if (!m) return { type: 'image', src: '/brand/logo.png', alt: puppyTitle(p) };
  return m.type === 'video' ? { ...m, type: 'image', src: m.poster || '' } : m;
}

export const hasVideo = (p: Puppy) => p.media.some((m) => m.type === 'video');

export const puppyUrl = (p: Puppy) => `${site.siteUrl}/puppies/${p.slug}`;

/** Alt text that always reads naturally, e.g. "Max, male Maltipoo puppy" */
export function puppyAlt(p: Puppy) {
  const sex = p.gender === 'boy' ? 'male ' : p.gender === 'girl' ? 'female ' : '';
  const text = `${p.name ? p.name + ', ' : ''}${sex}${p.breed} puppy`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** WhatsApp message prefilled from a puppy page. */
export function puppyWhatsAppText(p: Puppy) {
  return isGoneHome(p)
    ? `Hi TeddyPups! I loved ${puppyTitle(p)} (${puppyUrl(p)}). Do you have a puppy like this?`
    : p.name
      ? `Hi TeddyPups! I'm interested in ${p.name}, the ${p.breed}: ${puppyUrl(p)}`
      : `Hi TeddyPups! I'm interested in the ${puppyTitle(p)} (${genderWord(p)}): ${puppyUrl(p)}`;
}
