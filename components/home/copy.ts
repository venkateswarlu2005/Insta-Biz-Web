// Home page words and section photos (exactly as on the original site).
import type { MediaItem } from '@/lib/puppy';

/** Showroom photos of the apricot teddy bear puppy, used in the "Puppies in Dubai" window and the chat. */
const SHOWROOM: MediaItem[] = [
  {
    type: 'image',
    src: '/media/FHyoHcIosLZE/60f6e7e00a/27b888_323008bb0f6a41d4bde2a0da7206cd98f000.jpg',
    alt: 'A tiny apricot teddy bear puppy held up in the TeddyPups showroom',
    focus: '54.3% 48.3%',
    color: '#685848',
  },
  {
    type: 'image',
    src: '/media/Vi-kzyvemRl4/e740ed8a24/27b888_323008bb0f6a41d4bde2a0da7206cd98f001.jpg',
    alt: 'The apricot teddy bear puppy from our showroom, close up',
    focus: '46% 44.4%',
    color: '#685848',
  },
  {
    type: 'image',
    src: '/media/g_e4ebbc7fyG/8276289ae7/27b888_323008bb0f6a41d4bde2a0da7206cd98f002.jpg',
    alt: 'The apricot teddy bear puppy from our showroom, looking up',
    focus: '43.7% 40.2%',
    color: '#080818',
  },
  {
    type: 'image',
    src: '/media/skvodl2NZiKq/cefab5eee9/27b888_323008bb0f6a41d4bde2a0da7206cd98f003.jpg',
    alt: 'The apricot teddy bear puppy from our showroom, held up to say hello',
    focus: '45.3% 44.4%',
    color: '#685848',
  },
];

export const HOME = {
  hero: {
    note: 'every puppy is family',
    titleLines: ['Premium teacup', 'puppies in Dubai'],
    lede: 'Meet your new best friend in our Dubai showroom, or order a rare miniature breed from trusted breeders worldwide.',
    primary: { label: 'View available puppies', href: '/puppies' },
    whatsappLabel: 'Enquire on WhatsApp',
  },
  meet: {
    heading: 'Meet the pups',
    body: 'Real puppies, real photos, looking for their families right now.',
    ctaLabel: 'See all available puppies',
    ctaHref: '/puppies',
  },
  paths: {
    heading: 'Two ways to meet your puppy',
    local: {
      sign: 'Puppies in Dubai',
      photo: SHOWROOM[0],
      caption: 'In our showroom',
      text: 'See them, love them, take them home. Come meet our locally available puppies before you decide.',
      cta: { label: 'Meet local puppies', href: '/puppies?origin=local' },
    },
    imported: {
      sign: 'Imported for you',
      text: "Exclusive Korean teacup puppies, delivered. Order from the world's most reputable breeders and let us handle the import.",
      cta: { label: 'See imported puppies', href: '/puppies?origin=imported' },
    },
  },
  journey: {
    heading: 'Your puppy journey',
    body: 'A premium, step-by-step concierge experience. We make adoption simple, secure, and purely joyful.',
    steps: [
      {
        title: 'Choose your breed',
        text: "Select your preferred breed or tell us what you're looking for. We'll guide you based on availability and your lifestyle.",
      },
      {
        title: 'Get photos & details',
        text: 'Our team will share real photos, health details, and all necessary information directly on WhatsApp.',
      },
      {
        title: 'Secure & safe delivery',
        text: 'Once confirmed, we handle everything professionally and ensure your puppy reaches you safely and stress-free.',
      },
    ],
    ctaLabel: 'How it works',
    ctaHref: '/how-it-works',
    snaps: SHOWROOM,
    clip: {
      src: '/media/dSAUmXs8Qai9/ef39cbea20/27b888_323008bb0f6a41d4bde2a0da7206cd98-720p.mp4',
      poster: SHOWROOM[0].src,
      alt: 'Video of a tiny apricot teddy bear puppy in the TeddyPups showroom',
    },
  },
  trust: {
    kicker: 'puppy passport',
    heading: 'Why families trust TeddyPups',
    stamps: [
      {
        icon: 'heart',
        shape: 'round',
        ink: '#a24a1a',
        tilt: -8,
        title: 'Vet-checked & healthy',
        text: 'Every puppy comes vaccinated, dewormed, and with a verified health certificate.',
      },
      {
        icon: 'plane',
        shape: 'ticket',
        ink: '#1f6b45',
        tilt: 5,
        title: 'Korea to Dubai, safely',
        text: 'Trusted breeders, safe travel, and premium care from start to finish.',
      },
      {
        icon: 'chat',
        shape: 'oval',
        ink: '#5a3a28',
        tilt: -4,
        title: 'Support 24/7',
        text: 'Always here to help, from choosing your puppy to post-delivery support.',
      },
      {
        icon: 'globe',
        shape: 'scallop',
        ink: '#c2622b',
        tilt: 7,
        title: 'Trusted by families worldwide',
        text: 'Puppies delivered to loving homes all around the world.',
      },
    ],
  },
  families: {
    heading: 'Happy families & puppies',
    body: 'We are truly honored to see our puppies become cherished members of loving families. These heartwarming moments have been shared by our valued clients who welcomed a Teddy Pup into their homes and hearts.',
    ctaLabel: 'See every happy family',
    ctaHref: '/happy-families',
    testimonial: {
      quote:
        'TeddyPups truly made our dream a reality. They supported us at every step of the import journey. Our Maltipoo arrived healthy, cheerful, and absolutely perfect. Having 24/7 support throughout the process gave us complete peace of mind.',
      author: 'Sarah M.',
      location: 'Dubai, UAE',
    },
  },
  questions: {
    heading: 'Questions, answered',
    ctaLabel: 'Read all questions',
    ctaHref: '/faq',
    items: [
      {
        q: 'Are your puppies vaccinated and health-checked?',
        a: 'Yes. All our puppies come with a verified health certificate from licensed vets. Every puppy is vaccinated, dewormed, and thoroughly checked before joining your family.',
      },
      {
        q: 'Can I meet a puppy before I decide?',
        a: 'Yes. Come meet our locally available puppies in our Downtown Dubai showroom and spend time bonding before making your decision.',
      },
      {
        q: 'Can I take my puppy home the same day?',
        a: 'Local puppies are available immediately, so you can take your puppy home the same day.',
      },
    ],
  },
  cta: {
    heading: 'Ready to meet your new best friend?',
    body: 'Bring home a healthy, happy teacup or designer puppy with expert guidance every step of the way. We help you find the right match and ensure a smooth, safe delivery across the UAE.',
    whatsappLabel: 'Enquire on WhatsApp',
    secondary: { label: 'Visit & contact', href: '/contact' },
  },
} as const;
