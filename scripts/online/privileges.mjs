import fs from 'node:fs/promises';
import path from 'node:path';

// Railway mounts volumes as root. Only this pre-listener bootstrap may use
// root; the supervisor, HTTP server, worker and Chromium run as UID/GID 1000.
export async function dropContainerPrivileges() {
  if (process.env.FOOT_ANALYSIS_CONTAINER !== '1') return;
  process.umask(0o077);
  const data = process.env.FOOT_ANALYSIS_DATA_DIR;
  if (data !== '/data') throw new Error('Container data directory must be /data');
  if (process.getuid() === 0) {
    await fs.mkdir(data, {recursive: true});
    const rootStat = await fs.lstat(data);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('Invalid volume directory');
    async function own(target) {
      const stat = await fs.lstat(target);
      // Never follow links or cross mounts while operating with privileges.
      if (stat.isSymbolicLink() || stat.dev !== rootStat.dev || (!stat.isDirectory() && (!stat.isFile() || stat.nlink !== 1))) {
        throw new Error('Unsafe entry in data volume');
      }
      if (stat.uid !== 1000 || stat.gid !== 1000) await fs.chown(target, 1000, 1000);
      if (stat.isDirectory()) {
        for (const entry of await fs.readdir(target)) {
          if (target === data && entry === 'lost+found') continue;
          await own(path.join(target, entry));
        }
      }
    }
    await own(data);
    process.setgroups([]);
    process.setgid(1000);
    process.setuid(1000);
  }
  if (process.getuid() !== 1000 || process.getgid() !== 1000) throw new Error('Unexpected container user');
  await fs.access(data, fs.constants.W_OK);
}
