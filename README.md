# Zesen Zhao — personal homepage

Source for Zesen Zhao’s static academic homepage at <https://senmiaoorz.github.io/>. GitHub Actions publishes this repository to GitHub Pages.

## Preview

From this directory, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/>. There is no build step or package installation. The artwork, physics engine, and map renderer are included locally; public visitor counters are read from GoatCounter. Press Ctrl+C in the server terminal to stop it.

## Miku rain

- A staggered shower starts once the image is ready. Characters have gravity, circular collision bodies, rotation, friction, and a floor at the bottom of the viewport.
- Desktop users can drag a character in the page margins and release it. Clicking empty background adds a few more.
- The floating controls pause, restart, add characters, and hide the animation. At the population limit, “More Miku” gives the pile a bounce.
- Sleeping bodies and an idle animation loop reduce work after the pile settles. The animation stops when the tab is hidden. Phone layouts use smaller sprites and a lower population limit.
- Reduced-motion preferences disable automatic animation. The visitor can explicitly start it with the rain controls. Pause and theme choices are stored in the visitor’s browser.
- The academic content remains readable if JavaScript or the physics engine is unavailable.

## Content and styling

- `index.html`: biography, research interests, publications, updates, experience, service, and contact links.
- `styles.css`: responsive mint/cream visual design, dark theme, and reduced-motion styles.
- `app.js`: page controls and the physics animation.
- `assets/miku.png`: generated chibi Miku illustration, used in the hero and the animation.
- `vendor/matter.min.js`: Matter.js 0.20.0; its MIT license is included alongside it.
- `visitors.js`: public total/recent counters, country-map display, and production-only tracking.
- `assets/world.geojson`: simplified Natural Earth country boundaries.
- `scripts/update-visitors.py`: aggregate-only country snapshot generator, using a read-only token from the environment.
- `.github/workflows/pages.yml`: publishes the static site and refreshes country statistics every six hours.

The academic structure takes inspiration from <https://mars-tin.github.io/>. Layout and artwork are newly created. Content is based on the public profile README and six publications from the user’s Google Scholar profile; see `ASSET-NOTES.md` for sources. Publications are ordered by the publication dates recorded in Scholar, with complete author lists. Venue labels follow those entries, with the user-confirmed updates of MARS to NeurIPS 2026 and Dynamic Linear Attention to ICML 2026. This is a static import; it does not synchronize automatically with Scholar. No unavailable CV or unverified paper details have been added.

## Visitor statistics

The GoatCounter account is `senmiaoorz`, associated with `https://senmiaoorz.github.io`. Public visitor counters were enabled in GoatCounter. The total and recent counts are fetched from GoatCounter’s public visitor-counter endpoints, which can cache responses for up to four hours. The interface calls them visits because the service’s default session deduplication is enabled.

Local previews and other preview domains never load the tracking script. Only `senmiaoorz.github.io` records visits. Anchor navigation does not create additional pageviews. No sample visitors or invented counts are used. An empty map means there is no available country distribution yet; the map initially has 176 country/region polygons ready to shade.

Country data is a public aggregate JSON snapshot; it contains country codes, names, counts, totals, and a timestamp. It contains no IP addresses or private API tokens. The snapshot generator needs a GoatCounter token with **Read statistics** permission. Keep this token in a GitHub Actions repository secret called `GOATCOUNTER_API_TOKEN`, never in frontend code or the repository. The read-only token is configured as the repository secret. If it is revoked, the refresh workflow fails without exposing the token; the last successfully published website remains available.

## GitHub Pages deployment

- Repository: <https://github.com/SenmiaoORZ/SenmiaoORZ.github.io>; default branch: `main`.
- Settings → Pages uses **GitHub Actions** as the publishing source.
- `GOATCOUNTER_API_TOKEN` is stored under Settings → Secrets and variables → Actions. It has **Read statistics** permission for the `senmiaoorz` site only.
- Every push to `main`, manual workflow run, and scheduled run refreshes the aggregate country snapshot and deploys the public website files.
- Scheduled refresh: every six hours, at minute 23 UTC. GitHub may delay scheduled jobs; the displayed map timestamp identifies the latest successful refresh.
- To refresh immediately, open Actions → Publish homepage and refresh visitor map → Run workflow.
- Statistics periods use UTC calendar days. The collector’s `--reporting-timezone` defaults to `America/Los_Angeles`, matching the GoatCounter account’s current preference; update that argument if the account timezone changes. This compensates for the API’s separate handling of hourly totals and daily country data.
- The GoatCounter dashboard stays private. Only totals and country-level aggregates are published; the generated JSON is included in the deployment artifact, without creating recurring source commits.

The homepage stays static and requires no server or paid hosting plan. GoatCounter’s free service supports reasonable public website usage: <https://www.goatcounter.com/>. Service limits and pricing remain subject to its current policy.
