/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';
import { createHash, randomBytes } from 'crypto';
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
  method: 'GET';
  roleName?: string;
  target: string;
}

export interface CreateTemporaryAccessCodeOptions {
  accessToken: string;
  authenticator: string;
  roleName?: string;
  target: string;
}

export interface TemporaryAccessRequest {
  appName: string;
  method: string;
  path: string;
  querystring?: string;
}

export class InvalidTemporaryAccessTargetError extends Error {}

function normalizeApiBasePath() {
  const path = (process.env.API_BASE_PATH || '/api').replace(/\/+$/, '');
  return path.startsWith('/') ? path : `/${path}`;
}

function stripApiBasePath(path: string) {
  const apiBasePath = normalizeApiBasePath();
  if (path === apiBasePath) {
    return '/';
  }
  if (path.startsWith(`${apiBasePath}/`)) {
    return path.slice(apiBasePath.length);
  }
  return path;
}

function hasDotPathSegment(rawPath: string) {
  return rawPath.split('/').some((segment) => {
    let decoded = segment;
    for (let index = 0; index < 2; index++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) {
          break;
        }
        decoded = next;
      } catch {
        return true;
      }
    }
    return decoded === '.' || decoded === '..';
  });
}

function decodeQueryComponent(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    throw new InvalidTemporaryAccessTargetError();
  }
}

function normalizeQuerystring(
  querystring: string,
  options: {
    ignoredQueryParams?: Set<string>;
    rejectReservedQueryParams?: boolean;
  },
) {
  const params = querystring
    .split('&')
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const equalsIndex = segment.indexOf('=');
      const hasEquals = equalsIndex !== -1;
      const rawName = hasEquals ? segment.slice(0, equalsIndex) : segment;
      const rawValue = hasEquals ? segment.slice(equalsIndex + 1) : undefined;
      return {
        hasEquals,
        name: decodeQueryComponent(rawName),
        value: rawValue === undefined ? undefined : decodeQueryComponent(rawValue),
      };
    })
    .filter(({ name }) => {
      if (options.rejectReservedQueryParams && RESERVED_TARGET_QUERY_PARAMS.has(name)) {
        throw new InvalidTemporaryAccessTargetError();
      }
      return !options.ignoredQueryParams?.has(name);
    });

  return params
    .map(({ hasEquals, name, value }) => {
      const encodedName = encodeURIComponent(name);
      return hasEquals ? `${encodedName}=${encodeURIComponent(value ?? '')}` : encodedName;
    })
    .join('&');
}

function normalizeTarget(
  target: string,
  options: {
    ignoredQueryParams?: Set<string>;
    rejectReservedQueryParams?: boolean;
  } = {},
) {
  if (
    typeof target !== 'string' ||
    !target ||
    target.length > MAX_TARGET_LENGTH ||
    target !== target.trim() ||
    target.includes('#') ||
    target.includes('\\') ||
    /^https?:\/\//i.test(target) ||
    target.startsWith('//')
  ) {
    throw new InvalidTemporaryAccessTargetError();
  }

  const queryIndex = target.indexOf('?');
  const rawPath = queryIndex === -1 ? target : target.slice(0, queryIndex);
  const rawQuerystring = queryIndex === -1 ? '' : target.slice(queryIndex + 1);
  if (hasDotPathSegment(rawPath)) {
    throw new InvalidTemporaryAccessTargetError();
  }

  // Resource actions such as `backups:download` contain a colon. Prefixing
  // the path before URL parsing prevents it from being interpreted as a URL
  // scheme.
  const parsed = new URL(rawPath.startsWith('/') ? rawPath : `/${rawPath}`, 'http://temporary-access.local');

  const path = stripApiBasePath(parsed.pathname);
  const querystring = normalizeQuerystring(rawQuerystring, options);
  return querystring ? `${path}?${querystring}` : path;
}

export function normalizeTemporaryAccessTarget(target: string) {
  return normalizeTarget(target, { rejectReservedQueryParams: true });
}

function normalizeTemporaryAccessRequest(path: string, querystring = '') {
  return normalizeTarget(querystring ? `${path}?${querystring}` : path, {
    ignoredQueryParams: new Set([TEMPORARY_ACCESS_CODE_QUERY_PARAM, ROUTING_QUERY_PARAM]),
  });
}

function isTemporaryAccessCodeRecord(value: unknown): value is TemporaryAccessCodeRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Partial<TemporaryAccessCodeRecord>;
  return (
    typeof record.accessToken === 'string' &&
    typeof record.appName === 'string' &&
    typeof record.authenticator === 'string' &&
    record.method === 'GET' &&
    (record.roleName === undefined || typeof record.roleName === 'string') &&
    typeof record.target === 'string'
  );
}

export class TemporaryAccessCodeService {
  constructor(
    private readonly cache: Cache,
    private readonly appName: string,
  ) {}

  private getCacheKey(code: string) {
    const digest = createHash('sha256').update(code).digest('hex');
    return `auth:temporary-access-code:${digest}`;
  }

  async create(options: CreateTemporaryAccessCodeOptions) {
    const target = normalizeTemporaryAccessTarget(options.target);
    const code = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + TEMPORARY_ACCESS_CODE_TTL;
    const record: TemporaryAccessCodeRecord = {
      accessToken: options.accessToken,
      appName: this.appName,
      authenticator: options.authenticator,
      method: 'GET',
      roleName: options.roleName,
      target,
    };

    await this.cache.set(this.getCacheKey(code), record, TEMPORARY_ACCESS_CODE_TTL);
    return { code, expiresAt };
  }

  async get(code: string) {
    if (!CODE_PATTERN.test(code)) {
      return;
    }
    const record = await this.cache.get<TemporaryAccessCodeRecord>(this.getCacheKey(code));
    return isTemporaryAccessCodeRecord(record) ? record : undefined;
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

function getQueryParamName(segment: string) {
  const equalsIndex = segment.indexOf('=');
  const rawName = equalsIndex === -1 ? segment : segment.slice(0, equalsIndex);
  try {
    return decodeQueryComponent(rawName);
  } catch {
    return;
  }
}

function stripAccessCodeFromQuerystring(querystring: string) {
  return querystring
    .split('&')
    .filter((segment) => getQueryParamName(segment) !== TEMPORARY_ACCESS_CODE_QUERY_PARAM)
    .join('&');
}

function stripAccessCodeFromUrl(url: string) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return url;
  }
  const path = url.slice(0, queryIndex);
  const querystring = stripAccessCodeFromQuerystring(url.slice(queryIndex + 1));
  return querystring ? `${path}?${querystring}` : path;
}

function removeAccessCodeFromRequest(ctx: Context) {
  ctx.querystring = stripAccessCodeFromQuerystring(ctx.querystring || '');

  const originalUrl = stripAccessCodeFromUrl(ctx.originalUrl);
  ctx.originalUrl = originalUrl;
  ctx.request.originalUrl = originalUrl;
  const request = ctx.req as typeof ctx.req & { originalUrl?: string };
  if (typeof request.originalUrl === 'string') {
    request.originalUrl = stripAccessCodeFromUrl(request.originalUrl);
  }
}

function rejectTemporaryAccessCode(ctx: Context) {
  ctx.throw(401, getInvalidTemporaryAccessCodeError(ctx));
}

function getInvalidTemporaryAccessCodeError(ctx: Context) {
  return {
    code: INVALID_TEMPORARY_ACCESS_CODE,
    logLevel: 'trace',
    message: ctx.t('Invalid or expired temporary access code.', { ns: namespace }),
  };
}

function preventTemporaryAccessResponseCaching(ctx: Context) {
  ctx.set('Cache-Control', 'private, no-store');
}

function hasRequestBody(ctx: Context) {
  const contentLength = Number(ctx.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 0) {
    return true;
  }
  if (ctx.get('transfer-encoding')) {
    return true;
  }

  const body: unknown = ctx.request.body;
  if (body === undefined || body === null) {
    return false;
  }
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    return body.length > 0;
  }
  if (Array.isArray(body)) {
    return body.length > 0;
  }
  if (typeof body === 'object') {
    return Object.keys(body).length > 0;
  }
  return true;
}

export async function captureTemporaryAccessRequestMethod(ctx: Context, next: Next) {
  const request = ctx.req as RequestWithOriginalMethod;
  request[ORIGINAL_REQUEST_METHOD] ??= ctx.req.method;
  await next();
}

function getOriginalRequestMethod(ctx: Context) {
  return (ctx.req as RequestWithOriginalMethod)[ORIGINAL_REQUEST_METHOD] || ctx.req.method;
}

export function resolveTemporaryAccessCode(service: TemporaryAccessCodeService) {
  return async function temporaryAccessCodeMiddleware(ctx: Context, next: Next) {
    const searchParams = new URLSearchParams(ctx.querystring || '');
    const codes = searchParams.getAll(TEMPORARY_ACCESS_CODE_QUERY_PARAM);
    if (!codes.length) {
      return next();
    }

    preventTemporaryAccessResponseCaching(ctx);
    try {
      // A regular Authorization header always wins. The access-code query
      // parameter is still removed because it is reserved for authentication.
      if (ctx.get('Authorization')) {
        removeAccessCodeFromRequest(ctx);
        await next();
        return;
      }

      if (codes.length !== 1 || !codes[0]) {
        removeAccessCodeFromRequest(ctx);
        return rejectTemporaryAccessCode(ctx);
      }

      const originalMethod = getOriginalRequestMethod(ctx)?.toUpperCase();
      if (
        !originalMethod ||
        !['GET', 'HEAD'].includes(originalMethod) ||
        ctx.method.toUpperCase() !== originalMethod ||
        hasRequestBody(ctx)
      ) {
        removeAccessCodeFromRequest(ctx);
        return rejectTemporaryAccessCode(ctx);
      }

      const request: TemporaryAccessRequest = {
        appName: ctx.app.name,
        method: originalMethod,
        path: ctx.path,
        querystring: ctx.querystring,
      };
      removeAccessCodeFromRequest(ctx);
      const record = await service.get(codes[0]);
      if (!record || !service.matches(record, request)) {
        return rejectTemporaryAccessCode(ctx);
      }

      ctx.getBearerToken = () => record.accessToken;
      ctx.headers['x-authenticator'] = record.authenticator;
      if (record.roleName) {
        ctx.headers['x-role'] = record.roleName;
      } else {
        delete ctx.headers['x-role'];
      }
      ctx.state.authenticatedByAccessCode = true;
      ctx.state.disableTokenRenewal = true;
      ctx.state.forceAuthCheck = true;
      ctx.state.forceAuthCheckError = getInvalidTemporaryAccessCodeError(ctx);

      await next();
    } finally {
      preventTemporaryAccessResponseCaching(ctx);
      if (ctx.state.authenticatedByAccessCode === true) {
        ctx.remove('X-New-Token');
      }
    }
  };
}
