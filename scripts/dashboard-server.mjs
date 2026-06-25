import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {
  footballChannelProfiles,
  footballLanguageProfiles,
  footballShortTemplateCompositionMap,
  footballSoundtrackPresets,
  getFootballShortDurationParts,
  leaguePresets,
  loadCurrentJob,
  loadFootballShortDurationsConfig,
  loadNextFixtures,
  loadPredictionFixtures,
  loadResultFixtures,
  loadStandingsEditor,
  loadSeasonFinalVerdictEditor,
  loadLeagueRounds,
  loadRoundDates,
  loadFootballPredictionsLongJob,
  loadFootballRoundSummaryLongJob,
  loadTeamAccentColors,
  loadWorldCupConfig,
  loadWorldCupTierlistTeams,
  prepareJob,
  prepareWorldCupGroupStandingsPreview,
  prepareFootballPredictionsLongJob,
  parseFootballPredictionsLongYaml,
  prepareFootballRoundSummaryLongJob,
  parseFootballRoundSummaryLongYaml,
  projectRoot,
  saveFootballShortContentDurations,
  summarizeFootballShortDurations,
  syncCurrentFootballJobDuration,
  templates,
} from './lib/video-system.mjs';
import {getFootballCtaOptions, getFootballHookOptions} from './lib/football-copy.mjs';

const dashboardDir = path.join(projectRoot, 'dashboard');
const publicDir = path.join(projectRoot, 'public');
const outDir = path.join(projectRoot, 'out');
const publishingTemplateDir = path.join(projectRoot, 'config', 'publishing');
const footballThumbnailJobFile = path.join(
  projectRoot,
  'src',
  'data',
  'generated',
  'current-job.football.thumbnail.json'
);
const logosDir = path.join(projectRoot, 'public', 'logos');
const port = Number(process.env.DASHBOARD_PORT ?? '4321');
const host = process.env.DASHBOARD_HOST ?? '127.0.0.1';
const execFileAsync = promisify(execFile);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
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

const slugifyOutputPart = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizePngOutputName = (value, fallback = 'football-thumbnail.png') => {
  const rawValue = String(value ?? '').trim();
  const basename = path.basename(rawValue || fallback);
  const withoutExtension = basename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const slug = slugifyOutputPart(withoutExtension) || fallback.replace(/\.png$/i, '');
  return `${slug}.png`;
};

const normalizePublicPath = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return undefined;
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const normalizeThumbnailTeam = ({label, logoPath, accentColor, fallbackLabel}) => ({
  label: String(label || fallbackLabel || 'Time').trim(),
  logoPath: normalizePublicPath(logoPath),
  accentColor: String(accentColor || '').trim() || undefined,
});

const prepareFootballThumbnailJob = async (body) => {
  const channelProfile = body.channelProfile === 'en' ? 'en' : 'pt';
  const languageProfile = channelProfile === 'en' ? 'en' : 'pt-br';
  const allowedPresets = new Set(['matchup', 'result', 'table-story', 'champion']);
  const allowedThumbnailModels = new Set([
    'model-1',
    'model-2',
    'model-3',
    'model-4',
    'model-5',
    'model-6',
    'model-7',
    'model-8',
  ]);
  const preset = allowedPresets.has(body.preset) ? body.preset : 'matchup';
  const thumbnailModel = allowedThumbnailModels.has(body.thumbnailModel)
    ? body.thumbnailModel
    : 'model-4';
  const teamA = normalizeThumbnailTeam({
    label: body.teamAName,
    logoPath: body.teamALogoPath,
    accentColor: body.teamAAccentColor,
    fallbackLabel: channelProfile === 'en' ? 'Team A' : 'Time A',
  });
  const teamBName = String(body.teamBName || '').trim();
  const teamBLogoPath = String(body.teamBLogoPath || '').trim();
  const teamBAccentColor = String(body.teamBAccentColor || '').trim();
  const teamB =
    teamBName || teamBLogoPath || teamBAccentColor
      ? normalizeThumbnailTeam({
          label: teamBName || (channelProfile === 'en' ? 'Team B' : 'Time B'),
          logoPath: teamBLogoPath,
          accentColor: teamBAccentColor,
        })
      : undefined;
  const teamCName = String(body.teamCName || '').trim();
  const teamCLogoPath = String(body.teamCLogoPath || '').trim();
  const teamCAccentColor = String(body.teamCAccentColor || '').trim();
  const teamC =
    teamCName || teamCLogoPath || teamCAccentColor
      ? normalizeThumbnailTeam({
          label: teamCName || (channelProfile === 'en' ? 'Team C' : 'Time C'),
          logoPath: teamCLogoPath,
          accentColor: teamCAccentColor,
        })
      : undefined;
  const teamDName = String(body.teamDName || '').trim();
  const teamDLogoPath = String(body.teamDLogoPath || '').trim();
  const teamDAccentColor = String(body.teamDAccentColor || '').trim();
  const teamD =
    teamDName || teamDLogoPath || teamDAccentColor
      ? normalizeThumbnailTeam({
          label: teamDName || (channelProfile === 'en' ? 'Team D' : 'Time D'),
          logoPath: teamDLogoPath,
          accentColor: teamDAccentColor,
        })
      : undefined;
  const teamEName = String(body.teamEName || '').trim();
  const teamELogoPath = String(body.teamELogoPath || '').trim();
  const teamEAccentColor = String(body.teamEAccentColor || '').trim();
  const teamE =
    teamEName || teamELogoPath || teamEAccentColor
      ? normalizeThumbnailTeam({
          label: teamEName || (channelProfile === 'en' ? 'Team E' : 'Time E'),
          logoPath: teamELogoPath,
          accentColor: teamEAccentColor,
        })
      : undefined;
  const teamFName = String(body.teamFName || '').trim();
  const teamFLogoPath = String(body.teamFLogoPath || '').trim();
  const teamFAccentColor = String(body.teamFAccentColor || '').trim();
  const teamF =
    teamFName || teamFLogoPath || teamFAccentColor
      ? normalizeThumbnailTeam({
          label: teamFName || (channelProfile === 'en' ? 'Team F' : 'Time F'),
          logoPath: teamFLogoPath,
          accentColor: teamFAccentColor,
        })
      : undefined;
  const leagueName = String(body.leagueName || '').trim() || 'Copa do Brasil';
  const headline = String(body.headline || '').trim() || (channelProfile === 'en' ? 'WHO ADVANCES?' : 'QUEM PASSA?');
  const outputName =
    normalizePngOutputName(body.outputName, `${slugifyOutputPart(`${leagueName}-${headline}`)}.png`);
  const job = {
    sport: 'football',
    template: 'thumbnail',
    compositionId: 'FootballThumbnailStill',
    channelProfile,
    languageProfile,
    preset,
    thumbnailModel,
    brandName: String(body.brandName || '').trim() || 'Foot Analysis',
    brandLogoPath: normalizePublicPath(body.brandLogoPath) || '/branding/foot-analysis-logo.png',
    leagueName,
    headline,
    subheadline: String(body.subheadline || '').trim() || undefined,
    extraLabel: String(body.extraLabel || '').trim() || undefined,
    outputName,
    accentColor: String(body.accentColor || '').trim() || (channelProfile === 'en' ? '#0A84FF' : '#F0A500'),
    secondaryAccentColor: String(body.secondaryAccentColor || '').trim() || undefined,
    backgroundImagePath:
      normalizePublicPath(body.backgroundImagePath) ||
      '/backgrounds/thumbnails/neon-stadium-copa-bg.png',
    teamA,
    teamB,
    teamC,
    teamD,
    teamE,
    teamF,
  };

  await fs.writeFile(footballThumbnailJobFile, `${JSON.stringify(job, null, 2)}\n`, 'utf8');

  return {job};
};

const listFootballLogos = async (query) => {
  const normalizedQuery = slugifyOutputPart(query);
  const filenames = await fs.readdir(logosDir).catch(() => []);
  return filenames
    .filter((filename) => /\.(png|jpg|jpeg|webp)$/i.test(filename))
    .filter((filename) => !normalizedQuery || slugifyOutputPart(filename).includes(normalizedQuery))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => ({
      label: filename.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/-\d+$/g, '').replace(/-/g, ' '),
      path: `/logos/${filename}`,
    }));
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

const buildFootballShortDurationSettings = () => {
  const config = loadFootballShortDurationsConfig();
  const durationPartsByComposition = summarizeFootballShortDurations(config);
  const globalParts = getFootballShortDurationParts('', config);
  const shortItems = templates
    .map((template) => {
      const compositionId = footballShortTemplateCompositionMap[template.value];
      if (!compositionId || !durationPartsByComposition[compositionId]) {
        return null;
      }
      const parts = getFootballShortDurationParts(compositionId, config);
      return {
        template: template.value,
        label: template.label,
        compositionId,
        contentFrames: parts.contentFrames,
        totalFrames: parts.totalFrames,
      };
    })
    .filter(Boolean);

  return {
    fps: config?.fps ?? 30,
    opening: {
      teaserFrames: globalParts.teaserFrames,
      introFrames: globalParts.introFrames,
    },
    minimumTotalFrames: globalParts.minimumTotalFrames,
    defaultContentFrames: globalParts.defaultContentFrames,
    items: shortItems,
  };
};

const sendFootballShortDurations = (response) => {
  sendJson(response, 200, {
    ok: true,
    durations: buildFootballShortDurationSettings(),
  });
};

const saveFootballShortDurations = async (request, response) => {
  try {
    const body = await readBody(request);
    const updates = body.contentFramesByComposition;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new Error('contentFramesByComposition must be an object.');
    }

    await saveFootballShortContentDurations(updates);
    sendJson(response, 200, {
      ok: true,
      message:
        'Short durations saved. Refresh or restart Remotion Studio if the preview timeline does not update.',
      durations: buildFootballShortDurationSettings(),
    });
  } catch (error) {
    sendJson(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const sendFootballLongformOptions = async (response) => {
  const currentJob = await loadFootballPredictionsLongJob().catch(() => null);
  const teamAccentColors = await loadTeamAccentColors();

  sendJson(response, 200, {
    leaguePresets,
    channelProfiles: footballChannelProfiles,
    soundtrackPresets: footballSoundtrackPresets,
    teamAccentColors,
    currentJob,
  });
};

const sendFootballWorldCupGroups = async (response) => {
  try {
    const config = await loadWorldCupConfig();
    sendJson(response, 200, {
      ok: true,
      competitionName: config.competitionName ?? '',
      groups: config.groups ?? {},
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const sendFootballWorldCupStandingsPreview = async (response, url) => {
  try {
    const groupLetter = (url.searchParams.get('groupLetter') || 'A').toUpperCase().slice(0, 1);
    const season = Number(url.searchParams.get('season') || new Date().getFullYear());
    const languageProfile = url.searchParams.get('languageProfile') || 'pt-br';
    const channelProfile =
      url.searchParams.get('channelProfile') || (languageProfile === 'en' ? 'en' : 'pt');
    const competitionName = url.searchParams.get('competitionName') || undefined;
    const roundLabel = url.searchParams.get('roundLabel') || undefined;

    const {job} = await prepareWorldCupGroupStandingsPreview({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      season,
      channelProfile,
      languageProfile,
      groupLetter,
      competitionName,
      roundLabel,
    });

    sendJson(response, 200, {
      ok: true,
      groupLetter: job.groupLetter,
      rows: job.rows ?? [],
      lastResults: job.lastResults ?? [],
      nextMatches: job.nextMatches ?? [],
      warnings: job.warnings ?? [],
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const sendFootballRoundSummaryLongformOptions = async (response) => {
  const currentJob = await loadFootballRoundSummaryLongJob().catch(() => null);
  const teamAccentColors = await loadTeamAccentColors();
  sendJson(response, 200, {
    leaguePresets,
    channelProfiles: footballChannelProfiles,
    soundtrackPresets: footballSoundtrackPresets,
    teamAccentColors,
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

const sendFootballNextFixtures = async (response, url) => {
  try {
    const leagueId = Number(url.searchParams.get('leagueId'));
    const season = Number(url.searchParams.get('season'));
    const round = url.searchParams.get('round') ?? '';
    const matchDate = url.searchParams.get('matchDate') ?? '';
    const matchDates = parseMatchDates(matchDate, url.searchParams.getAll('matchDates'));
    const languageProfile = url.searchParams.get('languageProfile') ?? 'pt-br';
    const data = await loadNextFixtures({
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

const sendFootballTierlistTeams = async (response, url) => {
  try {
    const season = Number(url.searchParams.get('season'));
    const languageProfile = url.searchParams.get('languageProfile') ?? 'pt-br';
    const teams = await loadWorldCupTierlistTeams({
      apiKey: process.env.FOOTBALL_API_KEY,
      apiHost: process.env.FOOTBALL_API_HOST,
      season: Number.isFinite(season) ? season : 2026,
      languageProfile,
    });

    sendJson(response, 200, {
      ok: true,
      teams,
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      teams: [],
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
    worldCupStandingEdits: body.worldCupStandingEdits,
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
    tierlistSelections: body.tierlistSelections,
    topScorerPrediction: body.topScorerPrediction,
    bestPlayerPrediction: body.bestPlayerPrediction,
  });

const compactText = (value, maxLength = 900) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

const summarizeFixture = (fixture) => {
  const home = fixture.homeTeam ?? fixture.home ?? fixture.homeName ?? '';
  const away = fixture.awayTeam ?? fixture.away ?? fixture.awayName ?? '';
  const score =
    fixture.homeScore !== undefined && fixture.awayScore !== undefined
      ? `${fixture.homeScore ?? '-'}-${fixture.awayScore ?? '-'}`
      : fixture.predictedScore ?? fixture.score ?? '';
  const status = fixture.statusLabel ?? fixture.status ?? fixture.venue ?? '';
  return compactText([home, score, away, status].filter(Boolean).join(' '), 160);
};

const summarizeRows = (rows = [], mapRow) =>
  rows
    .slice(0, 12)
    .map(mapRow)
    .filter(Boolean)
    .map((item) => compactText(item, 180));

const formatTeamMetric = (entry) => {
  if (!entry) return '';
  const name = entry.team ?? entry.playerName ?? entry.name ?? '';
  const rank = entry.rank ? `${entry.rank}º ` : '';
  const metrics = [
    entry.points !== undefined ? `${entry.points} pts` : '',
    entry.percentage !== undefined ? `${entry.percentage}%` : '',
    entry.goals !== undefined ? `${entry.goals} goals` : '',
    entry.assists !== undefined ? `${entry.assists} assists` : '',
    entry.goalDifference !== undefined ? `${entry.goalDifference} GD` : '',
    entry.form ? `form ${entry.form}` : '',
  ].filter(Boolean);
  return `${rank}${name}${metrics.length ? `: ${metrics.join(', ')}` : ''}`;
};

const formatPlayerMetric = (entry) => {
  if (!entry) return '';
  const playerName = entry.playerName ?? entry.name ?? '';
  const teamContext = entry.team ? ` (${entry.team})` : '';
  const name = `${playerName}${teamContext}`.trim();
  const rank = entry.rank ? `${entry.rank}º ` : '';
  const metrics = [
    entry.goals !== undefined ? `${entry.goals} goals` : '',
    entry.assists !== undefined ? `${entry.assists} assists` : '',
    entry.rating !== undefined ? `${entry.rating} rating` : '',
    entry.position ? `position ${entry.position}` : '',
    entry.minutes !== undefined ? `${entry.minutes} minutes` : '',
  ].filter(Boolean);
  return `${rank}${name}${metrics.length ? `: ${metrics.join(', ')}` : ''}`;
};

const fixtureScore = (fixture) => ({
  homeScore: Number(fixture.homeScore),
  awayScore: Number(fixture.awayScore),
});

const hasNumericScore = (fixture) => {
  const {homeScore, awayScore} = fixtureScore(fixture);
  return Number.isFinite(homeScore) && Number.isFinite(awayScore);
};

const fixtureWinner = (fixture) => {
  if (!hasNumericScore(fixture)) return null;
  const {homeScore, awayScore} = fixtureScore(fixture);
  if (homeScore === awayScore) return null;
  return homeScore > awayScore ? fixture.homeTeam : fixture.awayTeam;
};

const fixtureMargin = (fixture) => {
  if (!hasNumericScore(fixture)) return 0;
  const {homeScore, awayScore} = fixtureScore(fixture);
  return Math.abs(homeScore - awayScore);
};

const formatFixtureStory = (fixture) => {
  const score = hasNumericScore(fixture)
    ? `${fixture.homeTeam} ${fixture.homeScore}-${fixture.awayScore} ${fixture.awayTeam}`
    : `${fixture.homeTeam} vs ${fixture.awayTeam}`;
  const winner = fixtureWinner(fixture);
  const suffix = winner ? `winner: ${winner}` : hasNumericScore(fixture) ? 'draw' : '';
  return [score, suffix, fixture.fixtureDateKey].filter(Boolean).join(' · ');
};

const majorClubNames = [
  'Palmeiras',
  'Flamengo',
  'Corinthians',
  'São Paulo',
  'Sao Paulo',
  'Santos',
  'Vasco',
  'Fluminense',
  'Cruzeiro',
  'Grêmio',
  'Gremio',
  'Internacional',
  'Botafogo',
  'Atlético Mineiro',
  'Atletico Mineiro',
];

const getFixtureTeams = (fixture) => [
  fixture.homeTeam ?? fixture.home ?? fixture.homeName ?? '',
  fixture.awayTeam ?? fixture.away ?? fixture.awayName ?? '',
];

const fixtureStoryScore = (fixture) =>
  getFixtureTeams(fixture).reduce((score, team) => {
    const normalizedTeam = String(team)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    const majorClubHit = majorClubNames.some((club) => {
      const normalizedClub = club
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      return normalizedTeam === normalizedClub;
    });
    return score + (majorClubHit ? 5 : 0);
  }, 0);

const getZoneRows = (rows, start, end) =>
  rows.filter((row) => Number(row.rank) >= start && Number(row.rank) <= end);

const publishingTemplateContext = {
  standings: {
    contentType: 'league_standings',
    editorialAngle: 'full table/classification update; focus on leader, top-zone movement, continental spots, and relegation zone only as part of the table.',
  },
  results: {
    contentType: 'round_results',
    editorialAngle: 'latest match results; focus on scorelines, surprises, big wins, and what changed after the round.',
  },
  'next-games': {
    contentType: 'upcoming_fixtures',
    editorialAngle: 'upcoming matches; choose the highest-stakes fixture or biggest affected team first. Focus on why the match matters before kickoff, what each team needs, and which tie can change the round. Do not write generic schedule copy.',
  },
  predictions: {
    contentType: 'predictions',
    editorialAngle: 'match predictions; focus on favorites, balanced fixtures, upset potential, and score discussion.',
  },
  'predictions-long': {
    contentType: 'longform_predictions',
    editorialAngle: 'long-form horizontal YouTube match predictions; focus on the round narrative, strongest picks, upset candidates, and scoreline reasoning across multiple games.',
    formatGuidance: 'This is a narrated horizontal long-form YouTube video, not a Short. Write metadata for viewers who may watch several minutes. Lead with what the predictions say about the round: expected winners, risky fixtures, upset potential, pressure games, and scoreline logic. Do not describe the video structure; describe the prediction story itself.',
  },
  'round-summary-long': {
    contentType: 'longform_round_summary',
    editorialAngle: 'long-form horizontal YouTube round recap; focus on results, decisive moments, scorelines, standout matches, and what the round changed.',
    formatGuidance: 'This is a narrated horizontal long-form YouTube video, not a Short. Write metadata for viewers who may watch several minutes. Lead with how the round played out: key results, who gained ground, who dropped points, standout scorelines, pressure changes, and table/story impact. Do not describe the video structure; describe the round itself.',
  },
  tierlist: {
    contentType: 'favorite_tierlist',
    editorialAngle: 'tournament favorites tierlist; focus on champion pick, favorites, dark horses, teams that can go deep, and disappointments.',
  },
  'world-cup-knockout': {
    contentType: 'knockout_bracket',
    editorialAngle: 'knockout stage bracket; focus on who advances, elimination pressure, decisive ties, and tournament drama.',
  },
  'champion-final': {
    contentType: 'champion_decider',
    editorialAngle: 'champion/final result; focus on the title winner, decisive match, trophy narrative, and celebration.',
  },
  'top-scorers': {
    contentType: 'top_scorers',
    editorialAngle: 'player-first scoring race; the players are the hook and the teams are supporting context only. Focus on the leading scorer, close pursuers, goals gap, and who can overtake. Do not frame the publishing draft around team consequences.',
  },
  'player-of-round': {
    contentType: 'player_ranking',
    editorialAngle: 'player-first ranking; the players are the hook and the teams are supporting context only. Focus on standout performances, rating leaders, goals, assists, and debate. Do not frame the publishing draft around team consequences.',
  },
  'championship-pace': {
    contentType: 'title_race_pace',
    editorialAngle: 'title race pace; focus on championship percentage, pressure at the top, who can sustain the pace, and the benchmark.',
  },
  'relegation-line': {
    contentType: 'relegation_battle',
    editorialAngle: 'relegation line, not a full classification; focus on danger, safety line, teams near the drop, points/percentage needed to escape, and pressure at the bottom.',
  },
  'continental-groups-standings': {
    contentType: 'continental_group_standings',
    editorialAngle: 'group qualification race; focus on who advances, who is alive, group pressure, and decisive standings.',
  },
  'world-cup-group-standings': {
    contentType: 'world_cup_group_race',
    editorialAngle: 'World Cup group standings; focus on qualification spots, who advances, and group pressure.',
  },
  'season-final-verdict': {
    contentType: 'season_wrap_up',
    editorialAngle: 'final season verdict; focus on champion, qualified teams, relegated teams, surprises, and disappointments.',
  },
};

const buildTemplateSpecificMetadata = (job) => {
  if (job.template === 'predictions') {
    const fixtures = job.fixtures ?? [];
    const homeWins = fixtures.filter((fixture) => hasNumericScore(fixture) && fixture.homeScore > fixture.awayScore);
    const awayWins = fixtures.filter((fixture) => hasNumericScore(fixture) && fixture.awayScore > fixture.homeScore);
    const draws = fixtures.filter((fixture) => hasNumericScore(fixture) && fixture.homeScore === fixture.awayScore);
    const tightGames = fixtures.filter((fixture) => hasNumericScore(fixture) && fixtureMargin(fixture) <= 1);
    const strongestPicks = fixtures
      .filter((fixture) => hasNumericScore(fixture) && fixtureMargin(fixture) >= 2)
      .map(formatFixtureStory);
    const upsetCandidates = awayWins.map(formatFixtureStory);

    return {
      totalFixtures: fixtures.length,
      favoriteLean: {
        homeWins: homeWins.length,
        awayWins: awayWins.length,
        draws: draws.length,
      },
      strongestPicks,
      tightGames: tightGames.map(formatFixtureStory),
      upsetCandidates,
      mostCommentableFixtures: fixtures.slice(0, 5).map(formatFixtureStory),
    };
  }

  if (job.template === 'next-games') {
    const fixtures = job.fixtures ?? [];
    const priorityFixtures = [...fixtures]
      .map((fixture, index) => ({
        fixture,
        index,
        score: fixtureStoryScore(fixture),
      }))
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map(({fixture}) => summarizeFixture(fixture));
    const fixtureTeams = fixtures.flatMap(getFixtureTeams).filter(Boolean);
    const majorTeams = fixtureTeams.filter((team) => fixtureStoryScore({homeTeam: team, awayTeam: ''}) > 0);

    return {
      totalFixtures: fixtures.length,
      priorityFixtures: priorityFixtures.slice(0, 5),
      featuredFixture: priorityFixtures[0] ?? '',
      supportingFixtures: priorityFixtures.slice(1, 5),
      majorTeams: [...new Set(majorTeams)].slice(0, 8),
      suggestedAngle:
        priorityFixtures[0]
          ? `Lead with ${priorityFixtures[0]} and explain why this fixture can change the round or pressure.`
          : 'Lead with the fixture that creates the clearest pressure or qualification consequence.',
      descriptionPlan:
        'Opening line: featuredFixture consequence. Bullet 1: featuredFixture pressure. Bullet 2: cite two supportingFixtures. Bullet 3: cite remaining majorTeams or another supportingFixture.',
      avoidGenericHooks: ['Olha os próximos jogos', 'Próximos jogos da rodada', 'Qual jogo você vai assistir?'],
    };
  }

  if (job.template === 'tierlist') {
    const tiers = job.tiers ?? [];
    return {
      tiers: tiers.map((tier) => ({
        label: tier.label,
        teams: (tier.entries ?? []).map((entry) => entry.team),
      })),
      championPick: tiers.find((tier) => tier.key === 'champion')?.entries?.[0]?.team ?? '',
      favorites: tiers.find((tier) => tier.key === 'favorites')?.entries?.map((entry) => entry.team) ?? [],
      darkHorses: tiers.find((tier) => tier.key === 'dark-horses')?.entries?.map((entry) => entry.team) ?? [],
      groupStageExit:
        tiers.find((tier) => tier.key === 'group-stage-exit')?.entries?.map((entry) => entry.team) ?? [],
      disappointment:
        tiers.find((tier) => tier.key === 'disappointment')?.entries?.map((entry) => entry.team) ?? [],
      topScorerPrediction: job.topScorerPrediction ?? '',
      bestPlayerPrediction: job.bestPlayerPrediction ?? '',
    };
  }

  if (job.template === 'predictions-long') {
    const matches = job.matches ?? [];
    return {
      totalMatches: matches.length,
      predictions: matches.slice(0, 16).map((match) =>
        [
          match.homeTeam,
          match.predictedScore,
          match.awayTeam,
          match.voiceover ? compactText(match.voiceover, 220) : '',
        ].filter(Boolean).join(' · ')
      ),
      strongestDiscussionPoints: matches
        .map((match) => compactText(match.voiceover, 180))
        .filter(Boolean)
        .slice(0, 8),
    };
  }

  if (job.template === 'round-summary-long') {
    const matches = job.matches ?? [];
    return {
      totalMatches: matches.length,
      results: matches.slice(0, 16).map((match) =>
        [
          match.homeTeam,
          `${match.homeScore ?? 0}-${match.awayScore ?? 0}`,
          match.awayTeam,
          match.statusLabel,
          match.highlights?.slice(0, 2).join(' / '),
        ].filter(Boolean).join(' · ')
      ),
      standoutMoments: matches
        .flatMap((match) => match.highlights ?? [])
        .filter(Boolean)
        .slice(0, 10),
      matchesWithEvents: matches
        .filter((match) => Array.isArray(match.events) && match.events.length > 0)
        .map((match) => `${match.homeTeam} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${match.awayTeam}`)
        .slice(0, 8),
    };
  }

  if (job.template === 'results') {
    const fixtures = job.fixtures ?? [];
    const decidedGames = fixtures.filter(hasNumericScore);
    const draws = decidedGames.filter((fixture) => fixture.homeScore === fixture.awayScore);
    const bigWins = decidedGames
      .filter((fixture) => fixtureMargin(fixture) >= 3)
      .sort((a, b) => fixtureMargin(b) - fixtureMargin(a));
    const awayWins = decidedGames.filter((fixture) => fixture.awayScore > fixture.homeScore);
    const eliminatedTeams = fixtures
      .flatMap((fixture) => [
        fixture.homeEliminated ? fixture.homeTeam : '',
        fixture.awayEliminated ? fixture.awayTeam : '',
      ])
      .filter(Boolean);

    return {
      totalFixtures: fixtures.length,
      resultStories: decidedGames.map(formatFixtureStory),
      bigWins: bigWins.map(formatFixtureStory),
      surpriseCandidates: awayWins.map(formatFixtureStory),
      draws: draws.map(formatFixtureStory),
      eliminatedTeams,
    };
  }

  if (job.template === 'standings') {
    const rows = job.rows ?? [];
    const leader = rows.find((row) => Number(row.rank) === 1) ?? rows[0];
    const second = rows.find((row) => Number(row.rank) === 2);
    const topZone = getZoneRows(rows, 1, 6);
    const continentalZone = getZoneRows(rows, 1, 6);
    const relegationZone = rows.filter((row) => Number(row.rank) >= Math.max(1, rows.length - 3));
    const leaderGap =
      leader?.points !== undefined && second?.points !== undefined
        ? Number(leader.points) - Number(second.points)
        : undefined;

    return {
      standingsLabel: job.standingsLabel,
      leader: formatTeamMetric(leader),
      leaderGapToSecond: leaderGap,
      topZone: topZone.map(formatTeamMetric),
      continentalZone: continentalZone.map(formatTeamMetric),
      relegationZone: relegationZone.map(formatTeamMetric),
      closestChasers: rows.slice(1, 5).map(formatTeamMetric),
    };
  }

  if (job.template === 'top-scorers') {
    const entries = job.entries ?? [];
    const leader = entries[0];
    const second = entries[1];
    const goalGap =
      leader?.goals !== undefined && second?.goals !== undefined
        ? Number(leader.goals) - Number(second.goals)
        : undefined;

    return {
      leader: formatPlayerMetric(leader),
      goalGapToSecond: goalGap,
      chasers: entries.slice(1, 6).map(formatPlayerMetric),
      tiedWithSecond: entries
        .slice(1)
        .filter((entry) => second?.goals !== undefined && Number(entry.goals) === Number(second.goals))
        .map(formatPlayerMetric),
      topFive: entries.slice(0, 5).map(formatPlayerMetric),
    };
  }

  if (job.template === 'relegation-line') {
    const entries = job.entries ?? [];
    const dangerEntries = entries.filter((entry) => Number(entry.rank) >= 17);
    const safeLineEntry = entries.find((entry) => Number(entry.rank) === 16);
    const closestSafeEntries = entries.filter((entry) => Number(entry.rank) >= 13 && Number(entry.rank) <= 16);
    return {
      benchmarkPercentage: job.benchmarkPercentage,
      benchmarkLabel: job.benchmarkLabel,
      noteLabel: job.noteLabel,
      safetyLine: safeLineEntry
        ? `${safeLineEntry.team} is just above the drop: ${safeLineEntry.points} pts, ${safeLineEntry.percentage}%`
        : '',
      dangerTeams: dangerEntries.map(
        (entry) => `${entry.rank}º ${entry.team}: ${entry.points} pts, ${entry.percentage}%`
      ),
      teamsNearSafety: closestSafeEntries.map(
        (entry) => `${entry.rank}º ${entry.team}: ${entry.points} pts, ${entry.percentage}%`
      ),
    };
  }

  if (job.template === 'championship-pace') {
    const entries = job.entries ?? [];
    const aboveBenchmark = entries.filter(
      (entry) => Number(entry.percentage) >= Number(job.benchmarkPercentage)
    );
    const belowBenchmark = entries.filter(
      (entry) => Number(entry.percentage) < Number(job.benchmarkPercentage)
    );
    return {
      benchmarkPercentage: job.benchmarkPercentage,
      benchmarkLabel: job.benchmarkLabel,
      leadingPaceTeams: entries.slice(0, 5).map(formatTeamMetric),
      teamsAboveChampionLine: aboveBenchmark.map(formatTeamMetric),
      teamsBelowChampionLine: belowBenchmark.slice(0, 6).map(formatTeamMetric),
      closestToLine: entries
        .slice()
        .sort(
          (a, b) =>
            Math.abs(Number(a.percentage) - Number(job.benchmarkPercentage)) -
            Math.abs(Number(b.percentage) - Number(job.benchmarkPercentage))
        )
        .slice(0, 5)
        .map(formatTeamMetric),
    };
  }

  return {};
};

const buildPublishingMetadata = (job) => {
  const rows =
    job.rows ?? job.standings ?? job.tableRows ?? job.entries ?? job.players ?? job.groups ?? [];
  const fixtures = job.fixtures ?? job.matches ?? job.nextMatches ?? job.results ?? [];
  const isPlayerFirstTemplate = job.template === 'top-scorers' || job.template === 'player-of-round';
  const languageProfile = job.languageProfile === 'en' || job.channelProfile === 'en' ? 'en' : 'pt-br';
  const context = publishingTemplateContext[job.template] ?? {
    contentType: job.template ?? 'football_video',
    editorialAngle: 'football short video; use the current template and metadata to choose the strongest story.',
  };

  return {
    sport: job.sport ?? 'football',
    template: job.template ?? '',
    contentType: context.contentType,
    editorialAngle: context.editorialAngle,
    publishingFormat: String(job.template ?? '').includes('long') ? 'youtube_longform_horizontal' : 'shortform_or_standard',
    formatGuidance: context.formatGuidance ?? '',
    compositionId: job.compositionId ?? '',
    channelProfile: job.channelProfile ?? '',
    languageProfile,
    leagueId: job.leagueId ?? '',
    leagueName: job.leagueName ?? job.competitionName ?? '',
    season: job.season ?? '',
    round: job.round ?? '',
    roundLabel: job.roundLabel ?? job.titleLabel ?? job.subtitleLabel ?? '',
    titleLabel: job.titleLabel ?? '',
    subtitleLabel: job.subtitleLabel ?? '',
    outputName: job.outputName ?? '',
    renderPath: job.outputName ? `/out/${job.outputName}` : '',
    ctaText: job.ctaText ?? '',
    hookText: job.hookText ?? '',
    introTitle: job.introTitle ?? '',
    introSubtitle: job.introSubtitle ?? '',
    voiceoverText: job.voiceoverText ?? '',
    userCreativeContext: {
      priorityTeams: splitCreativeList(job.aiPriorityTeams),
      editorialAngle: String(job.aiEditorialAngle ?? '').trim(),
    },
    champion: job.championTeam ?? job.champion?.team ?? '',
    groupLabel: job.groupLabel ?? '',
    dataSource: job.dataSource ?? '',
    templateSpecific: buildTemplateSpecificMetadata(job),
    summaryRows: summarizeRows(rows, (row) => {
      const rank = row.rank ?? row.position ?? '';
      const primaryName = isPlayerFirstTemplate
        ? row.playerName ?? row.name ?? row.team ?? row.groupName ?? ''
        : row.team ?? row.playerName ?? row.groupName ?? row.name ?? '';
      const teamContext = isPlayerFirstTemplate && row.playerName && row.team ? ` (${row.team})` : '';
      const name = `${primaryName}${teamContext}`;
      const stat =
        row.points !== undefined && row.percentage !== undefined
          ? `${row.points} pts · ${row.percentage}%`
          : row.points !== undefined
            ? `${row.points} pts`
          : row.goals !== undefined
            ? [row.goals !== undefined ? `${row.goals} goals` : '', row.assists !== undefined ? `${row.assists} assists` : '']
                .filter(Boolean)
                .join(' · ')
          : row.rating !== undefined
            ? `${row.rating} rating`
            : row.percentage !== undefined
              ? `${row.percentage}%`
              : '';
      return [rank, name, stat].filter(Boolean).join(' · ');
    }),
    fixtures: fixtures.slice(0, 14).map(summarizeFixture),
  };
};

const getPublishingTemplateFile = (languageProfile = 'pt-br') =>
  languageProfile === 'en'
    ? path.join(publishingTemplateDir, 'youtube-shorts-football-en.md')
    : path.join(publishingTemplateDir, 'youtube-shorts-football-pt.md');

const getYouTubeDescriptionFooterFile = (languageProfile = 'pt-br') =>
  languageProfile === 'en'
    ? path.join(publishingTemplateDir, 'youtube-description-footer-en.md')
    : path.join(publishingTemplateDir, 'youtube-description-footer-pt.md');

const loadPublishingTemplate = async (languageProfile = 'pt-br') => {
  const filePath = getPublishingTemplateFile(languageProfile);
  const templateText = await fs.readFile(filePath, 'utf8');
  return {
    filePath,
    name: path.basename(filePath),
    templateText,
  };
};

const loadYouTubeDescriptionFooter = async (languageProfile = 'pt-br') => {
  const filePath = getYouTubeDescriptionFooterFile(languageProfile);
  try {
    return (await fs.readFile(filePath, 'utf8')).trim();
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
};

const sectionBetween = (templateText, startPattern, endPattern) => {
  const start = templateText.search(startPattern);
  if (start === -1) return '';
  const rest = templateText.slice(start);
  const end = rest.slice(1).search(endPattern);
  return end === -1 ? rest.trim() : rest.slice(0, end + 1).trim();
};

const templateSectionMap = {
  standings: /^# A\) CLASSIFICAÇÃO/m,
  results: /^# B\) ÚLTIMOS JOGOS/m,
  'next-games': /^# F\) JOGOS DO DIA/m,
  predictions: /^# C\) PALPITES/m,
  tierlist: /^# C\) PALPITES/m,
  'world-cup-knockout': /^# D\) MATA-MATA/m,
  'champion-final': /^# D\) MATA-MATA/m,
  'top-scorers': /^# E\) ARTILHARIA/m,
  'player-of-round': /^# E\) ARTILHARIA/m,
  'championship-pace': /^# G\) TITLE RACE \/ DISPUTA PELO TÍTULO/m,
  'relegation-line': /^# H\) REBAIXAMENTO/m,
  'continental-groups-standings': /^# D\) MATA-MATA/m,
  'world-cup-group-standings': /^# A\) CLASSIFICAÇÃO/m,
  'season-final-verdict': /^# A\) CLASSIFICAÇÃO/m,
};

const compactPublishingTemplate = ({templateText, template, languageProfile}) => {
  if (languageProfile === 'en') {
    const englishTemplateText =
      templateText
        .split(/^# Legacy Format Coverage/m)[0]
        ?.split(/^# Estrutura Universal/m)[0]
        ?.trim() || templateText;
    return [
      'Language profile: en.',
      'Write every title, description, YouTube tag, hashtag, CTA, and platform field in English only.',
      'Never output Portuguese words or Brazilian Portuguese football terms in English-channel metadata.',
      'Use comma-friendly YouTube tags without #. Tags must be English search keywords such as football, soccer, Premier League, predictions, results, fixtures, standings, analysis, and relevant team/league names.',
      'Use the Foot Analysis EN compact brief below instead of the full template.',
      englishTemplateText,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');
  }

  const titleRules = sectionBetween(templateText, /^## Regras do Título/m, /^# DESCRIÇÃO UNIVERSAL/m);
  const descriptionRules = sectionBetween(templateText, /^# DESCRIÇÃO UNIVERSAL/m, /^# BLOCOS DINÂMICOS POR FORMATO/m);
  const formatRules = sectionBetween(
    templateText,
    templateSectionMap[template] ?? /^# A\) CLASSIFICAÇÃO/m,
    /^# [A-H]\) |^# TEMPLATE DE HASHTAGS/m
  );
  const hashtagRules = sectionBetween(templateText, /^# TEMPLATE DE HASHTAGS/m, /^# Fórmula de Conteúdo por Plataforma/m);
  const platformRules = sectionBetween(templateText, /^# Fórmula de Conteúdo por Plataforma/m, /^# Estratégia de Automação/m);
  const finalStrategy = sectionBetween(templateText, /^# Estratégia Final/m, /$^/m);

  return [
    `Language profile: ${languageProfile}.`,
    'Use the master template compact brief below instead of the full template.',
    titleRules,
    descriptionRules,
    formatRules,
    hashtagRules,
    platformRules,
    finalStrategy,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');
};

const allowedPublishingModels = new Set(['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o', 'gpt-5-mini']);

const resolvePublishingModel = (requestedModel) => {
  const normalizedModel = String(requestedModel ?? '').trim();
  if (allowedPublishingModels.has(normalizedModel)) {
    return normalizedModel;
  }

  return process.env.OPENAI_PUBLISHING_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
};

const publishingDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'platforms'],
  properties: {
    summary: {type: 'string'},
    platforms: {
      type: 'object',
      additionalProperties: false,
      required: ['youtube', 'reddit', 'tiktok', 'instagram', 'x'],
      properties: {
        youtube: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'description', 'tags', 'hashtags', 'thumbnailNotes'],
          properties: {
            title: {type: 'string'},
            description: {type: 'string'},
            tags: {type: 'array', items: {type: 'string'}},
            hashtags: {type: 'array', items: {type: 'string'}},
            thumbnailNotes: {type: 'string'},
          },
        },
        reddit: {
          type: 'object',
          additionalProperties: false,
          required: ['subreddit', 'title', 'body', 'flairSuggestion', 'tags'],
          properties: {
            subreddit: {type: 'string'},
            title: {type: 'string'},
            body: {type: 'string'},
            flairSuggestion: {type: 'string'},
            tags: {type: 'array', items: {type: 'string'}},
          },
        },
        tiktok: {
          type: 'object',
          additionalProperties: false,
          required: ['caption', 'hashtags', 'coverText'],
          properties: {
            caption: {type: 'string'},
            hashtags: {type: 'array', items: {type: 'string'}},
            coverText: {type: 'string'},
          },
        },
        instagram: {
          type: 'object',
          additionalProperties: false,
          required: ['caption', 'hashtags', 'coverText'],
          properties: {
            caption: {type: 'string'},
            hashtags: {type: 'array', items: {type: 'string'}},
            coverText: {type: 'string'},
          },
        },
        x: {
          type: 'object',
          additionalProperties: false,
          required: ['postText', 'hashtags'],
          properties: {
            postText: {type: 'string'},
            hashtags: {type: 'array', items: {type: 'string'}},
          },
        },
      },
    },
  },
};

const youtubePublishingDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'youtube'],
  properties: {
    summary: {type: 'string'},
    youtube: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'description', 'tags'],
      properties: {
        title: {type: 'string'},
        description: {type: 'string'},
        tags: {type: 'array', items: {type: 'string'}},
      },
    },
  },
};

const hookCtaSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['hookText', 'ctaText', 'voiceoverText'],
  properties: {
    hookText: {type: 'string'},
    ctaText: {type: 'string'},
    voiceoverText: {type: 'string'},
  },
};

const thumbnailSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'subheadline', 'extraLabel'],
  properties: {
    headline: {type: 'string'},
    subheadline: {type: 'string'},
    extraLabel: {type: 'string'},
  },
};

const extractResponseText = (data) => {
  if (typeof data.output_text === 'string') {
    return data.output_text;
  }

  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? '')
    .join('')
    .trim();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const openAiTransientStatuses = new Set([408, 409, 425, 429, 500, 502, 503, 504, 520, 522, 524]);

const buildOpenAiResponsesBody = ({model, input, text}) => ({
  model,
  input,
  text,
  ...(String(model).startsWith('gpt-5') ? {reasoning: {effort: 'low'}} : {}),
});

const callOpenAiResponses = async ({apiKey, body, maxAttempts = 3}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return data;
    }

    const baseMessage = data?.error?.message ?? `OpenAI request failed with ${response.status}`;
    const message =
      openAiTransientStatuses.has(response.status) && attempt >= maxAttempts
        ? `${baseMessage}. OpenAI returned a temporary ${response.status} after ${maxAttempts} attempts. Try again or switch models.`
        : baseMessage;
    lastError = new Error(
      openAiTransientStatuses.has(response.status) && attempt < maxAttempts
        ? `${message}. Retrying (${attempt}/${maxAttempts})…`
        : message
    );

    if (!openAiTransientStatuses.has(response.status) || attempt >= maxAttempts) {
      throw lastError;
    }

    await sleep(750 * attempt);
  }

  throw lastError ?? new Error('OpenAI request failed.');
};

const generatePublishingDraft = async ({job, extraContext, copyModelInstructions, requestedModel}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('Missing OPENAI_API_KEY. Add it to .env to generate publishing drafts.');
    error.errorType = 'missing_openai_key';
    throw error;
  }

  const metadata = buildPublishingMetadata(job);
  const publishingTemplate = await loadPublishingTemplate(metadata.languageProfile);
  const compactTemplate = compactPublishingTemplate({
    templateText: publishingTemplate.templateText,
    template: metadata.template,
    languageProfile: metadata.languageProfile,
  });
  const model = resolvePublishingModel(requestedModel);
  const prompt = [
    'Generate a publishing draft for a short football video.',
    'Return platform-specific copy only. Do not invent match facts beyond the metadata.',
    'Match metadata.languageProfile exactly: when metadata.languageProfile is "en", every output field including YouTube tags must be English only; when it is "pt-br", use Brazilian Portuguese.',
    'Do not mix languages inside tags. YouTube tags are plain search keywords, not translated labels from another channel.',
    'Prioritize native style for each platform and keep the user able to manually approve before posting.',
    'Use tags as comma-friendly keywords without #. Use hashtags with # when the platform field is named hashtags.',
    'For TikTok and Instagram, write the caption as one ready-to-paste field: description text followed by hashtags. Hashtags must include #.',
    'Do not copy metadata.hookText, metadata.ctaText, or metadata.voiceoverText verbatim. Those fields may be dashboard placeholders. Rewrite them using the master template unless they are already specific and consequence-driven.',
    'Respect metadata.contentType and metadata.editorialAngle. For relegation_battle, do not describe the video as a general league table; make the safety line, danger zone, and escape pressure the central story.',
    'For upcoming_fixtures, do not write generic schedule copy. Lead with metadata.templateSpecific.featuredFixture or the biggest affected team, explain why that fixture matters before kickoff, and ask a pressure/stakes question. Never use "Olha os próximos jogos", "Próximos jogos", or "Qual jogo você vai assistir?" as the main angle or CTA.',
    'For upcoming_fixtures descriptions, do not describe only one match. Opening line should focus on metadata.templateSpecific.featuredFixture, but the 3 bullets must cite multiple fixtures from metadata.templateSpecific.priorityFixtures/supportingFixtures when available.',
    'For top_scorers and player_ranking, write player-first copy: the main player/ranking is the hook, teams are supporting context only, and the CTA must ask about the individual race or player debate.',
    'Before writing title and description, classify the story as team, player, match, table, or prediction. For top_scorers, assists, player-ranking, golden-boot, or player-stats, classify as player story and lead with player names. Do not write team-led titles unless no player names are available.',
    'For top_scorers titles, priority order is: player names, goal count, race tension, competition, then team names only as support. Preferred formula: PLAYER 1 + PLAYER 2 + race status + competition.',
    `Compact master publishing template (${publishingTemplate.name}):\n${compactTemplate}`,
    copyModelInstructions
      ? `Additional editor instructions:\n${copyModelInstructions}`
      : '',
    extraContext ? `Additional context from editor:\n${extraContext}` : '',
    `Video metadata JSON:\n${JSON.stringify(metadata, null, 2)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const data = await callOpenAiResponses({
    apiKey,
    body: buildOpenAiResponsesBody({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are a football social media publishing assistant. Produce concise, platform-ready JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'football_publishing_draft',
          strict: true,
          schema: publishingDraftSchema,
        },
      },
    }),
  });

  const outputText = extractResponseText(data);
  if (!outputText) {
    throw new Error('OpenAI returned an empty publishing draft.');
  }

  const draft = normalizePublishingDraft(JSON.parse(outputText));
  const youtubeFooter = await loadYouTubeDescriptionFooter(metadata.languageProfile);
  if (draft.platforms?.youtube) {
    draft.platforms.youtube.description = appendYouTubeDescriptionFooter({
      description: draft.platforms.youtube.description,
      footer: youtubeFooter,
    });
  }

  return {
    draft,
    metadata,
    model,
    templateName: publishingTemplate.name,
  };
};

const generateYouTubePublishingDraft = async ({
  job,
  extraContext,
  copyModelInstructions,
  requestedModel,
  includeChannelFooter = false,
}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('Missing OPENAI_API_KEY. Add it to .env to generate YouTube drafts.');
    error.errorType = 'missing_openai_key';
    throw error;
  }

  const metadata = buildPublishingMetadata(job);
  const model = resolvePublishingModel(requestedModel);
  const prompt = [
    'Generate YouTube publishing metadata for a LONG-FORM football video.',
    'Match metadata.languageProfile exactly: when metadata.languageProfile is "en", title, description, and every tag must be English only; when it is "pt-br", use Brazilian Portuguese.',
    'Do not mix languages inside tags. YouTube tags are plain search keywords, not translated labels from another channel.',
    'Treat this as a horizontal narrated YouTube video, not as a Short. The copy should be built for a full video watch session, search discovery, and viewer retention.',
    'Return only title, description, and tags for YouTube. Do not create copy for Shorts, TikTok, Instagram, Reddit, or X.',
    'Do not use short-form language such as "quick", "short", "60 seconds", "reel", "clip", or "#Shorts" in the title, description, tags, or anywhere else.',
    'Title must be compelling, accurate, searchable, and under 100 characters. Prefer an editorial long-form angle over punchy short-video hooks.',
    'Title must be specific, not generic. It should normally include a team, player, fixture, scoreline, or direct consequence/stakes before broad words like "recap", "summary", "key results", "shocks", or "standout goals".',
    'Avoid titles that only describe the format or the round, such as "Premier League Matchday 1 Recap: Shocks, Standout Goals & Key Results". Instead, choose the strongest concrete story from the metadata and make that the lead.',
    'Use the consequence-first rule from the Foot Analysis PT system: do not merely describe what happened; explain who benefits, who is pressured, who dropped points, who gained ground, or what changed.',
    'Description should be ready to paste into YouTube for a horizontal long-form video, but it must read like football analysis, not like an outline of the video.',
    'Do not write "in this video", "we cover", "we go through", "this recap looks at", "vamos ver", or similar structure-first phrases. The description should describe the predictions/results themselves.',
    'For long-form predictions, explain what the predictions are saying about the round: which teams look safer, where the risky games are, where an upset can happen, which scorelines carry the strongest logic, and what pressure each fixture creates.',
    'For long-form round summaries, explain how the round actually went: which results mattered, who gained ground, who dropped points, which scorelines changed the story, and what the round means for the league context.',
    'Description structure: opening analytical paragraph about the predictions/results themselves, 3-5 bullets with concrete match/team/stakes details from metadata, then one specific viewer question.',
    'Tags must be comma-friendly keywords without #. Include broad football discovery terms, the league, round, teams when useful, channel brand, and long-form context terms such as analysis, predictions, recap, or round summary.',
    'Do not invent match facts beyond the metadata. If the metadata is sparse, frame the video around the league, round, and format.',
    'Respect metadata.contentType, metadata.editorialAngle, and metadata.formatGuidance.',
    copyModelInstructions
      ? `Additional editor instructions:\n${copyModelInstructions}`
      : '',
    extraContext ? `Additional context from editor:\n${extraContext}` : '',
    `Video metadata JSON:\n${JSON.stringify(metadata, null, 2)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const data = await callOpenAiResponses({
    apiKey,
    body: buildOpenAiResponsesBody({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are a football YouTube publishing assistant for long-form videos. Produce concise, accurate JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'football_youtube_longform_draft',
          strict: true,
          schema: youtubePublishingDraftSchema,
        },
      },
    }),
  });

  const outputText = extractResponseText(data);
  if (!outputText) {
    throw new Error('OpenAI returned an empty YouTube draft.');
  }

  const draft = JSON.parse(outputText);
  const youtubeFooter = includeChannelFooter
    ? await loadYouTubeDescriptionFooter(metadata.languageProfile)
    : '';
  draft.youtube = {
    ...draft.youtube,
    title: compactText(draft.youtube?.title, 100),
    description: appendYouTubeDescriptionFooter({
      description: draft.youtube?.description,
      footer: youtubeFooter,
    }),
    tags: normalizeTagList(draft.youtube?.tags),
  };

  return {
    draft,
    metadata,
    model,
  };
};

const valuesCompatible = (left, right) => {
  const leftText = String(left ?? '').trim();
  const rightText = String(right ?? '').trim();
  return !leftText || !rightText || leftText === rightText;
};

const normalizeIdentityText = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const valuesMatch = (left, right) => {
  const leftText = normalizeIdentityText(left);
  const rightText = normalizeIdentityText(right);
  return Boolean(leftText && rightText && leftText === rightText);
};

const jobCompetitionMatches = (formJob = {}, preparedJob = null) => {
  if (!preparedJob) return false;

  const leagueIdMatches = valuesMatch(formJob.leagueId, preparedJob.leagueId);
  const outputNameMatches = valuesMatch(formJob.outputName, preparedJob.outputName);
  const formCompetitionNames = [formJob.leagueName, formJob.competitionName].filter(Boolean);
  const preparedCompetitionNames = [preparedJob.leagueName, preparedJob.competitionName].filter(Boolean);
  const competitionNameMatches = formCompetitionNames.some((formName) =>
    preparedCompetitionNames.some((preparedName) => valuesMatch(formName, preparedName))
  );

  return leagueIdMatches || outputNameMatches || competitionNameMatches;
};

const canUsePreparedJobContext = (formJob = {}, preparedJob = null) => {
  if (!preparedJob) return false;
  return (
    valuesMatch(formJob.template, preparedJob.template) &&
    jobCompetitionMatches(formJob, preparedJob) &&
    valuesCompatible(formJob.season, preparedJob.season) &&
    valuesCompatible(formJob.languageProfile, preparedJob.languageProfile)
  );
};

const preparedJobCreativeOverrideKeys = new Set([
  'aiEditorialAngle',
  'aiPriorityTeams',
  'brandName',
  'channelProfile',
  'ctaText',
  'hookText',
  'introTitle',
  'introSubtitle',
  'voiceoverText',
]);

const mergePreparedJobContext = (formJob = {}, preparedJob = null) => {
  if (!preparedJob) {
    return formJob;
  }

  const merged = {...preparedJob};
  Object.entries(formJob).forEach(([key, value]) => {
    if (!preparedJobCreativeOverrideKeys.has(key)) return;
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && !value.trim()) return;
    if (Array.isArray(value) && value.length === 0) return;
    merged[key] = value;
  });
  return merged;
};

const buildCtaGuidance = (metadata) => {
  const languageProfile = metadata.languageProfile === 'en' ? 'en' : 'pt-br';
  const template = metadata.template;
  const leagueName = String(metadata.leagueName ?? '').trim();
  const normalizedLeague = normalizeIdentityText(leagueName);
  const isPromotionRace =
    normalizedLeague.includes('serie b') ||
    normalizedLeague.includes('serie c') ||
    normalizedLeague.includes('serie d') ||
    normalizedLeague.includes('championship');

  if (languageProfile === 'en') {
    if (template === 'standings' && isPromotionRace) {
      return {
        goal: `Ask one promotion-race question about ${leagueName}.`,
        preferred: ['Who goes up?', 'Who wins promotion?', 'Who takes the promotion spot?'],
        avoid: ['Who wins the title?', 'Who advances?', 'What do you think?'],
      };
    }
    if (template === 'standings') {
      return {
        goal: `Ask one table-consequence question about ${leagueName}.`,
        preferred: ['Who wins the title?', 'Who escapes?', 'Who takes the spot?'],
        avoid: ['What do you think?', 'Comment below'],
      };
    }
    if (template === 'results' || template === 'champion-final') {
      return {
        goal: `Ask one result-consequence question about ${leagueName}.`,
        preferred: ['Who leaves stronger?', 'Who takes the trophy?', 'Who is under more pressure now?'],
        avoid: ['What was the best match?', 'Comment below'],
      };
    }
    if (template === 'next-games' || template === 'predictions') {
      return {
        goal: `Ask one prediction question tied to ${leagueName}.`,
        preferred: ['Who needs the win most?', 'Which tie changes the round?', 'Who feels the pressure?'],
        avoid: ['What do you think?', 'Comment below', 'Which match will you watch?'],
      };
    }
    return {
      goal: `Ask one specific question tied to ${leagueName || metadata.contentType}.`,
      preferred: ['Who benefits most?', 'Who is in danger?', 'Who changes the race?'],
      avoid: ['What do you think?', 'Comment below'],
    };
  }

  if (template === 'standings' && isPromotionRace) {
    return {
      goal: `Pergunte sobre a briga pelo acesso em ${leagueName}.`,
      preferred: ['Quem sobe?', 'Quem fica com o acesso?', 'Quem entra no G4?'],
      avoid: ['Quem leva o título?', 'Quem avança?', 'O que achou?'],
    };
  }
  if (template === 'standings') {
    return {
      goal: `Pergunte sobre a consequência da tabela em ${leagueName}.`,
      preferred: ['Quem leva o título?', 'Quem escapa?', 'Quem pega a vaga?'],
      avoid: ['O que achou?', 'Comente abaixo'],
    };
  }
  if (template === 'results' || template === 'champion-final') {
    return {
      goal: `Pergunte sobre a consequência do resultado em ${leagueName}.`,
      preferred: ['Quem sai mais forte?', 'Quem leva a taça?', 'Quem ficou mais pressionado?'],
      avoid: ['Qual foi o melhor jogo?', 'O que achou?', 'Comente abaixo'],
    };
  }
  if (template === 'next-games' || template === 'predictions') {
    return {
      goal: `Pergunte sobre palpite ou pressão da rodada em ${leagueName}.`,
      preferred: ['Quem precisa vencer mais?', 'Qual confronto muda a rodada?', 'Quem sente mais a pressão?'],
      avoid: ['O que achou?', 'Comente abaixo', 'Qual jogo você vai assistir?'],
    };
  }
  if (template === 'relegation-line') {
    return {
      goal: `Pergunte sobre risco de queda em ${leagueName}.`,
      preferred: ['Quem escapa?', 'Quem cai?', 'Quem reage a tempo?'],
      avoid: ['Quem leva o título?', 'O que achou?'],
    };
  }
  if (template === 'championship-pace') {
    return {
      goal: `Pergunte sobre a briga pelo título em ${leagueName}.`,
      preferred: ['Quem leva o título?', 'Quem sustenta esse ritmo?', 'Dá para buscar o líder?'],
      avoid: ['Quem sobe?', 'O que achou?'],
    };
  }
  return {
    goal: `Pergunte sobre a consequência central de ${leagueName || metadata.contentType}.`,
    preferred: ['Quem se beneficia mais?', 'Quem ficou em perigo?', 'Quem muda a disputa?'],
    avoid: ['O que achou?', 'Comente abaixo'],
  };
};

const firstNonEmpty = (...values) =>
  values
    .flat()
    .map((value) => String(value ?? '').trim())
    .find(Boolean) ?? '';

const compactArray = (values = [], limit = 5) =>
  values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .slice(0, limit);

const splitCreativeList = (value) =>
  String(value ?? '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const textMentionsAny = (text, needles = []) => {
  const normalizedText = normalizeIdentityText(text);
  return needles.some((needle) => {
    const normalizedNeedle = normalizeIdentityText(needle);
    return Boolean(normalizedNeedle && normalizedText.includes(normalizedNeedle));
  });
};

const getPriorityFacts = (metadata) => {
  const priorityTeams = metadata.userCreativeContext?.priorityTeams ?? [];
  if (!priorityTeams.length) {
    return [];
  }

  const specific = metadata.templateSpecific ?? {};
  const candidateFacts = [
    ...(specific.resultStories ?? []),
    ...(specific.priorityFixtures ?? []),
    ...(specific.featuredFixture ? [specific.featuredFixture] : []),
    ...(specific.strongestPicks ?? []),
    ...(specific.upsetCandidates ?? []),
    ...(specific.tightGames ?? []),
    ...(specific.bigWins ?? []),
    ...(specific.surpriseCandidates ?? []),
    ...(specific.draws ?? []),
    ...(specific.topZone ?? []),
    ...(specific.closestChasers ?? []),
    ...(specific.continentalZone ?? []),
    ...(specific.relegationZone ?? []),
    ...(specific.dangerTeams ?? []),
    ...(specific.teamsNearSafety ?? []),
    ...(specific.leadingPaceTeams ?? []),
    ...(specific.teamsAboveChampionLine ?? []),
    ...(specific.teamsBelowChampionLine ?? []),
    ...(metadata.summaryRows ?? []),
    ...(metadata.fixtures ?? []),
  ];

  return compactArray(
    [...new Set(candidateFacts.filter((fact) => textMentionsAny(fact, priorityTeams)))],
    6
  );
};

const buildHookCtaProductionBrief = (metadata, editorialBrief, ctaGuidance) => ({
  languageProfile: metadata.languageProfile,
  requestedOutput: ['hookText', 'ctaText', 'voiceoverText'],
  videoContext: {
    template: metadata.template,
    contentType: metadata.contentType,
    competition: metadata.leagueName,
    season: metadata.season,
    round: metadata.roundLabel || metadata.round,
    group: metadata.groupLabel,
  },
  userDirection: editorialBrief.userDirection,
  selectedStory: {
    coreStory: editorialBrief.coreStory,
    mustUseFacts: compactArray(editorialBrief.mustUseFacts, 6),
    hookAngles: compactArray(editorialBrief.hookAngles, 4),
    ctaAngles: compactArray(editorialBrief.ctaAngles, 4),
  },
  outputLimits: {
    hookMaxChars: editorialBrief.hookMaxChars,
    ctaMaxChars: editorialBrief.ctaMaxChars,
    voiceoverMaxWords: editorialBrief.voiceoverMaxWords,
  },
  ctaGuidance: {
    goal: ctaGuidance.goal,
    preferred: compactArray(ctaGuidance.preferred, 4),
    avoid: compactArray(ctaGuidance.avoid, 4),
  },
  bannedExactPhrases: compactArray(editorialBrief.bannedExactPhrases, 14),
});

const buildHookCtaEditorialBrief = (metadata, ctaGuidance) => {
  const template = metadata.template;
  const languageProfile = metadata.languageProfile === 'en' ? 'en' : 'pt-br';
  const specific = metadata.templateSpecific ?? {};
  const isEnglish = languageProfile === 'en';
  const staleHooks = getFootballHookOptions(template, languageProfile);
  const staleCtas = getFootballCtaOptions(template, languageProfile);
  const hookMaxChars = isEnglish ? 54 : 58;
  const ctaMaxChars = isEnglish ? 52 : 56;
  const priorityFacts = getPriorityFacts(metadata);
  const genericAvoid = isEnglish
    ? [
        'What do you think?',
        'Comment below',
        'Did your team deliver?',
        'Which match is must-watch?',
        'Who advances?',
      ]
    : [
        'O que achou?',
        'Comente abaixo',
        'Seu time foi bem ou mal?',
        'Qual jogo você vai assistir?',
        'Quem avança?',
      ];

  const base = {
    languageProfile,
    hookMaxChars,
    ctaMaxChars,
    voiceoverMaxWords: 22,
    rule: isEnglish
      ? 'Pick one sharp editorial angle, use concrete names/numbers from metadata, and avoid placeholder-style copy.'
      : 'Escolha um ângulo editorial forte, use nomes/números concretos do metadata e evite texto com cara de placeholder.',
    bannedExactPhrases: [...new Set([...staleHooks, ...staleCtas, ...genericAvoid])],
    ctaGoal: ctaGuidance.goal,
    ctaPreferredShapes: ctaGuidance.preferred,
    ctaAvoid: ctaGuidance.avoid,
    userDirection: {
      priorityTeams: compactArray(metadata.userCreativeContext?.priorityTeams ?? [], 6),
      editorialAngle: String(metadata.userCreativeContext?.editorialAngle ?? '').trim(),
      priorityFacts,
      rule: isEnglish
        ? 'If priorityTeams or editorialAngle are provided, they are the highest-priority creative direction. Use them to choose the core story unless they contradict the factual metadata.'
        : 'Se priorityTeams ou editorialAngle forem preenchidos, eles são a direção criativa de maior prioridade. Use isso para escolher a história central, exceto se contradizer os fatos do metadata.',
    },
  };

  if (template === 'results') {
    const leadStory = firstNonEmpty(
      priorityFacts?.[0],
      specific.bigWins?.[0],
      specific.surpriseCandidates?.[0],
      specific.draws?.[0],
      specific.resultStories?.[0]
    );
    return {
      ...base,
      coreStory: leadStory || metadata.fixtures?.[0] || metadata.leagueName,
      mustUseFacts: compactArray([
        priorityFacts.length ? `priority teams: ${priorityFacts.join(' / ')}` : '',
        base.userDirection.editorialAngle ? `requested angle: ${base.userDirection.editorialAngle}` : '',
        leadStory,
        specific.bigWins?.[0] ? `big win: ${specific.bigWins[0]}` : '',
        specific.surpriseCandidates?.[0] ? `away/surprise angle: ${specific.surpriseCandidates[0]}` : '',
        specific.eliminatedTeams?.length ? `eliminated/removed teams: ${specific.eliminatedTeams.join(', ')}` : '',
      ]),
      hookAngles: isEnglish
        ? ['scoreline changed the round', 'winner gained pressure leverage', 'one result exposed a team']
        : ['placar que muda a rodada', 'vencedor sai com moral/pressão', 'resultado que expõe um time'],
      ctaAngles: isEnglish
        ? ['ask who leaves stronger', 'ask which result changed the table', 'ask who is under pressure now']
        : ['perguntar quem sai mais forte', 'perguntar qual resultado mudou a tabela', 'perguntar quem ficou pressionado'],
    };
  }

  if (template === 'standings' || template === 'world-cup-group-standings') {
    const leadStory = firstNonEmpty(
      priorityFacts?.[0],
      specific.leader,
      specific.leaderGapToSecond !== undefined ? `leader gap: ${specific.leaderGapToSecond}` : '',
      specific.closestChasers?.[0],
      specific.relegationZone?.[0],
      specific.topZone?.[0],
      metadata.groupLabel
    );
    return {
      ...base,
      coreStory: leadStory || metadata.leagueName,
      mustUseFacts: compactArray([
        priorityFacts.length ? `priority teams: ${priorityFacts.join(' / ')}` : '',
        base.userDirection.editorialAngle ? `requested angle: ${base.userDirection.editorialAngle}` : '',
        specific.standingsLabel || metadata.roundLabel,
        specific.leader ? `leader: ${specific.leader}` : '',
        specific.leaderGapToSecond !== undefined ? `gap to second: ${specific.leaderGapToSecond}` : '',
        specific.closestChasers?.length ? `chasers: ${specific.closestChasers.slice(0, 3).join(' / ')}` : '',
        specific.relegationZone?.length ? `danger zone: ${specific.relegationZone.slice(0, 3).join(' / ')}` : '',
      ]),
      hookAngles: isEnglish
        ? ['leader has pressure behind them', 'qualification/table line is tight', 'one team is suddenly in danger']
        : ['líder com pressão atrás', 'linha de vaga/tabela apertada', 'um time entrou em perigo'],
      ctaAngles: isEnglish
        ? ['ask who catches the leader', 'ask who takes the spot', 'ask who is most at risk']
        : ['perguntar quem busca o líder', 'perguntar quem pega a vaga', 'perguntar quem está mais ameaçado'],
    };
  }

  if (template === 'predictions' || template === 'next-games') {
    const leadStory = firstNonEmpty(
      priorityFacts?.[0],
      specific.featuredFixture,
      specific.upsetCandidates?.[0],
      specific.tightGames?.[0],
      specific.strongestPicks?.[0],
      specific.priorityFixtures?.[0],
      metadata.fixtures?.[0]
    );
    return {
      ...base,
      coreStory: leadStory || metadata.leagueName,
      mustUseFacts: compactArray([
        priorityFacts.length ? `priority teams: ${priorityFacts.join(' / ')}` : '',
        base.userDirection.editorialAngle ? `requested angle: ${base.userDirection.editorialAngle}` : '',
        leadStory,
        specific.upsetCandidates?.[0] ? `upset risk: ${specific.upsetCandidates[0]}` : '',
        specific.tightGames?.length ? `tight games: ${specific.tightGames.slice(0, 2).join(' / ')}` : '',
        specific.strongestPicks?.length ? `strong picks: ${specific.strongestPicks.slice(0, 2).join(' / ')}` : '',
        specific.majorTeams?.length ? `major teams: ${specific.majorTeams.slice(0, 4).join(', ')}` : '',
      ]),
      hookAngles: isEnglish
        ? ['one fixture carries the round', 'upset risk is visible', 'pressure game before kickoff']
        : ['um confronto carrega a rodada', 'risco de zebra claro', 'jogo de pressão antes da bola rolar'],
      ctaAngles: isEnglish
        ? ['ask who needs the win most', 'ask where the upset is', 'ask which pick is safest']
        : ['perguntar quem precisa vencer mais', 'perguntar onde vem a zebra', 'perguntar qual palpite é mais seguro'],
    };
  }

  if (template === 'top-scorers') {
    const leadStory = firstNonEmpty(specific.leader, specific.chasers?.[0], specific.topFive?.[0]);
    return {
      ...base,
      coreStory: leadStory || metadata.leagueName,
      mustUseFacts: compactArray([
        specific.leader ? `leader: ${specific.leader}` : '',
        specific.goalGapToSecond !== undefined ? `goal gap: ${specific.goalGapToSecond}` : '',
        specific.chasers?.length ? `chasers: ${specific.chasers.slice(0, 4).join(' / ')}` : '',
      ]),
      hookAngles: isEnglish
        ? ['scoring race pressure', 'leader being chased', 'goal gap can disappear']
        : ['pressão na artilharia', 'líder sendo caçado', 'diferença de gols pode sumir'],
      ctaAngles: isEnglish
        ? ['ask who finishes top scorer', 'ask who catches the leader', 'ask who scores next']
        : ['perguntar quem termina artilheiro', 'perguntar quem busca o líder', 'perguntar quem marca na próxima'],
    };
  }

  if (template === 'relegation-line') {
    const leadStory = firstNonEmpty(specific.safetyLine, specific.dangerTeams?.[0], specific.teamsNearSafety?.[0]);
    return {
      ...base,
      coreStory: leadStory || metadata.leagueName,
      mustUseFacts: compactArray([
        priorityFacts.length ? `priority teams: ${priorityFacts.join(' / ')}` : '',
        base.userDirection.editorialAngle ? `requested angle: ${base.userDirection.editorialAngle}` : '',
        specific.benchmarkPercentage ? `safety line: ${specific.benchmarkPercentage}%` : '',
        specific.safetyLine,
        specific.dangerTeams?.length ? `danger: ${specific.dangerTeams.slice(0, 4).join(' / ')}` : '',
        specific.teamsNearSafety?.length ? `near safety: ${specific.teamsNearSafety.slice(0, 3).join(' / ')}` : '',
      ]),
      hookAngles: isEnglish
        ? ['safety line pressure', 'team trapped below the line', 'escape race got tighter']
        : ['pressão da linha de segurança', 'time preso abaixo da linha', 'briga pela fuga apertou'],
      ctaAngles: isEnglish
        ? ['ask who escapes', 'ask who drops', 'ask who reacts in time']
        : ['perguntar quem escapa', 'perguntar quem cai', 'perguntar quem reage a tempo'],
    };
  }

  if (template === 'championship-pace') {
    const leadStory = firstNonEmpty(
      priorityFacts?.[0],
      specific.leadingPaceTeams?.[0],
      specific.teamsAboveChampionLine?.[0],
      specific.closestToLine?.[0]
    );
    return {
      ...base,
      coreStory: leadStory || metadata.leagueName,
      mustUseFacts: compactArray([
        priorityFacts.length ? `priority teams: ${priorityFacts.join(' / ')}` : '',
        base.userDirection.editorialAngle ? `requested angle: ${base.userDirection.editorialAngle}` : '',
        specific.benchmarkPercentage ? `champion benchmark: ${specific.benchmarkPercentage}%` : '',
        specific.leadingPaceTeams?.length ? `leaders: ${specific.leadingPaceTeams.slice(0, 4).join(' / ')}` : '',
        specific.closestToLine?.length ? `near line: ${specific.closestToLine.slice(0, 3).join(' / ')}` : '',
      ]),
      hookAngles: isEnglish
        ? ['title pace benchmark', 'leader can sustain or fall', 'chaser near the line']
        : ['linha de ritmo de campeão', 'líder sustenta ou cai', 'perseguidor perto da linha'],
      ctaAngles: isEnglish
        ? ['ask who sustains title pace', 'ask who catches the leader', 'ask who is real contender']
        : ['perguntar quem sustenta ritmo de título', 'perguntar quem busca o líder', 'perguntar quem é candidato real'],
    };
  }

  return {
    ...base,
    coreStory: firstNonEmpty(priorityFacts?.[0], metadata.summaryRows?.[0], metadata.fixtures?.[0], metadata.leagueName, metadata.contentType),
    mustUseFacts: compactArray([
      priorityFacts.length ? `priority teams: ${priorityFacts.join(' / ')}` : '',
      base.userDirection.editorialAngle ? `requested angle: ${base.userDirection.editorialAngle}` : '',
      metadata.summaryRows?.[0],
      metadata.summaryRows?.[1],
      metadata.fixtures?.[0],
    ]),
    hookAngles: isEnglish
      ? ['specific consequence', 'pressure point', 'race-changing detail']
      : ['consequência específica', 'ponto de pressão', 'detalhe que muda a disputa'],
    ctaAngles: isEnglish
      ? ['ask about the direct consequence', 'ask who benefits', 'ask who is under pressure']
      : ['perguntar sobre a consequência direta', 'perguntar quem se beneficia', 'perguntar quem ficou pressionado'],
  };
};

const generateHookCtaSuggestion = async ({job, preparedJob, target}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('Missing OPENAI_API_KEY. Add it to .env to generate Hook/CTA/voice-over suggestions.');
    error.errorType = 'missing_openai_key';
    throw error;
  }

  const effectiveJob = mergePreparedJobContext(job ?? {}, preparedJob);
  const metadata = buildPublishingMetadata(effectiveJob);
  const ctaGuidance = buildCtaGuidance(metadata);
  const editorialBrief = buildHookCtaEditorialBrief(metadata, ctaGuidance);
  const productionBrief = buildHookCtaProductionBrief(metadata, editorialBrief, ctaGuidance);
  const model =
    process.env.OPENAI_HOOK_CTA_MODEL ??
    process.env.OPENAI_PUBLISHING_MODEL ??
    process.env.OPENAI_MODEL ??
    'gpt-4.1-mini';
  const requestedTarget =
    target === 'hook'
      ? 'hookText'
      : target === 'cta'
        ? 'ctaText'
        : target === 'voiceover'
          ? 'voiceoverText'
          : 'all fields';
  const prompt = [
    'Generate short-video Hook, CTA, and voice-over text for the current football video setup.',
    `Requested field: ${requestedTarget}. Still return hookText, ctaText, and voiceoverText.`,
    'Use only the facts in the production brief. Do not invent standings, scores, teams, dates, or consequences.',
    'If userDirection.priorityFacts has items, use those before any other fact.',
    'If userDirection.priorityTeams has items, mention at least one of those teams in hookText or voiceoverText.',
    'If userDirection.editorialAngle is filled, all three fields must follow that angle.',
    'All three fields must tell the same story with different jobs: hookText creates curiosity, ctaText asks one comment question, voiceoverText explains the consequence.',
    'hookText: first-frame line, direct, concrete, not generic.',
    'ctaText: one specific question, tied to the same team/angle.',
    'voiceoverText: one speakable sentence, no hashtags, no stage directions.',
    'Avoid every phrase in bannedExactPhrases exactly.',
    'Match languageProfile exactly: pt-br outputs in Brazilian Portuguese; en outputs in English.',
    `Production brief JSON:\n${JSON.stringify(productionBrief, null, 2)}`,
  ].join('\n\n');

  const data = await callOpenAiResponses({
    apiKey,
    body: buildOpenAiResponsesBody({
      model,
      input: [
        {
          role: 'system',
          content:
            'You write concise football short-video hooks, CTAs, and 8-second voice-over scripts. Follow the compact production brief exactly.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'football_hook_cta_suggestion',
          strict: true,
          schema: hookCtaSuggestionSchema,
        },
      },
    }),
  });

  const outputText = extractResponseText(data);
  if (!outputText) {
    throw new Error('OpenAI returned an empty Hook/CTA suggestion.');
  }

  const suggestion = JSON.parse(outputText);
  return {
    hookText: String(suggestion.hookText ?? '').trim(),
    ctaText: String(suggestion.ctaText ?? '').trim(),
    voiceoverText: String(suggestion.voiceoverText ?? '').trim(),
    model,
    templateName: 'compact-production-brief',
  };
};

const generateThumbnailSuggestion = async (body) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('Missing OPENAI_API_KEY. Add it to .env to generate thumbnail suggestions.');
    error.errorType = 'missing_openai_key';
    throw error;
  }

  const channelProfile = body.channelProfile === 'en' ? 'en' : 'pt';
  const language = channelProfile === 'en' ? 'English' : 'Brazilian Portuguese';
  const model = process.env.OPENAI_THUMBNAIL_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
  const prompt = [
    `Create YouTube thumbnail copy in ${language} for a football channel.`,
    'Return only JSON matching the schema.',
    'Keep headline extremely short: 2 to 5 words, uppercase-ready, no hashtags.',
    'Keep subheadline punchy and factual. Do not invent facts not provided.',
    'The final visual is deterministic in Remotion, so suggest text only.',
    `Preset: ${body.preset || 'matchup'}`,
    `Competition: ${body.leagueName || ''}`,
    `Team A: ${body.teamAName || ''}`,
    `Team B: ${body.teamBName || ''}`,
    `Current headline: ${body.headline || ''}`,
    `Current subheadline: ${body.subheadline || ''}`,
    `Extra context: ${body.extraContext || ''}`,
  ].join('\n');

  const data = await callOpenAiResponses({
    apiKey,
    body: buildOpenAiResponsesBody({
      model,
      input: [
        {
          role: 'system',
          content:
            'You write concise football YouTube thumbnail copy. You never invent scores, transfers, injuries, or standings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'football_thumbnail_suggestion',
          strict: true,
          schema: thumbnailSuggestionSchema,
        },
      },
    }),
  });

  const outputText = extractResponseText(data);
  if (!outputText) {
    throw new Error('OpenAI returned an empty thumbnail suggestion.');
  }

  return JSON.parse(outputText);
};

const getYouTubeCredential = (channelProfile, key) => {
  const normalizedChannel = String(channelProfile ?? 'pt').toUpperCase() === 'EN' ? 'EN' : 'PT';
  return process.env[`YOUTUBE_${normalizedChannel}_${key}`] ?? process.env[`YOUTUBE_${key}`];
};

const getTikTokCredential = (channelProfile, key) => {
  const normalizedChannel = String(channelProfile ?? 'pt').toUpperCase() === 'EN' ? 'EN' : 'PT';
  return process.env[`TIKTOK_${normalizedChannel}_${key}`] ?? process.env[`TIKTOK_${key}`];
};

const getRequestOrigin = (request) => {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return `${protocol ?? 'http'}://${request.headers.host ?? `${host}:${port}`}`;
};

const getYouTubeRedirectUri = (request) =>
  `${getRequestOrigin(request)}/oauth/youtube/callback`;

const getTikTokRedirectUri = (request) =>
  process.env.TIKTOK_REDIRECT_URI || `${getRequestOrigin(request)}/oauth/tiktok/callback`;

const getYouTubeOAuthClient = (channelProfile = 'pt') => {
  const clientId = getYouTubeCredential(channelProfile, 'CLIENT_ID');
  const clientSecret = getYouTubeCredential(channelProfile, 'CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    const error = new Error(
      `Missing YouTube ${String(channelProfile).toUpperCase()} client ID or secret in .env.`
    );
    error.errorType = 'missing_youtube_client';
    throw error;
  }

  return {clientId, clientSecret};
};

const createYouTubeOAuthUrl = ({channelProfile, redirectUri}) => {
  const {clientId} = getYouTubeOAuthClient(channelProfile);
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', channelProfile === 'en' ? 'en' : 'pt');
  return authUrl.toString();
};

const exchangeYouTubeAuthorizationCode = async ({channelProfile, code, redirectUri}) => {
  const {clientId, clientSecret} = getYouTubeOAuthClient(channelProfile);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error_description ?? data?.error ?? 'Could not exchange YouTube authorization code.');
  }

  return {
    clientId,
    clientSecret,
    refreshToken: data.refresh_token,
  };
};

const getYouTubeAccessToken = async (channelProfile = 'pt') => {
  const accessToken = getYouTubeCredential(channelProfile, 'ACCESS_TOKEN');
  if (accessToken) {
    return accessToken;
  }

  const clientId = getYouTubeCredential(channelProfile, 'CLIENT_ID');
  const clientSecret = getYouTubeCredential(channelProfile, 'CLIENT_SECRET');
  const refreshToken = getYouTubeCredential(channelProfile, 'REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    const error = new Error(
      'Missing YouTube OAuth credentials. Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN to .env.'
    );
    error.errorType = 'missing_youtube_credentials';
    throw error;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error_description ?? data?.error ?? 'Could not refresh YouTube access token.');
  }

  return data.access_token;
};

const normalizeTagList = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const normalizeHashtagList = (hashtags) => {
  const rawItems = (Array.isArray(hashtags) ? hashtags : [hashtags])
    .flatMap((hashtag) => String(hashtag ?? '').split(/[\s,]+/))
    .filter(Boolean);

  return [
    ...new Set(
      rawItems
        .map((hashtag) => String(hashtag).trim())
        .filter(Boolean)
        .map((hashtag) => {
          const cleaned = hashtag
            .replace(/^#+/, '')
            .replace(/[^\p{L}\p{N}_]/gu, '')
            .trim();
          return cleaned ? `#${cleaned}` : '';
        })
        .filter(Boolean)
    ),
  ];
};

const appendHashtagsToText = ({text, hashtags}) => {
  const textValue = String(text ?? '').trim();
  const normalizedHashtags = normalizeHashtagList(hashtags);
  const missingHashtags = normalizedHashtags.filter((hashtag) => {
    const escapedHashtag = hashtag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return !new RegExp(`(^|\\s)${escapedHashtag}(?=\\s|$)`, 'i').test(textValue);
  });

  if (missingHashtags.length === 0) {
    return textValue;
  }

  return [textValue, missingHashtags.join(' ')].filter(Boolean).join('\n\n');
};

const normalizeShortSocialPlatform = (platformDraft) => {
  if (!platformDraft) return platformDraft;
  const captionHashtags = String(platformDraft.caption ?? '').match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const draftHashtags = Array.isArray(platformDraft.hashtags)
    ? platformDraft.hashtags
    : [platformDraft.hashtags];
  const hashtags = normalizeHashtagList([...draftHashtags, ...captionHashtags]);

  return {
    ...platformDraft,
    caption: appendHashtagsToText({
      text: platformDraft.caption,
      hashtags,
    }),
    hashtags,
  };
};

const normalizePublishingDraft = (draft) => {
  if (!draft?.platforms) return draft;

  return {
    ...draft,
    platforms: {
      ...draft.platforms,
      youtube: draft.platforms.youtube
        ? {
            ...draft.platforms.youtube,
            hashtags: normalizeHashtagList(draft.platforms.youtube.hashtags),
          }
        : draft.platforms.youtube,
      tiktok: normalizeShortSocialPlatform(draft.platforms.tiktok),
      instagram: normalizeShortSocialPlatform(draft.platforms.instagram),
      x: draft.platforms.x
        ? {
            ...draft.platforms.x,
            hashtags: normalizeHashtagList(draft.platforms.x.hashtags),
          }
        : draft.platforms.x,
    },
  };
};

const hasShortsMarker = (value) => /#shorts\b/i.test(String(value ?? ''));

const appendYouTubeDescriptionFooter = ({description, footer}) => {
  const descriptionText = String(description ?? '').trim();
  const footerText = String(footer ?? '').trim();
  if (!footerText || descriptionText.includes(footerText)) {
    return descriptionText;
  }

  const descriptionWithoutShorts = descriptionText.replace(/(^|\n)\s*#shorts\s*$/i, '').trim();
  return [descriptionWithoutShorts, footerText].filter(Boolean).join('\n\n');
};

const stripYouTubeCouponBlock = (description) => {
  const lines = String(description ?? '').replace(/\r\n/g, '\n').split('\n');
  const startIndex = lines.findIndex((line) => {
    const normalizedLine = line
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return (
      normalizedLine.includes('cupons') ||
      normalizedLine.includes('esportes da sorte') ||
      normalizedLine.includes('betmgm') ||
      normalizedLine.includes('joma brasil')
    );
  });

  if (startIndex === -1) {
    return lines.join('\n').trim();
  }

  let endIndex = lines.length - 1;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^\s*-{20,}\s*$/.test(lines[index])) {
      endIndex = index;
      break;
    }
  }

  return [...lines.slice(0, startIndex), ...lines.slice(endIndex + 1)]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const stripYouTubeChannelFooterBlock = (description) => {
  const lines = String(description ?? '').replace(/\r\n/g, '\n').split('\n');
  const startIndex = lines.findIndex((line) => {
    const normalizedLine = line
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return (
      normalizedLine.includes('bem-vindo ao canal foot analysis') ||
      normalizedLine.includes('welcome to foot analysis en')
    );
  });

  if (startIndex === -1) {
    return lines.join('\n').trim();
  }

  const shortsIndex = lines.findIndex(
    (line, index) => index > startIndex && /^\s*#shorts\s*$/i.test(line)
  );
  const footerEndIndex = shortsIndex === -1 ? lines.length : shortsIndex;

  return [...lines.slice(0, startIndex), ...lines.slice(footerEndIndex)]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const ensureShortsMetadata = ({title, description, tags}) => {
  const normalizedTags = [...new Set([...normalizeTagList(tags), 'shorts'])];
  const titleText = String(title ?? '').trim();
  const descriptionText = String(description ?? '').trim();
  const nextTitle = hasShortsMarker(titleText)
    ? titleText
    : `${titleText.slice(0, 92).trim()} #Shorts`.trim();
  const nextDescription = hasShortsMarker(descriptionText)
    ? descriptionText
    : `${descriptionText}${descriptionText ? '\n\n' : ''}#Shorts`;

  return {
    title: nextTitle,
    description: nextDescription,
    tags: normalizedTags,
  };
};

const resolveRenderedVideoPath = async ({outputName, renderPath}) => {
  const rawPath = String(renderPath || outputName || '').trim();
  if (!rawPath) {
    throw new Error('Missing rendered video path. Render the MP4 first.');
  }

  const relativePath = rawPath
    .replace(/^\/out\//, '')
    .replace(/^out\//, '')
    .replace(/^\/+/, '');
  const filePath = path.resolve(outDir, relativePath);
  if (!filePath.startsWith(`${outDir}${path.sep}`)) {
    throw new Error('Invalid render path.');
  }

  await fs.access(filePath);
  return filePath;
};

const inspectVideoForShorts = async (filePath) => {
  try {
    const {stdout} = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height:format=duration',
      '-of',
      'json',
      filePath,
    ]);
    const data = JSON.parse(stdout);
    const stream = data.streams?.[0] ?? {};
    const width = Number(stream.width);
    const height = Number(stream.height);
    const duration = Number(data.format?.duration);
    const isVertical = Number.isFinite(width) && Number.isFinite(height) && height > width;
    const isUnderSixtySeconds = Number.isFinite(duration) && duration < 60;

    return {
      width,
      height,
      duration,
      isVertical,
      isUnderSixtySeconds,
      eligible: isVertical && isUnderSixtySeconds,
    };
  } catch (error) {
    throw new Error(
      `Could not inspect rendered video with ffprobe: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

const uploadYouTubeVideo = async ({job, body, uploadMode = 'shorts'}) => {
  const accessToken = await getYouTubeAccessToken(job.channelProfile);
  const youtube = body.youtube ?? {};
  const filePath = await resolveRenderedVideoPath({
    outputName: body.outputName ?? job.outputName,
    renderPath: body.renderPath,
  });
  const isShortsUpload = uploadMode === 'shorts';
  const shortsCheck = isShortsUpload ? await inspectVideoForShorts(filePath) : null;
  if (isShortsUpload && !shortsCheck.eligible) {
    throw new Error(
      `Rendered video is not eligible for Shorts: ${shortsCheck.width}x${shortsCheck.height}, ${Number.isFinite(shortsCheck.duration) ? `${shortsCheck.duration.toFixed(1)}s` : 'unknown duration'}. Use a vertical video under 60 seconds.`
    );
  }
  const youtubeFooter = await loadYouTubeDescriptionFooter(job.languageProfile);
  const notifySubscribers = body.notifySubscribers === true;
  const hasPaidProductPlacement = body.hasPaidProductPlacement === true;
  const includeChannelFooter = body.includeChannelFooter === true;
  const descriptionWithFooter = includeChannelFooter
    ? appendYouTubeDescriptionFooter({
        description: youtube.description ?? body.description,
        footer: youtubeFooter,
      })
    : youtube.description ?? body.description;
  const descriptionWithoutCoupons = hasPaidProductPlacement
    ? descriptionWithFooter
    : stripYouTubeCouponBlock(descriptionWithFooter);
  const uploadDescription = includeChannelFooter
    ? descriptionWithoutCoupons
    : stripYouTubeChannelFooterBlock(descriptionWithoutCoupons);
  const uploadMetadata = isShortsUpload
    ? ensureShortsMetadata({
        title: youtube.title ?? body.title,
        description: uploadDescription,
        tags: youtube.tags ?? body.tags,
      })
    : {
        title: youtube.title ?? body.title,
        description: uploadDescription,
        tags: normalizeTagList(youtube.tags ?? body.tags),
      };
  const title = compactText(uploadMetadata.title, 100);
  const description = uploadMetadata.description;
  const tags = uploadMetadata.tags;
  const privacyStatus = String(
    body.privacyStatus ?? process.env.YOUTUBE_PRIVACY_STATUS ?? 'unlisted'
  ).toLowerCase();
  const allowedPrivacyStatuses = new Set(['private', 'unlisted', 'public']);

  if (!title) {
    throw new Error('Missing YouTube title.');
  }

  const metadata = {
    snippet: {
      title,
      description,
      tags,
      categoryId: '17',
    },
    status: {
      privacyStatus: allowedPrivacyStatuses.has(privacyStatus) ? privacyStatus : 'unlisted',
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: false,
    },
    paidProductPlacementDetails: {
      hasPaidProductPlacement,
    },
  };

  const boundary = `foot-analysis-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const videoBytes = await fs.readFile(filePath);
  const bodyBuffer = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata
      )}\r\n--${boundary}\r\ncontent-type: video/mp4\r\n\r\n`
    ),
    videoBytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const response = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status,paidProductPlacementDetails&uploadType=multipart&notifySubscribers=${notifySubscribers ? 'true' : 'false'}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': `multipart/related; boundary=${boundary}`,
        'content-length': String(bodyBuffer.length),
      },
      body: bodyBuffer,
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? `YouTube upload failed with ${response.status}`);
  }

  return {
    videoId: data.id,
    url: data.id ? `https://www.youtube.com/watch?v=${data.id}` : '',
    shortsUrl: isShortsUpload && data.id ? `https://www.youtube.com/shorts/${data.id}` : '',
    privacyStatus: metadata.status.privacyStatus,
    notifySubscribers,
    hasPaidProductPlacement,
    includeChannelFooter,
    uploadMode,
    title,
    filePath: path.relative(projectRoot, filePath),
    shortsCheck,
  };
};

const sendYouTubeOAuthCallback = async (request, response, url) => {
  const channelProfile = url.searchParams.get('state') === 'en' ? 'en' : 'pt';
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    response.writeHead(400, {'content-type': 'text/html; charset=utf-8'});
    response.end(`<h1>YouTube authorization failed</h1><p>${error ?? 'Missing authorization code.'}</p>`);
    return;
  }

  try {
    const token = await exchangeYouTubeAuthorizationCode({
      channelProfile,
      code,
      redirectUri: getYouTubeRedirectUri(request),
    });
    const prefix = channelProfile.toUpperCase();
    const envLines = [
      `YOUTUBE_${prefix}_CLIENT_ID=${token.clientId}`,
      `YOUTUBE_${prefix}_CLIENT_SECRET=${token.clientSecret}`,
      `YOUTUBE_${prefix}_REFRESH_TOKEN=${token.refreshToken}`,
    ].join('\n');

    response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
    response.end(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>YouTube OAuth Complete</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #102033; }
            pre { padding: 16px; border-radius: 10px; background: #f2f5f8; white-space: pre-wrap; word-break: break-all; }
            button { padding: 10px 14px; border-radius: 8px; border: 0; background: #0a66d8; color: #fff; font-weight: 700; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>YouTube ${prefix} refresh token generated</h1>
          <p>Add these lines to your local <code>.env</code>, then restart the dashboard server.</p>
          <pre id="env-lines">${envLines}</pre>
          <button onclick="navigator.clipboard.writeText(document.getElementById('env-lines').textContent)">Copy env lines</button>
        </body>
      </html>`);
  } catch (callbackError) {
    response.writeHead(500, {'content-type': 'text/html; charset=utf-8'});
    response.end(
      `<h1>YouTube authorization failed</h1><p>${
        callbackError instanceof Error ? callbackError.message : String(callbackError)
      }</p>`
    );
  }
};

const getTikTokOAuthClient = (channelProfile = 'pt') => {
  const clientKey = getTikTokCredential(channelProfile, 'CLIENT_KEY');
  const clientSecret = getTikTokCredential(channelProfile, 'CLIENT_SECRET');

  if (!clientKey || !clientSecret) {
    const error = new Error(
      `Missing TikTok ${String(channelProfile).toUpperCase()} client key or secret in .env.`
    );
    error.errorType = 'missing_tiktok_client';
    throw error;
  }

  return {clientKey, clientSecret};
};

const createTikTokOAuthUrl = ({channelProfile, redirectUri}) => {
  const {clientKey} = getTikTokOAuthClient(channelProfile);
  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', clientKey);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'user.info.basic,video.upload');
  authUrl.searchParams.set('state', channelProfile === 'en' ? 'en' : 'pt');
  authUrl.searchParams.set('disable_auto_auth', '1');
  return authUrl.toString();
};

const exchangeTikTokAuthorizationCode = async ({channelProfile, code, redirectUri}) => {
  const {clientKey, clientSecret} = getTikTokOAuthClient(channelProfile);
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data?.error_description ?? data?.error ?? 'Could not exchange TikTok authorization code.');
  }

  return {
    clientKey,
    clientSecret,
    refreshToken: data.refresh_token,
    openId: data.open_id,
    scope: data.scope,
    refreshExpiresIn: data.refresh_expires_in,
  };
};

const getTikTokAccessToken = async (channelProfile = 'pt') => {
  const accessToken = getTikTokCredential(channelProfile, 'ACCESS_TOKEN');
  if (accessToken) {
    return accessToken;
  }

  const clientKey = getTikTokCredential(channelProfile, 'CLIENT_KEY');
  const clientSecret = getTikTokCredential(channelProfile, 'CLIENT_SECRET');
  const refreshToken = getTikTokCredential(channelProfile, 'REFRESH_TOKEN');

  if (!clientKey || !clientSecret || !refreshToken) {
    const error = new Error(
      'Missing TikTok OAuth credentials. Add TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_REFRESH_TOKEN to .env.'
    );
    error.errorType = 'missing_tiktok_credentials';
    throw error;
  }

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data?.error_description ?? data?.error ?? 'Could not refresh TikTok access token.');
  }

  return data.access_token;
};

const uploadTikTokVideo = async ({job, body}) => {
  const accessToken = await getTikTokAccessToken(job.channelProfile);
  const filePath = await resolveRenderedVideoPath({
    outputName: body.outputName ?? job.outputName,
    renderPath: body.renderPath,
  });
  const shortsCheck = await inspectVideoForShorts(filePath);
  if (!shortsCheck.eligible) {
    throw new Error(
      `Rendered video is not eligible for TikTok short-form upload: ${shortsCheck.width}x${shortsCheck.height}, ${Number.isFinite(shortsCheck.duration) ? `${shortsCheck.duration.toFixed(1)}s` : 'unknown duration'}. Use a vertical video under 60 seconds.`
    );
  }

  const fileStats = await fs.stat(filePath);
  if (!fileStats.size) {
    throw new Error('Rendered video is empty.');
  }

  const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileStats.size,
        chunk_size: fileStats.size,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initResponse.json().catch(() => ({}));
  if (!initResponse.ok || initData?.error?.code !== 'ok') {
    throw new Error(
      initData?.error?.message || initData?.error?.code || `TikTok upload init failed with ${initResponse.status}`
    );
  }

  const uploadUrl = initData?.data?.upload_url;
  const publishId = initData?.data?.publish_id;
  if (!uploadUrl || !publishId) {
    throw new Error('TikTok did not return an upload URL.');
  }

  const videoBytes = await fs.readFile(filePath);
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'content-type': 'video/mp4',
      'content-length': String(fileStats.size),
      'content-range': `bytes 0-${fileStats.size - 1}/${fileStats.size}`,
    },
    body: videoBytes,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => '');
    throw new Error(errorText || `TikTok video upload failed with ${uploadResponse.status}`);
  }

  return {
    publishId,
    filePath: path.relative(projectRoot, filePath),
    shortsCheck,
    note: 'Open TikTok notifications/inbox to complete caption, cover, and posting.',
  };
};

const sendTikTokOAuthCallback = async (request, response, url) => {
  const channelProfile = url.searchParams.get('state') === 'en' ? 'en' : 'pt';
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error || !code) {
    response.writeHead(400, {'content-type': 'text/html; charset=utf-8'});
    response.end(`<h1>TikTok authorization failed</h1><p>${errorDescription ?? error ?? 'Missing authorization code.'}</p>`);
    return;
  }

  try {
    const token = await exchangeTikTokAuthorizationCode({
      channelProfile,
      code,
      redirectUri: getTikTokRedirectUri(request),
    });
    const prefix = channelProfile.toUpperCase();
    const envLines = [
      `TIKTOK_${prefix}_CLIENT_KEY=${token.clientKey}`,
      `TIKTOK_${prefix}_CLIENT_SECRET=${token.clientSecret}`,
      `TIKTOK_${prefix}_REFRESH_TOKEN=${token.refreshToken}`,
    ].join('\n');

    response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
    response.end(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>TikTok OAuth Complete</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #102033; }
            pre { padding: 16px; border-radius: 10px; background: #f2f5f8; white-space: pre-wrap; word-break: break-all; }
            button { padding: 10px 14px; border-radius: 8px; border: 0; background: #0a66d8; color: #fff; font-weight: 700; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>TikTok ${prefix} refresh token generated</h1>
          <p>Add these lines to your local <code>.env</code>, then restart the dashboard server.</p>
          <pre id="env-lines">${envLines}</pre>
          <button onclick="navigator.clipboard.writeText(document.getElementById('env-lines').textContent)">Copy env lines</button>
        </body>
      </html>`);
  } catch (callbackError) {
    response.writeHead(500, {'content-type': 'text/html; charset=utf-8'});
    response.end(
      `<h1>TikTok authorization failed</h1><p>${
        callbackError instanceof Error ? callbackError.message : String(callbackError)
      }</p>`
    );
  }
};


const runRender = async (compositionId, outputName) => {
  const outputPath = path.join('out', outputName);
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});
  await syncCurrentFootballJobDuration();

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

  if (request.method === 'GET' && url.pathname === '/api/football/short-durations') {
    sendFootballShortDurations(response);
    return;
  }

  if (request.method === 'PUT' && url.pathname === '/api/football/short-durations') {
    await saveFootballShortDurations(request, response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/thumbnails/logos') {
    try {
      const logos = await listFootballLogos(url.searchParams.get('q'));
      sendJson(response, 200, {
        ok: true,
        logos,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/settings/youtube/oauth-url') {
    try {
      const channelProfile = url.searchParams.get('channel') === 'en' ? 'en' : 'pt';
      const authUrl = createYouTubeOAuthUrl({
        channelProfile,
        redirectUri: getYouTubeRedirectUri(request),
      });
      sendJson(response, 200, {ok: true, authUrl});
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/settings/tiktok/oauth-url') {
    try {
      const channelProfile = url.searchParams.get('channel') === 'en' ? 'en' : 'pt';
      const redirectUri = getTikTokRedirectUri(request);
      const authUrl = createTikTokOAuthUrl({
        channelProfile,
        redirectUri,
      });
      sendJson(response, 200, {ok: true, authUrl, redirectUri});
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/oauth/youtube/callback') {
    await sendYouTubeOAuthCallback(request, response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/oauth/tiktok/callback') {
    await sendTikTokOAuthCallback(request, response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/longform/options') {
    await sendFootballLongformOptions(response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/round-summary-longform/options') {
    await sendFootballRoundSummaryLongformOptions(response);
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

  if (request.method === 'POST' && url.pathname === '/api/football/round-summary-longform/validate') {
    try {
      const body = await readBody(request);
      const validation = parseFootballRoundSummaryLongYaml(body.yamlText ?? '');
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

  if (request.method === 'GET' && url.pathname === '/api/football/next-fixtures') {
    await sendFootballNextFixtures(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/result-fixtures') {
    await sendFootballResultFixtures(response, url);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/world-cup-groups') {
    await sendFootballWorldCupGroups(response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/football/world-cup-standings-preview') {
    await sendFootballWorldCupStandingsPreview(response, url);
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

  if (request.method === 'GET' && url.pathname === '/api/football/tierlist-teams') {
    await sendFootballTierlistTeams(response, url);
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

  if (request.method === 'POST' && url.pathname === '/api/football/thumbnails/prepare') {
    try {
      const body = await readBody(request);
      const {job} = await prepareFootballThumbnailJob(body);

      sendJson(response, 200, {
        ok: true,
        message: 'Thumbnail job prepared. Preview or render the still when ready.',
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

  if (request.method === 'POST' && url.pathname === '/api/football/thumbnails/render') {
    try {
      const body = await readBody(request);
      const {job} = await prepareFootballThumbnailJob(body);
      const renderResult = await runStill(job.compositionId, job.outputName);

      sendJson(response, 200, {
        ok: true,
        message: 'Thumbnail rendered successfully.',
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

  if (request.method === 'POST' && url.pathname === '/api/football/thumbnails/suggest') {
    try {
      const body = await readBody(request);
      const suggestion = await generateThumbnailSuggestion(body);

      sendJson(response, 200, {
        ok: true,
        message: 'Thumbnail suggestion ready.',
        suggestion,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
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
        channelProfile: body.channelProfile,
        languageProfile: body.languageProfile,
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
        channelProfile: body.channelProfile,
        languageProfile: body.languageProfile,
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

  if (request.method === 'POST' && url.pathname === '/api/football/longform/publishing/youtube-draft') {
    try {
      const body = await readBody(request);
      const currentJob = await loadFootballPredictionsLongJob();
      const result = await generateYouTubePublishingDraft({
        job: currentJob,
        extraContext: body.extraContext,
        copyModelInstructions: body.copyModelInstructions,
        requestedModel: body.model,
        includeChannelFooter: body.includeChannelFooter === true,
      });

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/longform/publishing/youtube/upload') {
    try {
      const body = await readBody(request);
      const currentJob = await loadFootballPredictionsLongJob();
      const result = await uploadYouTubeVideo({
        job: currentJob,
        body,
        uploadMode: 'longform',
      });

      sendJson(response, 200, {
        ok: true,
        message: 'YouTube longform upload completed.',
        youtube: result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/round-summary-longform/prepare') {
    try {
      const body = await readBody(request);
      const {job, validation} = await prepareFootballRoundSummaryLongJob({
        yamlText: body.yamlText,
        apiKey: process.env.FOOTBALL_API_KEY,
        apiHost: process.env.FOOTBALL_API_HOST,
        brandName: body.brandName,
        soundtrackPath: body.soundtrackPath,
        soundtrackVolume: body.soundtrackVolume,
        channelProfile: body.channelProfile,
        languageProfile: body.languageProfile,
        voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
      });

      sendJson(response, 200, {
        ok: true,
        message: 'Round summary longform job prepared.',
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

  if (request.method === 'POST' && url.pathname === '/api/football/round-summary-longform/render') {
    try {
      const body = await readBody(request);
      const {job, validation} = await prepareFootballRoundSummaryLongJob({
        yamlText: body.yamlText,
        apiKey: process.env.FOOTBALL_API_KEY,
        apiHost: process.env.FOOTBALL_API_HOST,
        brandName: body.brandName,
        soundtrackPath: body.soundtrackPath,
        soundtrackVolume: body.soundtrackVolume,
        channelProfile: body.channelProfile,
        languageProfile: body.languageProfile,
        voiceoverEnabled: parseBooleanField(body.voiceoverEnabled, true),
      });
      const renderResult = await runRender('FootballRoundSummaryLong', job.outputName);

      sendJson(response, 200, {
        ok: true,
        message: 'Round summary longform render completed successfully.',
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

  if (
    request.method === 'POST' &&
    url.pathname === '/api/football/round-summary-longform/publishing/youtube-draft'
  ) {
    try {
      const body = await readBody(request);
      const currentJob = await loadFootballRoundSummaryLongJob();
      const result = await generateYouTubePublishingDraft({
        job: currentJob,
        extraContext: body.extraContext,
        copyModelInstructions: body.copyModelInstructions,
        requestedModel: body.model,
        includeChannelFooter: body.includeChannelFooter === true,
      });

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (
    request.method === 'POST' &&
    url.pathname === '/api/football/round-summary-longform/publishing/youtube/upload'
  ) {
    try {
      const body = await readBody(request);
      const currentJob = await loadFootballRoundSummaryLongJob();
      const result = await uploadYouTubeVideo({
        job: currentJob,
        body,
        uploadMode: 'longform',
      });

      sendJson(response, 200, {
        ok: true,
        message: 'YouTube round summary longform upload completed.',
        youtube: result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
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

  if (request.method === 'POST' && url.pathname === '/api/football/publishing/draft') {
    try {
      const body = await readBody(request);
      const currentJob = await loadCurrentJob();
      const result = await generatePublishingDraft({
        job: currentJob,
        extraContext: body.extraContext,
        copyModelInstructions: body.copyModelInstructions,
        requestedModel: body.model,
      });

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/copy/hook-cta') {
    try {
      const body = await readBody(request);
      const currentJob = await loadCurrentJob().catch(() => null);
      const requestPreparedJob = canUsePreparedJobContext(body.job ?? {}, body.preparedJob)
        ? body.preparedJob
        : null;
      const preparedJob =
        requestPreparedJob ??
        (canUsePreparedJobContext(body.job ?? {}, currentJob) ? currentJob : null);
      const result = await generateHookCtaSuggestion({
        job: body.job ?? {},
        preparedJob,
        target: body.target,
      });

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/publishing/youtube/upload') {
    try {
      const body = await readBody(request);
      const currentJob = await loadCurrentJob();
      const result = await uploadYouTubeVideo({
        job: currentJob,
        body,
      });

      sendJson(response, 200, {
        ok: true,
        message: 'YouTube upload completed.',
        youtube: result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/football/publishing/tiktok/upload') {
    try {
      const body = await readBody(request);
      const currentJob = await loadCurrentJob();
      const result = await uploadTikTokVideo({
        job: currentJob,
        body,
      });

      sendJson(response, 200, {
        ok: true,
        message: 'TikTok inbox upload completed.',
        tiktok: result,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.errorType ?? undefined,
      });
    }
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

  const publicPathPrefixes = [
    '/audio/',
    '/backgrounds/',
    '/branding/',
    '/fonts/',
    '/logos/',
    '/voiceovers/',
  ];
  if (request.method === 'GET' && publicPathPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
    const relativePath = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    const filePath = path.resolve(publicDir, relativePath);
    if (!filePath.startsWith(`${publicDir}${path.sep}`)) {
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
  } else if (
    url.pathname === '/football-round-summary-longform' ||
    url.pathname === '/football-round-summary-longform/'
  ) {
    filePath = path.join(dashboardDir, 'football-round-summary-longform', 'index.html');
  } else if (
    url.pathname === '/football-longform-player' ||
    url.pathname === '/football-longform-player/'
  ) {
    filePath = path.join(dashboardDir, 'football-longform-player', 'index.html');
  } else if (
    url.pathname === '/football-thumbnails' ||
    url.pathname === '/football-thumbnails/'
  ) {
    filePath = path.join(dashboardDir, 'football-thumbnails', 'index.html');
  } else {
    filePath = path.join(dashboardDir, url.pathname);
  }

  await serveStatic(response, filePath);
});

server.listen(port, host, () => {
  console.log(`Foot Analysis dashboard running at http://${host}:${port}`);
});
