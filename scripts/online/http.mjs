import path from 'node:path';
import fs from 'node:fs/promises';
import {getDb} from '../lib/db.mjs';
import {createOnlineStore} from './store.mjs';
import {createAuth} from './auth.mjs';
import {streamFile} from './files.mjs';
import {root, publicRoot, outputRoot} from './paths.mjs';

const shortTemplates = new Set(['results', 'next-games', 'predictions', 'standings', 'serie-c-quadrangular', 'season-final-verdict', 'champion-final', 'top-scorers', 'player-of-round', 'championship-pace', 'relegation-line', 'tierlist', 'continental-groups-standings', 'world-cup-group-standings', 'world-cup-knockout', 'historical-champions', 'team-comparison', 'league-comparison', 'top-scorers-comparison']);
export function validateShort(job) {
  if (!shortTemplates.has(job?.template) || !job.compositionId?.endsWith('Short') || !Number.isInteger(job.durationInFrames) || job.durationInFrames < 1 || job.durationInFrames > 30 * 180) throw new Error('Unsupported Short');
  return job;
}
const json = (response, status, body) => {response.writeHead(status, {'content-type': 'application/json', 'cache-control': 'no-store'});response.end(JSON.stringify(body));};
export function publicRender(row) {
  const {snapshot, ...rest} = row;
  const job = JSON.parse(snapshot);
  const available = row.state === 'completed' && !row.deleted_at && row.expires_at > Date.now();
  return {...rest, title: job.outputName || job.leagueName || job.template, template: job.template, downloadUrl: available ? `/api/online/renders/${row.id}/download` : null};
}

export function createOnlineHttp({store = createOnlineStore(getDb()), config = process.env, rendersRoot = outputRoot} = {}) {
  async function fileSize(id) {
    try {const stat = await fs.lstat(path.join(rendersRoot, `${id}.mp4`));return stat.isFile() ? stat.size : 0;}
    catch (error) {if (error.code === 'ENOENT') return 0;throw error;}
  }
  async function storageSummary() {
    const rows = store.storedVideos();
    let bytes = 0, files = 0;
    for (const row of rows) {const size = await fileSize(row.id);bytes += size;if (size > 0) files++;}
    return {bytes, files};
  }
  const auth = createAuth({store, origin: config.PUBLIC_URL, clientId: config.GOOGLE_CLIENT_ID, clientSecret: config.GOOGLE_CLIENT_SECRET, allowedEmail: config.ALLOWED_EMAIL});
  const apiAllowed = new Set(['options', 'short-durations', 'rounds', 'round-dates', 'prediction-fixtures', 'result-fixtures', 'next-fixtures', 'standings-editor', 'season-final-verdict-editor', 'top-scorers-editor', 'tierlist-teams', 'world-cup-groups', 'world-cup-standings-preview', 'copy/hook-cta', 'jobs/current', 'jobs/prepare', 'jobs/render', 'jobs/team-comparison', 'jobs/league-comparison', 'jobs/top-scorers-comparison', 'db/leagues', 'db/teams', 'db/standings', 'db/top-scorers', 'compare/teams', 'compare/leagues', 'compare/top-scorers']);
  return {
    store,
    preview(job) {return store.preview(validateShort(job));},
    enqueue(job) {
      if (store.activeCount() >= 20) throw new Error('Render queue full');
      return publicRender(store.enqueue(validateShort(job)));
    },
    async handle(request, response, url) {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Referrer-Policy', 'same-origin');
      response.setHeader('X-Frame-Options', 'SAMEORIGIN');
      response.setHeader('Cache-Control', 'private, no-store');
      if (url.pathname === '/healthz' && request.method === 'GET') {json(response, 200, {ok: true}); return true;}
      if (await auth.handle(request, response, url)) return true;
      if (!auth.authenticated(request)) {
        if (url.pathname === '/' && request.method === 'GET') {
          response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
          response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Foot Analysis</title><body style="background:#0b0d12;color:#f0f4f8;font:20px system-ui;padding:32px"><h1>Foot Analysis</h1><p>Dashboard privado de Shorts</p><a style="color:#70b7ff" href="/auth/google">Entrar com Google</a></body>');
        } else json(response, 401, {ok: false, error: 'Entre com sua conta Google em /.'});
        return true;
      }
      if (!['GET', 'HEAD'].includes(request.method) && !auth.validWrite(request)) {json(response, 403, {ok: false, error: 'Invalid origin'}); return true;}
      if (url.pathname === '/') {response.writeHead(302, {location: '/football'});response.end();return true;}
      if (url.pathname === '/api/online/config') {json(response, 200, {online: true, retentionHours: 48});return true;}
      if (url.pathname === '/api/online/storage' && request.method === 'GET') {
        json(response, 200, {ok: true, storage: await storageSummary()});return true;
      }
      if (url.pathname === '/api/online/renders' && request.method === 'DELETE') {
        if (request.headers['x-confirm-delete'] !== 'all-completed-mp4') {json(response, 400, {ok: false, error: 'Confirme a exclusão dos MP4 concluídos.'});return true;}
        // Snapshot eligible IDs once: queued/active jobs and later completions are never deleted.
        const targets = store.storedVideos();
        let deleted = 0, freedBytes = 0;
        for (const {id} of targets) {
          const size = await fileSize(id);
          await fs.rm(path.join(rendersRoot, `${id}.mp4`), {force: true});
          store.markDeleted(id);freedBytes += size;if (size > 0) deleted++;
        }
        json(response, 200, {ok: true, deleted, freedBytes});return true;
      }
      if (url.pathname === '/api/online/renders' && request.method === 'GET') {
        const page = Number(url.searchParams.get('page') || 0);
        if (!Number.isSafeInteger(page) || page < 0 || page > 1000000) {json(response,400,{ok:false});return true;}
        const renders = await Promise.all(store.list(page * 100).map(async (row) => ({...publicRender(row), sizeBytes: row.deleted_at ? 0 : await fileSize(row.id)})));
        json(response, 200, {ok: true, renders});return true;
      }
      const match = url.pathname.match(/^\/api\/online\/renders\/([a-f0-9-]{36})(?:\/(download|cancel|retry))?$/);
      if (match) {
        const [, id, action] = match;
        const row = store.get(id);
        if (!row) {json(response, 404, {ok: false});return true;}
        if (action === 'download' && ['GET', 'HEAD'].includes(request.method)) {
          if (!publicRender(row).downloadUrl) {json(response, 410, {ok: false, error: 'Arquivo expirado ou indisponível'});return true;}
          await streamFile(request, response, rendersRoot, `${id}.mp4`, url.searchParams.get('inline') === '1' ? undefined : `${id}.mp4`);
        } else if (action === 'cancel' && request.method === 'POST') {json(response, 200, {ok: true, render: publicRender(store.cancel(id))});}
        else if (action === 'retry' && request.method === 'POST') {
          if (['queued', 'rendering'].includes(row.state)) json(response, 409, {ok: false, error: 'Render ainda ativo'});
          else json(response, 202, {ok: true, render: this.enqueue(JSON.parse(row.snapshot))});
        } else if (!action && request.method === 'DELETE') {
          if (['queued', 'rendering'].includes(row.state)) json(response, 409, {ok: false, error: 'Cancele o render antes de excluir'});
          else {await fs.rm(path.join(rendersRoot, `${id}.mp4`), {force: true});store.markDeleted(id);json(response, 200, {ok: true});}
        } else if (!action && request.method === 'GET') json(response, 200, {ok: true, render: publicRender(row)});
        else json(response, 405, {ok: false});
        return true;
      }
      const preview = url.pathname.match(/^\/api\/online\/previews\/([a-f0-9-]{36})$/);
      if (preview && request.method === 'GET') {const job = store.getPreview(preview[1]);json(response, job ? 200 : 404, {ok: !!job, job});return true;}
      if (url.pathname === '/online/preview' && request.method === 'GET') {
        response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
        response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia</title><body style="margin:0;background:#0b0d12"><div id="player"></div><script src="/online/player.js"></script></body>');return true;
      }
      if (url.pathname === '/online/player.js' && request.method === 'GET') {await streamFile(request,response,path.join(root,'build/online'),'player.js');return true;}
      if (['GET', 'HEAD'].includes(request.method) && /^\/(audio|backgrounds|branding|fonts|logos|voiceovers)\//.test(url.pathname)) {await streamFile(request,response,publicRoot,decodeURIComponent(url.pathname.slice(1)));return true;}
      if (url.pathname.startsWith('/api/football/') && apiAllowed.has(url.pathname.slice('/api/football/'.length))) return false;
      if (['GET', 'HEAD'].includes(request.method) && ['/football', '/football/', '/football-static', '/football-static/'].includes(url.pathname)) {
        const html = await fs.readFile(path.join(root, 'dashboard/football/index.html'), 'utf8');
        response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
        response.end(html.replace('</head>', '<script>window.FOOT_ANALYSIS_ONLINE=true;</script><link rel="stylesheet" href="/online.css"></head>').replace('</body>', '<script type="module" src="/online.js"></script></body>'));
        return true;
      }
      if (['GET', 'HEAD'].includes(request.method) && ['/styles.css', '/online.css', '/online.js', '/football/app.js', '/football/helpers.js', '/football/studio.css', '/football/layout.js'].includes(url.pathname)) {await streamFile(request,response,path.join(root,'dashboard'),url.pathname.slice(1));return true;}
      json(response, 404, {ok: false, error: 'Not available in the private Shorts dashboard'});
      return true;
    },
  };
}
