import type { MetadataRoute } from 'next';
import { getAllPuppies } from '@/lib/content';
import { NAV, site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...NAV.map((n) => n.href), '/gone-home'].map((href) => ({
    url: `${site.siteUrl}${href === '/' ? '' : href}`,
    changeFrequency: 'weekly' as const,
  }));
  const puppies = getAllPuppies().map((p) => ({
    url: `${site.siteUrl}/puppies/${p.slug}`,
    changeFrequency: p.status === 'gone-home' ? ('yearly' as const) : ('weekly' as const),
  }));
  return [...pages, ...puppies];
}
