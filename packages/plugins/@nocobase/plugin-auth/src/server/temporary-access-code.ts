/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Cache, CacheManager } from '@nocobase/cache';
import { randomBytes } from 'crypto';
import { namespace } from '../preset';

export const TEMPORARY_ACCESS_CODE_QUERY_PARAM = 'accessCode';
export const TEMPORARY_ACCESS_CODE_TTL = 30_000;
export const INVALID_TEMPORARY_ACCESS_CODE = 'INVALID_TEMPORARY_ACCESS_CODE';

const MAX_TARGET_LENGTH = 4096;
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ROUTING_QUERY_PARAM = '__appName';
const RESERVED_TARGET_QUERY_PARAMS = new Set([TEMPORARY_ACCESS_CODE_QUERY_PARAM, ROUTING_QUERY_PARAM, 'token']);
const ORIGINAL_REQUEST_METHOD = Symbol('temporaryAccessCodeOriginalRequestMethod');

type RequestWithOriginalMethod = Context['req'] & {
  [ORIGINAL_REQUEST_METHOD]?: string;
};

export interface TemporaryAccessCodeRecord {
  accessToken: string;
  appName: string;
  authenticator: string;
  roleName?: string;
  target: string;
}

export interface CreateTemporaryAccessCodeOptions {
  accessToken: string;
  authenticator: string;
  roleName?: string;
  target: string;
}

interface TemporaryAccessRequest {
  appName: string;
  method: string;
  path: string;
  querystring?: string;
}

export class InvalidTemporaryAccessTargetError extends Error {}

export function createTemporaryAccessCodeCache(cacheManager: CacheManager) {
  return cacheManager.createCache({
    name: 'auth-temporary-access-code',
  });
}

function apiBasePath() {
  const path = (process.env.API_BASE_PATH || '/api').replace(/\/+$/, '');
  return path.startsWith('/') ? path : `/${path}`;
}

function stripApiBasePath(path: string) {
  const basePath = apiBasePath();
  if (basePath === '/') {
    return path;
  }
  if (path === basePath) {
    return '/';
  }
  if (!path.startsWith(`${basePath}/`)) {
    throw new InvalidTemporaryAccessTargetError();
  }
  return path.slice(basePath.length);
}

function hasDotPathSegment(path: string) {
  return path.split('/').some((segment) => {
    let decoded = segment;
    for (let index = 0; index < 2; index++) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        return true;
      }
    }
    return decoded === '.' || decoded === '..';
  });
}

function canonicalizeTarget(
  target: string,
  options: { ignoredQueryParams?: string[]; rejectReservedQueryParams?: boolean } = {},
) {
  if (
    typeof target !== 'string' ||
    !target ||
    target.length > MAX_TARGET_LENGTH ||
    target !== target.trim() ||
    target.includes('#') ||
    target.includes('\\') ||
    /^[a-z][a-z\d+.-]*:\/\//i.test(target) ||
    target.startsWith('//')
  ) {
    throw new InvalidTemporaryAccessTargetError();
  }

  const queryIndex = target.indexOf('?');
  const rawPath = queryIndex === -1 ? target : target.slice(0, queryIndex);
  if (!rawPath || hasDotPathSegment(rawPath)) {
    throw new InvalidTemporaryAccessTargetError();
  }

  // Prefix resource actions such as `backups:download` so URL does not treat
  // the action separator as a scheme.
  const parsed = new URL(rawPath.startsWith('/') ? rawPath : `/${rawPath}`, 'http://temporary-access.local');
  const searchParams = new URLSearchParams(queryIndex === -1 ? '' : target.slice(queryIndex + 1));

  if (options.rejectReservedQueryParams) {
    for (const name of searchParams.keys()) {
      if (RESERVED_TARGET_QUERY_PARAMS.has(name)) {
        throw new InvalidTemporaryAccessTargetError();
      }
    }
  }
  options.ignoredQueryParams?.forEach((name) => searchParams.delete(name));

  const path = parsed.pathname;
  const querystring = searchParams.toString();
  return querystring ? `${path}?${querystring}` : path;
}

export function normalizeTemporaryAccessTarget(target: string) {
  const normalizedTarget = canonicalizeTarget(target, { rejectReservedQueryParams: true });
  const path = normalizedTarget.split('?', 1)[0];
  const basePath = apiBasePath();
  if (basePath !== '/' && (path === basePath || path.startsWith(`${basePath}/`))) {
    throw new InvalidTemporaryAccessTargetError();
  }
  return normalizedTarget;
}

function normalizeTemporaryAccessRequest(path: string, querystring = '') {
  const relativePath = stripApiBasePath(path);
  return canonicalizeTarget(querystring ? `${relativePath}?${querystring}` : relativePath, {
    ignoredQueryParams: [TEMPORARY_ACCESS_CODE_QUERY_PARAM, ROUTING_QUERY_PARAM],
  });
}

export class TemporaryAccessCodeService {
  constructor(
    private readonly cache: Cache,
    private readonly appName: string,
  ) {}

  private cacheKey(code: string) {
    return `temporary-access-code:${code}`;
  }

  async create(options: CreateTemporaryAccessCodeOptions) {
    const code = randomBytes(32).toString('base64url');
    const record: TemporaryAccessCodeRecord = {
      accessToken: options.accessToken,
      appName: this.appName,
      authenticator: options.authenticator,
      roleName: options.roleName,
      target: normalizeTemporaryAccessTarget(options.target),
    };
    await this.cache.set(this.cacheKey(code), record, TEMPORARY_ACCESS_CODE_TTL);
    return { code };
  }

  async get(code: string) {
    if (!CODE_PATTERN.test(code)) {
      return;
    }
    return this.cache.get<TemporaryAccessCodeRecord>(this.cacheKey(code));
  }

  matches(record: TemporaryAccessCodeRecord, request: TemporaryAccessRequest) {
    if (record.appName !== request.appName || !['GET', 'HEAD'].includes(request.method.toUpperCase())) {
      return false;
    }
    try {
      return record.target === normalizeTemporaryAccessRequest(request.path, request.querystring);
    } catch {
      return false;
    }
  }
}

function stripAccessCode(querystring: string) {
  const searchParams = new URLSearchParams(querystring);
  searchParams.delete(TEMPORARY_ACCESS_CODE_QUERY_PARAM);
  return searchParams.toString();
}

function stripAccessCodeFromUrl(url: string) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return url;
  }
  const querystring = stripAccessCode(url.slice(queryIndex + 1));
  return querystring ? `${url.slice(0, queryIndex)}?${querystring}` : url.slice(0, queryIndex);
}

function removeAccessCodeFromRequest(ctx: Context) {
  ctx.querystring = stripAccessCode(ctx.querystring || '');
  ctx.originalUrl = stripAccessCodeFromUrl(ctx.originalUrl);
  ctx.request.originalUrl = ctx.originalUrl;
  const request = ctx.req as typeof ctx.req & { originalUrl?: string };
  if (request.originalUrl) {
    request.originalUrl = stripAccessCodeFromUrl(request.originalUrl);
  }
}

function invalidAccessCodeError(ctx: Context) {
  return {
    code: INVALID_TEMPORARY_ACCESS_CODE,
    logLevel: 'trace',
    message: ctx.t('Invalid or expired temporary access code.', { ns: namespace }),
  };
}

function rejectAccessCode(ctx: Context) {
  ctx.throw(401, invalidAccessCodeError(ctx));
}

function preventResponseCaching(ctx: Context) {
  ctx.set('Cache-Control', 'private, no-store');
}

function hasRequestBody(ctx: Context) {
  const contentLength = Number(ctx.get('content-length'));
  if ((Number.isFinite(contentLength) && contentLength > 0) || ctx.get('transfer-encoding')) {
    return true;
  }
  const body: unknown = ctx.request.body;
  if (body === undefined || body === null) {
    return false;
  }
  if (typeof body === 'string' || Buffer.isBuffer(body) || Array.isArray(body)) {
    return body.length > 0;
  }
  return typeof body === 'object' ? Object.keys(body).length > 0 : true;
}

export async function captureTemporaryAccessRequestMethod(ctx: Context, next: Next) {
  const request = ctx.req as RequestWithOriginalMethod;
  request[ORIGINAL_REQUEST_METHOD] ??= ctx.req.method;
  await next();
}

function originalRequestMethod(ctx: Context) {
  return (ctx.req as RequestWithOriginalMethod)[ORIGINAL_REQUEST_METHOD] || ctx.req.method;
}

export function resolveTemporaryAccessCode(service: TemporaryAccessCodeService) {
  return async function temporaryAccessCodeMiddleware(ctx: Context, next: Next) {
    const codes = new URLSearchParams(ctx.querystring || '').getAll(TEMPORARY_ACCESS_CODE_QUERY_PARAM);
    if (!codes.length) {
      return next();
    }

    preventResponseCaching(ctx);
    try {
      if (ctx.get('Authorization')) {
        removeAccessCodeFromRequest(ctx);
        return await next();
      }

      const method = originalRequestMethod(ctx)?.toUpperCase();
      const path = ctx.path;
      const querystring = ctx.querystring;
      removeAccessCodeFromRequest(ctx);

      if (
        codes.length !== 1 ||
        !codes[0] ||
        !method ||
        !['GET', 'HEAD'].includes(method) ||
        ctx.method.toUpperCase() !== method ||
        hasRequestBody(ctx)
      ) {
        return rejectAccessCode(ctx);
      }

      const record = await service.get(codes[0]);
      if (
        !record ||
        !service.matches(record, {
          appName: ctx.app.name,
          method,
          path,
          querystring,
        })
      ) {
        return rejectAccessCode(ctx);
      }

      ctx.getBearerToken = () => record.accessToken;
      ctx.headers['x-authenticator'] = record.authenticator;
      if (record.roleName) {
        ctx.headers['x-role'] = record.roleName;
      } else {
        delete ctx.headers['x-role'];
      }
      ctx.state.authenticatedByAccessCode = true;

      await next();
    } finally {
      preventResponseCaching(ctx);
      if (ctx.state.authenticatedByAccessCode === true) {
        ctx.remove('X-New-Token');
      }
    }
  };
}
