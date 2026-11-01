import { Chat } from '@/components/home/Chat';
import { HOME } from '@/components/home/copy';
import { Dusk } from '@/components/home/Dusk';
import type { Friend } from '@/components/home/HeroLineup';
import { Meet, type DoorPup } from '@/components/home/Meet';
import { Hero, HomeCta, Night, Passport, Paths } from '@/components/home/Scenes';
import { getAvailablePuppies, getFamilyPhotos, getHeroPuppies } from '@/lib/content';
import { coverImage, genderWord, hasVideo, puppyTitle, slugify, type Puppy } from '@/lib/puppy';
import { site, waLink } from '@/lib/site';

const friend = (p: Puppy): Friend => ({ slug: p.slug, displayName: puppyTitle(p), breed: p.breed, cover: coverImage(p) });

/** Door plate line, e.g. "Maltipoo, boy, 3 months, with video" (the breed is the name when there is no pet name). */
const doorMeta = (p: Puppy) =>
  [p.name ? p.breed : '', genderWord(p), p.age, hasVideo(p) ? 'with video' : ''].filter(Boolean).join(', ');

/** Breeds we have right now, most puppies first (ties keep page order). */
function breedChips(pups: Puppy[]) {
  const count = new Map<string, number>();
  for (const p of pups) for (const b of p.breeds) count.set(b, (count.get(b) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => ({ slug: slugify(name), name }));
}

export default function HomePage() {
  const available = getAvailablePuppies();
  // The line-up opens with the puppies marked "hero" and then cycles through everyone available.
  const heroes = getHeroPuppies();
  const lineup = [...heroes, ...available.filter((p) => !heroes.some((h) => h.slug === p.slug))].map(friend);
  const doors: DoorPup[] = available.map((p) => ({
    slug: p.slug,
    displayName: puppyTitle(p),
    meta: doorMeta(p),
    status: p.status,
    cover: coverImage(p),
  }));
  const flyer = available.find((p) => p.koreanTeacup) ?? available.find((p) => p.origin === 'imported');
  const firstHome = available[0];
  // captioned family photos lead the wall; the viewer pages through all of them
  const photos = getFamilyPhotos();
  const wall = [...photos.filter((p) => p.caption), ...photos.filter((p) => !p.caption)];

  return (
    <div data-page="home" className="tp-page">
      <div data-section="hero">
        <Hero friends={lineup} />
      </div>
      <div data-section="meet">
        <Meet {...HOME.meet} puppies={doors} />
      </div>
      <div data-section="paths">
        <Paths
          flight={{
            photo: flyer ? coverImage(flyer).src : undefined,
            label: `A plane bringing a ${flyer ? puppyTitle(flyer) : 'puppy'}${flyer ? ' puppy' : ''} from Korea to Dubai`,
          }}
        />
      </div>
      <div data-section="journey">
        <Chat
          {...HOME.journey}
          business={site.brand}
          greeting={site.whatsappGreeting}
          whatsappHref={waLink()}
          breeds={breedChips(available)}
        />
      </div>
      <div data-section="trust">
        <Passport />
      </div>
      <div data-section="families">
        <Dusk {...HOME.families} photos={wall} />
      </div>
      <div data-section="questions">
        <Night />
      </div>
      <div data-section="cta">
        <HomeCta inside={firstHome && { photo: coverImage(firstHome), name: puppyTitle(firstHome) }} />
      </div>
    </div>
  );
}
