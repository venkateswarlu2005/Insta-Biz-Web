import type { Metadata, Viewport } from 'next';
import { Figtree, Fraunces, Shantell_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { PupJourney } from '@/components/pup/PupJourney';
import { RouteCurtain } from '@/components/pup/RouteCurtain';
import { Footer } from '@/components/shell/Footer';
import { Header } from '@/components/shell/Header';
import { MotionProvider } from '@/components/shell/MotionProvider';
import { PawTrailCanvas } from '@/components/shell/PawTrailCanvas';
import { SmoothScroll } from '@/components/shell/SmoothScroll';
import { WhatsAppBar } from '@/components/shell/WhatsAppBar';
import { site } from '@/lib/site';
import './styles/site.css';

// Variable fonts with their extra axes: Fraunces SOFT/WONK give the rounded headings and the
// swash "&"; Shantell Sans BNCE/INFM give the bouncy handwriting.
const fraunces = Fraunces({ subsets: ['latin'], axes: ['SOFT', 'WONK', 'opsz'], variable: '--font-fraunces', display: 'swap' });
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });
const shantell = Shantell_Sans({ subsets: ['latin'], axes: ['BNCE', 'INFM'], variable: '--font-shantell', display: 'swap' });

const description =
  'Teddy bear and teacup puppies in Dubai. Meet local puppies in our Downtown Dubai showroom or bring home a rare breed imported from trusted breeders.';

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: { default: `${site.brand} — Premium teacup puppies in Dubai`, template: `%s | ${site.brand}` },
  description,
  applicationName: site.brand,
  openGraph: { title: `${site.brand} — Premium teacup puppies in Dubai`, description, images: ['/brand/logo.png'] },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#fffdf8', viewportFit: 'cover' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'PetStore',
  name: site.brand,
  description: site.about,
  url: site.siteUrl,
  logo: `${site.siteUrl}/brand/logo.png`,
  image: `${site.siteUrl}/brand/logo.png`,
  telephone: `+${site.whatsapp}`,
  email: site.email,
  address: { '@type': 'PostalAddress', streetAddress: site.address, addressLocality: 'Dubai', addressCountry: 'AE' },
  sameAs: site.socials.map((s) => s.url),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable} ${shantell.variable}`}>
      <body>
        <MotionProvider>
          <RouteCurtain />
          <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-cocoa px-5 py-3 font-semibold text-milk">
            Skip to content
          </a>
          <Header />
          <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
            {children}
            <PupJourney />
          </main>
          <Footer />
          <WhatsAppBar />
          <PawTrailCanvas />
          <SmoothScroll />
        </MotionProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
