import site from '@/content/site.json';

export { site };

/** wa.me link with a prefilled message (defaults to the general greeting). */
export function waLink(text: string = site.whatsappGreeting) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const telLink = `tel:+${site.whatsapp}`;

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/puppies', label: 'Puppies' },
  { href: '/happy-families', label: 'Happy families' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Visit & contact' },
] as const;
