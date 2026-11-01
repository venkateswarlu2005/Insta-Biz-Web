/**
 * TeddyPups enquiries → Google Sheet.
 *
 * Setup (once, about 5 minutes; see README "Enquiries → Google Sheet"):
 *  1. Create a Google Sheet, then Extensions → Apps Script, and paste this file in.
 *  2. Deploy → New deployment → type "Web app" → Execute as: Me, Who has access: Anyone → Deploy.
 *  3. Copy the web app URL (ends in /exec) into the site's NEXT_PUBLIC_ENQUIRY_ENDPOINT and rebuild.
 *
 * Each form submission becomes one row in the "Enquiries" tab (created automatically).
 */

const SHEET_NAME = 'Enquiries';
// Optional: also email each enquiry here (leave '' to turn off).
const NOTIFY_EMAIL = '';

const COLUMNS = [
  ['submittedAt', 'Received'],
  ['name', 'Name'],
  ['phone', 'Phone / WhatsApp'],
  ['email', 'Email'],
  ['area', 'Area'],
  ['puppy', 'Puppy'],
  ['puppyUrl', 'Puppy link'],
  ['message', 'Message'],
  ['source', 'Form'],
  ['page', 'Page'],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return reply({ ok: true }); // honeypot filled in: a bot
    if (!data.name || !data.phone) return reply({ ok: false, error: 'Name and phone are required' });

    const sheet = getSheet();
    const row = COLUMNS.map(([key]) => (key === 'submittedAt' ? new Date() : clean(data[key])));
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      const body = COLUMNS.map(([key, label], i) => `${label}: ${row[i] || '-'}`).join('\n');
      MailApp.sendEmail(NOTIFY_EMAIL, `New TeddyPups enquiry from ${clean(data.name)}`, body);
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Visiting the URL in a browser just confirms the script is live. */
function doGet() {
  return reply({ ok: true, service: 'TeddyPups enquiries' });
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS.map(([, label]) => label));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sheet;
}

/** Trim, cap length, and stop spreadsheet formula injection ("=", "+", "-", "@" at the start). */
function clean(value) {
  if (value === undefined || value === null) return '';
  const s = String(value).trim().slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
