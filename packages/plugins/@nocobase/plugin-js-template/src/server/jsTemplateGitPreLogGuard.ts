/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';

const jsTemplateGitRoutePattern = /\/(?:jsTemplateSync:|jsTemplateProjects:createFromGit(?:\/|$))/u;
const sensitiveKeyPattern =
  /(?:authorization|token|password|secret|credential|privatekey|authref|stderr|stdout)|^(?:source(?:map|text|code)?|content)$/iu;
const sensitiveHeaderKeyPattern = /(authorization|token|password|secret|credential|privatekey|authref)/iu;
const credentialBearingUrlPattern = /^[a-z][a-z0-9+.-]*:\/\/[^/?#\s]+@/iu;
const redactedCredential = '[REDACTED]';
const redactedActionLogView = Object.freeze({ params: redactedCredential });

type PreLogContext = {
  action?: {
    params?: unknown;
    toJSON?: () => unknown;
  };
  body?: unknown;
  method?: string;
  path?: string;
  status?: number;
  type?: string;
  url?: string;
  request?: {
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
    path?: string;
    url?: string;
  };
  state?: {
    pendingAuthTokenSource?: string;
  };
};

const restoreActionLogView = Symbol('restoreActionLogView');

type GuardedPreLogContext = PreLogContext & {
  [restoreActionLogView]?: () => void;
};

export function registerJsTemplateGitPreLogGuard(app: Application): void {
  app.use(jsTemplateGitPreLogGuard, { tag: 'js-template-git-pre-log-guard', before: 'logger' });
  app.use(jsTemplateGitPostBodyLogGuard, {
    tag: 'js-template-git-post-body-log-guard',
    after: 'bodyParser',
    before: 'auth',
  });
}

export async function jsTemplateGitPreLogGuard(ctx: PreLogContext, next: () => Promise<void>): Promise<void> {
  if (!isJsTemplateGitRoute(ctx.path)) {
    await next();
    return;
  }

  const rejectedUrl = sanitizeUrl(ctx);
  const rejectedHeaders = sanitizeHeaders(ctx);
  const rejected = rejectedUrl || rejectedHeaders;
  if (!rejected) {
    try {
      await next();
    } finally {
      restoreSanitizedActionLogView(ctx);
    }
    return;
  }

  ctx.status = 400;
  ctx.type = 'application/json';
  ctx.body = {
    errors: [
      {
        code: 'JS_TEMPLATE_INVALID_INPUT',
        message: 'Git credentials must only be supplied as a Secret reference in the request body',
        status: 400,
      },
    ],
  };
}

export async function jsTemplateGitPostBodyLogGuard(ctx: PreLogContext, next: () => Promise<void>): Promise<void> {
  if (!isJsTemplateGitRoute(ctx.path)) {
    await next();
    return;
  }
  try {
    await next();
  } finally {
    installSanitizedActionLogView(ctx);
  }
}

function installSanitizedActionLogView(ctx: PreLogContext): void {
  const action = ctx.action;
  if (!action || typeof action.toJSON !== 'function') {
    return;
  }
  const guardedCtx = ctx as GuardedPreLogContext;
  if (guardedCtx[restoreActionLogView]) {
    return;
  }
  const originalDescriptor = Object.getOwnPropertyDescriptor(action, 'toJSON');
  const originalToJSON = action.toJSON;
  let loggedAction: unknown = redactedActionLogView;
  try {
    loggedAction = redactLoggedValue(originalToJSON.call(action));
  } catch {
    // Logging must never replace the response or downstream error; use a minimal view when serialization fails.
  }
  try {
    Object.defineProperty(action, 'toJSON', {
      configurable: true,
      value: () => loggedAction,
      writable: true,
    });
  } catch {
    return;
  }
  guardedCtx[restoreActionLogView] = () => {
    if (originalDescriptor) {
      Object.defineProperty(action, 'toJSON', originalDescriptor);
      return;
    }
    delete action.toJSON;
  };
}

function restoreSanitizedActionLogView(ctx: PreLogContext): void {
  const guardedCtx = ctx as GuardedPreLogContext;
  const restore = guardedCtx[restoreActionLogView];
  if (!restore) {
    return;
  }
  try {
    restore();
  } catch {
    // Restoring a log-only view must never replace the response or downstream error.
  } finally {
    delete guardedCtx[restoreActionLogView];
  }
}

function isJsTemplateGitRoute(path: string | undefined): boolean {
  return typeof path === 'string' && jsTemplateGitRoutePattern.test(path);
}

function sanitizeUrl(ctx: PreLogContext): boolean {
  const currentUrl = ctx.url || ctx.request?.url;
  if (!currentUrl) {
    return false;
  }
  const sanitized = redactSensitiveUrl(currentUrl);
  if (sanitized === currentUrl) {
    return false;
  }
  ctx.url = sanitized;
  if (ctx.request?.url !== undefined) {
    ctx.request.url = sanitized;
  }
  if (ctx.request?.path !== undefined) {
    ctx.request.path = ctx.path;
  }
  return true;
}

function sanitizeHeaders(ctx: PreLogContext): boolean {
  const headerMaps = [ctx.request?.headers, ctx.request?.header].filter(
    (headers): headers is Record<string, string | string[] | undefined> => Boolean(headers),
  );
  if (!headerMaps.length) {
    return false;
  }
  let rejected = false;
  for (const headers of headerMaps) {
    for (const key of Object.keys(headers)) {
      const normalizedKey = normalizeKey(key);
      if (
        normalizedKey === 'xcsrftoken' ||
        normalizedKey === 'authorization' ||
        normalizedKey === 'cookie' ||
        normalizedKey === 'setcookie' ||
        normalizedKey === 'xauthenticator' ||
        normalizedKey === 'xnewtoken' ||
        !sensitiveHeaderKeyPattern.test(normalizedKey)
      ) {
        continue;
      }
      headers[key] = redactedCredential;
      rejected = true;
    }
  }
  return rejected;
}

function redactSensitiveUrl(value: string): string {
  const queryStart = value.indexOf('?');
  const path = queryStart < 0 ? value : value.slice(0, queryStart);
  const query = queryStart < 0 ? '' : value.slice(queryStart + 1);
  let rejected = sensitiveKeyPattern.test(normalizeKey(path));
  const sanitizedQuery = query
    .split('&')
    .map((part) => {
      if (!part) {
        return part;
      }
      const separator = part.indexOf('=');
      const key = separator < 0 ? part : part.slice(0, separator);
      if (!sensitiveKeyPattern.test(normalizeKey(decodeQueryKey(key)))) {
        return part;
      }
      rejected = true;
      return `${key}=${encodeURIComponent(redactedCredential)}`;
    })
    .join('&');
  if (!rejected) {
    return value;
  }
  const safePath = sensitiveKeyPattern.test(normalizeKey(path)) ? '/api/jsTemplateSync:rejected' : path;
  return queryStart < 0 ? safePath : `${safePath}?${sanitizedQuery}`;
}

function decodeQueryKey(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/gu, ' '));
  } catch {
    return value;
  }
}

function normalizeKey(value: string): string {
  return value.replace(/[^A-Za-z0-9]/gu, '');
}

function redactLoggedValue(value: unknown, sanitizedValues = new WeakMap<object, unknown>()): unknown {
  if (typeof value === 'string' && credentialBearingUrlPattern.test(value.trim())) {
    return redactedCredential;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const existing = sanitizedValues.get(value);
  if (existing !== undefined) {
    return existing;
  }
  if (Array.isArray(value)) {
    const sanitized: unknown[] = [];
    sanitizedValues.set(value, sanitized);
    sanitized.push(...value.map((item) => redactLoggedValue(item, sanitizedValues)));
    return sanitized;
  }
  const sanitized: Record<string, unknown> = {};
  sanitizedValues.set(value, sanitized);
  for (const [key, child] of Object.entries(value)) {
    if (sensitiveKeyPattern.test(normalizeKey(key))) {
      sanitized[key] = redactedCredential;
      continue;
    }
    sanitized[key] = redactLoggedValue(child, sanitizedValues);
  }
  return sanitized;
}
