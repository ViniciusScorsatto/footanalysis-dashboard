# Dashboard studio layout

The animated and static football dashboards share `dashboard/football/studio.css` and `layout.js`. The existing form controls are moved, not cloned: their IDs, form ownership, values and existing event handlers stay intact. Other dashboards keep their existing styles.

## Visual system

- Graphite background `#0d1117`, surfaces `#151b24`, borders `#2b3543`, blue actions `#4393ff`.
- System sans-serif UI, 34px main heading, 19px section headings, 13–16px controls.
- Configuration and preview columns on desktop; single column below 760px.
- Data editors, soundtrack, narration and advanced settings use native keyboard-accessible disclosures.
- The preview uses a portrait frame with an empty state until a preview URL is available.
- Video history uses compact aligned rows on desktop and stacked entries on mobile. Download, playback, retry, cancel and confirmed deletion remain available.
- Online navigation uses separate `#videos` and `#settings` views, with reload/back support. The former `#video-settings` link remains compatible. Creation controls stay mounted so changing views preserves the form.
- Unauthenticated navigation to dashboard/preview pages redirects to the login entry instead of returning API JSON. APIs, private assets and downloads still require authentication. OAuth failures offer a retry link and a sanitized `login_failed` stage/reference in server logs; state, PKCE and identity checks remain mandatory.

## Intentional adaptations from the visual concept

The implementation keeps the existing multi-date picker, unfinished-results option, dynamic selection summary, refresh-preview action, file expiry and retry/playback actions. These require more vertical space than the illustrative concept. No fake videos, storage metrics or preview scores are shipped. Local Studio and publishing controls remain available locally; online access restrictions are unchanged. The redesign changes the dashboard, not the generated video templates.

## Validation

Browser checks with isolated API fixtures cover 1536×1024 desktop, 768px tablet and 390px mobile, animated/static modes, local-mode controls, PT/EN switching, soundtrack volume, narration default, preparation payload, preview URL update, render enqueue and storage confirmation. No duplicate IDs, page errors or horizontal overflow were detected. Provider calls and a live Railway deployment are not exercised by these checks.

`npm run test:online` checks access to the new protected CSS/JS assets alongside authentication, queue, streaming and storage deletion regressions.

## Performance pass

- Initialization loads rounds → dates → results/predictions once, retaining saved multi-date selections. The shell and empty preview are initialized before waiting on data requests.
- Online previews stay at `about:blank` until a prepared preview ID exists. Unchanged preview URLs do not reload on incidental UI updates; the explicit refresh button still reloads.
- Video/storage polling stops on the creation screen and while the browser tab is hidden. Settings requests storage only. Video history refreshes every five seconds when jobs are active, otherwise every thirty seconds; storage refreshes every thirty seconds. Navigation and actions trigger immediate refreshes. Identical history responses do not replace the DOM.
- Shipped dashboard CSS/JS and the player bundle support gzip and private ETag revalidation. Authentication is checked before a 304 response. The browser must revalidate cached assets; APIs, snapshots, media and downloads keep their existing no-store policy and range handling.

Local before/after browser evidence with the same fixtures: initial result-fixture requests **3 → 1**, initial player requests **1 → 0**, initial history/storage requests **2 → 0** on the creation screen. The four measured JS/CSS files, including the locally built player, total **747,088 bytes raw / 189,730 gzip (~75% smaller)**. These are request/transfer measurements, not a claim about live Railway latency or render speed.

Browser checks also cover active/idle polling, settings-only storage requests, manual preview reload, deletion refresh and saved multi-date restoration. Server tests cover gzip opt-out, conditional requests, changed-file invalidation, HEAD, ranges and denial of cached-asset requests without a valid session.
