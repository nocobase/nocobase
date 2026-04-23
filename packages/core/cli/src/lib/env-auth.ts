/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  getCurrentEnvName,
  getEnv,
  setEnvOauthSession,
  type AuthStoreOptions,
  type OauthAuthConfig,
} from './auth-store.js';
import { printInfo, printVerbose, printWarning, printWarningBlock, updateTask } from './ui.js';

const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
const LOOPBACK_HOST = '127.0.0.1';
const OAUTH_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const OAUTH_FETCH_TIMEOUT_MS = 15_000;
const OAUTH_FETCH_RETRY_DELAYS_MS = [500, 1_000, 2_000] as const;
const DEFAULT_OAUTH_SCOPE = 'openid api offline_access';
const DEFAULT_CLIENT_NAME = 'NocoBase CLI';

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

function formatOauthFetchFailure(prefix: string, options: { baseUrl?: string; url: string; rawMessage?: string; envName?: string }) {
  return [
    prefix,
    options.envName ? `Env: ${options.envName}` : undefined,
    options.baseUrl ? `Base URL: ${options.baseUrl}` : undefined,
    `Request URL: ${options.url}`,
    `Network error: ${options.rawMessage || 'fetch failed'}`,
    'Check that the NocoBase app is running, the base URL is correct, and the server is reachable from this machine.',
    options.envName
      ? `If the saved login is stale, run \`nb env auth ${options.envName}\` again after connectivity is restored.`
      : 'If the saved login is stale, run `nb env auth <name>` again after connectivity is restored.',
    'Use `nb env list` to inspect the current env configuration.',
  ]
    .filter(Boolean)
    .join('\n');
}

function isRetryableOauthStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function getOauthFetchRetryDelays() {
  const override = process.env.NOCOBASE_CLI_OAUTH_RETRY_DELAY_MS;
  if (override !== undefined) {
    const delay = Number(override);
    if (Number.isFinite(delay) && delay >= 0) {
      return OAUTH_FETCH_RETRY_DELAYS_MS.map(() => delay);
    }
  }

  return OAUTH_FETCH_RETRY_DELAYS_MS;
}

function formatOauthRetryMessage(options: {
  operation: string;
  attempt: number;
  maxAttempts: number;
  reason: string;
}) {
  return `${options.operation} failed (${options.reason}). Retrying ${options.attempt}/${options.maxAttempts}...`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithOauthRetry(
  url: string,
  init: RequestInit | undefined,
  options: {
    operation: string;
    timeoutMs?: number;
    retryDelaysMs?: readonly number[];
    onRetry?: (message: string) => void;
  },
) {
  const retryDelaysMs = options.retryDelaysMs ?? getOauthFetchRetryDelays();
  const maxAttempts = retryDelaysMs.length + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, options.timeoutMs ?? OAUTH_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (!isRetryableOauthStatus(response.status) || attempt === maxAttempts) {
        return response;
      }

      const reason = `HTTP ${response.status}`;
      const message = formatOauthRetryMessage({
        operation: options.operation,
        attempt: attempt + 1,
        maxAttempts,
        reason,
      });
      printVerbose(message);
      options.onRetry?.(message);
      await sleep(retryDelaysMs[attempt - 1] ?? 0);
    } catch (error: unknown) {
      lastError = error;
      const reason =
        error instanceof Error && error.name === 'AbortError'
          ? `request timed out after ${Math.ceil((options.timeoutMs ?? OAUTH_FETCH_TIMEOUT_MS) / 1000)}s`
          : error instanceof Error
            ? error.message
            : String(error);

      if (attempt === maxAttempts) {
        throw new Error(reason);
      }

      const message = formatOauthRetryMessage({
        operation: options.operation,
        attempt: attempt + 1,
        maxAttempts,
        reason,
      });
      printVerbose(message);
      options.onRetry?.(message);
      await sleep(retryDelaysMs[attempt - 1] ?? 0);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

async function fetchOauthServerMetadata(
  baseUrl: string,
  options: { envName?: string; onRetry?: (message: string) => void } = {},
) {
  const metadataUrl = getOauthMetadataUrl(baseUrl);
  let response: Response;
  try {
    response = await fetchWithOauthRetry(
      metadataUrl,
      undefined,
      {
        operation: 'Loading OAuth metadata',
        onRetry: options.onRetry,
      },
    );
  } catch (error: any) {
    throw new Error(
      formatOauthFetchFailure('Failed to load OAuth metadata.', {
        envName: options.envName,
        baseUrl,
        url: metadataUrl,
        rawMessage: error?.message,
      }),
    );
  }
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

async function registerOauthClient(
  metadata: OauthServerMetadata,
  redirectUri: string,
  options: { envName?: string; baseUrl?: string } = {},
) {
  if (!metadata.registration_endpoint) {
    throw new Error('OAuth server does not expose a dynamic client registration endpoint.');
  }

  let response: Response;
  try {
    response = await fetchWithOauthRetry(
      metadata.registration_endpoint,
      {
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
      },
      {
        operation: 'Registering OAuth client',
        onRetry: (message) => updateTask(message),
      },
    );
  } catch (error: any) {
    throw new Error(
      formatOauthFetchFailure('Failed to register OAuth client.', {
        envName: options.envName,
        baseUrl: options.baseUrl,
        url: metadata.registration_endpoint,
        rawMessage: error?.message,
      }),
    );
  }
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

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string) {
  return escapeHtmlAttribute(value).replace(/\r?\n/g, '<br>');
}

function escapeScriptString(value: string) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

type BrowserOpenTarget = {
  target: string;
  cleanup?: () => Promise<void>;
};

function buildOauthPage(options: {
  title: string;
  cardExtra?: string;
  statusTone: 'success' | 'error' | 'info';
  statusMark: string;
  heading: string;
  description: string;
  tip?: string;
  footer?: string;
  detailHtml?: string;
  actionsHtml?: string;
  extraHeadHtml?: string;
  extraScriptHtml?: string;
}) {
  const tone =
    options.statusTone === 'success'
      ? {
          color: '#52c41a',
          soft: '#f6ffed',
          border: '#b7eb8f',
        }
      : options.statusTone === 'error'
        ? {
            color: '#ff4d4f',
            soft: '#fff2f0',
            border: '#ffccc7',
          }
        : {
            color: '#1677ff',
            soft: '#e6f4ff',
            border: '#91caff',
          };

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlAttribute(options.title)}</title>
  <style>
    :root {
      --bg: #f5f5f5;
      --panel: #ffffff;
      --panel-border: #f0f0f0;
      --text: rgba(0, 0, 0, 0.88);
      --muted: rgba(0, 0, 0, 0.45);
      --status: ${tone.color};
      --status-soft: ${tone.soft};
      --status-border: ${tone.border};
      --primary: #1677ff;
      --shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .shell {
      width: min(100%, 560px);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      background: var(--panel);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 56px;
      padding: 0 24px;
      border-bottom: 1px solid var(--panel-border);
      background: #ffffff;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
    }
    .card-extra {
      font-size: 12px;
      color: var(--primary);
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    .card-body {
      padding: 40px 32px 28px;
      text-align: center;
    }
    .mark {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--status-soft);
      border: 1px solid var(--status-border);
      color: var(--status);
      font-size: 30px;
      font-weight: 700;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 28px;
      line-height: 1.2;
      font-weight: 600;
    }
    p {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.7;
    }
    .tip {
      margin-top: 24px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      color: rgba(0, 0, 0, 0.65);
      font-size: 13px;
    }
    .detail {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 8px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      color: rgba(0, 0, 0, 0.72);
      font-size: 13px;
      line-height: 1.7;
      text-align: left;
      word-break: break-word;
    }
    .actions {
      margin-top: 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .actions a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 148px;
      height: 40px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid #1677ff;
      background: #1677ff;
      color: #fff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .actions a.secondary {
      background: #fff;
      color: #1677ff;
    }
    .manual {
      min-height: 22px;
      margin-top: 14px;
      font-size: 13px;
      color: var(--muted);
    }
    .card-foot {
      padding: 12px 24px;
      border-top: 1px solid var(--panel-border);
      background: #fafafa;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    }
  </style>
  ${options.extraHeadHtml ?? ''}
</head>
<body>
  <main class="shell">
    <div class="card-head">
      <div class="card-title">NocoBase CLI</div>
      <div class="card-extra">${escapeHtmlText(options.cardExtra ?? 'OAuth')}</div>
    </div>
    <div class="card-body">
      <div class="mark">${escapeHtmlText(options.statusMark)}</div>
      <h1>${escapeHtmlText(options.heading)}</h1>
      <p>${escapeHtmlText(options.description)}</p>
      ${options.tip ? `<p class="tip">${escapeHtmlText(options.tip)}</p>` : ''}
      ${options.detailHtml ? `<div class="detail">${options.detailHtml}</div>` : ''}
      ${options.actionsHtml ? `<div class="actions">${options.actionsHtml}</div>` : ''}
      <p id="manual" class="manual"></p>
    </div>
    <div class="card-foot">${escapeHtmlText(options.footer ?? 'You can close this page after returning to the terminal.')}</div>
  </main>
  ${options.extraScriptHtml ?? ''}
</body>
</html>
`;
}

export function buildOauthRedirectHtml(url: string) {
  const escapedUrl = escapeHtmlAttribute(url);

  return buildOauthPage({
    title: 'NocoBase OAuth Login',
    cardExtra: 'OAuth',
    statusTone: 'info',
    statusMark: '→',
    heading: 'Redirecting to sign-in',
    description: 'Your browser is opening the NocoBase login page so you can finish authentication.',
    tip: 'If the redirect does not start automatically, continue manually using the button below.',
    actionsHtml:
      `<a href="${escapedUrl}">Continue to sign-in</a>` +
      `<a class="secondary" href="${escapedUrl}">Open manually</a>`,
    footer: 'After sign-in, this page will hand control back to the terminal.',
    extraHeadHtml: `  <meta http-equiv="refresh" content="0; url=${escapedUrl}">`,
    extraScriptHtml: `  <script>window.location.replace(${escapeScriptString(url)});</script>`,
  });
}

export function buildOauthCompletionHtml() {
  return buildOauthPage({
    title: 'Authentication complete',
    cardExtra: 'OAuth',
    statusTone: 'success',
    statusMark: '✓',
    heading: 'Authentication complete',
    description: 'Your sign-in finished successfully. You can return to the terminal and continue there.',
    tip: 'This page will try to close automatically in a moment.',
    footer: 'You can close this page after returning to the terminal.',
    extraScriptHtml: `  <script>
    setTimeout(function () {
      window.close();
      setTimeout(function () {
        var el = document.getElementById('manual');
        if (document.visibilityState === 'visible' && el) {
          el.textContent = 'If this tab stays open, you can close it manually.';
        }
      }, 400);
    }, 1000);
  </script>`,
  });
}

export function buildOauthErrorHtml(message: string, options?: { title?: string }) {
  return buildOauthPage({
    title: options?.title ?? 'Authentication failed',
    cardExtra: 'OAuth',
    statusTone: 'error',
    statusMark: '!',
    heading: options?.title ?? 'Authentication failed',
    description: 'The OAuth sign-in flow could not be completed in this browser tab.',
    detailHtml: escapeHtmlText(message),
    tip: 'Return to the terminal to review the error details and try again if needed.',
    footer: 'You can close this page and restart authentication from the CLI.',
  });
}

async function createWindowsBrowserRedirectFile(url: string) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-oauth-'));
  const filePath = path.join(directory, 'authorize.html');
  await writeFile(filePath, buildOauthRedirectHtml(url), 'utf8');

  const cleanup = setTimeout(() => {
    void rm(directory, { recursive: true, force: true });
  }, OAUTH_LOGIN_TIMEOUT_MS);
  cleanup.unref?.();

  return {
    target: filePath,
    cleanup: async () => {
      clearTimeout(cleanup);
      await rm(directory, { recursive: true, force: true });
    },
  };
}

async function getBrowserOpenTarget(url: string): Promise<BrowserOpenTarget> {
  if (process.platform !== 'win32') {
    return { target: url };
  }

  return createWindowsBrowserRedirectFile(url);
}

async function maybeOpenBrowser(url: string): Promise<{ opened: boolean; cleanup?: () => Promise<void> }> {
  const { target, cleanup } = await getBrowserOpenTarget(url);
  const candidates =
    process.platform === 'darwin'
      ? [['open', target]]
      : process.platform === 'win32'
        ? [['cmd', '/c', 'start', '', target]]
        : [['xdg-open', target]];

  for (const [command, ...args] of candidates) {
    const opened = await new Promise<boolean>((resolve) => {
      try {
        const child = spawn(command, args, {
          detached: true,
          stdio: 'ignore',
        });

        child.once('error', () => resolve(false));
        child.once('spawn', () => {
          child.unref();
          resolve(true);
        });
      } catch (_error) {
        resolve(false);
      }
    });

    if (opened) {
      return {
        opened: true,
        cleanup,
      };
    }
  }

  return {
    opened: false,
    cleanup,
  };
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
          res.end(buildOauthErrorHtml('Invalid state.'));
          rejectWaiter?.(new Error('OAuth authorization failed: invalid state.'));
          return;
        }

        if (error) {
          res.statusCode = 400;
          res.end(buildOauthErrorHtml(String(errorDescription || error)));
          rejectWaiter?.(new Error(`OAuth authorization failed: ${errorDescription || error}`));
          return;
        }

        if (!code) {
          res.statusCode = 400;
          res.end(buildOauthErrorHtml('Missing authorization code.'));
          rejectWaiter?.(new Error('OAuth authorization failed: missing authorization code.'));
          return;
        }

        res.statusCode = 200;
        res.end(buildOauthCompletionHtml());
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
  envName?: string;
  baseUrl?: string;
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: options.clientId,
    code: options.code,
    code_verifier: options.codeVerifier,
    redirect_uri: options.redirectUri,
    resource: options.resource,
  });

  let response: Response;
  try {
    response = await fetchWithOauthRetry(
      options.metadata.token_endpoint,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
      },
      {
        operation: 'Exchanging OAuth authorization code',
        onRetry: (message) => updateTask(message),
      },
    );
  } catch (error: any) {
    throw new Error(
      formatOauthFetchFailure('Failed to exchange OAuth authorization code.', {
        envName: options.envName,
        baseUrl: options.baseUrl,
        url: options.metadata.token_endpoint,
        rawMessage: error?.message,
      }),
    );
  }
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
    throw new Error(`OAuth session for env "${options.envName}" cannot be refreshed. Run \`nb env auth ${options.envName}\`.`);
  }

  const metadata = await fetchOauthServerMetadata(options.baseUrl, { envName: options.envName });
  const resource = options.auth.resource || getOauthResource(metadata.issuer);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: options.auth.clientId,
    refresh_token: options.auth.refreshToken,
    resource,
  });

  const response = await fetchWithOauthRetry(
    metadata.token_endpoint,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    },
    {
      operation: `Refreshing OAuth session for env "${options.envName}"`,
    },
  ).catch((error: any) => {
    throw new Error(
      formatOauthFetchFailure(`Failed to refresh OAuth session for env "${options.envName}".`, {
        envName: options.envName,
        baseUrl: options.baseUrl,
        url: metadata.token_endpoint,
        rawMessage: error?.message,
      }),
    );
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      formatOauthError(
        `Failed to refresh OAuth session for env "${options.envName}". Run \`nb env auth ${options.envName}\` again`,
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
    throw new Error(`Env "${envName}" is missing a base URL. Run \`nb env add ${envName} --base-url <url>\`.`);
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
        env
          ? `Environment "${envName}" does not have an API base URL yet.`
          : `Environment "${envName}" has not been set up yet.`,
        env
          ? `Run \`nb env add ${envName} --base-url <url>\` to finish setting it up.`
          : `Run \`nb env add ${envName}\` first.`,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  printVerbose(`Starting OAuth sign-in for env "${envName}" using ${baseUrl}`);
  updateTask(`Checking sign-in settings for "${envName}"...`);
  const metadata = await fetchOauthServerMetadata(baseUrl, {
    envName,
    onRetry: (message) => updateTask(message),
  });
  const state = encodeBase64Url(crypto.randomBytes(16));
  const { codeVerifier, codeChallenge } = buildPkcePair();
  const callback = await createLoopbackServer(state);
  const resource = getOauthResource(metadata.issuer);
  let cleanupBrowserOpenTarget: (() => Promise<void>) | undefined;

  try {
    printVerbose(`OAuth callback listener ready at ${callback.redirectUri}`);
    updateTask(`Preparing secure browser sign-in for "${envName}"...`);
    const registration = await registerOauthClient(metadata, callback.redirectUri, {
      envName,
      baseUrl,
    });

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

    updateTask(`Waiting for you to finish signing in for "${envName}"...`);
    const browser = await maybeOpenBrowser(authorizationUrl.toString());
    cleanupBrowserOpenTarget = browser.cleanup;
    if (!browser.opened) {
      printWarningBlock('We could not open your browser automatically. Open this URL to continue signing in:');
    } else {
      printInfo('Your browser should open shortly. Finish signing in there to continue.');
    }
    printInfo(authorizationUrl.toString());

    const code = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`OAuth sign-in timed out after 5 minutes. Run \`nb env auth ${envName}\` to try again.`)),
        OAUTH_LOGIN_TIMEOUT_MS,
      );
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

    updateTask(`Finishing sign-in for "${envName}"...`);
    const tokenResponse = await exchangeAuthorizationCode({
      metadata,
      clientId: registration.clientId,
      redirectUri: callback.redirectUri,
      code,
      codeVerifier,
      resource,
      envName,
      baseUrl,
    });

    if (!tokenResponse.refresh_token) {
      printWarning(
        'Sign-in succeeded, but no refresh token was returned. You may need to sign in again when this session expires.',
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
    await cleanupBrowserOpenTarget?.().catch(() => undefined);
    await callback.close().catch(() => undefined);
  }
}
