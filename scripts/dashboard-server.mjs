import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {
  footballChannelProfiles,
  footballLanguageProfiles,
  footballSoundtrackPresets,
  leaguePresets,
  loadCurrentJob,
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
  loadWorldCupTierlistTeams,
  prepareJob,
  prepareFootballPredictionsLongJob,
  parseFootballPredictionsLongYaml,
  prepareFootballRoundSummaryLongJob,
  parseFootballRoundSummaryLongYaml,
  projectRoot,
  templates,
} from './lib/video-system.mjs';
import {getFootballHookOptions} from './lib/football-copy.mjs';

const dashboardDir = path.join(projectRoot, 'dashboard');
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

const sendFootballLongformOptions = async (response) => {
  const currentJob = await loadFootballPredictionsLongJob().catch(() => null);
  const teamAccentColors = await loadTeamAccentColors();
  const longformLeaguePresets = leaguePresets
    .filter((preset) => preset.channels?.includes('pt'))
    .sort((left, right) => {
      if (left.leagueId === 1) return -1;
      if (right.leagueId === 1) return 1;
      return 0;
    });

  sendJson(response, 200, {
    leaguePresets: longformLeaguePresets,
    soundtrackPresets: footballSoundtrackPresets,
    teamAccentColors,
    currentJob,
  });
};

const sendFootballRoundSummaryLongformOptions = async (response) => {
  const currentJob = await loadFootballRoundSummaryLongJob().catch(() => null);
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
    editorialAngle: 'upcoming matches; focus on must-watch games, direct clashes, schedule tension, and what each team needs.',
  },
  predictions: {
    contentType: 'predictions',
    editorialAngle: 'match predictions; focus on favorites, balanced fixtures, upset potential, and score discussion.',
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
    editorialAngle: 'scoring race; focus on the leading scorer, close pursuers, goals gap, and who can overtake.',
  },
  'player-of-round': {
    contentType: 'player_ranking',
    editorialAngle: 'player of the round ranking; focus on standout performances, rating leaders, goals, assists, and debate.',
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
      leader: formatTeamMetric(leader),
      goalGapToSecond: goalGap,
      chasers: entries.slice(1, 6).map(formatTeamMetric),
      tiedWithSecond: entries
        .slice(1)
        .filter((entry) => second?.goals !== undefined && Number(entry.goals) === Number(second.goals))
        .map(formatTeamMetric),
      topFive: entries.slice(0, 5).map(formatTeamMetric),
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
  const context = publishingTemplateContext[job.template] ?? {
    contentType: job.template ?? 'football_video',
    editorialAngle: 'football short video; use the current template and metadata to choose the strongest story.',
  };

  return {
    sport: job.sport ?? 'football',
    template: job.template ?? '',
    contentType: context.contentType,
    editorialAngle: context.editorialAngle,
    compositionId: job.compositionId ?? '',
    channelProfile: job.channelProfile ?? '',
    languageProfile: job.languageProfile ?? '',
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
    champion: job.championTeam ?? job.champion?.team ?? '',
    groupLabel: job.groupLabel ?? '',
    dataSource: job.dataSource ?? '',
    templateSpecific: buildTemplateSpecificMetadata(job),
    summaryRows: summarizeRows(rows, (row) => {
      const rank = row.rank ?? row.position ?? '';
      const name = row.team ?? row.playerName ?? row.groupName ?? row.name ?? '';
      const stat =
        row.points !== undefined && row.percentage !== undefined
          ? `${row.points} pts · ${row.percentage}%`
          : row.points !== undefined
            ? `${row.points} pts`
          : row.goals !== undefined
            ? `${row.goals} goals`
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

const generatePublishingDraft = async ({job, extraContext, copyModelInstructions}) => {
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
  const model = process.env.OPENAI_PUBLISHING_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
  const prompt = [
    'Generate a publishing draft for a short football video.',
    'Return platform-specific copy only. Do not invent match facts beyond the metadata.',
    'Prioritize native style for each platform and keep the user able to manually approve before posting.',
    'Use tags as comma-friendly keywords without #. Use hashtags with # when the platform field is named hashtags.',
    'For TikTok and Instagram, write the caption as one ready-to-paste field: description text followed by hashtags. Hashtags must include #.',
    'Respect metadata.contentType and metadata.editorialAngle. For relegation_battle, do not describe the video as a general league table; make the safety line, danger zone, and escape pressure the central story.',
    `Compact master publishing template (${publishingTemplate.name}):\n${compactTemplate}`,
    copyModelInstructions
      ? `Additional editor instructions:\n${copyModelInstructions}`
      : '',
    extraContext ? `Additional context from editor:\n${extraContext}` : '',
    `Video metadata JSON:\n${JSON.stringify(metadata, null, 2)}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
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

  const data = await openaiResponse.json().catch(() => ({}));
  if (!openaiResponse.ok) {
    const message = data?.error?.message ?? `OpenAI request failed with ${openaiResponse.status}`;
    throw new Error(message);
  }

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

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
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

  const data = await openaiResponse.json().catch(() => ({}));
  if (!openaiResponse.ok) {
    const message = data?.error?.message ?? `OpenAI request failed with ${openaiResponse.status}`;
    throw new Error(message);
  }

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

const uploadYouTubeVideo = async ({job, body}) => {
  const accessToken = await getYouTubeAccessToken(job.channelProfile);
  const youtube = body.youtube ?? {};
  const filePath = await resolveRenderedVideoPath({
    outputName: body.outputName ?? job.outputName,
    renderPath: body.renderPath,
  });
  const shortsCheck = await inspectVideoForShorts(filePath);
  if (!shortsCheck.eligible) {
    throw new Error(
      `Rendered video is not eligible for Shorts: ${shortsCheck.width}x${shortsCheck.height}, ${Number.isFinite(shortsCheck.duration) ? `${shortsCheck.duration.toFixed(1)}s` : 'unknown duration'}. Use a vertical video under 60 seconds.`
    );
  }
  const youtubeFooter = await loadYouTubeDescriptionFooter(job.languageProfile);
  const notifySubscribers = body.notifySubscribers === true;
  const hasPaidProductPlacement = body.hasPaidProductPlacement !== false;
  const shortsMetadata = ensureShortsMetadata({
    title: youtube.title ?? body.title,
    description: hasPaidProductPlacement
      ? appendYouTubeDescriptionFooter({
          description: youtube.description ?? body.description,
          footer: youtubeFooter,
        })
      : stripYouTubeCouponBlock(
          appendYouTubeDescriptionFooter({
            description: youtube.description ?? body.description,
            footer: youtubeFooter,
          })
        ),
    tags: youtube.tags ?? body.tags,
  });
  const title = compactText(shortsMetadata.title, 100);
  const description = shortsMetadata.description;
  const tags = shortsMetadata.tags;
  const privacyStatus = String(
    body.privacyStatus ?? process.env.YOUTUBE_PRIVACY_STATUS ?? 'private'
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
      privacyStatus: allowedPrivacyStatuses.has(privacyStatus) ? privacyStatus : 'private',
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
    shortsUrl: data.id ? `https://www.youtube.com/shorts/${data.id}` : '',
    privacyStatus: metadata.status.privacyStatus,
    notifySubscribers,
    hasPaidProductPlacement,
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
