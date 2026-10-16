# Apricot

The free workshop is served at `/apricot` through a Next.js rewrite to `public/apricot/index.html`. Its CSS and ES modules are isolated from the portfolio layout. Use a normal anchor for navigation into the static workshop, not a Next.js client navigation.

No account, database, paid AI API or server-side learner state is used. Progress, notes and best scores are stored in each browser's localStorage. Clearing site data removes them. Different devices and origins do not share progress. The notebook can be exported as Markdown. Do not put sensitive information in notes on a shared device.

The repository copy in `public/apricot` is now the source of truth. Edit the curriculum in `content.js` and `teaching.js`, labs in `games.js` and `mastery.js`, calculations in `engine.js`, and navigation/storage in `app.js`.

Review practice and its simple spaced schedule live in `review.js`. The `apricot-study-v1` browser key holds review answers, ratings and the last lesson position. Review is self-assessed for prose and numerically checked for calculations. See `apricot-learning-improvements.md` for the design rationale and source references.

Checks: `npm run test:apricot`, `npm run test:apricot:browser`, `node tests/apricot/review-browser.mjs`, and `node tests/apricot-integration.mjs`. Browser scripts default to port 4180; set `APRICOT_URL` or `SITE_URL` for a different target.

Run the full site with `npm run dev`. Run a production build with `npm run build`, then `npm start`. Verify `/`, `/apricot`, `/apricot/`, and `/apricot/index.html`, including refreshes and asset requests. The trailing slash is normalised by Next.js; module and stylesheet URLs are explicitly scoped to `/apricot`.

Existing source notes and badges from the standalone local prototype remain on that old origin. Public visitors start fresh. Existing notes on the same origin are retained across releases.
