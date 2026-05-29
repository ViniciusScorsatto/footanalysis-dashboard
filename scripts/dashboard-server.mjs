import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {
  footballChannelProfiles,
  footballLanguageProfiles,
  footballSoundtrackPresets,
  leaguePresets,
  loadCurrentJob,
  loadPredictionFixtures,
  loadResultFixtures,
  loadStandingsEditor,
  loadSeasonFinalVerdictEditor,
  loadLeagueRounds,
  loadRoundDates,
  loadFootballPredictionsLongJob,
  prepareJob,
  prepareFootballPredictionsLongJob,
  parseFootballPredictionsLongYaml,
  projectRoot,
  templates,
} from './lib/video-system.mjs';
import {getFootballHookOptions} from './lib/football-copy.mjs';

const dashboardDir = path.join(projectRoot, 'dashboard');
const outDir = path.join(projectRoot, 'out');
const port = Number(process.env.DASHBOARD_PORT ?? '4321');
const host = process.env.DASHBOARD_HOST ?? '127.0.0.1';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
};

const sendJson = (response, statusCode, data) => {
  response.writeHead(statusCode, {'content-type': 'application/json; charset=utf-8'});
  response.end(JSON.stringify(data));
};

const notFound = (response, message = 'Not found') => {
  response.writeHead(404);
  response.end(message);
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const parseBooleanField = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return !['false', '0', 'off', 'no'].includes(String(value).toLowerCase());
};

const parseMatchDates = (value, values = []) => {
  const rawValues = [
    ...(Array.isArray(values) ? values : [values]),
    ...(Array.isArray(value) ? value : [value]),
  ];

  return [
    ...new Set(
      rawValues
        .flatMap((item) => String(item ?? '').split(','))
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
};

const serveStatic = async (response, filePath) => {
  try {
    const ext = path.extname(filePath);
    const body = await fs.readFile(filePath);
    response.writeHead(200, {'content-type': contentTypes[ext] ?? 'application/octet-stream'});
    response.end(body);
  } catch {
    notFound(response);
  }
};

const sendFootballOptions = async (response) => {
  const currentJob = await loadCurrentJob().catch(() => null);
  sendJson(response, 200, {
    templates,
    leaguePresets,
    channelProfiles: footballChannelProfiles,
    languageProfiles: footballLanguageProfiles,
    hookOptions: Object.fromEntries(
      footballLanguageProfiles.map((profile) => [
        profile.value,
        Object.fromEntries(
          templates.map((template) => [
            template.value,
            getFootballHookOptions(template.value, profile.value),
          ])
        ),
      ])
    ),
    soundtrackPresets: footballSoundtrackPresets,
    currentJob,
  });
};

const sendFootballLongformOptions = async (response) => {
  const currentJob = await loadFootballPredictionsLongJob().catch(() => null);
  sendJson(response, 200, {
    leaguePresets: leaguePresets.filter((preset) => preset.channels?.includes('pt')),
    soundtrackPresets: footballSoundtrackPresets,
    currentJob,
  });
};

const sendFootballRounds = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const rounds = await loadLeagueRounds({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId,
      season,
    });

    sendJson(response, 200, {
      ok: true,
      rounds,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      rounds: [],
    });
  }
};

const sendFootballRoundDates = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const round = url.searchParams.get('round') ?? '';
    const languageProfile = url.searchParams.get('languageProfile') ?? 'pt-br';
    const dates = await loadRoundDates({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId,
      season,
      round,
      languageProfile,
    });

    sendJson(response, 200, {
      ok: true,
      dates,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      dates: [],
    });
  }
};

const sendFootballPredictionFixtures = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const round = url.searchParams.get('round') ?? '';
    const matchDate = url.searchParams.get('matchDate') ?? '';
    const matchDates = parseMatchDates(matchDate, url.searchParams.getAll('matchDates'));
    const languageProfile = url.searchParams.get('languageProfile') ?? 'pt-br';
    const data = await loadPredictionFixtures({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId,
      season,
      round,
      matchDate,
      matchDates,
      languageProfile,
    });

    sendJson(response, 200, {
      ok: true,
      ...data,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      fixtures: [],
    });
  }
};

const sendFootballResultFixtures = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const round = url.searchParams.get('round') ?? '';
    const matchDate = url.searchParams.get('matchDate') ?? '';
    const matchDates = parseMatchDates(matchDate, url.searchParams.getAll('matchDates'));
    const languageProfile = url.searchParams.get('languageProfile') ?? 'pt-br';
    const data = await loadResultFixtures({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId,
      season,
      round,
      matchDate,
      matchDates,
      languageProfile,
    });

    sendJson(response, 200, {
      ok: true,
      ...data,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      fixtures: [],
    });
  }
};

const sendFootballStandingsEditor = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const data = await loadStandingsEditor({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId,
      season,
    });

    sendJson(response, 200, {
      ok: true,
      ...data,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      rows: [],
    });
  }
};

const sendFootballSeasonFinalVerdictEditor = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const languageProfile = url.searchParams.get('languageProfile') ?? 'pt-br';
    const data = await loadSeasonFinalVerdictEditor({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      leagueId,
      season,
      languageProfile,
    });

    sendJson(response, 200, {
      ok: true,
      ...data,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      rows: [],
      statusOptions: [],
    });
  }
};

const prepareFootballJob = async (body) =>
  prepareJob({
    template: body.template,
    apiKey: process.env.FOOTBALL_API_KEY,
    apiHost: process.env.FOOTBALL_API_HOST,
    leagueId: Number(body.leagueId),
    season: Number(body.season),
    round: body.round,
    matchDate: body.matchDate,
    matchDates: parseMatchDates(body.matchDate, body.matchDates),
    brandName: body.brandName,
    leagueName: body.leagueName,
    roundLabel: body.roundLabel,
    outputName: body.outputName,
    channelProfile: body.channelProfile,
    languageProfile: body.languageProfile,
    groupLetter: body.groupLetter,
    competitionName: body.competitionName,
    ctaText: body.ctaText,
    soundtrackPath: body.soundtrackPath,
    soundtrackVolume: body.soundtrackVolume,
    introTitle: body.introTitle,
    introSubtitle: body.introSubtitle,
    hookText: body.hookText,
    voiceoverText: body.voiceoverText,
    voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
    includeFinalResult: parseBooleanField(body.includeFinalResult, true),
    championFinalSelection: body.championFinalSelection,
    championFinalRank: body.championFinalRank,
    predictionEdits: body.predictionEdits,
    fixtureEdits: body.fixtureEdits,
    standingEdits: body.standingEdits,
    seasonFinalVerdictEdits: body.seasonFinalVerdictEdits,
  });


const runRender = async (compositionId, outputName) => {
  const outputPath = path.join('out', outputName);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});

  return new Promise((resolve, reject) => {
    const child = spawn(
      npxCommand,
      ['remotion', 'render', 'src/index.ts', compositionId, outputPath],
      {
        cwd: projectRoot,
        env: process.env,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          outputPath,
          stdout,
          stderr,
        });
        return;
      }

      reject(new Error(stderr || stdout || `Render failed with exit code ${code}`));
    });
  });
};

const runStill = async (compositionId, outputName) => {
  const outputPath = path.join('out', outputName);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});

  return new Promise((resolve, reject) => {
    const child = spawn(
      npxCommand,
      ['remotion', 'still', 'src/index.ts', compositionId, outputPath],
      {
        cwd: projectRoot,
        env: process.env,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          outputPath,
          stdout,
          stderr,
        });
        return;
      }

      reject(new Error(stderr || stdout || `Still render failed with exit code ${code}`));
    });
  });
};

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end('Missing URL');
    return;
  }

  const url = new URL(request.url, `http://localhost:${port}`);

  if (request.method === 'GET' && url.pathname === '/api/football/options') {
    await sendFootballOptions(response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/longform/options') {
    await sendFootballLongformOptions(response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/longform/validate') {
    try {
      const body = await readBody(request);
      const validation = parseFootballPredictionsLongYaml(body.yamlText ?? '');
      sendJson(response, validation.ok ? 200 : 400, validation);
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/rounds') {
    await sendFootballRounds(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/round-dates') {
    await sendFootballRoundDates(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/prediction-fixtures') {
    await sendFootballPredictionFixtures(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/result-fixtures') {
    await sendFootballResultFixtures(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/standings-editor') {
    await sendFootballStandingsEditor(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/season-final-verdict-editor') {
    await sendFootballSeasonFinalVerdictEditor(response, url);
    return;
  }


  if (request.method === 'POST' && url.pathname === '/api/football/jobs/prepare') {
    try {
      const body = await readBody(request);
      const {job} = await prepareFootballJob(body);

      sendJson(response, 200, {
        ok: true,
        message: 'Current job prepared. Refresh Remotion Studio to preview it.',
        job,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/jobs/render') {
    try {
      const body = await readBody(request);
      const {job} = await prepareFootballJob(body);

      const renderResult = await runRender(job.compositionId, job.outputName);

      sendJson(response, 200, {
        ok: true,
        message: 'Render completed successfully.',
        job,
        render: renderResult,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/longform/prepare') {
    try {
      const body = await readBody(request);
      const {job, validation} = await prepareFootballPredictionsLongJob({
        yamlText: body.yamlText,
        brandName: body.brandName,
        soundtrackPath: body.soundtrackPath,
        soundtrackVolume: body.soundtrackVolume,
        voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
      });

      sendJson(response, 200, {
        ok: true,
        message: 'Longform predictions job prepared.',
        job,
        validation,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/longform/render') {
    try {
      const body = await readBody(request);
      const {job, validation} = await prepareFootballPredictionsLongJob({
        yamlText: body.yamlText,
        brandName: body.brandName,
        soundtrackPath: body.soundtrackPath,
        soundtrackVolume: body.soundtrackVolume,
        voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
      });
      const renderResult = await runRender('FootballPredictionsLong', job.outputName);

      sendJson(response, 200, {
        ok: true,
        message: 'Longform predictions render completed successfully.',
        job,
        validation,
        render: renderResult,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
        errorDetails: error?.details ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/jobs/current') {
    const currentJob = await loadCurrentJob().catch(() => null);
    sendJson(response, 200, {
      currentJob,
    });
    return;
  }


  if (request.method === 'GET' && url.pathname.startsWith('/out/')) {
    const relativePath = decodeURIComponent(url.pathname.replace(/^\/out\//, ''));
    const filePath = path.resolve(outDir, relativePath);
    if (!filePath.startsWith(`${outDir}${path.sep}`)) {
      notFound(response);
      return;
    }
    await serveStatic(response, filePath);
    return;
  }

  let filePath = '';
  if (url.pathname === '/') {
    filePath = path.join(dashboardDir, 'index.html');
  } else if (url.pathname === '/football' || url.pathname === '/football/') {
    filePath = path.join(dashboardDir, 'football', 'index.html');
  } else if (
    url.pathname === '/football-longform' ||
    url.pathname === '/football-longform/'
  ) {
    filePath = path.join(dashboardDir, 'football-longform', 'index.html');
  } else {
    filePath = path.join(dashboardDir, url.pathname);
  }

  await serveStatic(response, filePath);
});

server.listen(port, host, () => {
  console.log(`Foot Analysis dashboard running at http://${host}:${port}`);
});
