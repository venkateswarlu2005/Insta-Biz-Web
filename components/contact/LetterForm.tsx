'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type InputHTMLAttributes } from 'react';
import { PawIcon } from '@/components/icons';
import { enquiryWhatsAppLink, sendEnquiry, type Enquiry } from '@/lib/enquiry';
import { prefersReducedMotion } from '@/lib/motion';

export type PuppyOption = { id: string; label: string; url: string };
type Copy = { heading: string; body: string };
type Phase = 'writing' | 'sealing' | 'posting' | 'sent';
type Field = 'name' | 'phone' | 'email' | 'area' | 'message';
type Errors = Partial<Record<Field, string>>;

type BlankProps = InputHTMLAttributes<HTMLInputElement> & { name: Field; label: string; error?: string; size?: number };

/** A fill-in-the-blank input written into the letter's sentence. */
function Blank({ name, label, error, size = 14, ...rest }: BlankProps) {
  return (
    <span className="tp-blank" style={{ '--size': `${size}ch` } as CSSProperties}>
      <input name={name} aria-label={label} aria-invalid={!!error || undefined} aria-describedby={error ? `${name}-err` : undefined} {...rest} />
    </span>
  );
}

const str = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

function validate(data: FormData): Errors {
  const errors: Errors = {};
  const name = str(data, 'name');
  const phone = str(data, 'phone');
  const email = str(data, 'email');
  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || name.length > 80) errors.name = 'Please tell us your name.';
  if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15)
    errors.phone = 'Please add a phone or WhatsApp number we can reach you on, with the country code.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email address doesn't look quite right.";
  if (str(data, 'area').length > 80) errors.area = 'Please keep your area under 80 characters.';
  if (str(data, 'message').length > 2000) errors.message = 'Please keep your message under 2,000 characters.';
  return errors;
}

/**
 * "Dear TeddyPups," — the contact form as a letter. Sending it records the enquiry in the
 * Google Sheet, then plays the envelope-into-the-post-box animation. If the sheet can't be
 * reached, the same letter opens in WhatsApp so nothing is lost.
 */
export function LetterForm({
  puppies,
  success,
  fallback,
  whatsappHref,
}: {
  puppies: PuppyOption[];
  success: Copy;
  fallback: Copy;
  whatsappHref: string;
}) {
  const [phase, setPhase] = useState<Phase>('writing');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [alert, setAlert] = useState('');
  const [minHeight, setMinHeight] = useState<number>();
  // Set when the letter went to WhatsApp instead of the sheet.
  const [waLetter, setWaLetter] = useState<string | null>(null);
  const [posted, setPosted] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const sent = useRef<HTMLDivElement>(null);
  const selectId = useId();
  const noteId = useId();

  // Seal → post → sent (straight to sent with reduced motion).
  useEffect(() => {
    if (!posted) return;
    const timers = prefersReducedMotion()
      ? [setTimeout(() => setPhase('sent'), 0)]
      : [
          setTimeout(() => {
            setMinHeight(box.current?.offsetHeight);
            setPhase('sealing');
          }, 0),
          setTimeout(() => setPhase('posting'), 750),
          setTimeout(() => {
            setMinHeight(undefined);
            setPhase('sent');
          }, 1750),
        ];
    return () => timers.forEach(clearTimeout);
  }, [posted]);

  // Bring the thank-you note into view under the fixed header.
  useEffect(() => {
    const el = sent.current;
    if (phase !== 'sent' || !el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top;
    const headerH = 16 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    if (top < headerH + 8) scrollBy({ top: top - headerH - 24, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [phase]);

  // Focus the first blank that needs fixing.
  useEffect(() => {
    if (errors) form.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus();
  }, [errors]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    if (Object.keys(found).length) {
      setErrors(found);
      setAlert('Please check the highlighted parts of your letter.');
      return;
    }
    setErrors(null);
    setAlert('');

    const puppy = puppies.find((p) => p.id === str(data, 'puppyId'));
    const enquiry: Enquiry = {
      name: str(data, 'name'),
      phone: str(data, 'phone'),
      email: str(data, 'email') || undefined,
      area: str(data, 'area') || undefined,
      puppy: puppy?.label,
      puppyUrl: puppy?.url,
      message: str(data, 'message') || undefined,
      source: 'contact-page',
      website: str(data, 'website') || undefined,
    };

    setPending(true);
    const result = await sendEnquiry(enquiry);
    setPending(false);
    if (!result.ok) {
      // Sheet not set up or unreachable: hand the letter to WhatsApp instead.
      const href = enquiryWhatsAppLink(enquiry);
      setWaLetter(href);
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    setPosted((n) => n + 1);
  }

  const err = errors ?? {};
  const listed = Object.entries(err) as [Field, string][];
  const done = waLetter ? fallback : success;

  return (
    <div ref={box} className="tp-post" data-phase={phase} style={{ minHeight }}>
      {phase !== 'sent' && (
        <form
          ref={form}
          onSubmit={onSubmit}
          noValidate
          className="tp-letterform"
          aria-hidden={phase !== 'writing' || undefined}
          inert={phase !== 'writing'}
        >
          <span aria-hidden="true" className="tp-letter__stamp">
            <PawIcon className="size-9" />
          </span>
          <p className="font-scrawl tp-letterform__greeting">Dear TeddyPups,</p>
          {alert && (
            <div role="alert" className="tp-letterform__alert">
              <p className="font-semibold">{alert}</p>
              {listed.length > 0 && (
                <ul>
                  {listed.map(([k, v]) => (
                    <li key={k} id={`${k}-err`}>
                      {v}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="tp-letterform__line">
            my name is{' '}
            <Blank name="name" label="Your name (required)" autoComplete="name" required minLength={2} maxLength={80} size={16} error={err.name} />
            , and you can reach me on{' '}
            <Blank
              name="phone"
              label="Phone or WhatsApp number with country code (required)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              size={15}
              placeholder="+971 50 123 4567"
              error={err.phone}
            />{' '}
            or by email at{' '}
            <Blank name="email" label="Email (optional)" type="email" autoComplete="email" size={20} placeholder="optional" error={err.email} />.
          </p>
          <p className="tp-letterform__line">
            I live in{' '}
            <Blank
              name="area"
              label="Your area (optional)"
              autoComplete="address-level2"
              maxLength={80}
              size={13}
              placeholder="e.g. Dubai Marina"
              error={err.area}
            />
            , and I&apos;m curious about{' '}
            <span className="tp-blank tp-blank--select">
              <label htmlFor={selectId} className="sr-only">
                Puppy you&apos;re interested in (optional)
              </label>
              <select id={selectId} name="puppyId" defaultValue="">
                <option value="">any puppy (not sure yet)</option>
                {puppies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </span>
            .
          </p>
          <label htmlFor={noteId} className="sr-only">
            Your message (optional)
          </label>
          <textarea
            id={noteId}
            name="message"
            rows={4}
            maxLength={2000}
            placeholder="Anything else you'd like to tell us…"
            className="tp-letterform__note"
            aria-invalid={!!err.message || undefined}
          />
          {/* honeypot: real people never see or fill this */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <div className="tp-letterform__sign">
            <p className="font-scrawl">with love, a future puppy parent</p>
            <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-70">
              {pending ? 'Sealing the envelope…' : 'Post my letter'}
            </button>
          </div>
        </form>
      )}

      {(phase === 'sealing' || phase === 'posting') && (
        <div aria-hidden="true" className="tp-post__scene">
          <svg viewBox="0 0 160 112" className="tp-post__envelope">
            <rect x="4" y="18" width="152" height="90" rx="6" fill="#fffdf8" stroke="#2a170e" strokeWidth="4" />
            <path d="M6 104 64 62M154 104 96 62" fill="none" stroke="#2a170e" strokeWidth="3" strokeLinecap="round" />
            <path className="tp-post__flap" d="M6 22 80 74 154 22" fill="#fbe3b4" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="80" cy="72" r="11" fill="#a24a1a" stroke="#2a170e" strokeWidth="3" />
          </svg>
          <svg viewBox="0 0 200 260" className="tp-post__box">
            <rect x="86" y="170" width="28" height="86" fill="#5a3a28" stroke="#2a170e" strokeWidth="4" />
            <path d="M30 70a70 54 0 0 1 140 0v104H30z" fill="#c2622b" stroke="#2a170e" strokeWidth="5" strokeLinejoin="round" />
            <rect x="58" y="86" width="84" height="14" rx="7" fill="#2a170e" />
            <path d="M44 128h112" stroke="#2a170e" strokeWidth="3" strokeLinecap="round" opacity=".35" />
            <g className="tp-post__flag">
              <path d="M170 120V64" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
              <path d="M170 64h22v16h-22" fill="#f2be6b" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      )}

      {phase === 'sent' && (
        <div ref={sent} tabIndex={-1} role="status" className="tp-post__sent">
          <svg viewBox="0 0 200 150" aria-hidden="true" className="tp-post__box tp-post__box--sent">
            <rect x="86" y="96" width="28" height="52" fill="#5a3a28" stroke="#2a170e" strokeWidth="4" />
            <path d="M30 50a70 44 0 0 1 140 0v52H30z" fill="#c2622b" stroke="#2a170e" strokeWidth="5" strokeLinejoin="round" />
            <rect x="58" y="58" width="84" height="12" rx="6" fill="#2a170e" />
            <path d="M170 92V22" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
            <path d="M170 22h22v16h-22" fill="#f2be6b" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <p className="font-plush mt-4 text-[2rem]">{done.heading}</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-cocoa-soft">{done.body}</p>
          <a href={waLetter ?? whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
            {waLetter ? 'Send it on WhatsApp' : 'WhatsApp us'}
          </a>
        </div>
      )}
    </div>
  );
}
