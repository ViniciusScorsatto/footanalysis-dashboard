import crypto from 'node:crypto';
import {logEvent} from './logging.mjs';

const COOKIE = 'fa_session';
const STATE_COOKIE = 'fa_oauth';
export const readCookie = (request, name) => (request.headers.cookie ?? '').split(';').map((s) => s.trim()).find((s) => s.startsWith(`${name}=`))?.slice(name.length + 1);
const cookie = (name, value, seconds) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
const redirect = (response, location) => {response.writeHead(302, {location, 'cache-control': 'no-store'}); response.end();};

export async function verifyGoogleIdentity(token, {clientId, email, nonce, fetchImpl = fetch, now = Date.now()}) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Invalid identity');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url'));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid identity');
  const response = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs', {signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('Identity service unavailable');
  const jwk = (await response.json()).keys?.find((key) => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk || !crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), crypto.createPublicKey({key: jwk, format: 'jwk'}), Buffer.from(parts[2], 'base64url'))) throw new Error('Invalid signature');
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss) || claims.aud !== clientId || (claims.azp && claims.azp !== clientId) || !Number.isFinite(claims.exp) || claims.exp * 1000 <= now || !Number.isFinite(claims.iat) || claims.iat * 1000 > now + 60000 || claims.nonce !== nonce || claims.email_verified !== true || claims.email?.toLowerCase() !== email.toLowerCase() || !claims.sub) throw new Error('Account not allowed');
  return claims;
}

export function createAuth({store, origin, clientId, clientSecret, allowedEmail, fetchImpl = fetch}) {
  if (new URL(origin).protocol !== 'https:' || !clientId || !clientSecret || !allowedEmail) throw new Error('Configure HTTPS PUBLIC_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ALLOWED_EMAIL');
  const canonicalOrigin = new URL(origin).origin;
  const callback = `${canonicalOrigin}/auth/google/callback`;
  return {
    authenticated(request) {
      const session = store.session(readCookie(request, COOKIE));
      return session?.subject.startsWith(`${allowedEmail.toLowerCase()}|`) ? session : null;
    },
    validWrite(request) { return request.headers.origin === canonicalOrigin; },
    async handle(request, response, url) {
      if (url.pathname === '/auth/google' && request.method === 'GET') {
        const {state, nonce, verifier} = store.startOAuth();
        const params = new URLSearchParams({client_id: clientId, redirect_uri: callback, response_type: 'code', scope: 'openid email', state, nonce, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', prompt: 'select_account'});
        response.setHeader('Set-Cookie', cookie(STATE_COOKIE, state, 600));
        redirect(response, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        return true;
      }
      if (url.pathname === '/auth/google/callback' && request.method === 'GET') {
        response.setHeader('Set-Cookie', cookie(STATE_COOKIE, '', 0));
        let stage = 'state_cookie';
        try {
          const state = url.searchParams.get('state');
          if (!state || state !== readCookie(request, STATE_COOKIE)) throw new Error('Invalid state');
          stage = 'callback_state';
          const record = store.consumeOAuth(state);
          if (!record || !url.searchParams.get('code')) throw new Error('Invalid callback');
          stage = 'token_exchange';
          const result = await fetchImpl('https://oauth2.googleapis.com/token', {method: 'POST', signal: AbortSignal.timeout(15000), headers: {'content-type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({client_id: clientId, client_secret: clientSecret, redirect_uri: callback, grant_type: 'authorization_code', code: url.searchParams.get('code'), code_verifier: record.verifier})});
          if (!result.ok) throw new Error('Token exchange failed');
          stage = 'identity_verification';
          const identity = await verifyGoogleIdentity((await result.json()).id_token, {clientId, email: allowedEmail, nonce: record.nonce, fetchImpl});
          response.setHeader('Set-Cookie', [cookie(STATE_COOKIE, '', 0), cookie(COOKIE, store.createSession(`${allowedEmail.toLowerCase()}|${identity.sub}`), 604800)]);
          redirect(response, '/football');
        } catch {
          const reference=crypto.randomUUID();
          logEvent('login_failed', {requestId:reference,stage}, 'error');
          response.writeHead(403, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
          response.end(`<!doctype html><html lang="pt-br"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Entrar · Foot Analysis</title><body style="background:#0d1117;color:#edf2f7;font:16px system-ui;line-height:1.6;padding:24px;max-width:560px;margin:auto"><h1>Não foi possível entrar</h1><p>Use a conta Google autorizada. Se o login demorou ou foi aberto em outro navegador, inicie novamente neste navegador.</p><p>Se estiver dentro de outro aplicativo, abra o dashboard no Safari ou Chrome e tente novamente.</p><a style="display:inline-block;padding:12px;color:#78b2ff" href="/auth/google">Tentar novamente com Google</a><p style="overflow-wrap:anywhere">Referência: ${reference}</p></body></html>`);
        }
        return true;
      }
      if (url.pathname === '/auth/logout' && request.method === 'POST') {
        if (!this.validWrite(request)) {response.writeHead(403); response.end(); return true;}
        store.logout(readCookie(request, COOKIE));
        response.setHeader('Set-Cookie', cookie(COOKIE, '', 0));
        redirect(response, '/');
        return true;
      }
      return false;
    },
  };
}
