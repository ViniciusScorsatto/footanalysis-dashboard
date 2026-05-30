import http from 'node:http';
import readline from 'node:readline/promises';
import {stdin as input, stdout as output} from 'node:process';

const scope = 'https://www.googleapis.com/auth/youtube.upload';
const redirectUri = 'http://127.0.0.1:53682/oauth2callback';
const channel = process.argv.includes('--channel=en') ? 'EN' : 'PT';

const getArgValue = (name) => {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
};

const clientId = getArgValue('--client-id') || process.env.YOUTUBE_CLIENT_ID;
const clientSecret = getArgValue('--client-secret') || process.env.YOUTUBE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    'Missing OAuth client credentials. Run with --client-id=... --client-secret=... or set YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET.'
  );
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', scope);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

const waitForCode = () =>
  new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const url = new URL(request.url ?? '/', redirectUri);
      if (url.pathname !== '/oauth2callback') {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      response.writeHead(code ? 200 : 400, {'content-type': 'text/html; charset=utf-8'});
      response.end(
        code
          ? '<h1>Authorization received</h1><p>You can return to Codex.</p>'
          : `<h1>Authorization failed</h1><p>${error ?? 'Missing code'}</p>`
      );
      server.close();

      if (code) {
        resolve(code);
      } else {
        reject(new Error(error ?? 'Missing authorization code'));
      }
    });

    server.listen(53682, '127.0.0.1', () => {
      console.log('\nOpen this URL and authorize the correct YouTube channel:\n');
      console.log(authUrl.toString());
      console.log('\nWaiting for Google redirect on http://127.0.0.1:53682/oauth2callback ...\n');
    });

    server.on('error', reject);
  });

const exchangeCode = async (code) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error_description ?? data?.error ?? 'Could not exchange authorization code.');
  }

  return data;
};

const main = async () => {
  let code = '';
  try {
    code = await waitForCode();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.log('\nIf the local redirect failed, paste the code manually.');
    const rl = readline.createInterface({input, output});
    code = await rl.question('Authorization code: ');
    rl.close();
  }

  const token = await exchangeCode(code.trim());
  if (!token.refresh_token) {
    console.error('Google did not return a refresh token. Re-run with prompt=consent or revoke app access and try again.');
    process.exit(1);
  }

  console.log('\nAdd these values to .env:\n');
  console.log(`YOUTUBE_${channel}_CLIENT_ID=${clientId}`);
  console.log(`YOUTUBE_${channel}_CLIENT_SECRET=${clientSecret}`);
  console.log(`YOUTUBE_${channel}_REFRESH_TOKEN=${token.refresh_token}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
