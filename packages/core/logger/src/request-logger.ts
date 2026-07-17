/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { pick } from 'lodash';

import type { Logger, LoggerOptions } from './logger';

const REQUEST_SOURCE_HEADER = 'x-request-source';
const REDACTED = '[REDACTED]';
const sensitiveKeyPattern = /(token|authorization|password|secret|credential|private[\s_-]?key)/i;
const githubTokenPatterns = [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g];

const defaultRequestWhitelist = [
  'action',
  'header.x-role',
  'header.x-hostname',
  'header.x-timezone',
  'header.x-locale',
  'header.x-authenticator',
  'header.x-data-source',
  'header.x-request-source',
  'header.referer',
];
const defaultResponseWhitelist = ['status'];
const safeErrorDetailKeys = new Set([
  'provider',
  'operation',
  'reasonCode',
  'requestId',
  'httpStatus',
  'rateLimitReset',
  'retryAfterSeconds',
  'remoteTargetVersion',
  'expectedRemoteRevision',
  'currentRemoteRevision',
  'expectedHeadCommitId',
  'currentHeadCommitId',
]);

interface RequestLoggerContext {
  reqId: string;
  path: string;
  method: string;
  status: number;
  body?: unknown;
  logger?: unknown;
  log?: unknown;
  app: {
    log: {
      child(metadata: Record<string, unknown>): unknown;
    };
  };
  request: {
    header?: Record<string, unknown>;
    toJSON(): unknown;
  };
  response: {
    length?: number;
    toJSON(): unknown;
  };
  res: {
    setHeader(name: string, value: string): void;
  };
  action?: {
    toJSON?(): unknown;
  };
  auth?: {
    user?: {
      id?: unknown;
      username?: unknown;
    };
  };
}

export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: unknown) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}

export const requestLogger = (appName: string, logger: Logger, options?: RequestLoggerOptions) => {
  return async function requestLoggerMiddleware(ctx: RequestLoggerContext, next: () => Promise<unknown>) {
    const reqId = ctx.reqId;
    const pathMatch = /^\/api\/(.+):(.+)/.exec(ctx.path);
    const contextLogger = ctx.app.log.child({ reqId, module: pathMatch?.[1], submodule: pathMatch?.[2] });
    const requestSource = toNonEmptyString(sanitizeLogValue(ctx.request?.header?.[REQUEST_SOURCE_HEADER]));
    ctx.logger = ctx.log = contextLogger;
    const startTime = Date.now();
    const requestInfo = {
      method: ctx.method,
      path: ctx.path,
    };

    logger.info({
      message: `request ${ctx.method} ${ctx.path}`,
      ...requestInfo,
      req: sanitizeRequestInfo(pick(ctx.request.toJSON(), options?.requestWhitelist || defaultRequestWhitelist)),
      action: sanitizeLogValue(ctx.action?.toJSON?.()),
      app: appName,
      ...(requestSource ? { requestSource } : {}),
      reqId,
    });
    ctx.res.setHeader('X-Request-Id', reqId);

    let error: unknown;
    try {
      await next();
    } catch (caughtError) {
      error = caughtError;
    } finally {
      const cost = Date.now() - startTime;
      const status = ctx.status;
      const info = {
        message: `response ${ctx.path}`,
        ...requestInfo,
        res: sanitizeLogValue(pick(ctx.response.toJSON(), options?.responseWhitelist || defaultResponseWhitelist)),
        action: sanitizeLogValue(ctx.action?.toJSON?.()),
        userId: ctx.auth?.user?.id,
        username: ctx.auth?.user?.username,
        status,
        cost,
        app: appName,
        ...(requestSource ? { requestSource } : {}),
        reqId,
        bodySize: ctx.response.length,
      };
      if (Math.floor(status / 100) === 5) {
        logger.error({ ...info, res: sanitizeErrorResponse(ctx.body) });
      } else if (Math.floor(status / 100) === 4) {
        logger.warn({ ...info, res: sanitizeErrorResponse(ctx.body) });
      } else {
        logger.info(info);
      }
    }

    if (error !== undefined) {
      throw error;
    }
  };
};

function sanitizeRequestInfo(value: unknown): unknown {
  const request = toRecord(value);
  const { query: _query, url: _url, originalUrl: _originalUrl, href: _href, search: _search, ...safeRequest } = request;
  const header = toRecord(request.header);
  const referer = sanitizeReferer(header.referer);
  const { referer: _referer, ...headerWithoutReferer } = header;
  const sanitizedHeader = sanitizeLogValue({
    ...headerWithoutReferer,
    ...(referer ? { referer } : {}),
  });

  return sanitizeLogValue({
    ...safeRequest,
    ...(Object.keys(header).length ? { header: sanitizedHeader } : {}),
  });
}

function sanitizeReferer(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

function sanitizeLogValue(value: unknown, key?: string, seen = new WeakSet<object>()): unknown {
  if (key && sensitiveKeyPattern.test(key)) {
    return REDACTED;
  }
  if (typeof value === 'string') {
    return redactGitHubTokens(value);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return REDACTED;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, undefined, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    output[entryKey] = sanitizeLogValue(entryValue, entryKey, seen);
  }
  return output;
}

function sanitizeErrorResponse(body: unknown): unknown {
  const record = toRecord(body);
  const errors = Array.isArray(record.errors) ? record.errors : [];
  if (errors.length) {
    return errors.map(sanitizeErrorEntry);
  }
  return sanitizeErrorEntry(record);
}

function sanitizeErrorEntry(value: unknown): Record<string, unknown> {
  const error = toRecord(value);
  const details = toRecord(error.details);
  const safeDetails: Record<string, unknown> = {};
  for (const [key, detailValue] of Object.entries(details)) {
    if (safeErrorDetailKeys.has(key) && isSafeScalar(detailValue)) {
      safeDetails[key] = sanitizeLogValue(detailValue);
    }
  }

  return compactObject({
    code: toNonEmptyString(error.code),
    message: typeof error.message === 'string' ? redactGitHubTokens(error.message) : undefined,
    status: toFiniteNumber(error.status),
    details: Object.keys(safeDetails).length ? safeDetails : undefined,
  });
}

function redactGitHubTokens(value: string): string {
  return githubTokenPatterns.reduce((result, pattern) => result.replace(pattern, REDACTED), value);
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isSafeScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function compactObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
}
