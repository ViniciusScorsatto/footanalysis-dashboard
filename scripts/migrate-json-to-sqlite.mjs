import fs from 'node:fs/promises';
import path from 'node:path';
import {getDb, migrateDatabase, projectRoot, sqliteFile} from './lib/db.mjs';
import {loadCurrentVideoJob, loadLatestVideoJobByTemplate, saveVideoJob} from './lib/football-db.mjs';

const args = new Set(process.argv.slice(2));
const generatedDir = path.join(projectRoot, 'src', 'data', 'generated');
const currentJobFile = path.join(generatedDir, 'current-job.football.json');
const historyCacheDir = path.join(projectRoot, 'src', 'history', 'cache');

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));
const writeJson = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), {recursive: true});
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const getTemplateJobFile = (template) =>
  path.join(generatedDir, `current-job.football.${template}.json`);

const importGeneratedJobs = async () => {
  const filenames = (await fs.readdir(generatedDir).catch(() => []))
    .filter((filename) => /^current-job\.football(?:\.[^.]+)?\.json$/.test(filename))
    .sort((left, right) => (left === 'current-job.football.json' ? 1 : 0) - (right === 'current-job.football.json' ? 1 : 0));
  let imported = 0;

  for (const filename of filenames) {
    const filePath = path.join(generatedDir, filename);
    const job = await readJson(filePath).catch(() => null);
    if (!job?.template || !job?.compositionId) continue;
    saveVideoJob(job, {markCurrent: filename === 'current-job.football.json'});
    imported += 1;
  }

  return imported;
};

const importHistoryCache = async () => {
  const db = getDb();
  let imported = 0;
  const competitionIds = await fs.readdir(historyCacheDir).catch(() => []);

  for (const competitionId of competitionIds) {
    const folder = path.join(historyCacheDir, competitionId);
    const stat = await fs.stat(folder).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const filenames = (await fs.readdir(folder)).filter((filename) => filename.endsWith('.json'));
    for (const filename of filenames) {
      const generatorId = filename.replace(/\.json$/i, '');
      const payload = await readJson(path.join(folder, filename)).catch(() => null);
      if (!payload) continue;
      db.prepare(
        `INSERT INTO history_cache (competition_id, generator_id, payload_json, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(competition_id, generator_id) DO UPDATE SET
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`
      ).run(competitionId, generatorId, JSON.stringify(payload));
      imported += 1;
    }
  }

  return imported;
};

const exportCurrent = async () => {
  const currentJob = loadCurrentVideoJob();
  if (!currentJob?.template) {
    return false;
  }

  await writeJson(currentJobFile, currentJob);
  await writeJson(getTemplateJobFile(currentJob.template), currentJob);

  const templateJob = loadLatestVideoJobByTemplate(currentJob.template);
  if (templateJob && templateJob !== currentJob) {
    await writeJson(getTemplateJobFile(templateJob.template), templateJob);
  }

  return true;
};

migrateDatabase(getDb());

if (args.has('--migrate-only')) {
  console.log(`SQLite schema ready: ${sqliteFile}`);
  process.exit(0);
}

if (args.has('--export-current')) {
  const exported = await exportCurrent();
  console.log(exported ? 'Exported current job JSON from SQLite.' : 'No current job found in SQLite.');
  process.exit(0);
}

const jobs = await importGeneratedJobs();
const history = await importHistoryCache();
const exported = await exportCurrent();

console.log(`SQLite schema ready: ${sqliteFile}`);
console.log(`Imported video jobs: ${jobs}`);
console.log(`Imported history cache entries: ${history}`);
console.log(exported ? 'Exported current job JSON from SQLite.' : 'No current job to export.');
