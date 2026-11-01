import Image, { type ImageProps } from 'next/image';
import type { MediaItem } from '@/lib/puppy';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  media: Pick<MediaItem, 'src' | 'alt' | 'focus' | 'color'>;
  alt?: string;
};

/** Fills its (relatively positioned) parent, cropped around the photo's focus point. */
export function Img({ media, alt, style, sizes = '100vw', ...rest }: Props) {
  return (
    <Image
      src={media.src}
      alt={alt ?? media.alt}
      fill
      sizes={sizes}
      style={{ objectFit: 'cover', objectPosition: media.focus || '50% 50%', backgroundColor: media.color, ...style }}
      {...rest}
    />
  );
}
