# Genres and analytics

- Mobile navigation includes Admin only for an authenticated admin, matching the sidebar.
- Popular Genres uses catalog artwork and counts. View All opens `/categories/all/GENRES`; a card opens `/movies?genre=...`.
- Admin > Analytics reports page views, tab sessions, visible time, click counts, daily traffic, pages, referrer domains, approximate locations, screen sizes, browsers, operating systems, maximum scroll depth and normalized viewport click density.
- Filters: last 1/7/30/90 days, heatmap page and screen size. Refresh loads the latest data.

## Collection and privacy

Visitors opt in using the analytics prompt; they can disable it on `/cookies`. Do Not Track and Global Privacy Control override opt-in. Data begins at opt-in, with no historical import. Admin pages, form values, query strings, raw IPs, private watch-party codes and recordings are excluded. IP-derived hashes are used only for rate limiting. Events are stored in MongoDB with a 90-day TTL index (MongoDB expiry runs asynchronously). Sessions are random browser-tab identifiers, not unique people. Reports can be affected by blockers and client-generated event spoofing.

Location uses Vercel's country, region and city headers only when running on Vercel. Localhost/other hosts display Unknown. No external IP-lookup service is called. See https://vercel.com/docs/headers/request-headers . If deploying behind another provider, add its trusted geolocation integration before expecting location data.

Click maps show relative viewport coordinates grouped by page and width bucket (Mobile <768, Tablet <1024, Desktop >=1024), across scroll positions. They are not screenshot overlays or session replays. Cross-origin embedded player interactions cannot be observed. Scroll figures average each page visit's maximum reached depth. Visible time is time the page is visible, not proof that someone is watching a video.

Upstash Redis, when configured through the existing environment variables, provides distributed ingestion rate limits; otherwise, or if Redis is unavailable, the limiter is per server process. A failed shared limiter is retried after 60 seconds. The admin API enforces the same session role as the admin page and returns private, uncached responses. Public ingestion is same-origin, size limited, schema validated and deduplicates event IDs.

## Validation

Run `node scripts/test-analytics.cjs` from the app directory. It tests sanitization, validation, consent/DNT, origin enforcement, role access, conditional Admin navigation and a real aggregation against a uniquely named temporary MongoDB collection. That test collection is removed in a finally block; production analytics records are untouched.

Run `node scripts/test-pwa.mjs` and `npm run build` for existing PWA checks and the production build.


## Browser verification (2026-09-24)

- Signed-in admin: Admin appears in the mobile dock; Analytics loads and reports a real consenting browser visit, clicks, visible time and a populated heatmap.
- Mobile genre grid tested at 390px and 320px with no document horizontal overflow. View All navigates to the genre directory; the Comedy card selects Comedy in the collection.
- Back to top tested on the genre directory and admin analytics at 320px; it sits above the mobile dock and returns document scroll to zero. Available globally after scrolling more than 300px; reduced-motion users get an immediate jump.
- Guest analytics API request returns HTTP 403.
- Existing Redis endpoint was unavailable; verified bounded local rate limiting continues to accept analytics and rejects requests over its limit.
