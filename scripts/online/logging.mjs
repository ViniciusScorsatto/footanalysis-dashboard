import {randomUUID} from 'node:crypto';

const sensitive = /secret|token|password|authorization|cookie|api.?key|credential|client.?id|email/i;
export function redact(value) {
  let text = String(value ?? '');
  for (const [key, secret] of Object.entries(process.env)) {
    if (sensitive.test(key) && secret && secret.length >= 4) text = text.split(secret).join('[REDACTED]');
  }
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, (value) => {
      try {const url = new URL(value); return `${url.origin}${url.pathname}${url.search ? '?[REDACTED]' : ''}`;} catch {return '[URL]';}
    })
    .replace(/Bearer\s+[^\s,"']+/gi, 'Bearer [REDACTED]')
    .replace(/(["']?(?:[\w-]*(?:secret|token|password|cookie|authorization|api[-_]?key|apisports-key)|code)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1[REDACTED]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .slice(0, 4000);
}

function clean(value, depth = 0) {
  if (depth > 5) return '[TRUNCATED]';
  if (value instanceof Error) return clean({name: value.name, message: value.message, stack: value.stack, cause: value.cause}, depth + 1);
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => clean(item, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 40).map(([key, item]) => [key, sensitive.test(key) ? '[REDACTED]' : clean(item, depth + 1)]));
  return value;
}

export function logEvent(event, fields = {}, level = 'info') {
  const line = JSON.stringify({timestamp: new Date().toISOString(), level, event, ...clean(fields)});
  (level === 'error' ? console.error : console.log)(line);
}

export function jobContext(body = {}) {
  return Object.fromEntries(['template', 'leagueId', 'season', 'round', 'matchDate', 'channelProfile', 'videoMode', 'voiceoverEnabled', 'compositionId', 'durationInFrames'].filter((key) => ['string', 'number', 'boolean'].includes(typeof body[key])).map((key) => [key, body[key]]));
}

export function traceRequest(request, response, url) {
  const context = {requestId: randomUUID(), method: request.method, path: url.pathname};
  request.diagnostic = response.diagnostic = context;
  response.setHeader('X-Request-Id', context.requestId);
  const start = Date.now();
  const jobRequest = url.pathname.startsWith('/api/football/jobs/') && request.method === 'POST';
  if (jobRequest) logEvent('request_started', context);
  response.once('finish', () => {
    if (jobRequest || response.statusCode >= 500) logEvent('request_finished', {...context, status: response.statusCode, elapsedMs: Date.now() - start});
  });
}

export function publicFailure(response, status, error) {
  const context = response.diagnostic ?? {requestId: randomUUID()};
  logEvent('request_failed', {...context, status, error}, 'error');
  return {ok: false, errorId: context.requestId, error: `Não foi possível concluir. Confira os dados e tente novamente. Referência: ${context.requestId}`};
}
