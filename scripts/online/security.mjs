// One private user / one replica: shared budgets cannot be bypassed with forged
// X-Forwarded-For headers and require no unbounded per-address map.
export function createRequestLimits({now = Date.now} = {}) {
  const buckets = new Map();
  function take(key, limit, windowMs) {
    const time = now();
    let bucket = buckets.get(key);
    if (!bucket || time >= bucket.until) {
      bucket = {count: 0, until: time + windowMs};
      buckets.set(key, bucket);
    }
    if (bucket.count >= limit) return Math.max(1, Math.ceil((bucket.until - time) / 1000));
    bucket.count++;
    return 0;
  }
  return {
    check(request, url) {
      // Keep platform health checks independent of exhausted traffic budgets.
      if (request.method === 'GET' && url.pathname === '/healthz') return 0;
      const general = take('all', 600, 60000);
      if (general) return general;
      if (url.pathname === '/auth/google') return take('login', 10, 60000);
      if (url.pathname === '/auth/google/callback') return take('callback', 30, 60000);
      if (!['GET', 'HEAD'].includes(request.method)) return take('writes', 60, 60000);
      return 0;
    },
  };
}

export function securityHeaders(response, nonce) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'same-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' https: data: blob:",
    // Remotion uses a tiny data: audio buffer to unlock mobile playback.
    "media-src 'self' https: blob: data:", "font-src 'self' data:",
    "connect-src 'self'", "worker-src 'self' blob:", "frame-src 'self'",
    "frame-ancestors 'self'", "base-uri 'none'", "object-src 'none'", "form-action 'self'",
  ].join('; '));
}
