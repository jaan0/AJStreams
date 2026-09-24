# Playback availability

Availability is updated automatically while signed-in viewers play titles. It does not run a crawler or treat an HTTP 200 embed page as proof that the video works.

## Signals

- Direct files: media decode/source-not-supported errors while online; network errors and timeouts do not mark a title unavailable. Playback progress of at least five seconds reports success.
- VidLink: documented `fallback_url` redirects the frame to a same-origin callback when a stream is unavailable. The parent validates the frame, origin and per-attempt nonce. Documented playback progress events report success.
- Bingr: the existing player-status integration can report success when the correct frame and origin provide progress. There is no verified failure API, so silence and load timeouts remain unknown.
- MultiEmbed: no confirmed event contract; status remains unknown until an admin checks it.
- Anonymous viewers can still watch but do not submit shared health reports. Operational health reports are separate from optional analytics.

Provider documentation: https://vidlink.pro/ (Player Events and fallback_url).

## Rules

Three distinct signed-in accounts, or one signed-in admin, confirm a provider failure. Repeated reports from the same account do not add votes. Reports are deduplicated and throttled, account IDs are hashed, and report records expire after 24 hours. A recent successful source report outweighs failures. If only one of several sources fails, the card says Playback issues. Automatic Unavailable requires every configured source to fail; opaque providers remain unknown, so embedded titles may require an admin decision. In particular, this does not automatically detect every Bingr failure.

TV failures are scoped by season/episode and listed in admin. A broken episode never automatically marks the whole series unavailable. Admins can explicitly mark an entire title unavailable after checking alternatives.

Badges appear on cards and title details. They do not block retrying playback. Status expires after 24 hours, clears on successful playback, and is ignored if the source URL changes. Home cache is invalidated when status changes; open pages may need a refresh.

## Admin

Admin > Availability provides title search, status, update time, episode reports, Mark unavailable and Reset status. Manual Unavailable expires in 24 hours or clears on successful playback. Reset clears existing health reports for that title. Check the source again before renewing a manual status.

Redeploy the application to enable this on the live website. No new secret or paid integration is required; the existing MongoDB and authentication configuration are used. MongoDB TTL cleanup runs asynchronously, and the application independently excludes expired reports.

## Tests

`node scripts/test-availability.cjs` checks report thresholds, recovery, expiry, changed source URLs, authentication, origin enforcement, provider validation, episode isolation and the callback nonce/frame/origin validation. `npm run build` checks the production app.
