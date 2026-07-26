import {generateLastChampionsHistory} from '../../src/history/index.js';
import type {HistoricalSourceMode} from '../../src/history/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

type CliOptions = {
  competition: string;
  generator: string;
  amount: number;
  source: HistoricalSourceMode;
  format: 'history' | 'remotion-job';
  writeCurrentJob: boolean;
};

const competitionNames: Record<string, string> = {
  libertadores: 'Copa Libertadores',
};

const sourceModes = new Set<HistoricalSourceMode>(['local-only', 'cache-first', 'openai-refresh']);

const readFlag = (args: string[], flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
};

const parseAmount = (value: string | undefined) => {
  const amount = Number.parseInt(value ?? '10', 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('--amount must be a positive integer.');
  }

  return amount;
};

const parseSource = (value: string | undefined): HistoricalSourceMode => {
  const source = value ?? 'cache-first';
  if (!sourceModes.has(source as HistoricalSourceMode)) {
    throw new Error('--source must be one of: cache-first, local-only, openai-refresh.');
  }

  return source as HistoricalSourceMode;
};

const hasFlag = (args: string[], flag: string) => args.includes(flag);

const parseFormat = (value: string | undefined): CliOptions['format'] => {
  const format = value ?? 'history';
  if (format !== 'history' && format !== 'remotion-job') {
    throw new Error('--format must be one of: history, remotion-job.');
  }

  return format;
};

const parseCliOptions = (args: string[]): CliOptions => ({
  competition: readFlag(args, '--competition') ?? 'libertadores',
  generator: readFlag(args, '--generator') ?? 'last-champions',
  amount: parseAmount(readFlag(args, '--amount')),
  source: parseSource(readFlag(args, '--source')),
  format: parseFormat(readFlag(args, '--format')),
  writeCurrentJob: hasFlag(args, '--write-current-job'),
});

const buildHistoricalChampionsJob = ({
  competitionId,
  competitionName,
  amount,
  history,
}: {
  competitionId: string;
  competitionName: string;
  amount: number;
  history: Awaited<ReturnType<typeof generateLastChampionsHistory>>;
}) => {
  const years = history.champions.map((entry) => entry.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  return {
    sport: 'football',
    template: 'historical-champions',
    compositionId: 'FootballStaticHistoricalChampionsShort',
    videoMode: 'static',
    leagueId: competitionId === 'libertadores' ? 13 : 0,
    season: lastYear,
    leagueName: competitionName,
    channelProfile: 'pt',
    languageProfile: 'pt-br',
    brandName: 'Foot Analysis',
    brandLogoPath: '/branding/foot-analysis-logo.png',
    outputName: `${competitionId}-ultimos-${amount}-campeoes.mp4`,
    durationInFrames: 300,
    dataSource: 'history',
    leagueConfig: {
      leagueId: competitionId === 'libertadores' ? 13 : 0,
      leagueName: competitionName,
      accentColor: competitionId === 'libertadores' ? '#F39C12' : '#F0A500',
    },
    titleLabel: `Últimos ${amount} Campeões`,
    subtitleLabel: `${competitionName} · ${firstYear}-${lastYear}`,
    ctaText: 'Qual foi o melhor campeão?',
    entries: history.champions.map((entry) => ({
      year: entry.year,
      clubId: entry.clubId,
      clubName: entry.clubName,
      country: entry.country,
      ...(entry.runnerUp ? {runnerUp: entry.runnerUp} : {}),
      ...(entry.score ? {score: entry.score} : {}),
      ...(entry.notes ? {notes: entry.notes} : {}),
      badge: entry.badge ?? {label: entry.clubName.slice(0, 3).toUpperCase()},
    })),
  };
};

const writeRemotionJobFiles = async (job: ReturnType<typeof buildHistoricalChampionsJob>) => {
  const generatedDir = path.join(process.cwd(), 'src', 'data', 'generated');
  const payload = `${JSON.stringify(job, null, 2)}\n`;
  await fs.mkdir(generatedDir, {recursive: true});
  await fs.writeFile(
    path.join(generatedDir, 'current-job.football.historical-champions.json'),
    payload,
    'utf8'
  );
  await fs.writeFile(path.join(generatedDir, 'current-job.football.json'), payload, 'utf8');
};

const main = async () => {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.generator !== 'last-champions') {
    throw new Error(`Unsupported history generator: ${options.generator}`);
  }

  const competitionName = competitionNames[options.competition] ?? options.competition;
  const history = await generateLastChampionsHistory({
    competitionId: options.competition,
    competitionName,
    amount: options.amount,
    sourceMode: options.source,
  });

  if (history.warnings && history.warnings.length > 0) {
    for (const warning of history.warnings) {
      console.warn(`[history:${warning.code}] ${warning.message}`);
    }
  }

  if (options.format === 'remotion-job') {
    const job = buildHistoricalChampionsJob({
      competitionId: options.competition,
      competitionName,
      amount: options.amount,
      history,
    });

    if (options.writeCurrentJob) {
      await writeRemotionJobFiles(job);
    }

    console.log(JSON.stringify(job, null, 2));
    return;
  }

  console.log(JSON.stringify(history, null, 2));
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
