import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import {execFile} from 'node:child_process';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {promisify} from 'node:util';
import {
  deriveFootballRoundLabel,
  footballLanguageProfiles,
  getFootballDefaultCta,
  getFootballIntroDefaults,
  getFootballCopy,
  resolveFootballDisplayLabel,
} from './football-copy.mjs';

export const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const generatedDir = path.join(projectRoot, 'src', 'data', 'generated');
const logosDir = path.join(projectRoot, 'public', 'logos');
const voiceoversDir = path.join(projectRoot, 'public', 'voiceovers', 'football');
const currentJobFile = path.join(generatedDir, 'current-job.football.json');
const footballPredictionsLongJobFile = path.join(
  generatedDir,
  'current-job.football.predictions-long.json'
);
const leagueConfigDir = path.join(projectRoot, 'config', 'leagues');
const teamNameAliasesFile = path.join(projectRoot, 'config', 'football-team-name-aliases.json');
const teamAccentColorsFile = path.join(projectRoot, 'config', 'football-team-accent-colors.json');
const worldCupConfigFile = path.join(projectRoot, 'config', 'world-cup', 'groups.json');

export {footballLanguageProfiles};

export const footballChannelProfiles = [
  {value: 'pt', label: 'Portuguese Channel', languageProfile: 'pt-br'},
  {value: 'en', label: 'English Channel', languageProfile: 'en'},
];

const soundtrackLabelOverrides = {
  'fun-vibe-dyalla.mp3': 'Fun Vibe - Dyalla',
  'get-tough-tracktribe.mp3': 'Get Tough - TrackTribe',
  'final-whistle-rise-premier-league.mp3': 'Final Whistle Rise - Premier League',
  'final-whistle-fever-latin-leagues.mp3': 'Final Whistle Fever - Latin Leagues',
  'gol-de-arena.mp3': 'Gol de Arena',
  'gol-de-hoje.mp3': 'Gol de Hoje',
  'gol-de-impacto.mp3': 'Gol de Impacto',
  'gol-na-pressao.mp3': 'Gol na Pressão',
  'gridiron-clash-1.mp3': 'Gridiron Clash (1)',
  'gridiron-surge-1.mp3': 'Gridiron Surge (1)',
  'Champions - The Anthem plays.mp3': 'Champions - The Anthem Plays',
  'Lega Serie A  - The whole ground shakes.mp3': 'Lega Serie A - The Whole Ground Shakes',
  'La lIga.mp3': 'La Liga',
};

const preferredFootballSoundtracks = [
  'gol-na-pressao.mp3',
  'fun-vibe-dyalla.mp3',
  'get-tough-tracktribe.mp3',
  'final-whistle-rise-premier-league.mp3',
  'final-whistle-fever-latin-leagues.mp3',
];

const toSoundtrackLabel = (filename) => {
  if (soundtrackLabelOverrides[filename]) return soundtrackLabelOverrides[filename];
  const rawLabel = filename
    .replace(/\.mp3$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
  if (rawLabel.includes(' ') || rawLabel.includes(' - ')) return rawLabel;
  return rawLabel
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (word) => word.toLowerCase());
};

const listSoundtrackPresets = (folder, publicPrefix, preferred = []) => {
  const audioDir = path.join(projectRoot, 'public', 'audio', folder);
  if (!fsSync.existsSync(audioDir)) return [];
  const filenames = fsSync
    .readdirSync(audioDir)
    .filter((filename) => filename.toLowerCase().endsWith('.mp3'));
  const preferredSet = new Set(preferred);
  const ordered = [
    ...preferred.filter((filename) => filenames.includes(filename)),
    ...filenames.filter((filename) => !preferredSet.has(filename)).sort((a, b) => a.localeCompare(b)),
  ];
  return ordered.map((filename) => ({
    value: `${publicPrefix}/${filename}`,
    label: toSoundtrackLabel(filename),
  }));
};

export const footballSoundtrackPresets = listSoundtrackPresets(
  'football',
  '/audio/football',
  preferredFootballSoundtracks
);

const defaultFootballSoundtrack = footballSoundtrackPresets[0];
const FOOTBALL_DURATION_IN_FRAMES = 270;
const execFileAsync = promisify(execFile);

export const templates = [
  {value: 'results', label: 'Last Round Results'},
  {value: 'next-games', label: 'Next Games / Upcoming Fixtures'},
  {value: 'standings', label: 'Standings'},
  {value: 'season-final-verdict', label: 'Season Wrap-up'},
  {value: 'champion-final', label: 'Champion Final'},
  {value: 'top-scorers', label: 'Artilheiros / Top Scorers'},
  {value: 'player-of-round', label: 'Craque da Rodada / Player of the Round'},
  {value: 'championship-pace', label: 'Championship Pace'},
  {value: 'relegation-line', label: 'Relegation Line'},
  {value: 'tierlist', label: 'Tierlist'},
  {value: 'continental-groups-standings', label: 'Continental Groups Standings'},
  {value: 'predictions', label: 'Predictions'},
  {value: 'round-summary-long', label: 'Resumo da Rodada Longform'},
  {value: 'world-cup-group-standings', label: 'World Cup Group Standings'},
  {value: 'world-cup-knockout', label: 'World Cup Knockout'},
];

export const leaguePresets = [
  {label: 'Brasileirão Série A', leagueId: 71, channels: ['pt']},
  {label: 'Brasileirão Série B', leagueId: 72, channels: ['pt']},
  {label: 'Copa do Brasil', leagueId: 73, channels: ['pt']},
  {label: 'Copa do Nordeste', leagueId: 612, channels: ['pt']},
  {label: 'Brasileirão Série C', leagueId: 75, channels: ['pt']},
  {label: 'Brasileirão Série D', leagueId: 76, channels: ['pt']},
  {label: 'Brasileirão Sub-20', leagueId: 740, channels: ['pt']},
  {label: 'Brasileirão Sub-17', leagueId: 1128, channels: ['pt']},
  {label: 'Copa do Brasil Sub-17', leagueId: 1179, channels: ['pt']},
  {label: 'Copa São Paulo', leagueId: 618, channels: ['pt']},
  {label: 'Copa Libertadores', leagueId: 13, channels: ['pt']},
  {label: 'Copa Sulamericana', leagueId: 11, channels: ['pt']},
  {label: 'Copa do Mundo', leagueId: 1, channels: ['pt']},
  {label: 'World Cup', leagueId: 1, channels: ['en']},
  {label: 'Premier League', leagueId: 39, channels: ['en']},
  {label: 'FA Cup', leagueId: 45, channels: ['en']},
  {label: 'Championship', leagueId: 40, channels: ['en']},
  {label: 'La Liga', leagueId: 140, channels: ['en']},
  {label: 'Serie A', leagueId: 135, channels: ['en']},
  {label: 'Bundesliga', leagueId: 78, channels: ['en']},
  {label: 'Ligue 1', leagueId: 61, channels: ['en']},
  {label: 'Coupe de France', leagueId: 66, channels: ['en']},
  {label: 'Saudi Pro League', leagueId: 307, channels: ['en']},
  {label: 'Champions League', leagueId: 2, channels: ['en']},
  {label: 'Europa League', leagueId: 3, channels: ['en']},
  {label: 'Conference League', leagueId: 848, channels: ['en']},
  {label: 'Custom league', leagueId: null, channels: ['pt', 'en']},
];

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);
const UPCOMING_STATUSES = new Set(['NS', 'TBD']);

const sanitize = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseYamlScalar = (value) => {
  const trimmed = String(value ?? '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const parseSimpleYaml = (source) => {
  const lines = String(source ?? '').replace(/\r\n/g, '\n').split('\n');
  const result = {};
  let index = 0;

  const readBlock = (baseIndent) => {
    const blockLines = [];
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        blockLines.push('');
        index += 1;
        continue;
      }

      const indent = line.match(/^ */)?.[0].length ?? 0;
      if (indent <= baseIndent) break;
      blockLines.push(line.slice(baseIndent + 2));
      index += 1;
    }

    return blockLines.join('\n').trim();
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      index += 1;
      continue;
    }

    const rootMatch = line.match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/);
    if (!rootMatch) {
      throw new Error(`Invalid YAML near line ${index + 1}: ${line}`);
    }

    const [, key, rawValue = ''] = rootMatch;
    if (key !== 'matches') {
      result[key] = parseYamlScalar(rawValue);
      index += 1;
      continue;
    }

    index += 1;
    const matches = [];
    while (index < lines.length) {
      const itemLine = lines[index];
      if (!itemLine.trim()) {
        index += 1;
        continue;
      }

      if (!itemLine.startsWith('  - ')) break;
      const item = {};
      const firstField = itemLine.slice(4);
      index += 1;
      if (firstField.trim()) {
        const fieldMatch = firstField.match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/);
        if (!fieldMatch) {
          throw new Error(`Invalid match field near line ${index}: ${itemLine}`);
        }
        item[fieldMatch[1]] = parseYamlScalar(fieldMatch[2] ?? '');
      }

      while (index < lines.length) {
        const fieldLine = lines[index];
        if (!fieldLine.trim()) {
          index += 1;
          continue;
        }
        if (fieldLine.startsWith('  - ') || !fieldLine.startsWith('    ')) break;

        const fieldMatch = fieldLine.slice(4).match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/);
        if (!fieldMatch) {
          throw new Error(`Invalid match field near line ${index + 1}: ${fieldLine}`);
        }

        const [, fieldKey, fieldValue = ''] = fieldMatch;
        index += 1;
        item[fieldKey] = fieldValue.trim() === '|' ? readBlock(4) : parseYamlScalar(fieldValue);
      }

      matches.push(item);
    }

    result.matches = matches;
  }

  return result;
};

const getGoogleVoiceConfig = (languageProfile) => {
  const isEnglish = languageProfile === 'en';
  const languageCode = isEnglish ? 'en-US' : 'pt-BR';
  const configuredName = isEnglish
    ? process.env.GOOGLE_TTS_EN_VOICE
    : process.env.GOOGLE_TTS_PT_BR_VOICE;

  return configuredName?.trim()
    ? {languageCode, name: configuredName.trim()}
    : {languageCode};
};

const createTtsError = (message, details) => {
  const error = new Error(message);
  error.errorType = 'tts_error';
  error.details = details;
  return error;
};

const generateGoogleVoiceover = async ({
  text,
  languageProfile,
}) => {
  const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();

  if (!apiKey) {
    throw createTtsError(
      'Missing GOOGLE_TTS_API_KEY. Add it to .env to generate football voiceovers.',
      {envVar: 'GOOGLE_TTS_API_KEY'}
    );
  }

  const voice = getGoogleVoiceConfig(languageProfile);
  const speakingRate = 1.12;
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify({text, languageProfile, voice, speakingRate}))
    .digest('hex')
    .slice(0, 16);
  const filename = `${languageProfile}-${hash}.mp3`;
  const destination = path.join(voiceoversDir, filename);

  try {
    await fs.access(destination);
    return `/voiceovers/football/${filename}`;
  } catch {
    // Continue and synthesize the missing cached file.
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {'content-type': 'application/json; charset=utf-8'},
      body: JSON.stringify({
        input: {text},
        voice,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch: 0,
        },
      }),
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.audioContent) {
    throw createTtsError('Google Text-to-Speech failed while generating football voiceover.', {
      status: response.status,
      statusText: response.statusText,
      payload,
    });
  }

  await fs.writeFile(destination, Buffer.from(payload.audioContent, 'base64'));
  return `/voiceovers/football/${filename}`;
};

const compactColdOpenClubName = (value) => {
  const name = String(value ?? '').trim();
  if (!name) {
    return 'TBC';
  }

  return name
    .replace(/\bFootball Club\b/gi, 'FC')
    .replace(/\bFutebol Clube\b/gi, 'FC')
    .replace(/\bAssociação\b/gi, 'Assoc.')
    .replace(/\bEsporte Clube\b/gi, 'EC')
    .slice(0, 18)
    .toUpperCase();
};

const compactColdOpenScore = (homeScore, awayScore, fallback = 'VS') => {
  const home = Number(homeScore);
  const away = Number(awayScore);

  if (Number.isFinite(home) && Number.isFinite(away)) {
    return `${home} - ${away}`;
  }

  return fallback;
};

const buildColdOpenRowsFromTeams = (teams, {pointsStart = 22} = {}) => {
  const seen = new Set();

  return teams
    .map((team) => compactColdOpenClubName(team))
    .filter((team) => {
      if (!team || seen.has(team)) {
        return false;
      }

      seen.add(team);
      return true;
    })
    .slice(0, 4)
    .map((club, index) => ({
      rank: index + 1,
      club,
      pts: Math.max(pointsStart - index * 2, 1),
    }));
};

const buildFootballColdOpenData = (job) => {
  if (Array.isArray(job.rows) && job.rows.length > 0) {
    return {
      tableRows: job.rows.slice(0, 4).map((row) => ({
        rank: row.rank,
        club: compactColdOpenClubName(row.team),
        pts: row.points,
      })),
    };
  }

  if (Array.isArray(job.fixtures) && job.fixtures.length > 0) {
    const matchRows = job.fixtures.slice(0, 4).map((fixture) => ({
      left: compactColdOpenClubName(fixture.homeTeam),
      center: compactColdOpenScore(
        fixture.homeScore,
        fixture.awayScore,
        job.template === 'predictions' ? 'PICK' : 'VS'
      ),
      right: compactColdOpenClubName(fixture.awayTeam),
    }));

    return {
      matchRows,
      tableRows: buildColdOpenRowsFromTeams(
        job.fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
      ),
    };
  }

  if (Array.isArray(job.entries) && job.entries.length > 0) {
    return {
      tableRows: buildColdOpenRowsFromTeams(job.entries.map((entry) => entry.team), {
        pointsStart: 10,
      }),
    };
  }

  if (Array.isArray(job.groups) && job.groups.length > 0) {
    const rows = job.groups.flatMap((group) => group.rows ?? []);

    return {
      tableRows: rows.slice(0, 4).map((row, index) => ({
        rank: row.rank ?? index + 1,
        club: compactColdOpenClubName(row.team),
        pts: row.points ?? 0,
      })),
    };
  }

  if (job.champion || Array.isArray(job.qualificationGroups) || job.relegationGroup) {
    const rows = [
      job.champion,
      ...(job.qualificationGroups ?? []).flatMap((group) => group.entries ?? []),
      ...(job.relegationGroup?.entries ?? []),
    ].filter(Boolean);

    return {
      tableRows: rows.slice(0, 4).map((row, index) => ({
        rank: row.rank ?? index + 1,
        club: compactColdOpenClubName(row.team),
        pts: row.points ?? Math.max(10 - index * 2, 1),
      })),
    };
  }

  if (job.championTeam) {
    return {
      tableRows: buildColdOpenRowsFromTeams([job.championTeam], {pointsStart: 1}),
    };
  }

  if (Array.isArray(job.matches) && job.matches.length > 0) {
    return {
      matchRows: job.matches.slice(0, 4).map((match) => ({
        left: compactColdOpenClubName(match.homeTeam),
        center: compactColdOpenScore(match.homeScore, match.awayScore),
        right: compactColdOpenClubName(match.awayTeam),
      })),
      tableRows: buildColdOpenRowsFromTeams(
        job.matches.flatMap((match) => [match.homeTeam, match.awayTeam])
      ),
    };
  }

  return undefined;
};

const addFootballIntroAndVoiceover = async (job, overrides = {}) => {
  const defaults = getFootballIntroDefaults({
    template: job.template,
    languageProfile: job.languageProfile,
    leagueName: job.leagueName,
    season: job.season,
    roundLabel:
      job.roundLabel ??
      job.standingsLabel ??
      job.subtitleLabel ??
      job.groupLabel ??
      job.phaseLabel,
    groupLetter: job.groupLetter,
    phaseLabel: job.phaseLabel,
  });
  const introTitle = overrides.introTitle?.trim() || defaults.introTitle;
  const introSubtitle = overrides.introSubtitle?.trim() || defaults.introSubtitle;
  const hookText = overrides.hookText?.trim() || defaults.hookText;
  const voiceoverText = overrides.voiceoverText?.trim() || defaults.voiceoverText;
  const voiceoverEnabled = overrides.voiceoverEnabled !== false;
  const voiceoverPath = voiceoverEnabled
    ? await generateGoogleVoiceover({
        text: voiceoverText,
        languageProfile: job.languageProfile ?? 'pt-br',
      })
    : undefined;

  return {
    ...job,
    introTitle,
    introSubtitle,
    hookText,
    coldOpenData: buildFootballColdOpenData(job),
    voiceoverEnabled,
    voiceoverText,
    voiceoverPath,
    voiceoverLabel: voiceoverEnabled ? voiceoverText : undefined,
  };
};

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const teamShortLabel = (name) => {
  const cleaned = String(name ?? '')
    .replace(/\b(futebol clube|football club|sport club|sociedade esportiva|associacao atletica)\b/gi, '')
    .replace(/\b(fc|sc|ec|ac|afc|cf|u20)\b/gi, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const source = cleaned || String(name ?? '').trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 4).toUpperCase();
  }

  return parts
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

const ensureDirectories = async () => {
  await fs.mkdir(generatedDir, {recursive: true});
  await fs.mkdir(logosDir, {recursive: true});
  await fs.mkdir(voiceoversDir, {recursive: true});
};

const readJsonFile = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const getTemplateJobFile = (template) =>
  path.join(generatedDir, `current-job.football.${template}.json`);

const writeFootballJobFiles = async (job) => {
  const payload = `${JSON.stringify(job, null, 2)}\n`;
  await fs.writeFile(currentJobFile, payload, 'utf8');
  await fs.writeFile(getTemplateJobFile(job.template), payload, 'utf8');
};

const loadWorldCupConfig = async () => readJsonFile(worldCupConfigFile);

const normalizeGroupName = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const worldCupCountryTranslationsPt = {
  algeria: 'Argélia',
  argentina: 'Argentina',
  australia: 'Austrália',
  austria: 'Áustria',
  belgium: 'Bélgica',
  'bosnia herzogovina': 'Bosnia',
  'bosnia and herzogovina': 'Bosnia',
  'bosnia herzogovinia': 'Bosnia',
  'bosnia and herzogovinia': 'Bosnia',
  'bosnia herzegovina': 'Bosnia',
  'bosnia and herzegovina': 'Bosnia',
  'bosnia herzegovinia': 'Bosnia',
  'bosnia and herzegovinia': 'Bosnia',
  brazil: 'Brasil',
  'cabo verde': 'Cabo Verde',
  'cape verde': 'Cabo Verde',
  'cape verde islands': 'Cabo Verde',
  canada: 'Canadá',
  colombia: 'Colômbia',
  'congo dr': 'Congo',
  'cote d ivoire': 'C. do Marfim',
  "cote d'ivoire": 'C. do Marfim',
  'ivory coast': 'C. do Marfim',
  croatia: 'Croácia',
  curacao: 'Curaçao',
  'czech republic': 'Rep. Tcheca',
  czechia: 'Rep. Tcheca',
  'dr congo': 'Congo',
  ecuador: 'Equador',
  egypt: 'Egito',
  england: 'Inglaterra',
  france: 'França',
  germany: 'Alemanha',
  ghana: 'Gana',
  haiti: 'Haiti',
  'ir iran': 'Irã',
  iran: 'Irã',
  iraq: 'Iraque',
  japan: 'Japão',
  jordan: 'Jordânia',
  'korea republic': 'Coreia do Sul',
  'republic of korea': 'Coreia do Sul',
  'south korea': 'Coreia do Sul',
  mexico: 'México',
  morocco: 'Marrocos',
  netherlands: 'Holanda',
  'new zealand': 'Nova Zelândia',
  norway: 'Noruega',
  panama: 'Panamá',
  paraguay: 'Paraguai',
  portugal: 'Portugal',
  qatar: 'Catar',
  'saudi arabia': 'Arábia Saudita',
  scotland: 'Escócia',
  senegal: 'Senegal',
  'south africa': 'África do Sul',
  spain: 'Espanha',
  switzerland: 'Suíça',
  sweden: 'Suécia',
  tunisia: 'Tunísia',
  turkey: 'Turquia',
  turkiye: 'Turquia',
  türkiye: 'Turquia',
  uruguay: 'Uruguai',
  usa: 'EUA',
  'united states': 'EUA',
  uzbekistan: 'Uzbequistão',
};

const translateWorldCupCountryName = (teamName, languageProfile = 'pt-br') => {
  const name = String(teamName ?? '').trim();
  if (languageProfile === 'en' || !name) {
    return name;
  }

  const playoffMatch = name.match(/^winner\s+playoff\s+([a-z])$/i);
  if (playoffMatch) {
    return `Vencedor da Repescagem ${playoffMatch[1].toUpperCase()}`;
  }

  return worldCupCountryTranslationsPt[normalizeTeamAliasKey(name)] ?? name;
};

const shouldTranslateWorldCupCountryNames = (leagueId, languageProfile = 'pt-br') =>
  Number(leagueId) === 1 && languageProfile !== 'en';

const resolveFixtureVideoTeamName = (teamName, leagueId, languageProfile = 'pt-br') =>
  shouldTranslateWorldCupCountryNames(leagueId, languageProfile)
    ? translateWorldCupCountryName(teamName, languageProfile)
    : teamName;

const normalizeTeamAliasKey = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getWorldCupGroupKey = (groupName) => {
  const match = String(groupName ?? '').match(/group\s+([a-z])/i);
  return match ? match[1].toUpperCase() : null;
};

const getWorldCupStandingTeamKey = (row) =>
  row?.team?.id ? `id:${row.team.id}` : `name:${normalizeGroupName(row?.team?.name)}`;

const getBestWorldCupThirdPlaceKeys = (standingsGroups) => {
  const thirdPlaceRows = (standingsGroups ?? [])
    .map((groupRows) => (groupRows ?? []).find((row) => row?.rank === 3) ?? groupRows?.[2])
    .filter((row) => row && Number(row?.all?.played ?? 0) > 0);

  return new Set(
    thirdPlaceRows
      .sort((left, right) => {
        const pointsGap = Number(right?.points ?? 0) - Number(left?.points ?? 0);
        if (pointsGap !== 0) {
          return pointsGap;
        }

        const goalDifferenceGap = Number(right?.goalsDiff ?? 0) - Number(left?.goalsDiff ?? 0);
        if (goalDifferenceGap !== 0) {
          return goalDifferenceGap;
        }

        const goalsGap = Number(right?.all?.goals?.for ?? 0) - Number(left?.all?.goals?.for ?? 0);
        if (goalsGap !== 0) {
          return goalsGap;
        }

        return getWorldCupStandingTeamKey(left).localeCompare(getWorldCupStandingTeamKey(right));
      })
      .slice(0, 8)
      .map(getWorldCupStandingTeamKey)
  );
};

const mergeLeagueConfig = (baseConfig, overrideConfig) => ({
  ...baseConfig,
  ...overrideConfig,
  standings: {
    ...baseConfig?.standings,
    ...overrideConfig?.standings,
    safeArea: {
      ...baseConfig?.standings?.safeArea,
      ...overrideConfig?.standings?.safeArea,
    },
    zones: overrideConfig?.standings?.zones ?? baseConfig?.standings?.zones ?? [],
  },
});

const loadLeagueConfig = async (leagueId) => {
  const defaultConfig = await readJsonFile(path.join(leagueConfigDir, 'default.json'));

  try {
    const overrideConfig = await readJsonFile(path.join(leagueConfigDir, `${leagueId}.json`));
    return mergeLeagueConfig(defaultConfig, overrideConfig);
  } catch {
    return defaultConfig;
  }
};

const loadTeamNameAliases = async () => {
  try {
    const aliasesConfig = await readJsonFile(teamNameAliasesFile);
    const normalizeAliasMap = (aliases = {}) =>
      Object.fromEntries(
        Object.entries(aliases).map(([key, value]) => [normalizeTeamAliasKey(key), value])
      );

    return {
      global: normalizeAliasMap(aliasesConfig.global),
      leagues: Object.fromEntries(
        Object.entries(aliasesConfig.leagues ?? {}).map(([leagueId, aliases]) => [
          leagueId,
          normalizeAliasMap(aliases),
        ])
      ),
    };
  } catch {
    return {global: {}, leagues: {}};
  }
};

const loadTeamAccentColors = async () => {
  try {
    const accentConfig = await readJsonFile(teamAccentColorsFile);
    const normalizeAccentMap = (accents = {}) =>
      Object.fromEntries(
        Object.entries(accents)
          .filter(([, value]) => isHexColor(value))
          .map(([key, value]) => [normalizeTeamAliasKey(key), String(value).trim()])
      );

    return {
      global: normalizeAccentMap(accentConfig.global),
      leagues: Object.fromEntries(
        Object.entries(accentConfig.leagues ?? {}).map(([leagueId, accents]) => [
          leagueId,
          normalizeAccentMap(accents),
        ])
      ),
    };
  } catch {
    return {global: {}, leagues: {}};
  }
};

const youthLeagueIds = new Set([740, 1128, 1179]);

const stripYouthTeamSuffix = (teamName) =>
  String(teamName ?? '')
    .replace(/\b(?:u|sub[-\s]?)(?:17|20)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const resolveDisplayTeamName = (teamName, leagueId, aliasesConfig) => {
  const aliasKey = normalizeTeamAliasKey(teamName);
  const leagueAliases = aliasesConfig?.leagues?.[String(leagueId)] ?? {};
  const globalAliases = aliasesConfig?.global ?? {};

  return leagueAliases[aliasKey] ?? globalAliases[aliasKey] ?? teamName;
};

const resolveVideoTeamName = (teamName, leagueId, aliasesConfig) => {
  const displayName = resolveDisplayTeamName(teamName, leagueId, aliasesConfig);

  if (!youthLeagueIds.has(Number(leagueId))) {
    return displayName;
  }

  return stripYouthTeamSuffix(displayName);
};

const resolveVideoTeamNames = (apiTeamName, leagueId, aliasesConfig) => {
  const apiDisplayName = resolveDisplayTeamName(apiTeamName, leagueId, aliasesConfig);

  return {
    apiDisplayName,
    videoDisplayName: youthLeagueIds.has(Number(leagueId))
      ? stripYouthTeamSuffix(apiDisplayName)
      : apiDisplayName,
  };
};

const fetchJson = async (url, apiKey, apiHost) => {
  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
      'x-apisports-host': apiHost,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}\n${body}`);
  }

  return response.json();
};

const getFootballDateBucketTimeZone = (languageProfile = 'pt-br') =>
  languageProfile === 'pt-br' ? 'America/Sao_Paulo' : undefined;

const getFixtureDateKey = (fixture, languageProfile = 'pt-br') => {
  const fixtureDate = fixture.fixture?.date;
  if (!fixtureDate) {
    return null;
  }

  const timeZone = getFootballDateBucketTimeZone(languageProfile);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(timeZone ? {timeZone} : {}),
  }).format(new Date(fixtureDate));
};

export const loadLeagueRounds = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
}) => {
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_API_KEY.');
  }

  if (!Number.isFinite(leagueId) || !Number.isFinite(season)) {
    throw new Error('League ID and season are required to load rounds.');
  }

  const payload = await fetchJson(
    `https://${apiHost}/fixtures/rounds?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );

  return Array.isArray(payload.response) ? payload.response : [];
};

export const loadRoundDates = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
  round,
  languageProfile = 'pt-br',
}) => {
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_API_KEY.');
  }

  if (!Number.isFinite(leagueId) || !Number.isFinite(season) || !round?.trim()) {
    return [];
  }

  const payload = await fetchJson(
    `https://${apiHost}/fixtures?league=${leagueId}&season=${season}&round=${encodeURIComponent(
      round.trim()
    )}`,
    apiKey,
    apiHost
  );

  return [
    ...new Set(
      (payload.response ?? [])
        .map((fixture) => getFixtureDateKey(fixture, languageProfile))
        .filter(Boolean)
    ),
  ].sort((left, right) => left.localeCompare(right));
};

const isAutoStandingsLabel = (label) => {
  const normalized = String(label ?? '')
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  return (
    !normalized ||
    ['current table', 'classificacao atual', 'classificacao', 'tabela', 'tabela atual'].includes(
      normalized
    )
  );
};

const resolveDefaultStandingsLabel = async ({
  apiKey,
  apiHost,
  leagueId,
  season,
  languageProfile,
}) => {
  const fallback = languageProfile === 'en' ? 'Current Table' : 'Classificação Atual';

  try {
    const payload = await fetchJson(
      `https://${apiHost}/fixtures?league=${leagueId}&season=${season}`,
      apiKey,
      apiHost
    );
    const fixtures = Array.isArray(payload.response) ? payload.response : [];
    const latestFinishedRound = pickLatestFinishedRound(fixtures);

    if (!latestFinishedRound) {
      return fallback;
    }

    return deriveFootballRoundLabel('standings', latestFinishedRound, languageProfile);
  } catch {
    return fallback;
  }
};

const isYouthLogoFilename = (filename) =>
  /(?:^|-)(?:u17|u20|sub-?17|sub-?20)(?:-|\.|$)/i.test(filename);

const cachedTeamLogoAliases = {
  'c do marfim': ['Ivory Coast'],
  'cote d ivoire': ['Ivory Coast'],
  'ivory coast': ["Cote d'Ivoire"],
};

const findCachedTeamLogo = (teamName, {excludeYouth = false} = {}) => {
  const normalizedName = normalizeTeamAliasKey(teamName);
  const slugs = [
    sanitize(teamName),
    ...(cachedTeamLogoAliases[normalizedName] ?? []).map((alias) => sanitize(alias)),
  ].filter(Boolean);

  if (!slugs.length || !fsSync.existsSync(logosDir)) {
    return undefined;
  }

  const filenames = fsSync
    .readdirSync(logosDir)
    .filter((item) => !excludeYouth || !isYouthLogoFilename(item));
  const filename = slugs
    .map(
      (slug) =>
        filenames.find((item) => item === `${slug}.png`) ??
        filenames.find((item) => item.startsWith(`${slug}-`) && item.toLowerCase().endsWith('.png'))
    )
    .find(Boolean);

  return filename ? `/logos/${filename}` : undefined;
};

const professionalLogoNameCandidates = (teamName, leagueId, aliasesConfig) => {
  const baseName = stripYouthTeamSuffix(teamName);
  if (!baseName) {
    return [];
  }

  const aliasName = resolveDisplayTeamName(baseName, leagueId, aliasesConfig);
  const candidates = [
    baseName,
    aliasName,
    baseName.replace(/\bRJ\b/i, '').trim(),
    baseName.replace(/\bAthletico\s+PR\b/i, 'Atletico Paranaense'),
    baseName.replace(/\bAthletico-PR\b/i, 'Atletico Paranaense'),
    baseName.replace(/\bAtletico\s+Mineiro\b/i, 'Atletico MG'),
    baseName.replace(/\bAtl[eé]tico\s+Mineiro\b/i, 'Atletico MG'),
    baseName.replace(/\bAmerica\s+MG\b/i, 'America Mineiro'),
    baseName.replace(/\bAm[eé]rica\s+MG\b/i, 'America Mineiro'),
    baseName.replace(/\bFlamengo\s+RJ\b/i, 'Flamengo'),
  ];

  const normalizedCandidates = candidates.flatMap((name) => [
    name,
    name.replace(/\bAthletico[-\s]+PR\b/i, 'Atletico Paranaense'),
    name.replace(/\bAtl[eé]tico[-\s]+PR\b/i, 'Atletico Paranaense'),
    name.replace(/\bAtletico[-\s]+PR\b/i, 'Atletico Paranaense'),
  ]);

  return [...new Set(normalizedCandidates.map((name) => name.trim()).filter(Boolean))];
};

const findYouthProfessionalLogo = ({apiTeamName, displayTeamName, leagueId, aliasesConfig}) => {
  if (!youthLeagueIds.has(Number(leagueId))) {
    return undefined;
  }

  const candidates = [
    ...professionalLogoNameCandidates(displayTeamName, leagueId, aliasesConfig),
    ...professionalLogoNameCandidates(apiTeamName, leagueId, aliasesConfig),
  ];

  for (const candidate of candidates) {
    const logoPath = findCachedTeamLogo(candidate, {excludeYouth: true});
    if (logoPath) {
      return logoPath;
    }
  }

  return undefined;
};

const downloadLogo = async (url, teamName) => {
  if (!url) {
    return undefined;
  }

  const logoUrl = new URL(url);
  const extension = path.extname(logoUrl.pathname) || '.png';
  const sourceLogoId = sanitize(path.basename(logoUrl.pathname, extension));
  const filename = `${sanitize(teamName)}${sourceLogoId ? `-${sourceLogoId}` : ''}${extension}`;
  const destination = path.join(logosDir, filename);

  try {
    await fs.access(destination);
    return `/logos/${filename}`;
  } catch {
    // Not cached yet.
  }

  const response = await fetch(url);
  if (!response.ok) {
    return undefined;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  return `/logos/${filename}`;
};

const resolveTeamLogo = async ({
  logoUrl,
  apiTeamName,
  displayTeamName,
  leagueId,
  aliasesConfig,
}) => {
  const youthProfessionalLogo = findYouthProfessionalLogo({
    apiTeamName,
    displayTeamName,
    leagueId,
    aliasesConfig,
  });

  if (youthProfessionalLogo) {
    return youthProfessionalLogo;
  }

  return (
    (await downloadLogo(logoUrl, apiTeamName)) ??
    findCachedTeamLogo(displayTeamName) ??
    findCachedTeamLogo(apiTeamName)
  );
};


const formatFootballSeasonDisplay = ({season, languageProfile = 'pt-br'}) => {
  const numericSeason = Number(season);

  if (languageProfile === 'en' && Number.isFinite(numericSeason)) {
    return `${numericSeason}/${String(numericSeason + 1).slice(-2)}`;
  }

  return String(season);
};

const getLeagueNameWithSeason = (leagueName, season, languageProfile = 'pt-br') =>
  `${leagueName} ${formatFootballSeasonDisplay({season, languageProfile})}`;

const groupByRound = (fixtures, filterFn) => {
  const grouped = new Map();
  for (const fixture of fixtures.filter(filterFn)) {
    const round = fixture.league?.round;
    if (!round) continue;
    const list = grouped.get(round) ?? [];
    list.push(fixture);
    grouped.set(round, list);
  }
  return grouped;
};

const pickLatestFinishedRound = (fixtures) => {
  const grouped = groupByRound(fixtures, (fixture) =>
    FINISHED_STATUSES.has(fixture.fixture?.status?.short)
  );
  const entries = [...grouped.entries()].filter(([, roundFixtures]) => roundFixtures.length > 0);
  entries.sort((a, b) => {
    const aMax = Math.max(...a[1].map((fixture) => fixture.fixture?.timestamp ?? 0));
    const bMax = Math.max(...b[1].map((fixture) => fixture.fixture?.timestamp ?? 0));
    return bMax - aMax;
  });
  return entries[0]?.[0];
};

const pickNextUpcomingRound = (fixtures) => {
  const now = Date.now() / 1000;
  const grouped = groupByRound(fixtures, (fixture) => {
    const short = fixture.fixture?.status?.short;
    const timestamp = fixture.fixture?.timestamp ?? 0;
    return UPCOMING_STATUSES.has(short) || timestamp > now;
  });
  const entries = [...grouped.entries()].filter(([, roundFixtures]) => roundFixtures.length > 0);
  entries.sort((a, b) => {
    const aMin = Math.min(...a[1].map((fixture) => fixture.fixture?.timestamp ?? Number.MAX_SAFE_INTEGER));
    const bMin = Math.min(...b[1].map((fixture) => fixture.fixture?.timestamp ?? Number.MAX_SAFE_INTEGER));
    return aMin - bMin;
  });
  return entries[0]?.[0];
};

const parsePredictionScore = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return null;
  }

  return Math.max(0, Math.round(normalized));
};

const normalizeMatchDateSelection = ({matchDate, matchDates}) => {
  const rawValues = [
    ...(Array.isArray(matchDates) ? matchDates : [matchDates]),
    ...(Array.isArray(matchDate) ? matchDate : [matchDate]),
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

const buildPredictionEditMap = (predictionEdits) => {
  const editMap = new Map();

  if (!Array.isArray(predictionEdits)) {
    return editMap;
  }

  for (const edit of predictionEdits) {
    const fixtureId = Number(edit?.fixtureId);
    if (!Number.isFinite(fixtureId)) {
      continue;
    }

    editMap.set(fixtureId, {
      homeScore: parsePredictionScore(edit?.homeScore),
      awayScore: parsePredictionScore(edit?.awayScore),
      homeEliminated: Boolean(edit?.homeEliminated),
      awayEliminated: Boolean(edit?.awayEliminated),
      hasPenalties: Boolean(edit?.hasPenalties),
      homePenaltyScore: parsePredictionScore(edit?.homePenaltyScore),
      awayPenaltyScore: parsePredictionScore(edit?.awayPenaltyScore),
    });
  }

  return editMap;
};

const fetchPredictionSuggestion = async ({fixtureId, apiKey, apiHost}) => {
  if (!Number.isFinite(fixtureId)) {
    return {homeScore: null, awayScore: null, source: 'manual'};
  }

  try {
    const payload = await fetchJson(
      `https://${apiHost}/predictions?fixture=${fixtureId}`,
      apiKey,
      apiHost
    );
    const prediction = payload.response?.[0]?.predictions;
    const homeScore = parsePredictionScore(prediction?.goals?.home);
    const awayScore = parsePredictionScore(prediction?.goals?.away);

    return {
      homeScore,
      awayScore,
      source: homeScore !== null && awayScore !== null ? 'api' : 'manual',
    };
  } catch {
    return {homeScore: null, awayScore: null, source: 'manual'};
  }
};

const resolveTemplateFixtures = ({
  fixtures,
  template,
  round,
  matchDate,
  matchDates,
  languageProfile,
}) => {
  const detectedRound =
    round?.trim() ||
    (template === 'results' || template === 'champion-final'
      ? pickLatestFinishedRound(fixtures)
      : pickNextUpcomingRound(fixtures));

  if (!detectedRound) {
    throw new Error(`Could not detect a suitable round for template "${template}".`);
  }

  const normalizedMatchDates = normalizeMatchDateSelection({matchDate, matchDates});
  const normalizedMatchDateSet = new Set(normalizedMatchDates);
  const roundFixtures = fixtures.filter((fixture) => {
    if (fixture.league?.round !== detectedRound) {
      return false;
    }

    if (normalizedMatchDates.length === 0) {
      return true;
    }

    return normalizedMatchDateSet.has(getFixtureDateKey(fixture, languageProfile));
  });

  return {
    detectedRound,
    normalizedMatchDate: normalizedMatchDates.length === 1 ? normalizedMatchDates[0] : '',
    normalizedMatchDates,
    roundFixtures,
  };
};

const buildFixtures = async ({
  fixtures,
  template,
  leagueId,
  aliasesConfig,
  predictionEditMap = new Map(),
  fixtureEditMap = new Map(),
  apiKey,
  apiHost,
  languageProfile = 'pt-br',
}) => {
  const sorted = [...fixtures].sort((a, b) => (a.fixture?.timestamp ?? 0) - (b.fixture?.timestamp ?? 0));
  const cards = [];
  for (const fixture of sorted) {
    const apiHomeTeam = fixture.teams?.home?.name;
    const apiAwayTeam = fixture.teams?.away?.name;
    if (!apiHomeTeam || !apiAwayTeam) continue;

    const homeNames = resolveVideoTeamNames(apiHomeTeam, leagueId, aliasesConfig);
    const awayNames = resolveVideoTeamNames(apiAwayTeam, leagueId, aliasesConfig);
    const homeTeam = resolveFixtureVideoTeamName(
      homeNames.videoDisplayName,
      leagueId,
      languageProfile
    );
    const awayTeam = resolveFixtureVideoTeamName(
      awayNames.videoDisplayName,
      leagueId,
      languageProfile
    );
    const fixtureId = Number(fixture.fixture?.id);
    let predictedScores = {
      homeScore: null,
      awayScore: null,
      source: 'manual',
    };

    if (template === 'predictions') {
      const manualEdit = predictionEditMap.get(fixtureId);
      if (manualEdit) {
        predictedScores = {
          homeScore: manualEdit.homeScore,
          awayScore: manualEdit.awayScore,
          source: 'manual',
        };
      } else {
        predictedScores = await fetchPredictionSuggestion({fixtureId, apiKey, apiHost});
      }
    }

    const fixtureEdit = fixtureEditMap.get(fixtureId);

    cards.push({
      fixtureId,
      fixtureDateKey: getFixtureDateKey(fixture, languageProfile) ?? undefined,
      homeTeam,
      awayTeam,
      homeScore:
        template === 'predictions'
          ? predictedScores.homeScore
          : fixtureEdit?.homeScore ?? fixture.goals?.home ?? null,
      awayScore:
        template === 'predictions'
          ? predictedScores.awayScore
          : fixtureEdit?.awayScore ?? fixture.goals?.away ?? null,
      predictionSource: template === 'predictions' ? predictedScores.source : undefined,
      homeEliminated: fixtureEdit?.homeEliminated ?? false,
      awayEliminated: fixtureEdit?.awayEliminated ?? false,
      hasPenalties: fixtureEdit?.hasPenalties ?? false,
      homePenaltyScore: fixtureEdit?.hasPenalties ? fixtureEdit.homePenaltyScore : null,
      awayPenaltyScore: fixtureEdit?.hasPenalties ? fixtureEdit.awayPenaltyScore : null,
      homeBadge: {
        label: initials(homeTeam),
        logoPath: await resolveTeamLogo({
          logoUrl: fixture.teams?.home?.logo,
          apiTeamName: apiHomeTeam,
          displayTeamName: homeNames.apiDisplayName,
          leagueId,
          aliasesConfig,
        }),
      },
      awayBadge: {
        label: initials(awayTeam),
        logoPath: await resolveTeamLogo({
          logoUrl: fixture.teams?.away?.logo,
          apiTeamName: apiAwayTeam,
          displayTeamName: awayNames.apiDisplayName,
          leagueId,
          aliasesConfig,
        }),
      },
    });
  }
  return cards;
};

const pickChampionFinalFixture = (fixtureCards) => {
  const fixture = fixtureCards.find((card) => card.homeEliminated !== card.awayEliminated) ??
    fixtureCards.find(
      (card) =>
        card.hasPenalties &&
        card.homePenaltyScore !== null &&
        card.awayPenaltyScore !== null &&
        card.homePenaltyScore !== card.awayPenaltyScore
    ) ??
    fixtureCards.find(
      (card) =>
        card.homeScore !== null &&
        card.awayScore !== null &&
        card.homeScore !== card.awayScore
    );

  if (!fixture) {
    throw new Error(
      'Champion Final needs one decided fixture. Select the final result, edit its score or penalties, or mark the eliminated team.'
    );
  }

  return fixture;
};

const resolveChampionFromFixture = (fixture) => {
  if (fixture.homeEliminated !== fixture.awayEliminated) {
    return fixture.homeEliminated
      ? {team: fixture.awayTeam, badge: fixture.awayBadge}
      : {team: fixture.homeTeam, badge: fixture.homeBadge};
  }

  if (
    fixture.hasPenalties &&
    fixture.homePenaltyScore !== null &&
    fixture.awayPenaltyScore !== null &&
    fixture.homePenaltyScore !== fixture.awayPenaltyScore
  ) {
    return fixture.homePenaltyScore > fixture.awayPenaltyScore
      ? {team: fixture.homeTeam, badge: fixture.homeBadge}
      : {team: fixture.awayTeam, badge: fixture.awayBadge};
  }

  return Number(fixture.homeScore) > Number(fixture.awayScore)
    ? {team: fixture.homeTeam, badge: fixture.homeBadge}
    : {team: fixture.awayTeam, badge: fixture.awayBadge};
};

const normalizeChampionFinalSelection = (selection) => {
  const team = String(selection?.team ?? '').trim();
  const badgeLabel = String(selection?.badge?.label ?? team).trim();

  if (!team || !badgeLabel) {
    return undefined;
  }

  return {
    team,
    badge: {
      label: badgeLabel,
      logoPath: selection.badge?.logoPath,
      imagePath: selection.badge?.imagePath,
      accentColor: selection.badge?.accentColor,
      sublabel: selection.badge?.sublabel,
    },
  };
};

const loadChampionByStandingRank = async ({
  apiKey,
  apiHost,
  leagueId,
  season,
  rank,
  aliasesConfig,
}) => {
  const championRank = Number(rank);
  if (!Number.isFinite(championRank) || championRank <= 0) {
    return undefined;
  }

  const payload = await fetchJson(
    `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const standingsRows = flattenStandingsGroups(payload.response?.[0]?.league?.standings);
  const rows = await buildStandingsRows(standingsRows, leagueId, aliasesConfig);
  const champion = rows.find((row) => row.rank === championRank);

  return champion
    ? {
        team: champion.team,
        badge: champion.badge,
      }
    : undefined;
};

export const loadPredictionFixtures = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
  round,
  matchDate,
  matchDates,
  languageProfile = 'pt-br',
}) => {
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_API_KEY.');
  }

  const aliasesConfig = await loadTeamNameAliases();
  await ensureDirectories();

  const payload = await fetchJson(
    `https://${apiHost}/fixtures?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  const {detectedRound, normalizedMatchDate, normalizedMatchDates, roundFixtures} =
    resolveTemplateFixtures({
    fixtures,
    template: 'predictions',
    round,
    matchDate,
    matchDates,
    languageProfile,
  });

  const cards = await buildFixtures({
    fixtures: roundFixtures,
    template: 'predictions',
    leagueId,
    aliasesConfig,
    apiKey,
    apiHost,
    languageProfile,
  });

  return {
    round: detectedRound,
    matchDate: normalizedMatchDate || undefined,
    matchDates: normalizedMatchDates.length ? normalizedMatchDates : undefined,
    fixtures: cards,
  };
};

export const loadNextFixtures = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
  round,
  matchDate,
  matchDates,
  languageProfile = 'pt-br',
}) => {
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_API_KEY.');
  }

  const aliasesConfig = await loadTeamNameAliases();
  await ensureDirectories();

  const payload = await fetchJson(
    `https://${apiHost}/fixtures?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  const {detectedRound, normalizedMatchDate, normalizedMatchDates, roundFixtures} =
    resolveTemplateFixtures({
    fixtures,
    template: 'next-games',
    round,
    matchDate,
    matchDates,
    languageProfile,
  });

  const cards = await buildFixtures({
    fixtures: roundFixtures,
    template: 'next-games',
    leagueId,
    aliasesConfig,
    apiKey,
    apiHost,
    languageProfile,
  });

  return {
    round: detectedRound,
    matchDate: normalizedMatchDate || undefined,
    matchDates: normalizedMatchDates.length ? normalizedMatchDates : undefined,
    fixtures: cards,
  };
};

export const loadResultFixtures = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
  round,
  matchDate,
  matchDates,
  languageProfile = 'pt-br',
}) => {
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_API_KEY.');
  }

  const aliasesConfig = await loadTeamNameAliases();
  await ensureDirectories();

  const payload = await fetchJson(
    `https://${apiHost}/fixtures?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  const {detectedRound, normalizedMatchDate, normalizedMatchDates, roundFixtures} =
    resolveTemplateFixtures({
    fixtures,
    template: 'results',
    round,
    matchDate,
    matchDates,
    languageProfile,
  });

  const cards = await buildFixtures({
    fixtures: roundFixtures,
    template: 'results',
    leagueId,
    aliasesConfig,
    apiKey,
    apiHost,
    languageProfile,
  });

  return {
    round: detectedRound,
    matchDate: normalizedMatchDate || undefined,
    matchDates: normalizedMatchDates.length ? normalizedMatchDates : undefined,
    fixtures: cards,
  };
};

const buildStandingsRows = async (standingsResponse, leagueId, aliasesConfig) => {
  const rows = [];
  for (const row of standingsResponse) {
    const apiTeamName = row.team?.name;
    if (!apiTeamName) continue;

    const names = resolveVideoTeamNames(apiTeamName, leagueId, aliasesConfig);
    const teamName = names.videoDisplayName;

    rows.push({
      rank: row.rank,
      team: teamName,
      played: row.all?.played ?? 0,
      points: row.points ?? 0,
      goalDifference: row.goalsDiff ?? 0,
      form: row.form ?? '',
      badge: {
        label: initials(teamName),
        logoPath: await resolveTeamLogo({
          logoUrl: row.team?.logo,
          apiTeamName,
          displayTeamName: names.apiDisplayName,
          leagueId,
          aliasesConfig,
        }),
      },
    });
  }
  return rows;
};

const applyStandingEdits = (rows, standingEdits = []) => {
  if (!Array.isArray(standingEdits) || standingEdits.length === 0) {
    return rows;
  }

  const editsByOriginalRank = new Map(
    standingEdits
      .map((edit) => {
        const originalRank = Number(edit?.originalRank);
        return Number.isFinite(originalRank) ? [originalRank, edit] : null;
      })
      .filter(Boolean)
  );

  return rows
    .map((row) => {
      const edit = editsByOriginalRank.get(row.rank);
      if (!edit) {
        return row;
      }

      const nextRank = Number(edit.rank);
      const nextPlayed = Number(edit.played);
      const nextPoints = Number(edit.points);
      const nextGoalDifference = Number(edit.goalDifference);
      const nextTeam = String(edit.team ?? '').trim();

      return {
        ...row,
        rank: Number.isFinite(nextRank) ? nextRank : row.rank,
        team: nextTeam || row.team,
        played: Number.isFinite(nextPlayed) ? nextPlayed : row.played,
        points: Number.isFinite(nextPoints) ? nextPoints : row.points,
        goalDifference: Number.isFinite(nextGoalDifference)
          ? nextGoalDifference
          : row.goalDifference,
        form: String(edit.form ?? row.form ?? '').trim(),
      };
    })
    .sort((left, right) => left.rank - right.rank);
};

export const loadStandingsEditor = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
}) => {
  const aliasesConfig = await loadTeamNameAliases();
  const payload = await fetchJson(
    `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const league = payload.response?.[0]?.league;
  const standingsRows = flattenStandingsGroups(league?.standings);
  const rows = await buildStandingsRows(standingsRows, leagueId, aliasesConfig);

  return {
    leagueName: league?.name ?? `League ${leagueId}`,
    rows,
  };
};

const isRelegationZone = (zone = {}) => {
  const normalized = `${zone.key ?? ''} ${zone.label ?? ''}`.toLowerCase();
  if (normalized.includes('playoff') || normalized.includes('play-off')) {
    return false;
  }

  return (
    normalized.includes('rebaix') ||
    normalized.includes('releg') ||
    normalized.includes('bottom') ||
    normalized.includes('drop')
  );
};

const getVerdictZoneForRow = (row, zones = []) => {
  if (row.rank === 1) {
    return {
      key: 'champion',
      label: 'Champion',
    };
  }

  return zones.find((zone) => row.rank >= zone.start && row.rank <= zone.end) ?? null;
};

const getManualVerdictGroupDefinition = (key, languageProfile = 'pt-br', leagueConfig) => {
  const configuredZone = leagueConfig?.standings?.zones?.find((zone) => zone.key === key);

  if (configuredZone) {
    return {
      key: configuredZone.key,
      label: configuredZone.label,
      accentColor:
        configuredZone.textColor ?? configuredZone.accent ?? leagueConfig?.accentColor ?? '#F0A500',
    };
  }

  const fallbackGroups = {
    'relegation-playoff': {
      label: languageProfile === 'en' ? 'Relegation Playoff' : 'Playoff do Rebaixamento',
      accentColor: '#F5A134',
    },
    'stayed-up': {
      label: languageProfile === 'en' ? 'Stayed Up' : 'Permaneceu',
      accentColor: '#27AE60',
    },
  };
  const fallback = fallbackGroups[key] ?? {
    label: key,
    accentColor: leagueConfig?.accentColor ?? '#F0A500',
  };

  return {
    key,
    ...fallback,
  };
};

const normalizeSeasonFinalVerdictOverrides = (overrides = []) => {
  if (!Array.isArray(overrides)) {
    return new Map();
  }

  return new Map(
    overrides
      .map((override) => {
        const rank = Number(override?.rank);
        const status = String(override?.status ?? 'auto').trim();

        if (!Number.isFinite(rank) || !status || status === 'auto') {
          return null;
        }

        return [rank, status];
      })
      .filter(Boolean)
  );
};

const getRowsForZone = (rows, zone, {excludeChampion = false} = {}) =>
  rows.filter((row) => {
    if (excludeChampion && row.rank === 1) {
      return false;
    }

    return row.rank >= zone.start && row.rank <= zone.end;
  });

const buildSeasonFinalVerdictSections = ({
  rows,
  leagueConfig,
  languageProfile,
  verdictOverrides,
}) => {
  const overrideMap = normalizeSeasonFinalVerdictOverrides(verdictOverrides);
  const championOverride = rows.find((row) => overrideMap.get(row.rank) === 'champion');
  const champion = championOverride ?? rows[0];
  const zones = leagueConfig?.standings?.zones ?? [];
  const fallbackRelegationStart = Math.max(rows.length - 2, 1);
  const relegationZones = zones.filter(isRelegationZone);
  const continentalZones = zones.filter((zone) => !isRelegationZone(zone));
  const isRowAvailableForAutoGroup = (row) =>
    row.rank !== champion.rank && !overrideMap.has(row.rank);
  const qualificationGroups = continentalZones
    .map((zone) => ({
      key: zone.key,
      label: zone.label,
      accentColor: zone.textColor ?? zone.accent ?? leagueConfig?.accentColor ?? '#F0A500',
      entries: getRowsForZone(rows.filter(isRowAvailableForAutoGroup), zone, {
        excludeChampion: true,
      }),
    }))
    .filter((group) => group.entries.length > 0);
  const manualQualificationGroups = new Map();
  const manualRelegationEntries = [];

  for (const row of rows) {
    const status = overrideMap.get(row.rank);
    if (!status || status === 'hidden' || status === 'champion') {
      continue;
    }

    if (status === 'relegation') {
      manualRelegationEntries.push(row);
      continue;
    }

    const groupDefinition = getManualVerdictGroupDefinition(status, languageProfile, leagueConfig);
    const existingGroup = manualQualificationGroups.get(groupDefinition.key) ?? {
      ...groupDefinition,
      entries: [],
    };
    existingGroup.entries.push(row);
    manualQualificationGroups.set(groupDefinition.key, existingGroup);
  }

  const autoRelegationEntries = relegationZones.length
    ? relegationZones.flatMap((zone) => getRowsForZone(rows.filter(isRowAvailableForAutoGroup), zone))
    : rows.filter((row) => row.rank >= fallbackRelegationStart && isRowAvailableForAutoGroup(row));
  const relegationEntries = [...autoRelegationEntries, ...manualRelegationEntries].sort(
    (left, right) => left.rank - right.rank
  );

  for (const manualGroup of manualQualificationGroups.values()) {
    const matchingGroup = qualificationGroups.find((group) => group.key === manualGroup.key);
    if (matchingGroup) {
      matchingGroup.entries = [...matchingGroup.entries, ...manualGroup.entries].sort(
        (left, right) => left.rank - right.rank
      );
    } else {
      qualificationGroups.push({
        ...manualGroup,
        entries: manualGroup.entries.sort((left, right) => left.rank - right.rank),
      });
    }
  }

  return {
    champion,
    qualificationGroups,
    relegationGroup: {
      key: 'relegation',
      label: languageProfile === 'en' ? 'Relegated' : 'Rebaixados',
      accentColor: '#E74C3C',
      entries: relegationEntries,
    },
  };
};

export const loadSeasonFinalVerdictEditor = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
  languageProfile = 'pt-br',
}) => {
  const leagueConfig = await loadLeagueConfig(leagueId);
  const aliasesConfig = await loadTeamNameAliases();
  const payload = await fetchJson(
    `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const league = payload.response?.[0]?.league;
  const standingsRows = flattenStandingsGroups(league?.standings);
  const rows = await buildStandingsRows(standingsRows, leagueId, aliasesConfig);
  const zones = leagueConfig?.standings?.zones ?? [];
  const configuredStatusOptions = zones.map((zone) => ({
    value: zone.key,
    label: zone.label,
  }));
  const requiredStatusOptions = [
    {value: 'auto', label: languageProfile === 'en' ? 'Auto rule' : 'Regra automática'},
    {value: 'champion', label: languageProfile === 'en' ? 'Champion' : 'Campeão'},
    ...configuredStatusOptions,
    {
      value: 'relegation-playoff',
      label: languageProfile === 'en' ? 'Relegation Playoff' : 'Playoff do Rebaixamento',
    },
    {value: 'stayed-up', label: languageProfile === 'en' ? 'Stayed Up' : 'Permaneceu'},
    {value: 'relegation', label: languageProfile === 'en' ? 'Relegated' : 'Rebaixado'},
    {value: 'hidden', label: languageProfile === 'en' ? 'Hide' : 'Ocultar'},
  ];
  const statusOptions = [
    ...new Map(requiredStatusOptions.map((option) => [option.value, option])).values(),
  ];

  return {
    leagueName: league?.name ?? leagueConfig?.leagueName ?? `League ${leagueId}`,
    rows: rows.map((row) => {
      const zone = getVerdictZoneForRow(row, zones);
      return {
        rank: row.rank,
        team: row.team,
        points: row.points,
        goalDifference: row.goalDifference,
        badge: row.badge,
        autoStatus: zone?.key ?? 'none',
        autoStatusLabel: zone?.label ?? (languageProfile === 'en' ? 'Mid-table' : 'Meio da tabela'),
      };
    }),
    statusOptions,
  };
};

const buildTopScorerEntries = async (topScorersResponse, leagueId, aliasesConfig) => {
  const entries = [];
  const sortedRows = [...topScorersResponse].sort((left, right) => {
    const leftGoals = Number(left.statistics?.[0]?.goals?.total ?? 0);
    const rightGoals = Number(right.statistics?.[0]?.goals?.total ?? 0);
    return rightGoals - leftGoals;
  });

  for (const row of sortedRows.slice(0, 10)) {
    const playerName = row.player?.name;
    const stat = Array.isArray(row.statistics) ? row.statistics[0] : undefined;
    const apiTeamName = stat?.team?.name;

    if (!playerName || !apiTeamName) {
      continue;
    }

    const names = resolveVideoTeamNames(apiTeamName, leagueId, aliasesConfig);
    const teamName = names.videoDisplayName;
    entries.push({
      rank: entries.length + 1,
      playerName,
      team: teamName,
      teamShort: teamShortLabel(teamName),
      goals: Number(stat?.goals?.total ?? 0),
      assists: stat?.goals?.assists ?? null,
      badge: {
        label: initials(teamName),
        logoPath: await resolveTeamLogo({
          logoUrl: stat?.team?.logo,
          apiTeamName,
          displayTeamName: names.apiDisplayName,
          leagueId,
          aliasesConfig,
        }),
      },
    });
  }

  return entries;
};

const buildTopScorersJob = async ({
  apiKey,
  apiHost,
  leagueId,
  season,
  brandName,
  leagueName,
  roundLabel,
  outputName,
  channelProfile,
  languageProfile,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
}) => {
  const payload = await fetchJson(
    `https://${apiHost}/players/topscorers?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const leagueConfig = await loadLeagueConfig(leagueId);
  const aliasesConfig = await loadTeamNameAliases();
  const responseRows = Array.isArray(payload.response) ? payload.response : [];
  const entries = await buildTopScorerEntries(responseRows, leagueId, aliasesConfig);
  const apiLeagueName =
    responseRows[0]?.statistics?.[0]?.league?.name ??
    leagueConfig?.leagueName ??
    `League ${leagueId}`;
  const finalLeagueName =
    leagueName?.trim() || getLeagueNameWithSeason(apiLeagueName, season, languageProfile);

  return {
    ...makeBaseJob({
      template: 'top-scorers',
      leagueId,
      season,
      leagueName: finalLeagueName,
      brandName,
      outputName:
        outputName?.trim() ||
        `${sanitize(finalLeagueName)}-${
          languageProfile === 'en' ? 'top-scorers' : 'artilheiros'
        }-${languageProfile}.mp4`,
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId: 'FootballTopScorersShort',
    leagueConfig,
    titleLabel: languageProfile === 'en' ? 'Top Scorers' : 'Artilheiros',
    subtitleLabel: roundLabel?.trim() || (languageProfile === 'en' ? 'Top 10 scorers' : 'Top 10 do campeonato'),
    ctaText: ctaText?.trim() || getFootballDefaultCta('top-scorers', languageProfile),
    warnings:
      entries.length === 0
        ? [`No top scorers data found for league ${leagueId} season ${season}.`]
        : undefined,
    entries,
  };
};

const numericStat = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const buildPlayerOfRoundEntries = async ({
  fixtures,
  apiKey,
  apiHost,
  leagueId,
  aliasesConfig,
}) => {
  const entries = [];

  for (const fixture of fixtures) {
    const fixtureId = Number(fixture.fixture?.id);
    if (!Number.isFinite(fixtureId)) {
      continue;
    }

    const payload = await fetchJson(
      `https://${apiHost}/fixtures/players?fixture=${fixtureId}`,
      apiKey,
      apiHost
    );
    const teams = Array.isArray(payload.response) ? payload.response : [];

    for (const teamPayload of teams) {
      const apiTeamName = teamPayload.team?.name;
      if (!apiTeamName || !Array.isArray(teamPayload.players)) {
        continue;
      }

      const names = resolveVideoTeamNames(apiTeamName, leagueId, aliasesConfig);
      const teamName = names.videoDisplayName;
      const logoPath = await resolveTeamLogo({
        logoUrl: teamPayload.team?.logo,
        apiTeamName,
        displayTeamName: names.apiDisplayName,
        leagueId,
        aliasesConfig,
      });

      for (const playerPayload of teamPayload.players) {
        const playerName = playerPayload.player?.name;
        const stat = Array.isArray(playerPayload.statistics)
          ? playerPayload.statistics[0]
          : undefined;
        const rating = numericStat(stat?.games?.rating, NaN);

        if (!playerName || !Number.isFinite(rating)) {
          continue;
        }

        entries.push({
          rank: 0,
          playerName,
          team: teamName,
          teamShort: teamShortLabel(teamName),
          position: stat?.games?.position ?? undefined,
          rating,
          goals: numericStat(stat?.goals?.total),
          assists: numericStat(stat?.goals?.assists),
          shotsOn: numericStat(stat?.shots?.on),
          keyPasses: numericStat(stat?.passes?.key),
          minutes: numericStat(stat?.games?.minutes),
          badge: {
            label: initials(teamName),
            logoPath,
          },
        });
      }
    }
  }

  return entries
    .sort((left, right) => {
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }

      if (right.minutes !== left.minutes) {
        return right.minutes - left.minutes;
      }

      return left.playerName.localeCompare(right.playerName);
    })
    .slice(0, 10)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
};

const buildPlayerOfRoundJob = async ({
  apiKey,
  apiHost,
  leagueId,
  season,
  round,
  matchDate,
  matchDates,
  brandName,
  leagueName,
  roundLabel,
  outputName,
  channelProfile,
  languageProfile,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
}) => {
  const fixturesPayload = await fetchJson(
    `https://${apiHost}/fixtures?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const leagueConfig = await loadLeagueConfig(leagueId);
  const aliasesConfig = await loadTeamNameAliases();
  const fixtures = Array.isArray(fixturesPayload.response) ? fixturesPayload.response : [];
  const {detectedRound, normalizedMatchDate, normalizedMatchDates, roundFixtures} =
    resolveTemplateFixtures({
    fixtures,
    template: 'results',
    round,
    matchDate,
    matchDates,
    languageProfile,
  });
  const entries = await buildPlayerOfRoundEntries({
    fixtures: roundFixtures,
    apiKey,
    apiHost,
    leagueId,
    aliasesConfig,
  });

  if (entries.length === 0) {
    throw new Error(`No player ratings found for round "${detectedRound}".`);
  }

  const apiLeagueName = fixturesPayload.response?.[0]?.league?.name ?? `League ${leagueId}`;
  const finalLeagueName =
    leagueName?.trim() || getLeagueNameWithSeason(apiLeagueName, season, languageProfile);
  const finalRoundLabel =
    roundLabel?.trim() ||
    (languageProfile === 'en'
      ? deriveFootballRoundLabel('results', detectedRound, languageProfile)
      : `Rodada dos Craques · ${deriveFootballRoundLabel('results', detectedRound, languageProfile)}`);

  return {
    ...makeBaseJob({
      template: 'player-of-round',
      leagueId,
      season,
      leagueName: finalLeagueName,
      brandName,
      outputName:
        outputName?.trim() ||
        `${sanitize(finalLeagueName)}-${
          languageProfile === 'en' ? 'player-of-round' : 'craque-da-rodada'
        }-${sanitize(detectedRound)}${
          normalizedMatchDates.length
            ? `-${sanitize(normalizedMatchDates.length <= 2 ? normalizedMatchDates.join('-') : `${normalizedMatchDates.length}-dates`)}`
            : ''
        }-${languageProfile}.mp4`,
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId: 'FootballPlayerOfRoundShort',
    leagueConfig,
    round: detectedRound,
    matchDate: normalizedMatchDate || undefined,
    matchDates: normalizedMatchDates.length ? normalizedMatchDates : undefined,
    titleLabel: languageProfile === 'en' ? 'Player of the Round' : 'Craque da Rodada',
    subtitleLabel: finalRoundLabel,
    ctaText: ctaText?.trim() || getFootballDefaultCta('player-of-round', languageProfile),
    entries,
  };
};

const calculatePointsPercentage = (points, played) => {
  if (!Number.isFinite(points) || !Number.isFinite(played) || played <= 0) {
    return 0;
  }

  return Math.round((points / (played * 3)) * 100);
};

const buildPaceEntries = (rows) => {
  const maxPlayed = rows.reduce((highest, row) => Math.max(highest, row.played ?? 0), 0);

  return {
    maxPlayed,
    entries: rows.map((row) => ({
      rank: row.rank,
      team: row.team,
      played: row.played,
      points: row.points,
      percentage: calculatePointsPercentage(row.points, row.played),
      hasGameInHand: row.played < maxPlayed,
      badge: row.badge,
    })),
  };
};

const buildChampionshipPaceEntries = (rows, config) => {
  const {maxPlayed, entries} = buildPaceEntries(rows);
  const entryCount = Math.max(1, config?.entryCount ?? 10);

  return {
    maxPlayed,
    entries: [...entries]
      .sort((left, right) => {
        if (right.percentage !== left.percentage) {
          return right.percentage - left.percentage;
        }

        if (right.points !== left.points) {
          return right.points - left.points;
        }

        return left.rank - right.rank;
      })
      .slice(0, entryCount),
  };
};

const buildRelegationLineEntries = (rows, config) => {
  const {maxPlayed, entries} = buildPaceEntries(rows);
  const maxRows = Math.max(1, config?.maxRows ?? 10);
  const belowLine = [...entries]
    .sort((left, right) => {
      if (left.percentage !== right.percentage) {
        return left.percentage - right.percentage;
      }

      if (left.points !== right.points) {
        return left.points - right.points;
      }

      return right.rank - left.rank;
    })
    .slice(0, maxRows)
    .sort((left, right) => {
      if (right.percentage !== left.percentage) {
        return right.percentage - left.percentage;
      }

      if (right.points !== left.points) {
        return right.points - left.points;
      }

      return left.rank - right.rank;
    });

  return {
    maxPlayed,
    entries: belowLine,
  };
};

const buildPaceJob = async ({
  template,
  apiKey,
  apiHost,
  leagueId,
  season,
  brandName,
  leagueName,
  roundLabel,
  outputName,
  channelProfile,
  languageProfile,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
}) => {
  const payload = await fetchJson(
    `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const leagueConfig = await loadLeagueConfig(leagueId);
  const aliasesConfig = await loadTeamNameAliases();
  const league = payload.response?.[0]?.league;
  const standingsRows = flattenStandingsGroups(league?.standings);
  const rows = await buildStandingsRows(standingsRows, leagueId, aliasesConfig);

  if (rows.length === 0) {
    throw new Error(`No standings data found for league ${leagueId} season ${season}.`);
  }

  const paceConfig =
    template === 'championship-pace'
      ? leagueConfig?.pace?.championship
      : leagueConfig?.pace?.relegation;
  const {maxPlayed, entries} =
    template === 'championship-pace'
      ? buildChampionshipPaceEntries(rows, paceConfig)
      : buildRelegationLineEntries(rows, paceConfig);
  const finalLeagueName =
    leagueName?.trim() ||
    getLeagueNameWithSeason(league?.name ?? `League ${leagueId}`, season, languageProfile);
  const titleLabel =
    template === 'championship-pace'
      ? languageProfile === 'en'
        ? 'Title Pace'
        : 'Ritmo de Campeão'
      : languageProfile === 'en'
        ? 'Relegation Line'
        : 'Linha do Rebaixamento';
  const subtitleLabel =
    roundLabel?.trim() ||
    (languageProfile === 'en'
      ? `Points Rate After Matchday ${maxPlayed}`
      : `Aproveitamento na Rodada ${maxPlayed}`);
  const benchmarkPercentage = paceConfig?.benchmarkPercentage ?? (template === 'championship-pace' ? 68 : 38);
  const benchmarkLabel =
    paceConfig?.benchmarkLabel ??
    (template === 'championship-pace'
      ? languageProfile === 'en'
        ? 'Average of the Last 10 Champions'
        : 'Média dos últimos 10 campeões'
      : languageProfile === 'en'
        ? 'Safety Line'
        : 'Linha de segurança');
  const hasGamesInHand = entries.some((entry) => entry.hasGameInHand);
  const noteLabel = hasGamesInHand
    ? languageProfile === 'en'
      ? '*teams with games in hand'
      : '*times com jogos a menos'
    : undefined;

  return {
    ...makeBaseJob({
      template,
      leagueId,
      season,
      leagueName: finalLeagueName,
      brandName,
      outputName:
        outputName?.trim() ||
        `${sanitize(finalLeagueName)}-${template}-${languageProfile}.mp4`,
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId:
      template === 'championship-pace'
        ? 'FootballChampionshipPaceShort'
        : 'FootballRelegationLineShort',
    leagueConfig,
    titleLabel,
    subtitleLabel,
    benchmarkPercentage,
    benchmarkLabel,
    noteLabel,
    ctaText:
      ctaText?.trim() || getFootballDefaultCta(template, languageProfile),
    entries,
  };
};

const flattenStandingsGroups = (standingsGroups) => {
  if (!Array.isArray(standingsGroups)) {
    return [];
  }

  if (standingsGroups.length === 1 && Array.isArray(standingsGroups[0])) {
    return standingsGroups[0];
  }

  return standingsGroups.flatMap((groupRows) => (Array.isArray(groupRows) ? groupRows : []));
};

const getContinentalGroupLabel = (groupName, languageProfile = 'pt-br') => {
  const match = String(groupName ?? '').match(/group\s+([a-z])/i);
  const letter = match?.[1]?.toUpperCase();
  if (!letter) {
    return String(groupName ?? '').trim() || (languageProfile === 'en' ? 'Group' : 'Grupo');
  }

  return languageProfile === 'en' ? `Group ${letter}` : `Grupo ${letter}`;
};

const buildContinentalGroups = async (allStandingsGroups, leagueId, aliasesConfig, languageProfile) => {
  const groups = [];

  for (const groupRows of allStandingsGroups) {
    if (!Array.isArray(groupRows) || groupRows.length === 0) {
      continue;
    }

    const groupName = groupRows[0]?.group;
    if (!groupName) {
      continue;
    }

    const rows = await Promise.all(
      groupRows.slice(0, 4).map(async (row) => {
        const apiTeamName = row.team?.name ?? 'TBC';
        const names = resolveVideoTeamNames(apiTeamName, leagueId, aliasesConfig);
        const teamName = names.videoDisplayName;

        return {
          rank: row.rank ?? 0,
          team: teamName,
          goalDifference: row.goalsDiff ?? 0,
          points: row.points ?? 0,
          badge: {
            label: initials(teamName),
            logoPath: await resolveTeamLogo({
              logoUrl: row.team?.logo,
              apiTeamName,
              displayTeamName: names.apiDisplayName,
              leagueId,
              aliasesConfig,
            }),
          },
        };
      })
    );

    groups.push({
      groupKey: getWorldCupGroupKey(groupName) ?? sanitize(groupName),
      groupLabel: getContinentalGroupLabel(groupName, languageProfile),
      rows,
    });
  }

  return groups.sort((left, right) => left.groupLabel.localeCompare(right.groupLabel));
};

const formatWorldCupDateLabel = (isoDate, languageProfile) => {
  const date = new Date(isoDate);

  if (languageProfile === 'pt-br') {
    const monthDay = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
    const time = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(date);

    return `${monthDay.replace('.', '')} • ${time} (BRT)`;
  }

  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(date);

  return `${monthDay} • ${time} (UTC)`;
};

const buildWorldCupGroupJob = async ({
  apiKey,
  apiHost,
  season,
  brandName,
  outputName,
  channelProfile,
  languageProfile,
  groupLetter,
  competitionName,
  roundLabel,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
  leagueName,
}) => {
  await ensureDirectories();

  const copy = getFootballCopy(languageProfile);
  const worldCupConfig = await loadWorldCupConfig().catch(() => ({groups: {}}));
  const normalizedGroupLetter = String(groupLetter ?? 'A').trim().toUpperCase();
  const fallbackGroup = worldCupConfig.groups?.[normalizedGroupLetter];
  const fallbackFlags = new Map(
    [
      ...(fallbackGroup?.standings ?? []).map((row) => [normalizeGroupName(row.team), row.flag]),
      ...(fallbackGroup?.nextMatches ?? []).flatMap((match) => [
        [normalizeGroupName(match.homeTeam), match.homeFlag],
        [normalizeGroupName(match.awayTeam), match.awayFlag],
      ]),
      ...(fallbackGroup?.lastResults ?? []).flatMap((match) => [
        [normalizeGroupName(match.homeTeam), match.homeFlag],
        [normalizeGroupName(match.awayTeam), match.awayFlag],
      ]),
    ].filter((entry) => entry[0] && entry[1])
  );

  let rows = fallbackGroup?.teams?.map((team, index) => ({
    rank: index + 1,
    team: translateWorldCupCountryName(team.name, languageProfile),
    played: 0,
    goalDifference: 0,
    points: 0,
    badge: {label: team.flag},
  })) ?? [];

  let nextMatches = fallbackGroup?.nextMatches?.map((match) => ({
    homeTeam: translateWorldCupCountryName(match.homeTeam, languageProfile),
    awayTeam: translateWorldCupCountryName(match.awayTeam, languageProfile),
    homeBadge: {label: match.homeFlag},
    awayBadge: {label: match.awayFlag},
    dateLabel: formatWorldCupDateLabel(match.dateTime, languageProfile),
  })) ?? [];

  let lastResults = fallbackGroup?.lastResults?.map((match) => ({
    homeTeam: translateWorldCupCountryName(match.homeTeam, languageProfile),
    awayTeam: translateWorldCupCountryName(match.awayTeam, languageProfile),
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    homeBadge: {label: match.homeFlag},
    awayBadge: {label: match.awayFlag},
    dateLabel: formatWorldCupDateLabel(match.dateTime, languageProfile),
  })) ?? [];

  let detectedCompetitionName = competitionName?.trim() || copy.worldCup.title(season);

  if (apiKey) {
    const standingsPayload = await fetchJson(
      `https://${apiHost}/standings?league=1&season=${season}`,
      apiKey,
      apiHost
    );

    const league = standingsPayload.response?.[0]?.league;
    const allGroups = Array.isArray(league?.standings) ? league.standings : [];
    const bestThirdPlaceKeys = getBestWorldCupThirdPlaceKeys(allGroups);
    const selectedGroupRows = allGroups.find((groupRows) => {
      const groupName = groupRows?.[0]?.group;
      return getWorldCupGroupKey(groupName) === normalizedGroupLetter;
    });

    if (selectedGroupRows?.length) {
      rows = await Promise.all(
        selectedGroupRows.slice(0, 4).map(async (row) => ({
          rank: row.rank,
          team: translateWorldCupCountryName(row.team?.name ?? 'TBC', languageProfile),
          played: row.all?.played ?? 0,
          goalDifference: row.goalsDiff ?? 0,
          points: row.points ?? 0,
          qualifiesAsBestThird:
            row.rank === 3 && bestThirdPlaceKeys.has(getWorldCupStandingTeamKey(row)),
          badge: {
            label:
              fallbackFlags.get(normalizeGroupName(row.team?.name)) ??
              initials(row.team?.name ?? 'TBC'),
            imagePath:
              row.team?.id && row.team?.logo
                ? await downloadLogo(row.team.logo, row.team.name)
                : undefined,
          },
        }))
      );
    }

    const fallbackGroupTeams = new Set(
      (fallbackGroup?.teams ?? fallbackGroup?.standings ?? []).map((row) =>
        normalizeGroupName(row.name ?? row.team)
      )
    );
    const groupTeams = new Set(
      selectedGroupRows?.length
        ? selectedGroupRows.map((row) => normalizeGroupName(row.team?.name))
        : [...fallbackGroupTeams]
    );
    if (groupTeams.size > 0) {
      const fixturesPayload = await fetchJson(
        `https://${apiHost}/fixtures?league=1&season=${season}`,
        apiKey,
        apiHost
      );
      const groupFixtures = (fixturesPayload.response ?? []).filter((fixture) => {
        const homeName = normalizeGroupName(fixture.teams?.home?.name);
        const awayName = normalizeGroupName(fixture.teams?.away?.name);
        return groupTeams.has(homeName) && groupTeams.has(awayName);
      });

      const finishedFixtures = groupFixtures
        .filter((fixture) => FINISHED_STATUSES.has(fixture.fixture?.status?.short))
        .sort((a, b) => (b.fixture?.timestamp ?? 0) - (a.fixture?.timestamp ?? 0))
        .slice(0, 2);

      const upcomingFixtures = groupFixtures
        .filter((fixture) => {
          const status = fixture.fixture?.status?.short;
          return UPCOMING_STATUSES.has(status);
        })
        .sort((a, b) => (a.fixture?.timestamp ?? 0) - (b.fixture?.timestamp ?? 0))
        .slice(0, 2);

      lastResults = [];
      nextMatches = [];

      if (finishedFixtures.length > 0) {
        lastResults = await Promise.all(
          finishedFixtures.map(async (fixture) => ({
            homeTeam: translateWorldCupCountryName(
              fixture.teams?.home?.name ?? 'TBC',
              languageProfile
            ),
            awayTeam: translateWorldCupCountryName(
              fixture.teams?.away?.name ?? 'TBC',
              languageProfile
            ),
            homeScore: fixture.goals?.home ?? fixture.score?.fulltime?.home ?? null,
            awayScore: fixture.goals?.away ?? fixture.score?.fulltime?.away ?? null,
            homeBadge: {
              label:
                fallbackFlags.get(normalizeGroupName(fixture.teams?.home?.name)) ??
                initials(fixture.teams?.home?.name ?? 'TBC'),
              imagePath:
                fixture.teams?.home?.id && fixture.teams?.home?.logo
                  ? await downloadLogo(fixture.teams.home.logo, fixture.teams.home.name)
                  : undefined,
            },
            awayBadge: {
              label:
                fallbackFlags.get(normalizeGroupName(fixture.teams?.away?.name)) ??
                initials(fixture.teams?.away?.name ?? 'TBC'),
              imagePath:
                fixture.teams?.away?.id && fixture.teams?.away?.logo
                  ? await downloadLogo(fixture.teams.away.logo, fixture.teams.away.name)
                  : undefined,
            },
            dateLabel: formatWorldCupDateLabel(fixture.fixture?.date, languageProfile),
          }))
        );
      }

      if (upcomingFixtures.length > 0) {
        nextMatches = await Promise.all(
          upcomingFixtures.map(async (fixture) => ({
            homeTeam: translateWorldCupCountryName(
              fixture.teams?.home?.name ?? 'TBC',
              languageProfile
            ),
            awayTeam: translateWorldCupCountryName(
              fixture.teams?.away?.name ?? 'TBC',
              languageProfile
            ),
            homeBadge: {
              label:
                fallbackFlags.get(normalizeGroupName(fixture.teams?.home?.name)) ??
                initials(fixture.teams?.home?.name ?? 'TBC'),
              imagePath:
                fixture.teams?.home?.id && fixture.teams?.home?.logo
                  ? await downloadLogo(fixture.teams.home.logo, fixture.teams.home.name)
                  : undefined,
            },
            awayBadge: {
              label:
                fallbackFlags.get(normalizeGroupName(fixture.teams?.away?.name)) ??
                initials(fixture.teams?.away?.name ?? 'TBC'),
              imagePath:
                fixture.teams?.away?.id && fixture.teams?.away?.logo
                  ? await downloadLogo(fixture.teams.away.logo, fixture.teams.away.name)
                  : undefined,
            },
            dateLabel: formatWorldCupDateLabel(fixture.fixture?.date, languageProfile),
          }))
        );
      }
    }
  }

  const finalCompetitionName = detectedCompetitionName || copy.worldCup.title(season);
  const groupMatchSectionMode =
    lastResults.length === 0 ? 'next-only' : nextMatches.length === 0 ? 'results-only' : 'mixed';

  return {
    ...makeBaseJob({
      template: 'world-cup-group-standings',
      leagueId: 1,
      season,
      leagueName: finalCompetitionName,
      brandName,
      outputName: outputName?.trim() || copy.worldCup.output(season, normalizedGroupLetter),
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId: 'FootballWorldCupGroupShort',
    competitionName: finalCompetitionName,
    groupLetter: normalizedGroupLetter,
    titleLabel: finalCompetitionName,
    groupLabel: roundLabel?.trim() || copy.worldCup.group(normalizedGroupLetter),
    tableLabels: copy.worldCup.tableLabels,
    qualificationLegend: copy.worldCup.qualificationLegend,
    lastResultsLabel: copy.worldCup.lastResults(normalizedGroupLetter),
    nextMatchesLabel: copy.worldCup.nextMatches(normalizedGroupLetter),
    groupMatchSectionMode,
    ctaText: ctaText?.trim() || copy.worldCup.cta,
    rows,
    lastResults,
    nextMatches,
  };
};

const buildWorldCupKnockoutJob = async ({
  season,
  brandName,
  outputName,
  channelProfile,
  languageProfile,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
}) => {
  const copy = getFootballCopy(languageProfile);
  const isPortuguese = languageProfile !== 'en';
  const matches = [
    ['1º Grupo A', '2º Grupo B'],
    ['1º Grupo C', '2º Grupo D'],
    ['1º Grupo E', '2º Grupo F'],
    ['1º Grupo G', '2º Grupo H'],
    ['1º Grupo I', '2º Grupo J'],
    ['1º Grupo K', '2º Grupo L'],
    ['1º Grupo B', isPortuguese ? '3º Melhor' : 'Best 3rd'],
    ['1º Grupo D', isPortuguese ? '3º Melhor' : 'Best 3rd'],
    ['1º Grupo F', '2º Grupo C'],
    ['1º Grupo H', '2º Grupo J'],
    ['1º Grupo J', '2º Grupo H'],
    ['1º Grupo L', isPortuguese ? '3º Melhor' : 'Best 3rd'],
    ['2º Grupo A', '2º Grupo B'],
    ['2º Grupo D', '2º Grupo G'],
    ['2º Grupo E', '2º Grupo I'],
    ['2º Grupo K', '2º Grupo L'],
  ].map(([homeTeam, awayTeam], index) => ({
    homeTeam,
    awayTeam,
    homeScore: null,
    awayScore: null,
    homeBadge: {label: initials(homeTeam)},
    awayBadge: {label: initials(awayTeam)},
    statusLabel: isPortuguese ? `Jogo ${index + 1}` : `Match ${index + 1}`,
    winner: 'none',
  }));

  return {
    ...makeBaseJob({
      template: 'world-cup-knockout',
      leagueId: 1,
      season,
      leagueName: copy.worldCup.title(season),
      brandName,
      outputName: outputName?.trim() || copy.worldCup.knockoutOutput(season),
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId: 'FootballWorldCupKnockoutShort',
    titleLabel: copy.worldCup.title(season),
    phaseLabel: copy.worldCup.knockoutPhase(),
    ctaText: ctaText?.trim() || getFootballDefaultCta('world-cup-knockout', languageProfile),
    matches,
  };
};

const tierlistDefinitions = [
  {
    key: 'champion',
    selectionKey: 'champion',
    label: {en: 'Champion', 'pt-br': 'Campeão'},
    count: 1,
    accentColor: '#FEDF00',
  },
  {
    key: 'favorites',
    selectionKey: 'favorites',
    label: {en: 'Favorites', 'pt-br': 'Favoritos'},
    count: 3,
    accentColor: '#009B3A',
  },
  {
    key: 'deep-run',
    selectionKey: 'deepRun',
    label: {en: 'Deep Run', 'pt-br': 'Vão Longe'},
    count: 5,
    accentColor: '#0A84FF',
  },
  {
    key: 'dark-horses',
    selectionKey: 'darkHorses',
    label: {en: 'Dark Horses', 'pt-br': 'Zebras'},
    count: 3,
    accentColor: '#8E44AD',
  },
  {
    key: 'group-stage-exit',
    selectionKey: 'groupStageExit',
    label: {en: 'Group Stage Exit', 'pt-br': 'Cai na Fase de Grupos'},
    count: 4,
    accentColor: '#C86430',
  },
  {
    key: 'disappointment',
    selectionKey: 'disappointment',
    label: {en: 'Disappointment', 'pt-br': 'Decepção'},
    count: 3,
    accentColor: '#E74C3C',
  },
];

const normalizeTierlistSelections = (tierlistSelections = {}) => {
  const getValues = (selectionKey) => {
    const value = tierlistSelections?.[selectionKey];
    const rawValues = Array.isArray(value) ? value : String(value ?? '').split(',');
    return rawValues.map((item) => String(item ?? '').trim()).filter(Boolean);
  };

  return Object.fromEntries(
    tierlistDefinitions.map((tier) => [
      tier.selectionKey,
      getValues(tier.selectionKey).slice(0, tier.count),
    ])
  );
};

const worldCupFallbackTeamNames = (worldCupConfig) => [
  ...new Set(
    Object.values(worldCupConfig.groups ?? {})
      .flatMap((group) => [
        ...(group.teams ?? []).map((team) => team.name),
        ...(group.standings ?? []).map((team) => team.team),
      ])
      .map((name) => String(name ?? '').trim())
      .filter(Boolean)
  ),
];

export const loadWorldCupTierlistTeams = async ({
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  season = 2026,
  languageProfile = 'pt-br',
} = {}) => {
  const worldCupConfig = await loadWorldCupConfig().catch(() => ({groups: {}}));
  const teams = new Map();
  const addTeam = async ({name, logo}) => {
    const originalName = String(name ?? '').trim();
    if (!originalName) {
      return;
    }

    const key = normalizeTeamAliasKey(originalName);
    if (teams.has(key)) {
      return;
    }

    const displayName = translateWorldCupCountryName(originalName, languageProfile);
    teams.set(key, {
      value: originalName,
      label: displayName,
      badge: {
        label: initials(displayName),
        imagePath:
          logo && apiKey
            ? await downloadLogo(logo, originalName)
            : findCachedTeamLogo(originalName) ?? findCachedTeamLogo(displayName),
      },
    });
  };

  if (apiKey) {
    try {
      const standingsPayload = await fetchJson(
        `https://${apiHost}/standings?league=1&season=${season}`,
        apiKey,
        apiHost
      );
      const allGroups = standingsPayload.response?.[0]?.league?.standings ?? [];
      const apiRows = Array.isArray(allGroups) ? allGroups.flat() : [];
      for (const row of apiRows) {
        await addTeam({name: row.team?.name, logo: row.team?.logo});
      }
    } catch {
      // Keep the dashboard usable with the local World Cup config.
    }
  }

  for (const name of worldCupFallbackTeamNames(worldCupConfig)) {
    await addTeam({name});
  }

  return [...teams.values()].sort((left, right) => left.label.localeCompare(right.label));
};

const buildTierlistJob = async ({
  apiKey,
  apiHost,
  season,
  brandName,
  outputName,
  channelProfile,
  languageProfile,
  leagueName,
  roundLabel,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
  tierlistSelections,
  topScorerPrediction,
  bestPlayerPrediction,
}) => {
  await ensureDirectories();

  const normalizedSeason = Number.isFinite(Number(season)) ? Number(season) : 2026;
  const isEnglish = languageProfile === 'en';
  const copy = getFootballCopy(languageProfile);
  const finalLeagueName =
    leagueName?.trim() || (isEnglish ? `World Cup ${normalizedSeason}` : `Copa do Mundo ${normalizedSeason}`);
  const selections = normalizeTierlistSelections(tierlistSelections);
  const teamOptions = await loadWorldCupTierlistTeams({
    apiKey,
    apiHost,
    season: normalizedSeason,
    languageProfile,
  });
  const teamOptionMap = new Map(teamOptions.map((team) => [normalizeTeamAliasKey(team.value), team]));

  const buildEntry = async (teamName) => {
    const option = teamOptionMap.get(normalizeTeamAliasKey(teamName));
    const originalName = option?.value ?? teamName;
    const displayName = option?.label ?? translateWorldCupCountryName(originalName, languageProfile);
    return {
      team: displayName,
      sourceTeam: originalName,
      badge: {
        label: initials(displayName),
        imagePath:
          option?.badge?.imagePath ??
          findCachedTeamLogo(originalName) ??
          findCachedTeamLogo(displayName),
      },
    };
  };

  const tiers = await Promise.all(
    tierlistDefinitions.map(async (tier) => {
      const entries = await Promise.all(
        (selections[tier.selectionKey] ?? []).map((teamName) => buildEntry(teamName))
      );
      return {
        key: tier.key,
        label: tier.label[languageProfile] ?? tier.label.en,
        accentColor: tier.accentColor,
        entries,
      };
    })
  );

  const missingTiers = tierlistDefinitions
    .filter((tier) => (selections[tier.selectionKey] ?? []).length !== tier.count)
    .map((tier) => `${tier.label[languageProfile] ?? tier.label.en}: ${tier.count}`);
  const selectedTeamKeys = tierlistDefinitions.flatMap((tier) =>
    (selections[tier.selectionKey] ?? []).map((teamName) => normalizeTeamAliasKey(teamName))
  );
  const duplicateTeamKeys = selectedTeamKeys.filter(
    (teamKey, index) => selectedTeamKeys.indexOf(teamKey) !== index
  );

  if (missingTiers.length || duplicateTeamKeys.length) {
    const missingMessage = missingTiers.length
      ? `Tierlist incompleta. Selecione: ${missingTiers.join(', ')}.`
      : 'Tierlist inválida.';
    const duplicateMessage = duplicateTeamKeys.length
      ? ' Não repita o mesmo time em mais de uma tier.'
      : '';
    const error = new Error(`${missingMessage}${duplicateMessage}`);
    error.errorType = 'tierlist_validation_error';
    error.details = {missingTiers, duplicateTeamKeys};
    throw error;
  }

  return {
    ...makeBaseJob({
      template: 'tierlist',
      leagueId: 1,
      season: normalizedSeason,
      leagueName: finalLeagueName,
      brandName,
      outputName:
        outputName?.trim() ||
        `${sanitize(finalLeagueName)}-${isEnglish ? 'tierlist' : 'favoritos'}-${languageProfile}.mp4`,
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId: 'FootballTierlistShort',
    leagueConfig: {
      leagueId: 1,
      leagueName: finalLeagueName,
      accentColor: isEnglish ? '#0A84FF' : '#FEDF00',
      secondaryAccentColor: isEnglish ? '#C8A84B' : '#009B3A',
    },
    titleLabel: 'Tierlist',
    subtitleLabel:
      roundLabel?.trim() || (isEnglish ? 'World Cup favorites' : 'Favoritos da Copa'),
    topScorerPrediction: String(topScorerPrediction ?? '').trim(),
    bestPlayerPrediction: String(bestPlayerPrediction ?? '').trim(),
    ctaText: ctaText?.trim() || getFootballDefaultCta('tierlist', languageProfile),
    tiers,
    dataSource: apiKey ? 'api' : 'sample',
    coldOpenData: {
      tableRows: tiers.flatMap((tier) =>
        tier.entries.slice(0, 3).map((entry) => ({
          rank: tier.label,
          club: entry.team,
          pts: '',
        }))
      ).slice(0, 6),
    },
  };
};

const buildContinentalGroupsJob = async ({
  apiKey,
  apiHost,
  leagueId,
  season,
  brandName,
  leagueName,
  roundLabel,
  outputName,
  channelProfile,
  languageProfile,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
}) => {
  await ensureDirectories();
  const leagueConfig = await loadLeagueConfig(leagueId);
  const aliasesConfig = await loadTeamNameAliases();
  const copy = getFootballCopy(languageProfile);

  const payload = await fetchJson(
    `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );

  const league = payload.response?.[0]?.league;
  const allStandingsGroups = Array.isArray(league?.standings) ? league.standings : [];
  const groups = await buildContinentalGroups(
    allStandingsGroups,
    leagueId,
    aliasesConfig,
    languageProfile
  );

  if (groups.length === 0) {
    throw new Error(`No grouped standings found for league ${leagueId} season ${season}.`);
  }

  const finalLeagueName =
    leagueName?.trim() ||
    getLeagueNameWithSeason(league?.name ?? `League ${leagueId}`, season, languageProfile);
  const titleLabel =
    languageProfile === 'en' ? 'Group Standings' : 'Tabela dos Grupos';
  const subtitleLabel =
    roundLabel?.trim() ||
    (languageProfile === 'en' ? 'Group Stage' : 'Fase de Grupos');

  return {
    ...makeBaseJob({
      template: 'continental-groups-standings',
      leagueId,
      season,
      leagueName: finalLeagueName,
      brandName,
      outputName:
        outputName?.trim() ||
        `${sanitize(finalLeagueName)}-${languageProfile === 'en' ? 'group-standings' : 'grupos'}-${languageProfile}.mp4`,
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId: 'FootballContinentalGroupsShort',
    leagueConfig,
    titleLabel,
    subtitleLabel,
    tableLabels:
      languageProfile === 'en'
        ? {pos: 'Pos', team: 'Team', gd: 'GD', pts: 'Pts'}
        : {pos: 'Pos', team: 'Equipe', gd: 'SG', pts: 'Pts'},
    ctaText:
      ctaText?.trim() || getFootballDefaultCta('continental-groups-standings', languageProfile),
    groups,
  };
};

const makeBaseJob = ({
  template,
  leagueId,
  season,
  leagueName,
  brandName,
  outputName,
  durationInFrames,
  channelProfile,
  languageProfile,
  soundtrackPath,
  soundtrackVolume,
}) => ({
  sport: 'football',
  template,
  leagueId,
  season,
  leagueName,
  channelProfile,
  languageProfile,
  brandName: brandName?.trim() || 'Foot Analysis',
  brandLogoPath: '/branding/foot-analysis-logo.png',
  soundtrackPath: soundtrackPath?.trim() || defaultFootballSoundtrack.value,
  soundtrackLabel:
    footballSoundtrackPresets.find(
      (preset) => preset.value === (soundtrackPath?.trim() || defaultFootballSoundtrack.value)
    )?.label ?? defaultFootballSoundtrack.label,
  soundtrackVolume: Number.isFinite(Number(soundtrackVolume))
    ? Math.max(0, Math.min(1, Number(soundtrackVolume)))
    : 0.2,
  outputName,
  durationInFrames,
});

const parsePredictedScore = (value) => {
  const match = String(value ?? '')
    .trim()
    .match(/^(\d{1,2})\s*[-xX–]\s*(\d{1,2})$/);

  if (!match) {
    return null;
  }

  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
    predictedScore: `${Number(match[1])}-${Number(match[2])}`,
  };
};

const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value ?? '').trim());

const longformTeamAccentPalette = [
  '#27AE60',
  '#C0392B',
  '#2E86DE',
  '#8E44AD',
  '#E67E22',
  '#1ABC9C',
  '#E74C3C',
  '#F39C12',
  '#3498DB',
  '#9B59B6',
];

const inferLongformTeamAccent = (teamName) => {
  const normalized = normalizeTeamAliasKey(teamName);
  const hash = [...normalized].reduce((total, char) => total + char.charCodeAt(0), 0);
  return longformTeamAccentPalette[hash % longformTeamAccentPalette.length] ?? '#F0A500';
};

const resolveTeamAccentColor = (teamName, leagueId, accentConfig) => {
  const accentKey = normalizeTeamAliasKey(teamName);
  const leagueAccents = accentConfig?.leagues?.[String(leagueId)] ?? {};
  const globalAccents = accentConfig?.global ?? {};

  return leagueAccents[accentKey] ?? globalAccents[accentKey];
};

const longformBadgeForTeam = (teamName, leagueId, aliasesConfig, accentConfig, accentColor) => {
  const apiDisplayName = resolveDisplayTeamName(teamName, leagueId, aliasesConfig);
  const displayName = resolveVideoTeamName(teamName, leagueId, aliasesConfig);
  const configuredAccentColor =
    resolveTeamAccentColor(displayName, leagueId, accentConfig) ??
    resolveTeamAccentColor(apiDisplayName, leagueId, accentConfig) ??
    resolveTeamAccentColor(teamName, leagueId, accentConfig);

  return {
    team: displayName,
    badge: {
      label: teamShortLabel(displayName),
      logoPath:
        findYouthProfessionalLogo({
          apiTeamName: teamName,
          displayTeamName: apiDisplayName,
          leagueId,
          aliasesConfig,
        }) ??
        findCachedTeamLogo(apiDisplayName) ??
        findCachedTeamLogo(displayName) ??
        findCachedTeamLogo(teamName),
      accentColor: isHexColor(accentColor)
        ? String(accentColor).trim()
        : configuredAccentColor ?? inferLongformTeamAccent(displayName),
    },
  };
};

const estimateVoiceoverFrames = (text) => {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(8, Math.ceil((words / 150) * 60) + 3);
  return seconds * 30;
};

const publicAssetPathToFile = (publicPath) =>
  path.join(projectRoot, 'public', String(publicPath ?? '').replace(/^\/+/, ''));

const getAudioDurationInFrames = async (publicPath, fallbackFrames = 300) => {
  const filePath = publicAssetPathToFile(publicPath);
  try {
    const {stdout} = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const seconds = Number(stdout.trim());
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 30) : fallbackFrames;
  } catch {
    return fallbackFrames;
  }
};

export const parseFootballPredictionsLongYaml = (yamlText) => {
  const data = parseSimpleYaml(yamlText);
  const errors = [];
  const matches = Array.isArray(data.matches) ? data.matches : [];

  if (!String(data.title ?? '').trim()) errors.push('Missing required field: title.');
  if (!String(data.league ?? '').trim()) errors.push('Missing required field: league.');
  if (!String(data.openingLine1 ?? '').trim() && !String(data.openingLine2 ?? '').trim()) {
    errors.push('Missing openingLine1 or openingLine2 for the intro screen.');
  }
  if (!matches.length) errors.push('Missing required field: matches.');

  const seen = new Set();
  matches.forEach((match, index) => {
    const label = `Match ${index + 1}`;
    const homeTeam = String(match.homeTeam ?? '').trim();
    const awayTeam = String(match.awayTeam ?? '').trim();
    const voiceover = String(match.voiceover ?? '').trim();
    const score = parsePredictedScore(match.predictedScore);
    const homeAccentColor = String(match.homeAccentColor ?? '').trim();
    const awayAccentColor = String(match.awayAccentColor ?? '').trim();

    if (!homeTeam) errors.push(`${label}: homeTeam is required.`);
    if (!awayTeam) errors.push(`${label}: awayTeam is required.`);
    if (!score) errors.push(`${label}: predictedScore must look like "2-1".`);
    if (!voiceover) errors.push(`${label}: voiceover is required.`);
    if (homeAccentColor && !isHexColor(homeAccentColor)) {
      errors.push(`${label}: homeAccentColor must be a hex color like "#27AE60".`);
    }
    if (awayAccentColor && !isHexColor(awayAccentColor)) {
      errors.push(`${label}: awayAccentColor must be a hex color like "#C0392B".`);
    }

    const key = `${normalizeTeamAliasKey(homeTeam)}::${normalizeTeamAliasKey(awayTeam)}`;
    if (seen.has(key)) errors.push(`${label}: duplicate match ${homeTeam} x ${awayTeam}.`);
    seen.add(key);
  });

  return {
    ok: errors.length === 0,
    errors,
    data,
  };
};

export const loadFootballPredictionsLongJob = async () => {
  const raw = await fs.readFile(footballPredictionsLongJobFile, 'utf8');
  return JSON.parse(raw);
};

export const loadFootballRoundSummaryLongJob = async () => {
  const raw = await fs.readFile(getTemplateJobFile('round-summary-long'), 'utf8');
  return JSON.parse(raw);
};

export const prepareFootballPredictionsLongJob = async ({
  yamlText,
  brandName,
  soundtrackPath,
  soundtrackVolume,
  voiceoverEnabled = true,
}) => {
  await ensureDirectories();

  const parsed = parseFootballPredictionsLongYaml(yamlText);
  if (!parsed.ok) {
    const error = new Error(parsed.errors.join('\n'));
    error.errorType = 'yaml_validation_error';
    error.details = {errors: parsed.errors};
    throw error;
  }

  const data = parsed.data;
  const aliasesConfig = await loadTeamNameAliases();
  const accentConfig = await loadTeamAccentColors();
  const leagueId = Number(data.leagueId);
  const normalizedLeagueId = Number.isFinite(leagueId) ? leagueId : 0;
  const transitionDurationInFrames = 18;
  const selectedSoundtrack = soundtrackPath?.trim() || defaultFootballSoundtrack?.value;
  const introDurationInFrames = await getAudioDurationInFrames(selectedSoundtrack, 300);
  const outroDurationInFrames = await getAudioDurationInFrames(
    selectedSoundtrack,
    Math.max(210, 120 + Math.ceil(data.matches.length / 2) * 42)
  );

  const matches = [];
  for (const [index, match] of data.matches.entries()) {
    const score = parsePredictedScore(match.predictedScore);
    const home = longformBadgeForTeam(
      match.homeTeam,
      normalizedLeagueId,
      aliasesConfig,
      accentConfig,
      match.homeAccentColor
    );
    const away = longformBadgeForTeam(
      match.awayTeam,
      normalizedLeagueId,
      aliasesConfig,
      accentConfig,
      match.awayAccentColor
    );
    const voiceover = String(match.voiceover).trim();
    const voiceoverPath =
      voiceoverEnabled !== false
        ? await generateGoogleVoiceover({text: voiceover, languageProfile: 'pt-br'})
        : undefined;

    matches.push({
      id: `${sanitize(home.team)}-${sanitize(away.team)}-${index + 1}`,
      homeTeam: home.team,
      awayTeam: away.team,
      predictedScore: score.predictedScore,
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      voiceover,
      voiceoverPath,
      durationInFrames: estimateVoiceoverFrames(voiceover),
      homeBadge: home.badge,
      awayBadge: away.badge,
    });
  }

  const matchDurationTotal = matches.reduce(
    (total, match) => total + match.durationInFrames + transitionDurationInFrames,
    0
  );
  const leagueName = String(data.league).trim();
  const season = Number(data.season);
  const title = String(data.title).trim();
  const outputName = String(data.outputName ?? '').trim() || `${sanitize(title)}.mp4`;
  const normalizedOutputName = outputName.toLowerCase().endsWith('.mp4')
    ? outputName
    : `${outputName}.mp4`;
  const openingLines = [data.openingLine1, data.openingLine2]
    .map((line) => String(line ?? '').trim())
    .filter(Boolean);

  const job = {
    sport: 'football',
    template: 'predictions-long',
    compositionId: 'FootballPredictionsLong',
    leagueId: normalizedLeagueId,
    season: Number.isFinite(season) ? season : new Date().getFullYear(),
    leagueName,
    channelProfile: 'pt',
    languageProfile: 'pt-br',
    brandName: brandName?.trim() || 'Foot Analysis',
    brandLogoPath: '/branding/foot-analysis-logo.png',
    soundtrackPath: selectedSoundtrack,
    soundtrackLabel:
      footballSoundtrackPresets.find((preset) => preset.value === selectedSoundtrack)?.label ??
      defaultFootballSoundtrack?.label,
    soundtrackVolume: Number.isFinite(Number(soundtrackVolume))
      ? Math.max(0, Math.min(1, Number(soundtrackVolume)))
      : 0.92,
    outputName: normalizedOutputName,
    durationInFrames:
      introDurationInFrames + matchDurationTotal + outroDurationInFrames,
    dataSource: 'sample',
    title,
    roundLabel: String(data.round ?? '').trim() || title,
    openingLines,
    introDurationInFrames,
    outroDurationInFrames,
    transitionDurationInFrames,
    disclaimer: 'Os palpites têm caráter exclusivamente recreativo.',
    voiceoverEnabled: voiceoverEnabled !== false,
    matches,
  };

  const payload = `${JSON.stringify(job, null, 2)}\n`;
  await fs.writeFile(footballPredictionsLongJobFile, payload, 'utf8');

  return {job, validation: parsed};
};

const roundSummaryStatLabels = [
  ['Shots on Goal', 'No alvo'],
  ['Total Shots', 'Finalizações'],
  ['Ball Possession', 'Posse'],
  ['Corner Kicks', 'Escanteios'],
  ['Fouls', 'Faltas'],
  ['Yellow Cards', 'Cartões amarelos'],
  ['Red Cards', 'Cartões vermelhos'],
  ['Goalkeeper Saves', 'Defesas'],
  ['Passes %', 'Precisão passe'],
];

const normalizeApiStatisticValue = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  return String(value);
};

const findStatistic = (teamStats, type) => {
  const row = teamStats.find(
    (stat) => normalizeTeamAliasKey(stat?.type) === normalizeTeamAliasKey(type)
  );
  return normalizeApiStatisticValue(row?.value);
};

const buildRoundSummaryStats = (statisticsPayload) => {
  const teams = Array.isArray(statisticsPayload?.response) ? statisticsPayload.response : [];
  const homeStats = Array.isArray(teams[0]?.statistics) ? teams[0].statistics : [];
  const awayStats = Array.isArray(teams[1]?.statistics) ? teams[1].statistics : [];

  return roundSummaryStatLabels
    .map(([apiType, label]) => ({
      label,
      homeValue: findStatistic(homeStats, apiType),
      awayValue: findStatistic(awayStats, apiType),
    }))
    .filter((stat) => stat.homeValue !== '0' || stat.awayValue !== '0')
    .slice(0, 7);
};

const mapRoundSummaryEventType = (event) => {
  const type = String(event?.type ?? '').toLowerCase();
  const detail = String(event?.detail ?? '').toLowerCase();

  if (type.includes('goal')) {
    return detail.includes('penalty') ? 'penalty' : 'goal';
  }
  if (type.includes('card')) return 'card';
  if (type.includes('subst')) return 'subst';
  if (type.includes('var')) return 'var';
  return 'other';
};

const buildRoundSummaryEvents = (eventsPayload, homeTeamName, awayTeamName) => {
  const events = Array.isArray(eventsPayload?.response) ? eventsPayload.response : [];

  return events
    .map((event) => {
      const teamName = String(event?.team?.name ?? '').trim();
      const side =
        normalizeTeamAliasKey(teamName) === normalizeTeamAliasKey(homeTeamName) ? 'home' : 'away';
      return {
        minute: Number(event?.time?.elapsed ?? 0),
        extraMinute: Number.isFinite(Number(event?.time?.extra)) ? Number(event.time.extra) : null,
        team: teamName,
        player: String(event?.player?.name ?? '').trim(),
        assist: String(event?.assist?.name ?? '').trim() || null,
        type: mapRoundSummaryEventType(event),
        detail: String(event?.detail ?? event?.type ?? '').trim(),
        side,
      };
    })
    .filter((event) => event.minute > 0 && ['goal', 'penalty', 'card', 'var'].includes(event.type))
    .sort((left, right) => left.minute - right.minute);
};

const buildRoundSummaryHighlights = ({fixture, stats, events, homeTeam, awayTeam}) => {
  const highlights = [];
  const goals = events.filter((event) => event.type === 'goal' || event.type === 'penalty');
  const redCards = events.filter((event) => event.type === 'card' && /red|vermelho/i.test(event.detail));
  const possession = stats.find((stat) => stat.label === 'Posse');
  const shots = stats.find((stat) => stat.label === 'Finalizações');
  const homeScore = Number(fixture?.goals?.home ?? 0);
  const awayScore = Number(fixture?.goals?.away ?? 0);

  if (homeScore !== awayScore) {
    highlights.push(`${homeScore > awayScore ? homeTeam : awayTeam} venceu pelo placar de ${homeScore} a ${awayScore}.`);
  } else {
    highlights.push(`Empate em ${homeScore} a ${awayScore}, com equilíbrio no placar final.`);
  }
  if (goals.length) {
    highlights.push(`Gols de ${goals.map((event) => event.player || event.team).join(', ')}.`);
  }
  if (redCards.length) {
    highlights.push(`Expulsão para ${redCards.map((event) => event.player || event.team).join(', ')}.`);
  }
  if (shots && shots.homeValue !== '0' && shots.awayValue !== '0') {
    highlights.push(`Finalizações: ${homeTeam} ${shots.homeValue}, ${awayTeam} ${shots.awayValue}.`);
  }
  if (possession && possession.homeValue !== '0' && possession.awayValue !== '0') {
    highlights.push(`Posse de bola: ${homeTeam} ${possession.homeValue}, ${awayTeam} ${possession.awayValue}.`);
  }

  return highlights.slice(0, 4);
};

export const parseFootballRoundSummaryLongYaml = (yamlText) => {
  const data = parseSimpleYaml(yamlText);
  const errors = [];
  const matches = Array.isArray(data.matches) ? data.matches : [];

  if (!matches.length) errors.push('Missing required field: matches.');

  const seen = new Set();
  matches.forEach((match, index) => {
    const label = `Match ${index + 1}`;
    const fixtureId = Number(match.fixtureId);
    const voiceover = String(match.voiceover ?? '').trim();

    if (!Number.isFinite(fixtureId)) errors.push(`${label}: fixtureId is required.`);
    if (!voiceover) errors.push(`${label}: voiceover is required.`);
    if (seen.has(fixtureId)) errors.push(`${label}: duplicate fixtureId ${fixtureId}.`);
    seen.add(fixtureId);
  });

  return {
    ok: errors.length === 0,
    errors,
    data,
  };
};

export const prepareFootballRoundSummaryLongJob = async ({
  yamlText,
  apiKey,
  apiHost,
  brandName,
  soundtrackPath,
  soundtrackVolume,
  voiceoverEnabled = true,
}) => {
  await ensureDirectories();

  const parsed = parseFootballRoundSummaryLongYaml(yamlText);
  if (!parsed.ok) {
    const error = new Error(parsed.errors.join('\n'));
    error.errorType = 'yaml_validation_error';
    error.details = {errors: parsed.errors};
    throw error;
  }

  const data = parsed.data;
  const aliasesConfig = await loadTeamNameAliases();
  const accentConfig = await loadTeamAccentColors();
  const selectedSoundtrack = soundtrackPath?.trim() || defaultFootballSoundtrack?.value;
  const introDurationInFrames = await getAudioDurationInFrames(selectedSoundtrack, 300);
  const outroDurationInFrames = await getAudioDurationInFrames(selectedSoundtrack, 300);
  const transitionDurationInFrames = 18;

  const matches = [];
  let leagueId = Number(data.leagueId);
  let season = Number(data.season);
  let leagueName = String(data.league ?? '').trim();
  let roundLabel = String(data.round ?? '').trim();

  for (const [index, match] of data.matches.entries()) {
    const fixtureId = Number(match.fixtureId);
    const fixturePayload = await fetchJson(
      `https://${apiHost}/fixtures?id=${fixtureId}`,
      apiKey,
      apiHost
    );
    const fixture = fixturePayload.response?.[0];
    if (!fixture) {
      throw new Error(`No fixture found for fixtureId ${fixtureId}.`);
    }

    leagueId = Number.isFinite(leagueId) ? leagueId : Number(fixture.league?.id);
    season = Number.isFinite(season) ? season : Number(fixture.league?.season);
    leagueName =
      leagueName ||
      getLeagueNameWithSeason(fixture.league?.name ?? `League ${leagueId}`, season, 'pt-br');
    roundLabel = roundLabel || deriveFootballRoundLabel('results', fixture.league?.round ?? '', 'pt-br');

    const apiHomeTeam = fixture.teams?.home?.name;
    const apiAwayTeam = fixture.teams?.away?.name;
    const home = longformBadgeForTeam(apiHomeTeam, leagueId, aliasesConfig, accentConfig);
    const away = longformBadgeForTeam(apiAwayTeam, leagueId, aliasesConfig, accentConfig);
    const eventsPayload = await fetchJson(
      `https://${apiHost}/fixtures/events?fixture=${fixtureId}`,
      apiKey,
      apiHost
    );
    const statisticsPayload = await fetchJson(
      `https://${apiHost}/fixtures/statistics?fixture=${fixtureId}`,
      apiKey,
      apiHost
    );
    const events = buildRoundSummaryEvents(eventsPayload, apiHomeTeam, apiAwayTeam);
    const keyStats = buildRoundSummaryStats(statisticsPayload);
    const voiceover = String(match.voiceover).trim();
    const voiceoverPath =
      voiceoverEnabled !== false
        ? await generateGoogleVoiceover({text: voiceover, languageProfile: 'pt-br'})
        : undefined;

    matches.push({
      id: `${sanitize(home.team)}-${sanitize(away.team)}-${index + 1}`,
      fixtureId,
      homeTeam: home.team,
      awayTeam: away.team,
      homeScore: Number(fixture.goals?.home ?? fixture.score?.fulltime?.home ?? 0),
      awayScore: Number(fixture.goals?.away ?? fixture.score?.fulltime?.away ?? 0),
      fixtureDateLabel: getFixtureDateKey(fixture, 'pt-br') ?? undefined,
      venueLabel: fixture.fixture?.venue?.name ?? undefined,
      statusLabel: fixture.fixture?.status?.short ?? 'FT',
      voiceover,
      voiceoverPath,
      durationInFrames: estimateVoiceoverFrames(voiceover),
      homeBadge: {
        ...home.badge,
        logoPath:
          (await resolveTeamLogo({
            logoUrl: fixture.teams?.home?.logo,
            apiTeamName: apiHomeTeam,
            displayTeamName: home.team,
            leagueId,
            aliasesConfig,
          })) ?? home.badge.logoPath,
      },
      awayBadge: {
        ...away.badge,
        logoPath:
          (await resolveTeamLogo({
            logoUrl: fixture.teams?.away?.logo,
            apiTeamName: apiAwayTeam,
            displayTeamName: away.team,
            leagueId,
            aliasesConfig,
          })) ?? away.badge.logoPath,
      },
      events,
      keyStats,
      highlights: buildRoundSummaryHighlights({fixture, stats: keyStats, events, homeTeam: home.team, awayTeam: away.team}),
    });
  }

  const matchDurationTotal = matches.reduce(
    (total, match) => total + match.durationInFrames + transitionDurationInFrames,
    0
  );
  const title = String(data.title ?? '').trim() || 'Resumo da Rodada';
  const outputName = String(data.outputName ?? '').trim() || `${sanitize(title)}.mp4`;
  const normalizedOutputName = outputName.toLowerCase().endsWith('.mp4')
    ? outputName
    : `${outputName}.mp4`;
  const openingLines = [data.openingLine1, data.openingLine2]
    .map((line) => String(line ?? '').trim())
    .filter(Boolean);

  const job = {
    sport: 'football',
    template: 'round-summary-long',
    compositionId: 'FootballRoundSummaryLong',
    leagueId: Number.isFinite(leagueId) ? leagueId : 0,
    season: Number.isFinite(season) ? season : new Date().getFullYear(),
    leagueName: leagueName || 'Football',
    channelProfile: 'pt',
    languageProfile: 'pt-br',
    brandName: brandName?.trim() || 'Foot Analysis',
    brandLogoPath: '/branding/foot-analysis-logo.png',
    soundtrackPath: selectedSoundtrack,
    soundtrackLabel:
      footballSoundtrackPresets.find((preset) => preset.value === selectedSoundtrack)?.label ??
      defaultFootballSoundtrack?.label,
    soundtrackVolume: Number.isFinite(Number(soundtrackVolume))
      ? Math.max(0, Math.min(1, Number(soundtrackVolume)))
      : 0.92,
    outputName: normalizedOutputName,
    durationInFrames:
      introDurationInFrames + matchDurationTotal + outroDurationInFrames,
    dataSource: 'api',
    title,
    roundLabel: roundLabel || title,
    openingLines,
    introDurationInFrames,
    outroDurationInFrames,
    transitionDurationInFrames,
    disclaimer: 'Os dados são baseados nas informações disponíveis da partida.',
    voiceoverEnabled: voiceoverEnabled !== false,
    matches,
  };

  await writeFootballJobFiles(job);

  return {job, validation: parsed};
};

export const loadCurrentJob = async () => {
  const raw = await fs.readFile(currentJobFile, 'utf8');
  return JSON.parse(raw);
};

export const prepareJob = async ({
  template,
  apiKey,
  apiHost = 'v3.football.api-sports.io',
  leagueId,
  season,
  round,
  matchDate,
  matchDates,
  brandName,
  leagueName,
  roundLabel,
  outputName,
  channelProfile = languageProfile === 'en' ? 'en' : 'pt',
  languageProfile = 'pt-br',
  groupLetter,
  competitionName,
  ctaText,
  soundtrackPath,
  soundtrackVolume,
  introTitle,
  introSubtitle,
  hookText,
  voiceoverText,
  voiceoverEnabled = true,
  includeFinalResult = true,
  championFinalSelection,
  championFinalRank,
  predictionEdits,
  fixtureEdits,
  standingEdits,
  seasonFinalVerdictEdits,
  tierlistSelections,
  topScorerPrediction,
  bestPlayerPrediction,
}) => {
  await ensureDirectories();

  if (template === 'world-cup-group-standings') {
    const baseJob = await buildWorldCupGroupJob({
      apiKey,
      apiHost,
      season,
      brandName,
      outputName,
      channelProfile,
      languageProfile,
      groupLetter,
      competitionName,
      roundLabel,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
      leagueName,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'tierlist') {
    const baseJob = await buildTierlistJob({
      apiKey,
      apiHost,
      season,
      brandName,
      outputName,
      channelProfile,
      languageProfile,
      leagueName,
      roundLabel,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
      tierlistSelections,
      topScorerPrediction,
      bestPlayerPrediction,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'world-cup-knockout') {
    const baseJob = await buildWorldCupKnockoutJob({
      season,
      brandName,
      outputName,
      channelProfile,
      languageProfile,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (!apiKey) {
    throw new Error('Missing FOOTBALL_API_KEY.');
  }

  const leagueConfig = await loadLeagueConfig(leagueId);
  const aliasesConfig = await loadTeamNameAliases();

  if (template === 'championship-pace' || template === 'relegation-line') {
    const baseJob = await buildPaceJob({
      template,
      apiKey,
      apiHost,
      leagueId,
      season,
      brandName,
      leagueName,
      roundLabel,
      outputName,
      channelProfile,
      languageProfile,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'top-scorers') {
    const baseJob = await buildTopScorersJob({
      apiKey,
      apiHost,
      leagueId,
      season,
      brandName,
      leagueName,
      roundLabel,
      outputName,
      channelProfile,
      languageProfile,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'player-of-round') {
    const baseJob = await buildPlayerOfRoundJob({
      apiKey,
      apiHost,
      leagueId,
      season,
      round,
      matchDate,
      matchDates,
      brandName,
      leagueName,
      roundLabel,
      outputName,
      channelProfile,
      languageProfile,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'standings') {
    const payload = await fetchJson(
      `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
      apiKey,
      apiHost
    );
    const league = payload.response?.[0]?.league;
    const standingsRows = flattenStandingsGroups(league?.standings);
    const rows = applyStandingEdits(
      await buildStandingsRows(standingsRows, leagueId, aliasesConfig),
      standingEdits
    );

    const finalLeagueName =
      leagueName?.trim() ||
      getLeagueNameWithSeason(league?.name ?? `League ${leagueId}`, season, languageProfile);
    const seasonDisplay = formatFootballSeasonDisplay({season, languageProfile});
    const requestedStandingsLabel = roundLabel?.trim() ?? '';
    const defaultStandingsLabel = await resolveDefaultStandingsLabel({
      apiKey,
      apiHost,
      leagueId,
      season,
      languageProfile,
    });
    const finalStandingsLabel = isAutoStandingsLabel(requestedStandingsLabel)
      ? defaultStandingsLabel
      : requestedStandingsLabel;
    const baseJob = {
      ...makeBaseJob({
        template: 'standings',
        leagueId,
        season,
        leagueName: finalLeagueName,
        brandName,
        outputName: outputName?.trim() || `${sanitize(finalLeagueName)}-standings.mp4`,
        durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
        channelProfile,
        languageProfile,
        soundtrackPath,
        soundtrackVolume,
      }),
      compositionId: 'FootballStandingsShort',
      leagueConfig,
      standingsLabel: resolveFootballDisplayLabel(
        'standings',
        finalStandingsLabel,
        languageProfile
      ),
      ctaText: ctaText?.trim() || getFootballDefaultCta('standings', languageProfile),
      warnings:
        rows.length === 0
          ? [`No standings data found for league ${leagueId} season ${season}.`]
          : undefined,
      rows,
    };
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'season-final-verdict') {
    const payload = await fetchJson(
      `https://${apiHost}/standings?league=${leagueId}&season=${season}`,
      apiKey,
      apiHost
    );
    const league = payload.response?.[0]?.league;
    const standingsRows = flattenStandingsGroups(league?.standings);
    const rows = await buildStandingsRows(standingsRows, leagueId, aliasesConfig);

    if (rows.length === 0) {
      throw new Error(`No standings data found for league ${leagueId} season ${season}.`);
    }

    const finalLeagueName =
      leagueName?.trim() ||
      getLeagueNameWithSeason(league?.name ?? `League ${leagueId}`, season, languageProfile);
    const seasonDisplay = formatFootballSeasonDisplay({season, languageProfile});
    const verdictSections = buildSeasonFinalVerdictSections({
      rows,
      leagueConfig,
      languageProfile,
      verdictOverrides: seasonFinalVerdictEdits,
    });
    const baseJob = {
      ...makeBaseJob({
        template: 'season-final-verdict',
        leagueId,
        season,
        leagueName: finalLeagueName,
        brandName,
        outputName:
          outputName?.trim() ||
          `${sanitize(finalLeagueName)}-${
            languageProfile === 'en' ? 'final-verdict' : 'resumo-final'
          }.mp4`,
        durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
        channelProfile,
        languageProfile,
        soundtrackPath,
        soundtrackVolume,
      }),
      compositionId: 'FootballSeasonFinalVerdictShort',
      leagueConfig,
      titleLabel: languageProfile === 'en' ? 'Season Wrap-up' : 'Resumo Final',
      subtitleLabel:
        roundLabel?.trim() ||
        (languageProfile === 'en'
          ? `Season ${seasonDisplay} Decided`
          : `Temporada ${seasonDisplay} Definida`),
      ctaText:
        ctaText?.trim() || getFootballDefaultCta('season-final-verdict', languageProfile),
      ...verdictSections,
    };
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  if (template === 'continental-groups-standings') {
    const baseJob = await buildContinentalGroupsJob({
      apiKey,
      apiHost,
      leagueId,
      season,
      brandName,
      leagueName,
      roundLabel,
      outputName,
      channelProfile,
      languageProfile,
      ctaText,
      soundtrackPath,
      soundtrackVolume,
    });
    const job = await addFootballIntroAndVoiceover(baseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(job);
    return {job, files: {currentJobFile, logosDir}};
  }

  const payload = await fetchJson(
    `https://${apiHost}/fixtures?league=${leagueId}&season=${season}`,
    apiKey,
    apiHost
  );
  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  const {detectedRound, normalizedMatchDate, normalizedMatchDates, roundFixtures} =
    resolveTemplateFixtures({
    fixtures,
    template,
    round,
    matchDate,
    matchDates,
    languageProfile,
  });
  const fixtureCards = await buildFixtures({
    fixtures: roundFixtures,
    template,
    leagueId,
    aliasesConfig,
    predictionEditMap: buildPredictionEditMap(predictionEdits),
    fixtureEditMap: buildPredictionEditMap(fixtureEdits),
    apiKey,
    apiHost,
    languageProfile,
  });

  if (fixtureCards.length === 0) {
    throw new Error(`No fixtures available for round "${detectedRound}".`);
  }

  const apiLeagueName = payload.response?.[0]?.league?.name ?? `League ${leagueId}`;
  const finalLeagueName =
    leagueName?.trim() || getLeagueNameWithSeason(apiLeagueName, season, languageProfile);
  const finalRoundLabel =
    roundLabel?.trim() ||
    deriveFootballRoundLabel(template, detectedRound, languageProfile);
  const dateOutputSlug = normalizedMatchDates.length
    ? sanitize(normalizedMatchDates.length <= 2 ? normalizedMatchDates.join('-') : `${normalizedMatchDates.length}-dates`)
    : '';
  const baseJob = {
    ...makeBaseJob({
      template,
      leagueId,
      season,
      leagueName: finalLeagueName,
      brandName,
      outputName:
        outputName?.trim() ||
        `${sanitize(finalLeagueName)}-${template}-${sanitize(detectedRound)}${
          dateOutputSlug ? `-${dateOutputSlug}` : ''
        }.mp4`,
      durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
      channelProfile,
      languageProfile,
      soundtrackPath,
      soundtrackVolume,
    }),
    compositionId:
      template === 'results'
        ? 'FootballResultsShort'
        : template === 'next-games'
          ? 'FootballNextGamesShort'
          : 'FootballPredictionsShort',
    leagueConfig,
    round: detectedRound,
    matchDate: normalizedMatchDate || undefined,
    matchDates: normalizedMatchDates.length ? normalizedMatchDates : undefined,
    roundLabel: finalRoundLabel,
    ctaText: ctaText?.trim() || getFootballDefaultCta(template, languageProfile),
    fixtures: fixtureCards,
  };
  if (template === 'champion-final') {
    const selectedChampion =
      (await loadChampionByStandingRank({
        apiKey,
        apiHost,
        leagueId,
        season,
        rank: championFinalRank,
        aliasesConfig,
      })) ?? normalizeChampionFinalSelection(championFinalSelection);
    const needsChampionFixture = !selectedChampion || includeFinalResult;
    const championFixture = needsChampionFixture ? pickChampionFinalFixture(fixtureCards) : undefined;
    const champion = selectedChampion ?? resolveChampionFromFixture(championFixture);
    const seasonDisplay = formatFootballSeasonDisplay({season, languageProfile});
    const championBaseJob = {
      ...makeBaseJob({
        template: 'champion-final',
        leagueId,
        season,
        leagueName: finalLeagueName,
        brandName,
        outputName:
          outputName?.trim() ||
          `${sanitize(finalLeagueName)}-${languageProfile === 'en' ? 'champions' : 'campeao'}-${sanitize(
            detectedRound
          )}.mp4`,
        durationInFrames: FOOTBALL_DURATION_IN_FRAMES,
        channelProfile,
        languageProfile,
        soundtrackPath,
        soundtrackVolume,
      }),
      compositionId: 'FootballChampionFinalShort',
      leagueConfig,
      championTeam: champion.team,
      championBadge: champion.badge,
      titleLabel: languageProfile === 'en' ? 'Champions' : 'Campeão',
      subtitleLabel: finalLeagueName,
      seasonLabel:
        languageProfile === 'en' ? `Season ${seasonDisplay}` : `Temporada ${seasonDisplay}`,
      ctaText: ctaText?.trim() || getFootballDefaultCta('champion-final', languageProfile),
      finalFixture: includeFinalResult ? championFixture : undefined,
    };
    const championJob = await addFootballIntroAndVoiceover(championBaseJob, {
      introTitle,
      introSubtitle,
      hookText,
      voiceoverText,
      voiceoverEnabled,
    });

    await writeFootballJobFiles(championJob);
    return {job: championJob, files: {currentJobFile, logosDir}};
  }
  const job = await addFootballIntroAndVoiceover(baseJob, {
    introTitle,
    introSubtitle,
    hookText,
    voiceoverText,
    voiceoverEnabled,
  });

  await writeFootballJobFiles(job);
  return {job, files: {currentJobFile, logosDir}};
};

export const readDashboardState = async () => {
  try {
    return await loadCurrentJob();
  } catch {
    return null;
  }
};
