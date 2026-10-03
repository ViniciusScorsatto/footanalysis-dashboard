import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import crypto from 'node:crypto';

import {
  leaguePresets,
  loadLeagueRounds,
  loadPredictionFixtures,
  prepareJob,
  projectRoot,
} from '../../scripts/lib/video-system.mjs';
import {listVideoJobs, saveRenderOutput} from '../../scripts/lib/football-db.mjs';
import {
  createPredictionRequest,
  getPredictionRequest,
  getRequestByDownloadToken,
  listPredictionRequests,
  setDownloadToken,
  updatePredictionRequest,
} from './store.mjs';

const allowedLeagues = new Map(
  leaguePresets
    .filter((item) => [71, 72, 75, 76].includes(item.leagueId))
    .map((item) => [item.leagueId, item])
);
const serviceToken = process.env.PREDICTION_SERVICE_TOKEN ?? '';
const adminToken = process.env.PREDICTION_ADMIN_TOKEN ?? serviceToken;
const port = Number(process.env.PREDICTION_SERVICE_PORT ?? 4322);
const host = process.env.PREDICTION_SERVICE_HOST ?? '0.0.0.0';
const publicBaseUrl = (process.env.PREDICTION_PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, '');
const downloadSecret = process.env.PREDICTION_DOWNLOAD_SECRET ?? serviceToken;
const outputDir = path.join(projectRoot, 'out');
const jsonHeaders = {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'};
const recentRequests = new Map();
let activeRender = false;

const sendJson = (response, status, body) => {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(body));
};

const sendText = (response, status, body, contentType = 'text/plain; charset=utf-8') => {
  response.writeHead(status, {'content-type': contentType});
  response.end(body);
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
};

const authorized = (request, expected) => {
  if (!expected) return false;
  const value = request.headers.authorization ?? '';
  return value === `Bearer ${expected}`;
};

const requireService = (request, response) => {
  if (!authorized(request, serviceToken)) {
    sendJson(response, 401, {ok: false, error: 'Unauthorized'});
    return false;
  }
  return true;
};

const requireAdmin = (request, response) => {
  if (!authorized(request, adminToken)) {
    sendJson(response, 401, {ok: false, error: 'Unauthorized'});
    return false;
  }
  return true;
};

const getAllowedLeague = (value) => {
  const leagueId = Number(value);
  return Number.isFinite(leagueId) ? allowedLeagues.get(leagueId) : undefined;
};

const validateScores = (predictionEdits, fixtures) => {
  if (!Array.isArray(predictionEdits) || predictionEdits.length !== fixtures.length) {
    throw new Error('É necessário preencher o placar de todos os jogos.');
  }
  const fixtureIds = new Set(fixtures.map((fixture) => Number(fixture.fixtureId)));
  const seen = new Set();
  return predictionEdits.map((edit) => {
    const fixtureId = Number(edit?.fixtureId);
    const homeScore = Number(edit?.homeScore);
    const awayScore = Number(edit?.awayScore);
    if (!fixtureIds.has(fixtureId) || seen.has(fixtureId)) throw new Error('Jogo inválido no palpite.');
    if (![homeScore, awayScore].every((score) => Number.isInteger(score) && score >= 0 && score <= 20)) {
      throw new Error('Os placares devem ser números inteiros entre 0 e 20.');
    }
    seen.add(fixtureId);
    return {fixtureId, homeScore, awayScore};
  });
};

const downloadTokenFor = (requestId) =>
  crypto.createHmac('sha256', downloadSecret).update(String(requestId)).digest('hex');

const loadManualFixtures = async ({leagueId, season, round}) => {
  const result = await loadPredictionFixtures({
    apiKey: process.env.FOOTBALL_API_KEY,
    apiHost: process.env.FOOTBALL_API_HOST,
    leagueId,
    season,
    round,
    languageProfile: 'pt-br',
    includePredictionSuggestions: false,
  });
  return {
    round: result.round,
    fixtures: result.fixtures.map((fixture) => ({
      fixtureId: fixture.fixtureId,
      fixtureDateKey: fixture.fixtureDateKey,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeBadge: fixture.homeBadge,
      awayBadge: fixture.awayBadge,
      homeScore: null,
      awayScore: null,
    })),
  };
};

const renderJob = ({outputName}) =>
  new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const outputPath = path.join('out', outputName);
    const child = spawn(command, ['remotion', 'render', 'src/index.ts', 'FootballPredictionsShort', outputPath], {
      cwd: projectRoot,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    child.on('close', (code) =>
      code === 0 ? resolve({outputPath, stdout, stderr}) : reject(new Error(stderr || stdout || `Render failed: ${code}`))
    );
  });

const runRenderForRequest = async (requestId) => {
  if (activeRender) throw new Error('Já existe um render em andamento.');
  const request = getPredictionRequest(requestId);
  if (!request) throw new Error('Pedido não encontrado.');
  if (!['PENDENTE', 'FALHOU'].includes(request.status)) throw new Error('Pedido não está pronto para renderização.');
  activeRender = true;
  updatePredictionRequest(requestId, {status: 'EM_RENDER', error_message: null});
  try {
    const outputName = `foot-analysis-${request.league_id}-${request.season}-${request.round.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${request.id}.mp4`;
    const {job} = await prepareJob({
      template: 'predictions',
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId: request.league_id,
      season: request.season,
      round: request.round,
      brandName: 'Foot Analysis',
      leagueName: request.league_name,
      roundLabel: `Palpites da ${request.round}`,
      outputName,
      channelProfile: 'pt',
      languageProfile: 'pt-br',
      predictionEdits: request.predictionEdits,
      voiceoverEnabled: false,
    });
    const videoJobId = listVideoJobs({limit: 1})[0]?.id ?? null;
    const render = await renderJob({outputName});
    saveRenderOutput({jobId: videoJobId, compositionId: 'FootballPredictionsShort', outputName, renderPath: render.outputPath, payload: render});
    const token = downloadTokenFor(request.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setDownloadToken(requestId, token, expiresAt);
    const updated = updatePredictionRequest(requestId, {
      status: 'PRONTO',
      video_job_id: videoJobId,
      output_name: outputName,
      render_path: render.outputPath,
    });
    return {...updated, downloadUrl: `${publicBaseUrl}/api/predictions/download/${token}`};
  } catch (error) {
    updatePredictionRequest(requestId, {status: 'FALHOU', error_message: error instanceof Error ? error.message : String(error)});
    throw error;
  } finally {
    activeRender = false;
  }
};

const adminHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pedidos de palpites · Foot Analysis</title><style>body{font-family:system-ui;background:#0b0d12;color:#f0f4f8;max-width:1100px;margin:0 auto;padding:32px}h1{font-size:28px}button{background:#f0a500;border:0;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer}.row{border:1px solid #1e2a3a;background:#0f1318;padding:16px;margin:12px 0;border-radius:10px}.muted{color:#7f91a0;font-size:13px}.actions{display:flex;gap:8px;margin-top:12px}</style></head><body><h1>Pedidos de palpites</h1><p class="muted">Use o token administrativo configurado no serviço.</p><div id="app">Carregando…</div><script>const token=prompt('Token administrativo');const headers={Authorization:'Bearer '+token};const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));async function load(){const r=await fetch('/api/admin/prediction-requests',{headers});const d=await r.json();document.querySelector('#app').innerHTML=(d.requests||[]).map(x=>'<article class="row"><strong>'+esc(x.league_name)+' · '+esc(x.round)+'</strong><div>'+esc(x.email)+' · <b>'+esc(x.status)+'</b></div><div class="muted">'+esc(x.predictionEdits.map(p=>p.homeScore+' × '+p.awayScore).join(' · '))+'</div><div class="actions">'+(x.status==='PENDENTE'||x.status==='FALHOU'?'<button onclick="act(\''+x.id+'\',\'render\')">Renderizar</button>':'')+(x.status==='PRONTO'?'<button onclick="act(\''+x.id+'\',\'deliver\')">Enviar e-mail</button>':'')+'</div></article>').join('')||'<p>Nenhum pedido.</p>'}async function act(id,action){await fetch('/api/admin/prediction-requests/'+id+'/'+action,{method:'POST',headers});load()}load()</script></body></html>`;

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  try {
    if (request.method === 'GET' && url.pathname === '/health') return sendJson(response, 200, {ok: true, service: 'prediction-shorts'});
    if (request.method === 'GET' && url.pathname === '/admin') return sendText(response, 200, adminHtml, 'text/html; charset=utf-8');
    if (url.pathname.startsWith('/api/predictions/download/')) {
      const token = decodeURIComponent(url.pathname.split('/').at(-1) ?? '');
      const item = getRequestByDownloadToken(token);
      if (!item?.render_path) return sendText(response, 404, 'Download indisponível.');
      const filePath = path.resolve(projectRoot, item.render_path);
      if (!filePath.startsWith(`${outputDir}${path.sep}`)) return sendText(response, 404, 'Download indisponível.');
      const file = await fs.readFile(filePath);
      response.writeHead(200, {'content-type': 'video/mp4', 'content-disposition': `attachment; filename="${item.output_name}"`});
      return response.end(file);
    }
    if (url.pathname.startsWith('/api/predictions/') && !requireService(request, response)) return;
    if (url.pathname.startsWith('/api/admin/') && !requireAdmin(request, response)) return;

    if (request.method === 'GET' && url.pathname === '/api/predictions/options') {
      return sendJson(response, 200, {ok: true, leagues: [...allowedLeagues.values()], season: Number(process.env.FOOTBALL_SEASON ?? new Date().getUTCFullYear())});
    }
    if (request.method === 'GET' && url.pathname === '/api/predictions/rounds') {
      const league = getAllowedLeague(url.searchParams.get('leagueId'));
      const season = Number(url.searchParams.get('season'));
      if (!league || !Number.isInteger(season)) return sendJson(response, 400, {ok: false, error: 'Campeonato e temporada inválidos.'});
      const rounds = await loadLeagueRounds({apiKey: process.env.FOOTBALL_API_KEY, apiHost: process.env.FOOTBALL_API_HOST, leagueId: league.leagueId, season});
      return sendJson(response, 200, {ok: true, rounds});
    }
    if (request.method === 'GET' && url.pathname === '/api/predictions/fixtures') {
      const league = getAllowedLeague(url.searchParams.get('leagueId'));
      const season = Number(url.searchParams.get('season'));
      const round = String(url.searchParams.get('round') ?? '').trim();
      if (!league || !Number.isInteger(season) || !round) return sendJson(response, 400, {ok: false, error: 'Campeonato, temporada e rodada são obrigatórios.'});
      const data = await loadManualFixtures({leagueId: league.leagueId, season, round});
      return sendJson(response, 200, {ok: true, league: league.label, ...data});
    }
    if (request.method === 'POST' && url.pathname === '/api/predictions/requests') {
      const body = await readBody(request);
      if (!process.env.WEBSITE_REQUEST_TOKEN || body.websiteToken !== process.env.WEBSITE_REQUEST_TOKEN) return sendJson(response, 403, {ok: false, error: 'Origem não autorizada.'});
      if (String(body.websiteHoneypot ?? '').trim()) return sendJson(response, 202, {ok: true, requestId: 'accepted'});
      const league = getAllowedLeague(body.leagueId);
      const season = Number(body.season);
      const round = String(body.round ?? '').trim();
      const email = String(body.email ?? '').trim().toLowerCase();
      const requestIp = request.socket.remoteAddress ?? 'unknown';
      const throttleKey = `${requestIp}:${email}`;
      const previousRequest = recentRequests.get(throttleKey) ?? 0;
      if (Date.now() - previousRequest < 60 * 60 * 1000) throw new Error('Já recebemos um pedido recente para este e-mail.');
      if (!league || !Number.isInteger(season) || !round || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Preencha campeonato, rodada e um e-mail válido.');
      const fixtureData = await loadManualFixtures({leagueId: league.leagueId, season, round});
      const predictionEdits = validateScores(body.predictionEdits, fixtureData.fixtures);
      const saved = createPredictionRequest({email, leagueId: league.leagueId, leagueName: league.label, season, round: fixtureData.round, fixtures: fixtureData.fixtures, predictionEdits});
      recentRequests.set(throttleKey, Date.now());
      return sendJson(response, 201, {ok: true, requestId: saved.id, status: saved.status});
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/prediction-requests') return sendJson(response, 200, {ok: true, requests: listPredictionRequests({status: url.searchParams.get('status') || undefined})});
    const actionMatch = url.pathname.match(/^\/api\/admin\/prediction-requests\/([^/]+)\/(render|deliver)$/);
    if (request.method === 'POST' && actionMatch) {
      const [, id, action] = actionMatch;
      if (action === 'render') return sendJson(response, 200, {ok: true, request: await runRenderForRequest(id)});
      const item = getPredictionRequest(id);
      if (!item || item.status !== 'PRONTO') throw new Error('Pedido não está pronto para entrega.');
      const webhookUrl = process.env.WEBSITE_DELIVERY_WEBHOOK_URL;
      if (!webhookUrl) throw new Error('WEBSITE_DELIVERY_WEBHOOK_URL não configurada.');
      const delivery = await fetch(webhookUrl, {method: 'POST', headers: {'content-type': 'application/json', authorization: `Bearer ${process.env.WEBSITE_DELIVERY_TOKEN ?? ''}`}, body: JSON.stringify({email: item.email, leagueName: item.league_name, round: item.round, downloadUrl: `${publicBaseUrl}/api/predictions/download/${downloadTokenFor(id)}`})});
      if (!delivery.ok) throw new Error(`Falha ao enviar e-mail: ${delivery.status}`);
      return sendJson(response, 200, {ok: true, request: updatePredictionRequest(id, {status: 'ENVIADO'})});
    }
    return sendJson(response, 404, {ok: false, error: 'Not found'});
  } catch (error) {
    sendJson(response, 400, {ok: false, error: error instanceof Error ? error.message : String(error)});
  }
});

server.listen(port, host, () => console.log(`Prediction Shorts service running at http://${host}:${port}`));
