// Build-time content loading (server components only). Content lives in /content as JSON,
// edited through Sveltia CMS at /admin. Each puppy is one file: content/puppies/<slug>.json
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { Puppy } from '@/lib/puppy';

const CONTENT = path.join(process.cwd(), 'content');

const readJson = <T,>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;

let cache: Puppy[] | null = null;

export function getAllPuppies(): Puppy[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const dir = path.join(CONTENT, 'puppies');
  cache = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = readJson<Partial<Puppy>>(path.join(dir, f));
      return {
        name: '',
        breeds: [],
        colour: '',
        origin: 'imported',
        koreanTeacup: false,
        status: 'available',
        hero: false,
        order: 999,
        description: '',
        media: [],
        ...raw,
        slug: f.replace(/\.json$/, ''),
      } as Puppy;
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  return cache;
}

/** Puppies still looking for a home (available + reserved), in display order. */
export const getAvailablePuppies = () => getAllPuppies().filter((p) => p.status !== 'gone-home');

export const getGoneHomePuppies = () => getAllPuppies().filter((p) => p.status === 'gone-home');

export const getHeroPuppies = () => getAvailablePuppies().filter((p) => p.hero).slice(0, 6);

export const getPuppy = (slug: string) => getAllPuppies().find((p) => p.slug === slug);

export type FamilyPhoto = {
  src: string;
  alt: string;
  caption: string;
  focus?: string;
  color?: string;
  width?: number;
  height?: number;
};

export const getFamilyPhotos = () => readJson<{ photos: FamilyPhoto[] }>(path.join(CONTENT, 'families.json')).photos;
