'use client';

import { m } from 'motion/react';
import { useId, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { enquiryWhatsAppLink, sendEnquiry, type Enquiry } from '@/lib/enquiry';

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'area' | 'message', string>>;

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string };

function Field({ label, name, error, hint, ...rest }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[0.95rem] font-semibold">
        {label}
        {rest.required ? (
          <span className="text-toffee-ink"> *</span>
        ) : (
          <span className="font-normal text-cocoa-soft"> (optional)</span>
        )}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base outline-none transition-[border-color,box-shadow] focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)] aria-[invalid=true]:border-[#b3261e]"
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-cocoa-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Record<string, string>): Errors {
  const e: Errors = {};
  if (v.name.length < 2) e.name = v.name ? 'Please enter your full name.' : 'Please tell us your name.';
  else if (v.name.length > 80) e.name = 'That name is a little long — 80 characters at most.';
  const digits = v.phone.replace(/\D/g, '');
  if (!v.phone) e.phone = 'Please add a phone or WhatsApp number so we can reach you.';
  else if (!/^\+?[\d\s()./-]+$/.test(v.phone) || digits.length < 7 || digits.length > 15)
    e.phone = 'That number doesn’t look right — include the country code, e.g. +971 50 123 4567.';
  if (v.email && !EMAIL.test(v.email)) e.email = 'That email address doesn’t look right.';
  if (v.area.length > 80) e.area = 'Please keep the area under 80 characters.';
  if (v.message.length > 2000) e.message = 'Please keep your message under 2,000 characters.';
  return e;
}

type Props = {
  /** e.g. "Max (Maltipoo, boy)" */
  puppy: string;
  puppyUrl: string;
  source: Enquiry['source'];
  defaultMessage: string;
  /** WhatsApp link shown after sending (same as the page's WhatsApp button) */
  whatsappHref: string;
};

type State =
  | { kind: 'idle'; errors: Errors }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'fallback'; enquiry: Enquiry; reason: 'not-configured' | 'network' | 'rejected' };

const SUCCESS = {
  heading: 'Message received!',
  body: 'Thank you — our team will get back to you promptly. For the quickest reply, message us on WhatsApp.',
};

function Envelope() {
  return (
    <svg viewBox="0 0 120 84" className="tp-envelope mx-auto w-32" aria-hidden="true">
      <path d="M6 10h108v68H6z" fill="#fffdf8" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" />
      <path d="M6 10l54 40 54-40" fill="none" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="94" cy="62" r="12" fill="#c2622b" stroke="#2a170e" strokeWidth="2.5" />
    </svg>
  );
}

/** "dear TeddyPups…" letter form. Goes to the Google Sheet; falls back to WhatsApp so no enquiry is lost. */
export function EnquiryForm({ puppy, puppyUrl, source, defaultMessage, whatsappHref }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle', errors: {} });
  const form = useRef<HTMLFormElement>(null);
  const messageId = useId();
  // keeps what was typed if the visitor comes back from the WhatsApp fallback to edit
  const draft = useRef<Record<string, string>>({});

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const v = Object.fromEntries(
      ['name', 'phone', 'email', 'area', 'message', 'website'].map((k) => [k, String(fd.get(k) ?? '').trim()]),
    );
    draft.current = v;
    const errors = validate(v);
    if (Object.keys(errors).length) {
      setState({ kind: 'idle', errors });
      // focus the first field with a problem, in form order
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const enquiry: Enquiry = {
      name: v.name,
      phone: v.phone,
      email: v.email || undefined,
      area: v.area || undefined,
      message: v.message || undefined,
      puppy,
      puppyUrl,
      source,
      website: v.website || undefined,
    };
    setState({ kind: 'sending' });
    const res = await sendEnquiry(enquiry);
    setState(res.ok ? { kind: 'sent' } : { kind: 'fallback', enquiry, reason: res.reason });
  }

  if (state.kind === 'sent') {
    return (
      <m.div
        role="status"
        initial={{ rotateX: -80, opacity: 0, y: -10 }}
        animate={{ rotateX: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        className="tp-sent rounded-[2rem] border-[3px] border-cocoa bg-honey p-8 text-center"
      >
        <Envelope />
        <p className="font-plush mt-4 text-[2rem]">{SUCCESS.heading}</p>
        <p className="mx-auto mt-2 max-w-[38ch] text-cocoa-soft">{SUCCESS.body}</p>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
          WhatsApp us
        </a>
      </m.div>
    );
  }

  if (state.kind === 'fallback') {
    return (
      <m.div
        role="alert"
        initial={{ rotateX: -80, opacity: 0, y: -10 }}
        animate={{ rotateX: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        className="tp-sent rounded-[2rem] border-[3px] border-cocoa bg-honey-soft p-8 text-center"
      >
        <Envelope />
        <p className="font-plush mt-4 text-[2rem]">Almost there!</p>
        <p className="mx-auto mt-2 max-w-[42ch] text-cocoa-soft">
          {state.reason === 'network'
            ? 'We couldn’t reach our inbox just now — your connection may have dropped.'
            : 'Our online inbox isn’t taking messages right now.'}{' '}
          Tap below to send the same message to us on WhatsApp — it&apos;s all filled in for you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={enquiryWhatsAppLink(state.enquiry)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            Send it on WhatsApp
          </a>
          <button type="button" onClick={() => setState({ kind: 'idle', errors: {} })} className="btn btn-ghost">
            Edit my message
          </button>
        </div>
      </m.div>
    );
  }

  const errors = state.kind === 'idle' ? state.errors : {};
  const sending = state.kind === 'sending';
  const errorCount = Object.keys(errors).length;

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="space-y-5">
      {errorCount > 0 && (
        <p role="alert" className="rounded-2xl bg-blush px-4 py-3 font-semibold">
          {errorCount === 1 ? 'Please check the highlighted field.' : 'Please check the highlighted fields.'}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" required minLength={2} maxLength={80} error={errors.name} defaultValue={draft.current.name} />
        <Field
          label="Phone or WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          error={errors.phone}
          defaultValue={draft.current.phone}
          hint="With country code, e.g. +971 50 123 4567"
        />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} defaultValue={draft.current.email} />
        <Field label="Your area" name="area" autoComplete="address-level2" maxLength={80} error={errors.area} defaultValue={draft.current.area} hint="e.g. Dubai Marina" />
      </div>
      <input type="hidden" name="puppy" value={puppy} />
      <div>
        <label htmlFor={messageId} className="block text-[0.95rem] font-semibold">
          Message <span className="font-normal text-cocoa-soft">(optional)</span>
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={4}
          maxLength={2000}
          aria-invalid={!!errors.message}
          className="mt-1.5 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 py-3 text-base outline-none focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)]"
          defaultValue={draft.current.message ?? defaultMessage}
        />
        {errors.message && <p className="mt-1 text-sm font-semibold text-[#b3261e]">{errors.message}</p>}
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <button type="submit" disabled={sending} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
        {sending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
