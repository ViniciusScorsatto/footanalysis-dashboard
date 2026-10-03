import path from 'node:path';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';

const types = {'.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'};
export async function streamFile(request, response, base, relative, downloadName) {
  let file;
  try {
    const baseReal = await fs.realpath(base);
    file = await fs.realpath(path.resolve(base, relative));
    if (!file.startsWith(baseReal + path.sep)) throw new Error('outside root');
    const stat = await fs.stat(file);
    if (!stat.isFile()) throw new Error('not file');
    const headers = {'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'accept-ranges': 'bytes', 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff'};
    if (downloadName) headers['content-disposition'] = `attachment; filename="${downloadName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`;
    let start = 0;
    let end = stat.size - 1;
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {response.writeHead(416, {'content-range': `bytes */${stat.size}`}); response.end(); return;}
      if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {response.writeHead(416, {'content-range': `bytes */${stat.size}`}); response.end(); return;}
      headers['content-range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['content-length'] = String(Math.max(0, end - start + 1));
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD' || stat.size === 0) {response.end(); return;}
    await pipeline(createReadStream(file, {start, end}), response);
  } catch {
    if (!response.headersSent) {response.writeHead(404); response.end();}
    else response.destroy();
  }
}
