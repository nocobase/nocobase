import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import {
  getCurrentEnvName,
  getEnv,
  setEnvOauthSession,
  type AuthStoreOptions,
  type OauthAuthConfig,
} from './auth-store.js';
import { printInfo, printVerbose, printWarning, updateTask } from './ui.js';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
const LOOPBACK_HOST = '127.0.0.1';
const OAUTH_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_OAUTH_SCOPE = 'openid api offline_access';
const DEFAULT_CLIENT_NAME = 'NocoBase CTL';

interface OauthServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
}

interface OauthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

export function getOauthMetadataUrl(baseUrl: string) {
  return `${normalizeBaseUrl(baseUrl)}/.well-known/oauth-authorization-server`;
}

export function getOauthResource(issuerOrBaseUrl: string) {
  return `${normalizeBaseUrl(issuerOrBaseUrl)}/`;
}

export function getDefaultOauthScope() {
  return DEFAULT_OAUTH_SCOPE;
}

export function isOauthAccessTokenExpired(auth: OauthAuthConfig, now = Date.now()) {
  if (!auth.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(auth.expiresAt);
  if (Number.isNaN(expiresAt)) {
    return false;
  }

  return expiresAt - ACCESS_TOKEN_REFRESH_WINDOW_MS <= now;
}

function calculateExpiresAt(expiresIn?: number) {
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return undefined;
  }

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

function formatOauthError(prefix: string, data: any, fallbackStatus?: number) {
  if (typeof data === 'string' && data.trim()) {
    return `${prefix}: ${data}`;
  }

  if (data?.error || data?.error_description) {
    const description = [data.error, data.error_description].filter(Boolean).join(': ');
    return `${prefix}: ${description}`;
  }

  if (typeof fallbackStatus === 'number') {
    return `${prefix}: HTTP ${fallbackStatus}`;
  }

  return prefix;
}

async function fetchOauthServerMetadata(baseUrl: string) {
  const metadataUrl = getOauthMetadataUrl(baseUrl);
  const response = await fetch(metadataUrl);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(formatOauthError(`Failed to load OAuth metadata from ${metadataUrl}`, data, response.status));
  }

  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.issuer !== 'string' ||
    typeof data.authorization_endpoint !== 'string' ||
    typeof data.token_endpoint !== 'string'
  ) {
    throw new Error(`Invalid OAuth metadata from ${metadataUrl}.`);
  }

  return data as OauthServerMetadata;
}

async function registerOauthClient(metadata: OauthServerMetadata, redirectUri: string) {
  if (!metadata.registration_endpoint) {
    throw new Error('OAuth server does not expose a dynamic client registration endpoint.');
  }

  const response = await fetch(metadata.registration_endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      client_name: DEFAULT_CLIENT_NAME,
      application_type: 'native',
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: DEFAULT_OAUTH_SCOPE,
      redirect_uris: [redirectUri],
    }),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(formatOauthError('Failed to register OAuth client', data, response.status));
  }

  if (!data || typeof data !== 'object' || typeof data.client_id !== 'string') {
    throw new Error('OAuth client registration succeeded but no client_id was returned.');
  }

  return {
    clientId: data.client_id as string,
  };
}

function encodeBase64Url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildPkcePair() {
  const codeVerifier = encodeBase64Url(crypto.randomBytes(32));
  const codeChallenge = encodeBase64Url(crypto.createHash('sha256').update(codeVerifier).digest());

  return {
    codeVerifier,
    codeChallenge,
  };
}

function maybeOpenBrowser(url: string) {
  const candidates =
    process.platform === 'darwin'
      ? [['open', url]]
      : process.platform === 'win32'
        ? [['cmd', '/c', 'start', '', url]]
        : [['xdg-open', url]];

  for (const [command, ...args] of candidates) {
    try {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return true;
    } catch (_error) {
      continue;
    }
  }

  return false;
}

async function createLoopbackServer(state: string) {
  const result = await new Promise<{
    redirectUri: string;
    waitForCode: () => Promise<string>;
    close: () => Promise<void>;
  }>((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url || '/', `http://${LOOPBACK_HOST}`);
        const receivedState = requestUrl.searchParams.get('state');
        const code = requestUrl.searchParams.get('code');
        const error = requestUrl.searchParams.get('error');
        const errorDescription = requestUrl.searchParams.get('error_description');

        res.setHeader('content-type', 'text/html; charset=utf-8');

        if (receivedState !== state) {
          res.statusCode = 400;
          res.end('<html><body><h1>Authentication failed</h1><p>Invalid state.</p></body></html>');
          return;
        }

        if (error) {
          res.statusCode = 400;
          res.end(`<html><body><h1>Authentication failed</h1><p>${errorDescription || error}</p></body></html>`);
          reject(new Error(`OAuth authorization failed: ${errorDescription || error}`));
          return;
        }

        if (!code) {
          res.statusCode = 400;
          res.end('<html><body><h1>Authentication failed</h1><p>Missing authorization code.</p></body></html>');
          reject(new Error('OAuth authorization failed: missing authorization code.'));
          return;
        }

        res.statusCode = 200;
        res.end('<html><body><h1>Authentication complete</h1><p>You can return to the terminal.</p></body></html>');
        resolveWaiter(code);
      } catch (error) {
        reject(error as Error);
      }
    });

    let resolveWaiter!: (code: string) => void;
    let rejectWaiter!: (error: Error) => void;

    const waitForCode = () =>
      new Promise<string>((resolveCode, rejectCode) => {
        resolveWaiter = (code) => {
          void close();
          resolveCode(code);
        };
        rejectWaiter = (error) => {
          void close();
          rejectCode(error);
        };
      });

    const close = async () => {
      await new Promise<void>((resolveClose) => {
        server.close(() => resolveClose());
      });
    };

    server.on('error', (error) => {
      reject(error as Error);
      rejectWaiter?.(error as Error);
    });

    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to open the OAuth callback listener.'));
        return;
      }

      resolve({
        redirectUri: `http://${LOOPBACK_HOST}:${address.port}/callback`,
        waitForCode,
        close,
      });
    });
  });

  return result;
}

async function exchangeAuthorizationCode(options: {
  metadata: OauthServerMetadata;
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
  resource: string;
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: options.clientId,
    code: options.code,
    code_verifier: options.codeVerifier,
    redirect_uri: options.redirectUri,
    resource: options.resource,
  });

  const response = await fetch(options.metadata.token_endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(formatOauthError('Failed to exchange OAuth authorization code', data, response.status));
  }

  if (!data || typeof data !== 'object' || typeof data.access_token !== 'string') {
    throw new Error('OAuth token response is missing access_token.');
  }

  return data as OauthTokenResponse;
}

async function refreshOauthAccessToken(options: {
  envName: string;
  baseUrl: string;
  auth: OauthAuthConfig;
  scope?: AuthStoreOptions['scope'];
}) {
  if (!options.auth.refreshToken || !options.auth.clientId) {
    throw new Error(`OAuth session for env "${options.envName}" cannot be refreshed. Run \`nb env auth -e ${options.envName}\`.`);
  }

  const metadata = await fetchOauthServerMetadata(options.baseUrl);
  const resource = options.auth.resource || getOauthResource(metadata.issuer);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: options.auth.clientId,
    refresh_token: options.auth.refreshToken,
    resource,
  });

  const response = await fetch(metadata.token_endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      formatOauthError(
        `Failed to refresh OAuth session for env "${options.envName}". Run \`nb env auth -e ${options.envName}\` again`,
        data,
        response.status,
      ),
    );
  }

  if (!data || typeof data !== 'object' || typeof data.access_token !== 'string') {
    throw new Error(`OAuth refresh response for env "${options.envName}" is missing access_token.`);
  }

  const nextAuth: OauthAuthConfig = {
    type: 'oauth',
    accessToken: data.access_token,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : options.auth.refreshToken,
    expiresAt: calculateExpiresAt(data.expires_in),
    scope: typeof data.scope === 'string' ? data.scope : options.auth.scope,
    issuer: metadata.issuer,
    clientId: options.auth.clientId,
    resource,
  };

  await setEnvOauthSession(options.envName, nextAuth, {
    scope: options.scope,
    preserveRuntime: true,
  });

  return nextAuth.accessToken;
}

export async function resolveAccessToken(options: {
  envName?: string;
  baseUrl?: string;
  token?: string;
  scope?: AuthStoreOptions['scope'];
}) {
  if (options.token) {
    return options.token;
  }

  const envName = options.envName ?? (await getCurrentEnvName({ scope: options.scope }));
  const env = await getEnv(envName, { scope: options.scope });
  if (!env?.auth) {
    return undefined;
  }

  if (env.auth.type === 'token') {
    return env.auth.accessToken;
  }

  if (!isOauthAccessTokenExpired(env.auth)) {
    return env.auth.accessToken;
  }

  const baseUrl = options.baseUrl ?? env.baseUrl;
  if (!baseUrl) {
    throw new Error(`Env "${envName}" is missing a base URL. Run \`nb env add --name ${envName} --base-url <url>\`.`);
  }

  printVerbose(`Refreshing OAuth session for env "${envName}"`);
  return refreshOauthAccessToken({
    envName,
    baseUrl,
    auth: env.auth,
    scope: options.scope,
  });
}

export async function resolveServerRequestTarget(options: {
  envName?: string;
  baseUrl?: string;
  token?: string;
  scope?: AuthStoreOptions['scope'];
}) {
  const envName = options.envName ?? (await getCurrentEnvName({ scope: options.scope }));
  const env = await getEnv(envName, { scope: options.scope });
  const baseUrl = options.baseUrl ?? env?.baseUrl;
  const token = await resolveAccessToken({
    envName,
    baseUrl,
    token: options.token,
    scope: options.scope,
  });

  if (!baseUrl) {
    throw new Error('Missing base URL. Use --base-url or configure one with `nb env add`.');
  }

  return { baseUrl, token };
}

export async function authenticateEnvWithOauth(options: {
  envName?: string;
  scope?: AuthStoreOptions['scope'];
}) {
  const envName = options.envName ?? (await getCurrentEnvName({ scope: options.scope }));
  const env = await getEnv(envName, { scope: options.scope });
  const baseUrl = env?.baseUrl;

  if (!baseUrl) {
    throw new Error(
      [
        `Env "${envName}" is missing a base URL.`,
        'Run `nb env add --name <name> --base-url <url>` first.',
      ].join('\n'),
    );
  }

  updateTask(`Loading OAuth metadata for env "${envName}"...`);
  const metadata = await fetchOauthServerMetadata(baseUrl);
  const state = encodeBase64Url(crypto.randomBytes(16));
  const { codeVerifier, codeChallenge } = buildPkcePair();
  const callback = await createLoopbackServer(state);
  const resource = getOauthResource(metadata.issuer);

  try {
    updateTask(`Registering OAuth client for env "${envName}"...`);
    const registration = await registerOauthClient(metadata, callback.redirectUri);

    const authorizationUrl = new URL(metadata.authorization_endpoint);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('client_id', registration.clientId);
    authorizationUrl.searchParams.set('redirect_uri', callback.redirectUri);
    authorizationUrl.searchParams.set('scope', DEFAULT_OAUTH_SCOPE);
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('prompt', 'consent');
    authorizationUrl.searchParams.set('code_challenge', codeChallenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
    authorizationUrl.searchParams.set('resource', resource);

    updateTask(`Waiting for OAuth login for env "${envName}"...`);
    const opened = maybeOpenBrowser(authorizationUrl.toString());
    if (!opened) {
      printWarning('Unable to open the browser automatically. Open this URL manually:');
    } else {
      printInfo('Complete the OAuth login in your browser.');
    }
    printInfo(authorizationUrl.toString());

    const code = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('OAuth login timed out.')), OAUTH_LOGIN_TIMEOUT_MS);
      timeout.unref?.();

      callback.waitForCode().then(
        (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      );
    });

    updateTask(`Exchanging OAuth code for env "${envName}"...`);
    const tokenResponse = await exchangeAuthorizationCode({
      metadata,
      clientId: registration.clientId,
      redirectUri: callback.redirectUri,
      code,
      codeVerifier,
      resource,
    });

    if (!tokenResponse.refresh_token) {
      printWarning(
        'OAuth login succeeded but no refresh_token was returned. The server did not grant offline access for this client/session.',
      );
    }

    await setEnvOauthSession(
      envName,
      {
        type: 'oauth',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: calculateExpiresAt(tokenResponse.expires_in),
        scope: tokenResponse.scope || DEFAULT_OAUTH_SCOPE,
        issuer: metadata.issuer,
        clientId: registration.clientId,
        resource,
      },
      { scope: options.scope },
    );
  } finally {
    await callback.close().catch(() => undefined);
  }
}
