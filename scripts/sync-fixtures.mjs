import {prepareJob} from './lib/video-system.mjs';

const template = process.env.FOOTBALL_TEMPLATE ?? 'results';
const apiKey = process.env.FOOTBALL_API_KEY;
const apiHost = process.env.FOOTBALL_API_HOST ?? 'v3.football.api-sports.io';
const leagueId = Number(process.env.FOOTBALL_LEAGUE_ID ?? '72');
const season = Number(process.env.FOOTBALL_SEASON ?? '2026');
const round = process.env.FOOTBALL_ROUND ?? '';
const brandName = process.env.FOOTBALL_BRAND_NAME ?? 'Foot Analysis';
const leagueName = process.env.FOOTBALL_LEAGUE_NAME ?? '';
const roundLabel = process.env.FOOTBALL_ROUND_LABEL ?? '';
const outputName = process.env.FOOTBALL_OUTPUT_NAME ?? '';

const {job, files} = await prepareJob({
  template,
  apiKey,
  apiHost,
  leagueId,
  season,
  round,
  brandName,
  leagueName,
  roundLabel,
  outputName,
});

console.log(`Prepared ${job.template} job for ${job.leagueName}`);
console.log(`Current job: ${files.currentJobFile}`);
