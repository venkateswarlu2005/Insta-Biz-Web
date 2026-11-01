import Image from 'next/image';
import type { CSSProperties } from 'react';

// Tilt, tape position and tape colour cycle by position, exactly as the original.
const TILTS = [-2.2, 1.6, -0.9, 2.4, -1.5, 0.8, -2.6, 1.2];
const TAPES = ['center', 'left', 'right', 'corners', 'center', 'right', 'left', 'center'] as const;
const TAPE_COLOURS = ['#f6d79a', '#f9cdbf', '#cfe5f6', '#f6d79a', '#e9dcc4'];

export type PolaroidMedia = {
  src: string;
  alt: string;
  caption?: string;
  color?: string;
  width?: number;
  height?: number;
};

type Props = {
  media: PolaroidMedia;
  order: number;
  sizes: string;
  /** overrides media.caption */
  caption?: string;
  priority?: boolean;
};

/** A taped polaroid print. The caption strip is always there (it gives the print its shape) but only holds real captions. */
export function Polaroid({ media, order, sizes, caption, priority = false }: Props) {
  const tape = TAPES[order % TAPES.length];
  const style = {
    '--tilt': `${TILTS[order % TILTS.length]}deg`,
    '--tape': TAPE_COLOURS[order % TAPE_COLOURS.length],
    '--i': order,
  } as CSSProperties;
  const text = (caption ?? media.caption ?? '').trim();

  return (
    <span className="tp-polaroid" style={style}>
      {tape === 'corners' ? (
        <>
          <span aria-hidden="true" className="tp-tape tp-tape--tl" />
          <span aria-hidden="true" className="tp-tape tp-tape--tr" />
        </>
      ) : (
        <span aria-hidden="true" className={`tp-tape tp-tape--${tape}`} />
      )}
      <span className="tp-polaroid__photo">
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width ?? 1200}
          height={media.height ?? 1200}
          sizes={sizes}
          priority={priority}
          style={{ width: '100%', height: 'auto', backgroundColor: media.color }}
        />
      </span>
      <span className="tp-polaroid__caption font-scrawl">{text}</span>
    </span>
  );
}
