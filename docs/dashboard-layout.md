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
