/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Requests to an App without a runtime. The registry starts the App on its first request (a stopped App) after
 * preparing its files again (a dormant one). A page request waits briefly; if the App is not ready by then it gets a
 * small page that says the App is starting and refreshes itself, while the activation carries on. Other requests (API
 * calls, WebSocket upgrades) wait longer and then get a 503 with `Retry-After`.
 */
import type { IncomingMessage } from 'node:http';

import type { AppRuntimeRegistry } from './app-registry.ts';
import { AppNotFoundError } from './errors.ts';
import type { ActiveAppHandle, AppLifecycleState } from './app-types.ts';

export interface OnDemandActivationOptions {
  /** How long a page request waits before it is answered with the starting page. */
  holdMs: number;
  /** How long any other request waits before it is answered with a 503. */
  waitMs: number;
}

export const DEFAULT_ACTIVATION_HOLD_MS = 1_500;
export const DEFAULT_ACTIVATION_WAIT_MS = 60_000;
const RETRY_AFTER_SECONDS = 2;

/** Whether a browser is asking for a page, which may be answered with the starting page. */
export function isPageRequest(req: IncomingMessage): boolean {
  const method = req.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') return false;
  const mode = req.headers['sec-fetch-mode'];
  if (typeof mode === 'string' && mode !== 'navigate') return false;
  const accept = req.headers.accept ?? '';
  return accept.includes('text/html');
}

/**
 * The App's runtime for a request, starting it when it has none; or the response to answer with instead, while it
 * starts or after it failed to.
 */
export async function activateForRequest(
  registry: AppRuntimeRegistry,
  appId: string,
  req: IncomingMessage,
  options: OnDemandActivationOptions,
): Promise<ActiveAppHandle | Response> {
  if (registry.isActive(appId)) return registry.ensureActiveHandle(appId);
  const page = isPageRequest(req);
  const before: AppLifecycleState = registry.isDormant(appId)
    ? 'dormant'
    : 'stopped';
  if (!registry.isActivating(appId) && registry.recentFailure(appId)) {
    registry.touch(appId);
    return page ? failedPage(req) : unavailable('APP_START_FAILED');
  }
  const activation = registry.ensureActiveHandle(appId);
  const outcome = await settleWithin(
    activation,
    page ? options.holdMs : options.waitMs,
  );
  if (outcome.kind === 'ready') return outcome.value;
  if (outcome.kind === 'failed') {
    if (page && !(outcome.error instanceof AppNotFoundError))
      return failedPage(req);
    throw outcome.error;
  }
  return page ? startingPage(req, before) : unavailable('APP_STARTING');
}

/** Waits for the App to start for a WebSocket upgrade; null when it did not start in time. */
export async function activateForUpgrade(
  registry: AppRuntimeRegistry,
  appId: string,
  options: OnDemandActivationOptions,
): Promise<ActiveAppHandle | null> {
  if (registry.isActive(appId)) return registry.ensureActiveHandle(appId);
  const outcome = await settleWithin(
    registry.ensureActiveHandle(appId),
    options.waitMs,
  );
  if (outcome.kind === 'failed') throw outcome.error;
  return outcome.kind === 'ready' ? outcome.value : null;
}

type Settled<T> =
  | { kind: 'ready'; value: T }
  | { kind: 'failed'; error: unknown }
  | { kind: 'pending' };

async function settleWithin<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<Settled<T>> {
  let timer: NodeJS.Timeout | undefined;
  const pending = new Promise<Settled<T>>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'pending' }), timeoutMs);
    timer.unref?.();
  });
  try {
    return await Promise.race([
      promise.then(
        (value): Settled<T> => ({ kind: 'ready', value }),
        (error: unknown): Settled<T> => ({ kind: 'failed', error }),
      ),
      pending,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function unavailable(code: 'APP_STARTING' | 'APP_START_FAILED'): Response {
  return new Response(
    JSON.stringify({
      error:
        code === 'APP_STARTING'
          ? 'The application is starting. Retry shortly.'
          : 'The application failed to start. Retry shortly.',
      code,
    }),
    {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'retry-after': String(
          code === 'APP_STARTING' ? RETRY_AFTER_SECONDS : 10,
        ),
      },
    },
  );
}

interface PageText {
  readonly lang: string;
  readonly title: string;
  readonly message: string;
  readonly hint: string;
}

const TEXT: Record<
  'en' | 'zh',
  Record<'stopped' | 'dormant' | 'failed', PageText>
> = {
  en: {
    stopped: {
      lang: 'en',
      title: 'Starting the application…',
      message:
        'It was stopped after a while without visits and is starting again.',
      hint: 'This usually takes a few seconds. The page refreshes by itself.',
    },
    dormant: {
      lang: 'en',
      title: 'Preparing the application…',
      message:
        'It was put to sleep after a long time without visits and is being prepared again.',
      hint: 'This can take a little longer. The page refreshes by itself.',
    },
    failed: {
      lang: 'en',
      title: 'The application could not start',
      message: 'Its last start failed. It will be tried again shortly.',
      hint: 'The page refreshes by itself.',
    },
  },
  zh: {
    stopped: {
      lang: 'zh-CN',
      title: '正在启动应用…',
      message: '应用在一段时间无人访问后已停止，正在重新启动。',
      hint: '通常只需几秒钟，页面会自动刷新。',
    },
    dormant: {
      lang: 'zh-CN',
      title: '正在重新准备应用…',
      message: '应用在长时间无人访问后已休眠，正在重新准备并启动。',
      hint: '这可能需要稍长一些时间，页面会自动刷新。',
    },
    failed: {
      lang: 'zh-CN',
      title: '应用未能启动',
      message: '上一次启动失败，稍后会自动重试。',
      hint: '页面会自动刷新。',
    },
  },
};

function textFor(
  req: IncomingMessage,
  kind: 'stopped' | 'dormant' | 'failed',
): PageText {
  const language = String(req.headers['accept-language'] ?? '').toLowerCase();
  return TEXT[language.startsWith('zh') ? 'zh' : 'en'][kind];
}

function startingPage(
  req: IncomingMessage,
  state: AppLifecycleState,
): Response {
  return pageResponse(
    textFor(req, state === 'dormant' ? 'dormant' : 'stopped'),
    RETRY_AFTER_SECONDS,
    true,
  );
}

function failedPage(req: IncomingMessage): Response {
  return pageResponse(textFor(req, 'failed'), 10, false);
}

function pageResponse(
  text: PageText,
  refreshSeconds: number,
  spinner: boolean,
): Response {
  const html = `<!doctype html>
<html lang="${text.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="${refreshSeconds}">
<meta name="robots" content="noindex">
<title>${escapeHtml(text.title)}</title>
<style>
:root{color-scheme:light dark;--fg:#1f2328;--muted:#656d76;--bg:#f6f8fa;--card:#fff;--line:#d0d7de;--accent:#0969da}
@media (prefers-color-scheme:dark){:root{--fg:#e6edf3;--muted:#8d96a0;--bg:#0d1117;--card:#161b22;--line:#30363d;--accent:#4493f8}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;padding:16px}
main{max-width:420px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:28px 24px;text-align:center}
h1{font-size:18px;margin:16px 0 8px}p{margin:0 0 6px;color:var(--muted)}
.spinner{width:28px;height:28px;margin:0 auto;border:3px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:spin 0.9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.spinner{animation-duration:3s}}
</style>
</head>
<body>
<main role="status" aria-live="polite" data-app-host="${spinner ? 'starting' : 'failed'}">
${spinner ? '<div class="spinner" aria-hidden="true"></div>' : ''}
<h1>${escapeHtml(text.title)}</h1>
<p>${escapeHtml(text.message)}</p>
<p>${escapeHtml(text.hint)}</p>
</main>
</body>
</html>
`;
  return new Response(html, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': String(refreshSeconds),
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
