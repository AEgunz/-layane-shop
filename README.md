# layane-shop Store Studio

A responsive, database-backed landing page builder and store administration app.

## Included
- Dashboard, editable product pages, three layout templates and distinct /p/<slug> URLs.
- Shared brand name, logo upload, color, tagline and customer support phone.
- Arabic and English storefronts, plus French language option.
- Cash-on-delivery forms with validation, server-calculated pricing and duplicate-submit protection.
- Central orders with customer details, statuses, dates, search, filters and CSV export.
- Visits, conversion, delivered sales and per-product analytics.
- D1 persistence, R2 images, administrator authorization, and draft/archive isolation.

## Run locally
Requires Node.js 22.13 or newer.

1. Run `npm ci`.
2. Run `npm run build`.
3. Apply the local database schema:
   `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_salty_venus.sql`
4. Run `npm run dev` and open its printed local address.
5. Use the local Sign in with ChatGPT link. Local preview supplies a mock identity; hosted sign-in uses the Sites identity service.

The first authenticated administrator initializes the store. Keep the site owner-private until you have opened the dashboard once. Server authorization then restricts editing and customer data to that administrator even if the storefront audience is later made public.

## First steps
Open Landing pages, edit the supplied Everyday comfort bundle, and publish it. Upload your logo and edit the shared brand in Brand settings. Product content and reference artwork are a starting point for your review. Text embedded inside supplied images is part of those images; replace the image to change that text.

Publishing a product activates its URL within the site's current audience. It does not change the platform's sharing settings. The store uses cash on delivery; no online payment gateway is connected.

## Measurement
Visits are counted once per product, browser session and UTC day. Administrator visits are excluded. Conversion is placed orders divided by visits. Sales include delivered orders only. Browser storage holds only the temporary visit-session token, never authoritative store data. Analytics are first-party session measurements and can be affected by blocked scripts or cleared browser storage.

## Validation
Type check and production build passed. Local integration checks covered page creation, publication, draft isolation, archive, order creation, duplicate submission, trusted pricing, status persistence, global branding, authorization, and invalid input. Browser checks covered editor publication, Arabic checkout, mobile layout, desktop editor, and WebMCP navigation with valid and invalid input.

## Publishing status
The Site was registered but not deployed. Automatic approval review blocked passing the temporary publishing credential to the official Sites workflow, including after a scoped permission grant. Source and compiled output are preserved. Continue publishing the same Site identified in `.openai/hosting.json`; do not register another Site.

Local QA data, dependencies, credentials, and machine-specific temporary files are excluded from the source archive.
