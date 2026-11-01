'use client';

// Sends enquiry forms to a Google Sheet through a Google Apps Script web app
// (see google-apps-script/Code.gs and README). WhatsApp links are separate and unchanged.
import { waLink } from '@/lib/site';

export type Enquiry = {
  name: string;
  phone: string;
  email?: string;
  area?: string;
  message?: string;
  /** puppy the enquiry is about, e.g. "Max (Maltipoo, boy)" */
  puppy?: string;
  puppyUrl?: string;
  /** which form sent it */
  source: 'puppy-page' | 'gone-home-page' | 'contact-page';
  /** honeypot: real people leave this empty */
  website?: string;
};

export type SendResult = { ok: true } | { ok: false; reason: 'not-configured' | 'network' | 'rejected' };

const ENDPOINT = process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT;

export async function sendEnquiry(enquiry: Enquiry): Promise<SendResult> {
  if (enquiry.website) return { ok: true }; // bot: pretend it worked
  if (!ENDPOINT) return { ok: false, reason: 'not-configured' };

  const body = JSON.stringify({ ...enquiry, page: location.href, submittedAt: new Date().toISOString() });
  try {
    // A plain-text body keeps this a "simple" request, so Apps Script needs no CORS preflight.
    const res = await fetch(ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === false ? { ok: false, reason: 'rejected' } : { ok: true };
  } catch {
    // Some browsers block reading the redirected response; the row is still written, so send blind.
    try {
      await fetch(ENDPOINT, { method: 'POST', body, mode: 'no-cors' });
      return { ok: true };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }
}

/** Same enquiry as a WhatsApp message, used as a fallback when the sheet can't be reached. */
export function enquiryWhatsAppLink(e: Enquiry) {
  const lines = [
    `Hi TeddyPups! My name is ${e.name}.`,
    e.puppy && `I'm asking about: ${e.puppy}${e.puppyUrl ? ` (${e.puppyUrl})` : ''}`,
    e.message,
    e.area && `Area: ${e.area}`,
    e.email && `Email: ${e.email}`,
    `Phone: ${e.phone}`,
  ];
  return waLink(lines.filter(Boolean).join('\n'));
}
