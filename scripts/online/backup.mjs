// Run while no preparation/editing is in progress. SQLite backup is WAL-safe.
import fs from 'node:fs/promises';
import path from 'node:path';
import {getDb} from '../lib/db.mjs';
import {online, stateRoot} from './paths.mjs';
if (!online) throw new Error('Set FOOT_ANALYSIS_ONLINE=1 and the production data directory');
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Pass a new absolute backup directory');
if (path.resolve(destination).startsWith(stateRoot + path.sep)) throw new Error('Keep backups outside the data directory');
await fs.mkdir(destination, {recursive: false});
await getDb().backup(path.join(destination,'foot-analysis.sqlite'));
for (const name of ['public','config','generated','history-cache']) {
  await fs.cp(path.join(stateRoot,name),path.join(destination,name),{recursive:true}).catch(error=>{if(error.code!=='ENOENT')throw error;});
}
console.log('Backup complete. MP4s excluded; retained snapshots can be rendered again.');
