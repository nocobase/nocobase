/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger, LoggerOptions } from './logger';
import { pick } from 'lodash';

const REQUEST_SOURCE_HEADER = 'x-request-source';
const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(password|token|authorization|credential|authref|privatekey|secret)/i;
const URL_KEY_PATTERN = /^(url|originalurl|referer)$/i;

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

export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}

export const requestLogger = (appName: string, requestLogger: Logger, options?: RequestLoggerOptions) => {
  return async function requestLoggerMiddleware(ctx, next) {
    const reqId = ctx.reqId;
    const path = /^\/api\/(.+):(.+)/.exec(ctx.path);
    const contextLogger = ctx.app.log.child({ reqId, module: path?.[1], submodule: path?.[2] });
    const requestSource = ctx.request?.header?.[REQUEST_SOURCE_HEADER];
    // ctx.reqId = reqId;
    ctx.logger = ctx.log = contextLogger;
    const startTime = Date.now();
    const url = redactSensitiveQuery(ctx.url);
    const action = redactSensitiveFields(ctx.action?.toJSON?.());
    const requestInfo = {
      method: ctx.method,
      path: url,
    };
    requestLogger.info({
      message: `request ${ctx.method} ${url}`,
      ...requestInfo,
      req: redactSensitiveFields(pick(ctx.request.toJSON(), options?.requestWhitelist || defaultRequestWhitelist)),
      action,
      app: appName,
      ...(requestSource ? { requestSource } : {}),
      reqId,
    });
    ctx.res.setHeader('X-Request-Id', reqId);

    let error: Error;
    try {
      await next();
    } catch (e) {
      error = e;
    } finally {
      const cost = Date.now() - startTime;
      const status = ctx.status;
      const info = {
        message: `response ${url}`,
        ...requestInfo,
        res: pick(ctx.response.toJSON(), options?.responseWhitelist || defaultResponseWhitelist),
        action,
        userId: ctx.auth?.user?.id,
        username: ctx.auth?.user?.username,
        status: ctx.status,
        cost,
        app: appName,
        ...(requestSource ? { requestSource } : {}),
        reqId,
        bodySize: ctx.response.length,
      };
      if (Math.floor(status / 100) == 5) {
        requestLogger.error({ ...info, res: ctx.body?.['errors'] || ctx.body });
      } else if (Math.floor(status / 100) == 4) {
        requestLogger.warn({ ...info, res: ctx.body?.['errors'] || ctx.body });
      } else {
        requestLogger.info(info);
      }
    }

    if (error) {
      throw error;
    }
  };
};

function redactSensitiveFields(value: unknown, seen = new WeakSet<object>()): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return REDACTED_VALUE;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    const redacted = value.map((item) => redactSensitiveFields(item, seen));
    seen.delete(value);
    return redacted;
  }

  const redacted = Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      const normalizedKey = normalizeKey(key);
      if (SENSITIVE_KEY_PATTERN.test(normalizedKey)) {
        return [key, REDACTED_VALUE];
      }
      if (typeof child === 'string' && URL_KEY_PATTERN.test(normalizedKey)) {
        return [key, redactSensitiveQuery(child)];
      }
      return [key, redactSensitiveFields(child, seen)];
    }),
  );
  seen.delete(value);
  return redacted;
}

function redactSensitiveQuery(url: unknown): unknown {
  if (typeof url !== 'string') {
    return url;
  }
  const queryStart = url.indexOf('?');
  if (queryStart < 0) {
    return url;
  }
  const fragmentStart = url.indexOf('#', queryStart);
  const queryEnd = fragmentStart < 0 ? url.length : fragmentStart;
  const query = url.slice(queryStart + 1, queryEnd);
  const redactedQuery = query
    .split('&')
    .map((part) => {
      const separator = part.indexOf('=');
      const rawKey = separator < 0 ? part : part.slice(0, separator);
      if (!SENSITIVE_KEY_PATTERN.test(normalizeKey(decodeQueryKey(rawKey)))) {
        return part;
      }
      return `${rawKey}=${REDACTED_VALUE}`;
    })
    .join('&');
  return `${url.slice(0, queryStart + 1)}${redactedQuery}${url.slice(queryEnd)}`;
}

function decodeQueryKey(key: string): string {
  try {
    return decodeURIComponent(key.replace(/\+/g, ' '));
  } catch {
    return key;
  }
}

function normalizeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9]/g, '');
}
