import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

// Exact upstream host, not a suffix match. Local overrides remain local files.
const HOSTS = new Set(['media.api-sports.io']);
export function logoUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !HOSTS.has(url.hostname)) throw new Error('LOGO_DESTINATION_BLOCKED');
  return url;
}

export function publicIPv4(address) {
  if (isIP(address) !== 4) return false;
  const [a,b,c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}

export function imageExtension(bytes, contentType) {
  const mime = String(contentType ?? '').split(';')[0].trim().toLowerCase();
  if (mime === 'image/png' && bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) && bytes.toString('ascii',12,16) === 'IHDR') return '.png';
  if (mime === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217) return '.jpg';
  if (mime === 'image/webp' && bytes.length >= 16 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return '.webp';
  if (mime === 'image/gif' && bytes.length >= 13 && ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))) return '.gif';
  // SVG/XML/HTML are deliberately not accepted as downloaded assets.
  throw new Error('LOGO_FORMAT_BLOCKED');
}

export async function fetchLogo(value, {lookupImpl = lookup, requestImpl = https.get, maxBytes = 2 * 1024 * 1024, timeoutMs = 10000} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const {signal} = controller;
  // DNS is part of the total deadline, including stalled resolution.
  const resolveHost = (host) => new Promise((resolve, reject) => {
    const abort = () => reject(new Error('LOGO_TIMEOUT'));
    signal.addEventListener('abort', abort, {once:true});
    Promise.resolve().then(() => lookupImpl(host, {all:true, family:4})).then(resolve,reject)
      .finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
  try {
    let url = logoUrl(value);
    for (let hop = 0; hop <= 2; hop++) {
      const addresses = await resolveHost(url.hostname);
      if (!addresses.length || addresses.some(({address}) => !publicIPv4(address))) throw new Error('LOGO_ADDRESS_BLOCKED');
      const address = addresses[0].address;
      const result = await new Promise((resolve, reject) => {
        // Keep TLS hostname verification/SNI, but pin DNS to the checked IPv4.
        // No shared connection pool, proxy environment or second DNS lookup.
        const req = requestImpl(url, {agent:false, family:4, signal,
          lookup: (_host, options, callback) => options?.all ? callback(null,[{address,family:4}]) : callback(null,address,4),
          headers: {Accept:'image/png,image/jpeg,image/webp,image/gif', 'Accept-Encoding':'identity'},
        }, res => {
          res.on('error',reject);
          if ([301,302,303,307,308].includes(res.statusCode)) {
            resolve({location:res.headers.location});res.destroy();return;
          }
          if (res.statusCode === 404) {resolve({missing:true});res.destroy();return;}
          if (res.statusCode !== 200 || (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity')) {reject(new Error('LOGO_RESPONSE_BLOCKED'));res.destroy();return;}
          const size = res.headers['content-length'];
          if (size !== undefined && (!/^\d+$/.test(String(size)) || Number(size) > maxBytes)) {reject(new Error('LOGO_TOO_LARGE'));res.destroy();return;}
          const chunks = [];let received = 0;
          res.on('data',chunk => {
            received += chunk.length;
            if (received > maxBytes) {reject(new Error('LOGO_TOO_LARGE'));res.destroy();return;}
            chunks.push(chunk);
          });
          res.on('aborted',() => reject(new Error('LOGO_INCOMPLETE')));
          res.on('end',() => {
            try {const bytes=Buffer.concat(chunks);resolve({bytes,extension:imageExtension(bytes,res.headers['content-type'])});}
            catch(error) {reject(error);}
          });
        });
        req.on('error',reject);
      });
      if (result.missing) return undefined;
      if (result.bytes) return result;
      if (!result.location || hop === 2) throw new Error('LOGO_REDIRECT_BLOCKED');
      url = logoUrl(new URL(result.location,url));
    }
  } finally {clearTimeout(timer);}
}
