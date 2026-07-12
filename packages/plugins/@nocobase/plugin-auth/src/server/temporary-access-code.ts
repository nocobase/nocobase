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

export const TEMPORARY_ACCESS_CODE_QUERY_PARAM = '_code';
export const TEMPORARY_ACCESS_CODE_HEADER = 'X-Temp-Code';
export const TEMPORARY_ACCESS_CODE_TTL = 30_000;
export const INVALID_TEMPORARY_ACCESS_CODE = 'INVALID_TEMPORARY_ACCESS_CODE';

const MAX_URL_LENGTH = 4096;
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ROUTING_QUERY_PARAM = '__appName';
const RESERVED_URL_QUERY_PARAMS = new Set([TEMPORARY_ACCESS_CODE_QUERY_PARAM, ROUTING_QUERY_PARAM, 'token']);

export interface TemporaryAccessCodeRecord {
  accessToken: string;
  appName: string;
  authenticator: string;
  roleName?: string;
  urlPattern: string;
}

export interface CreateTemporaryAccessCodeOptions {
  accessToken: string;
  authenticator: string;
  roleName?: string;
  url: string;
}

interface TemporaryAccessRequest {
  appName: string;
  path: string;
  querystring?: string;
}

export class InvalidTemporaryAccessUrlError extends Error {}

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
    throw new InvalidTemporaryAccessUrlError();
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

function canonicalizeUrl(
  url: string,
  options: { ignoredQueryParams?: string[]; rejectReservedQueryParams?: boolean } = {},
) {
  if (
    typeof url !== 'string' ||
    !url ||
    url.length > MAX_URL_LENGTH ||
    url !== url.trim() ||
    url.includes('#') ||
    url.includes('\\') ||
    /^[a-z][a-z\d+.-]*:\/\//i.test(url) ||
    url.startsWith('//')
  ) {
    throw new InvalidTemporaryAccessUrlError();
  }

  const queryIndex = url.indexOf('?');
  const rawPath = queryIndex === -1 ? url : url.slice(0, queryIndex);
  if (!rawPath || hasDotPathSegment(rawPath)) {
    throw new InvalidTemporaryAccessUrlError();
  }

  // Prefix resource actions such as `backups:download` so URL does not treat
  // the action separator as a scheme.
  const parsed = new URL(rawPath.startsWith('/') ? rawPath : `/${rawPath}`, 'http://temporary-access.local');
  const searchParams = new URLSearchParams(queryIndex === -1 ? '' : url.slice(queryIndex + 1));

  if (options.rejectReservedQueryParams) {
    for (const name of searchParams.keys()) {
      if (RESERVED_URL_QUERY_PARAMS.has(name)) {
        throw new InvalidTemporaryAccessUrlError();
      }
    }
  }
  options.ignoredQueryParams?.forEach((name) => searchParams.delete(name));
  searchParams.sort();

  const path = parsed.pathname;
  const querystring = searchParams.toString();
  return querystring ? `${path}?${querystring}` : path;
}

export function normalizeTemporaryAccessUrl(url: string) {
  const normalizedUrl = canonicalizeUrl(url, { rejectReservedQueryParams: true });
  const path = normalizedUrl.split('?', 1)[0];
  const basePath = apiBasePath();
  if (basePath !== '/' && (path === basePath || path.startsWith(`${basePath}/`))) {
    throw new InvalidTemporaryAccessUrlError();
  }
  return normalizedUrl;
}

function matchesUrlPattern(pattern: string, url: string) {
  const normalizedPattern = pattern.replace(/\*+/g, '*');
  let patternIndex = 0;
  let urlIndex = 0;
  let wildcardIndex = -1;
  let wildcardUrlIndex = 0;

  while (urlIndex < url.length) {
    if (patternIndex < normalizedPattern.length && normalizedPattern[patternIndex] === url[urlIndex]) {
      patternIndex++;
      urlIndex++;
    } else if (normalizedPattern[patternIndex] === '*') {
      wildcardIndex = patternIndex++;
      wildcardUrlIndex = urlIndex;
    } else if (wildcardIndex !== -1) {
      patternIndex = wildcardIndex + 1;
      urlIndex = ++wildcardUrlIndex;
    } else {
      return false;
    }
  }

  while (normalizedPattern[patternIndex] === '*') {
    patternIndex++;
  }
  return patternIndex === normalizedPattern.length;
}

function normalizeTemporaryAccessRequest(path: string, querystring = '') {
  const relativePath = stripApiBasePath(path);
  return canonicalizeUrl(querystring ? `${relativePath}?${querystring}` : relativePath, {
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
      urlPattern: normalizeTemporaryAccessUrl(options.url),
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
    if (record.appName !== request.appName) {
      return false;
    }
    try {
      return matchesUrlPattern(record.urlPattern, normalizeTemporaryAccessRequest(request.path, request.querystring));
    } catch {
      return false;
    }
  }
}

function stripTemporaryAccessParams(querystring: string) {
  const searchParams = new URLSearchParams(querystring);
  searchParams.delete(TEMPORARY_ACCESS_CODE_QUERY_PARAM);
  searchParams.delete(ROUTING_QUERY_PARAM);
  return searchParams.toString();
}

function stripTemporaryAccessParamsFromUrl(url: string) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return url;
  }
  const querystring = stripTemporaryAccessParams(url.slice(queryIndex + 1));
  return querystring ? `${url.slice(0, queryIndex)}?${querystring}` : url.slice(0, queryIndex);
}

function removeTemporaryAccessCredentials(ctx: Context) {
  ctx.querystring = stripTemporaryAccessParams(ctx.querystring || '');
  ctx.originalUrl = stripTemporaryAccessParamsFromUrl(ctx.originalUrl);
  ctx.request.originalUrl = ctx.originalUrl;
  const request = ctx.req as typeof ctx.req & { originalUrl?: string };
  if (request.originalUrl) {
    request.originalUrl = stripTemporaryAccessParamsFromUrl(request.originalUrl);
  }
  delete ctx.headers[TEMPORARY_ACCESS_CODE_HEADER.toLowerCase()];
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

export function resolveTemporaryAccessCode(service: TemporaryAccessCodeService) {
  return async function temporaryAccessCodeMiddleware(ctx: Context, next: Next) {
    const queryCodes = new URLSearchParams(ctx.querystring || '').getAll(TEMPORARY_ACCESS_CODE_QUERY_PARAM);
    const headerCode = ctx.get(TEMPORARY_ACCESS_CODE_HEADER);
    if (!queryCodes.length && !headerCode) {
      return next();
    }

    preventResponseCaching(ctx);
    try {
      const code = headerCode || queryCodes[0];
      const path = ctx.path;
      const querystring = ctx.querystring;
      removeTemporaryAccessCredentials(ctx);

      if (ctx.get('Authorization')) {
        return await next();
      }

      if (queryCodes.length > 1 || !code) {
        return rejectAccessCode(ctx);
      }

      const record = await service.get(code);
      if (
        !record ||
        !service.matches(record, {
          appName: ctx.app.name,
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
