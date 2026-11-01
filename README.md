# TeddyPups U.A.E. website

This repository contains the source for the TeddyPups U.A.E. website. The site is built as static files and hosted on Cloudflare Pages. Puppy and page content lives in JSON files; enquiries are sent to a Google Sheet through Google Apps Script.

## Technology and architecture

| Area | Technology | Why it was chosen | Trade-offs and alternatives |
|---|---|---|---|
| Application | Next.js 15 App Router, React 19, TypeScript | Reusable components and page-level routes make the interactive, multi-page site easier to build and maintain. TypeScript catches many content and code mistakes before deployment. | Next.js adds framework and build complexity compared with plain HTML or a small static-site generator. This project exports static pages, so it does not use Next.js server rendering or runtime API routes. |
| Rendering and hosting | Next.js static export (`output: 'export'`) on Cloudflare Pages | Visitors receive prebuilt files from a CDN. There is no application server to operate, and static pages are fast and inexpensive to host. | Pages are generated at build time; content changes require a new build and deploy. Request-time personalization, server-side logic, and Next.js API routes would require adding a backend or changing the rendering/hosting design. |
| Styling | CSS design system in `app/styles/`, with Tailwind CSS v4 available for utility styles | Shared CSS tokens and components support a consistent, distinctive visual design across pages. | Custom CSS requires discipline to keep shared patterns consistent. A component library could speed up standard interfaces, but would constrain or add weight to this highly customized design. |
| Animation and scrolling | Motion and Lenis | They support the site's page transitions, scroll effects, and interactive scenes. | Animation code increases JavaScript and implementation complexity. Effects should remain optional for reduced-motion users; a mostly static site could remove these dependencies for a smaller client bundle. |
| Content | JSON files under `content/`; Sveltia CMS at `/admin` edits the files through GitHub | Content remains readable, reviewable, and versioned with the source. The CMS lets an owner update puppy listings and photos without editing code. | Publishing commits to GitHub and triggers a full site rebuild, so updates are not instantaneous. A traditional CMS or database offers more live editing, but needs a continuously available backend and more operational work. |
| Images | `scripts/optimize-images.mjs`, Sharp, and a custom Next.js image loader | Image variants are generated ahead of time, allowing the exported site to serve appropriately sized WebP images without a runtime image service. | Image variants add build time and generated files. A hosted image service can transform images on demand, but adds an external service and potentially ongoing cost. |
| Enquiries | Browser form → Google Apps Script web app → Google Sheet, with WhatsApp fallback | This reuses Google Sheets as a simple enquiry inbox without hosting a custom application server. WhatsApp remains available when the sheet endpoint is not configured or cannot be reached. | Apps Script has Google service quotas and authorization/deployment requirements. Its public web-app URL is not a full spam-protection or data-management system. Higher-volume or sensitive workflows should use a backend or form provider with stronger validation, monitoring, and access controls. |

### Request and publishing flows

- **Website:** source code and JSON content → `npm run build` → static files in `out/` → Cloudflare Pages CDN.
- **CMS:** owner edits at `/admin` → Sveltia CMS commits changes to the configured GitHub repository → Cloudflare Pages rebuilds and publishes the site.
- **Enquiries:** visitor submits a form → the configured Google Apps Script writes a row in the spreadsheet's `Enquiries` tab. If the endpoint is unavailable, the form offers a prefilled WhatsApp message instead. Check the spreadsheet to confirm a particular enquiry was recorded.

## Requirements

- Node.js 22 (the repository's `.nvmrc` specifies `22`).
- npm.
- For CMS publishing: a GitHub repository and a deployed Sveltia CMS authentication worker.
- For spreadsheet enquiries: a Google Sheet and a deployed Google Apps Script web app.

## Run locally

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development command runs `scripts/optimize-images.mjs` before starting Next.js.

To create and preview the static export:

```powershell
npm run build
npm start
```

The build writes the site to `out/`; `npm start` serves that output locally. To check TypeScript:

```powershell
npm run typecheck
```

### Local enquiry configuration

Create `.env.local` in the project root and add the deployed Apps Script web-app URL:

```dotenv
NEXT_PUBLIC_ENQUIRY_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart the development server after changing this file. The `NEXT_PUBLIC_` value is included in client-side code, so it is public; do not put credentials or secrets in it. The URL identifies a public web-app endpoint, not a secret.

## Content

- `content/puppies/<slug>.json`: one file per puppy. `status` is `available`, `reserved`, or `gone-home`; `gone-home` listings appear on the Gone home page. `hero: true` includes a puppy in the home-page lineup (up to six); `order` controls sorting.
- `content/families.json`: Happy families photos and optional captions.
- `content/site.json`: brand and contact details used across the site.
- Other page content is stored in JSON files under `content/`.
- Existing photos are in `public/media/`; media uploaded through the CMS goes in `public/uploads/`.

## Set up CMS publishing

The CMS configuration is in `public/admin/config.yml`. Before enabling it:

1. Push the project to GitHub and replace the example `repo` value in the configuration with the actual `OWNER/REPOSITORY`.
2. Deploy the [Sveltia CMS authentication worker](https://github.com/sveltia/sveltia-cms-auth) to Cloudflare Workers.
3. Configure a GitHub OAuth App for that worker, including its documented callback URL, and set the OAuth credentials in the worker's settings. Keep the client secret in the worker settings; never commit it to this repository.
4. Replace the example `base_url` with the deployed worker URL, and set `site_url` and `display_url` to the real website address.
5. Give the intended CMS publisher write access to the repository, then visit `/admin` on the deployed site and sign in.

Publishing through the CMS creates a Git commit. GitHub/Cloudflare then rebuilds the static site; the change appears after that deployment completes.

## Set up enquiry storage

1. Create a Google Sheet for enquiries.
2. In that sheet, open **Extensions → Apps Script** and paste in `google-apps-script/Code.gs`.
3. Optionally set `NOTIFY_EMAIL` in the script if email notifications are wanted.
4. In Apps Script, choose **Deploy → New deployment → Web app**. Choose **Execute as: Me** and **Who has access: Anyone**, then deploy and authorize the script. Google may show an unverified-app warning for a script that has not gone through Google's verification process; only authorize a script you trust and understand.
5. Copy the deployment URL ending in `/exec`. Set it as `NEXT_PUBLIC_ENQUIRY_ENDPOINT` in `.env.local` for local testing and in Cloudflare Pages' production environment variables for the deployed site.
6. Restart the local dev server after changing `.env.local`; rebuild and redeploy after changing the production variable.

The script creates an `Enquiries` tab on the first valid submission. Each row includes the received time, name, phone, email, area, puppy, message, form, and page. The script runs as the Google account that deployed it and writes to its associated spreadsheet. Restrict access to the spreadsheet to the people who should see enquiry data. The honeypot is a basic bot filter, not comprehensive abuse protection.

## Deploy the website to Cloudflare Pages

1. In Cloudflare, create a Pages project connected to the GitHub repository.
2. Set the build command to `npm run build` and the output directory to `out`.
3. Use Node.js 22 for the build environment.
4. Add `NEXT_PUBLIC_ENQUIRY_ENDPOINT` as a production build environment variable if forms should write to the spreadsheet.
5. Deploy, verify the site and enquiry flow, then configure the custom domain.

Cloudflare Pages rebuilds on repository updates. `public/_headers` contains the site's static response and caching headers.
