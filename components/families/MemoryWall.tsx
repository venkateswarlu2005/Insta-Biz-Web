'use client';

import type { CSSProperties } from 'react';
import { PawIcon } from '@/components/icons';
import { RevealScope } from '@/components/RevealScope';
import { Polaroid, type PolaroidMedia } from '@/components/families/Polaroid';
import { usePhotoViewer } from '@/components/families/PhotoViewer';

const SIZES = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw';

/** The wall of family polaroids; each one opens the photo viewer. */
export function MemoryWall({ photos }: { photos: PolaroidMedia[] }) {
  const { open, viewer } = usePhotoViewer(photos, SIZES);

  return (
    <>
      <RevealScope>
        <ul className="tp-wall" aria-label="Photos from TeddyPups families">
          {photos.map((photo, i) => (
            <li key={photo.src} className="tp-wall__item" data-reveal="true" style={{ '--d': `${(i % 4) * 60}ms` } as CSSProperties}>
              <button
                type="button"
                className="tp-wall__print"
                onClick={() => open(i)}
                aria-label={`Open photo ${i + 1} of ${photos.length}${photo.caption ? `: ${photo.caption}` : ''}`}
              >
                <Polaroid media={photo} order={i} sizes={SIZES} priority={i < 2} />
                <PawIcon className="tp-wall__paw" />
              </button>
            </li>
          ))}
        </ul>
      </RevealScope>
      {viewer}
    </>
  );
}
