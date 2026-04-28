/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import inject from 'light-my-request';
import type { IdpOauthService } from './service';
import { getProviderInternalPath } from './paths';

type Provider = import('oidc-provider').Provider;

const LOOPBACK_REDIRECT_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

type DispatchContext = {
  method: string;
  path: string;
  querystring?: string;
  headers: Record<string, string | string[] | undefined>;
  logger?: {
    debug?: (message: string, meta?: Record<string, any>) => void;
    warn?: (message: string, meta?: Record<string, any>) => void;
  };
  request: {
    body?: Record<string, any> | string | null;
  };
  get(name: string): string;
  set(name: string, value: string | string[]): void;
  body?: unknown;
  status?: number;
  withoutDataWrapping?: boolean;
};

function getRequestBody(ctx: DispatchContext) {
  const body = ctx.request.body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return undefined;
    }
  }
  return body;
}

function isLoopbackRedirectUri(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' && LOOPBACK_REDIRECT_HOSTS.has(url.hostname) && !!url.port;
  } catch (error) {
    return false;
  }
}

function assertRegistrationRedirectUris(ctx: DispatchContext, pathname: string) {
  if (ctx.method !== 'POST' || pathname !== '/idpOAuth/register') {
    return true;
  }

  const body = getRequestBody(ctx);
  const redirectUris = body?.redirect_uris;
  if (
    !Array.isArray(redirectUris) ||
    !redirectUris.length ||
    !redirectUris.every((uri) => typeof uri === 'string' && isLoopbackRedirectUri(uri))
  ) {
    ctx.status = 400;
    ctx.body = {
      error: 'invalid_client_metadata',
      error_description: 'redirect_uris must only contain http loopback callback URLs with an explicit port',
    };
    return false;
  }

  return true;
}

function buildPayload(ctx: DispatchContext) {
  const body = ctx.request.body;
  if (body === undefined || body === null) {
    return undefined;
  }

  const contentType = String(ctx.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return new URLSearchParams(body).toString();
  }

  if (contentType.includes('application/json')) {
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  return body;
}

function buildHeaders(ctx: DispatchContext, service: IdpOauthService) {
  const publicOrigin = service.getProviderContext(ctx).origin;
  const headers = { ...ctx.headers, host: new URL(publicOrigin).host };

  // The payload is rebuilt for the injected request, so transport-specific length headers must be removed.
  delete headers['content-length'];
  delete headers['Content-Length'];
  delete headers['transfer-encoding'];
  delete headers['Transfer-Encoding'];

  return headers;
}

function rewriteProviderPathname(ctx: DispatchContext, service: IdpOauthService, pathname: string) {
  const { issuerPath } = service.getProviderContext(ctx);
  const externalPathPrefix = `${issuerPath}/idpOAuth/`;
  const internalPathPrefix = '/idpOAuth/';
  const metadataPrefixes = ['/.well-known/oauth-authorization-server', '/.well-known/openid-configuration'];

  // oidc-provider only knows its internal mount paths, but externally it is exposed under issuerPath.
  if (pathname.startsWith(externalPathPrefix) || pathname === issuerPath) {
    return pathname;
  }

  if (pathname.startsWith(internalPathPrefix)) {
    return `${issuerPath}${pathname}`;
  }

  if (metadataPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return `${issuerPath}${pathname}`;
  }

  return pathname;
}

function rewriteProviderUrl(ctx: DispatchContext, service: IdpOauthService, value: string) {
  const { origin } = service.getProviderContext(ctx);
  const publicOriginUrl = new URL(origin);

  if (value.startsWith('/')) {
    const url = new URL(value, origin);
    url.pathname = rewriteProviderPathname(ctx, service, url.pathname);
    return url.pathname + url.search + url.hash;
  }

  try {
    const url = new URL(value);
    const rewrittenPathname = rewriteProviderPathname(ctx, service, url.pathname);
    if (rewrittenPathname === url.pathname && url.origin !== origin) {
      return value;
    }

    url.protocol = publicOriginUrl.protocol;
    url.host = publicOriginUrl.host;
    url.pathname = rewrittenPathname;
    return url.toString();
  } catch (error) {
    return value;
  }
}

export function rewriteProviderLocationHeader(ctx: DispatchContext, service: IdpOauthService, location: string) {
  return rewriteProviderUrl(ctx, service, location);
}

function getFrontendInteractionCookiePath(originalPath: string) {
  const match = originalPath.match(/^\/(?:apps\/([^/]+)\/)?idp-oauth\/interaction\/([^/]+)$/);
  if (!match) {
    return undefined;
  }

  const [, appName, uid] = match;
  return { appName, uid };
}

function rewriteProviderSetCookieHeader(ctx: DispatchContext, service: IdpOauthService, cookie: string) {
  const pathMatch = cookie.match(/;\s*path=([^;]+)/i);
  if (!pathMatch) {
    return cookie;
  }

  const originalPath = pathMatch[1];
  let rewrittenPath = rewriteProviderLocationHeader(ctx, service, originalPath);
  const providerContext = service.getProviderContext(ctx);

  if (originalPath.startsWith('/idpOAuth/interaction/')) {
    rewrittenPath = `${providerContext.issuerPath}${originalPath}`;
  }

  const frontendInteractionPath = getFrontendInteractionCookiePath(originalPath);
  if (frontendInteractionPath) {
    // The browser renders the frontend interaction page, but the provider session must be sent to the backend API route.
    const interactionAppName = frontendInteractionPath.appName || providerContext.appName;
    const interactionIssuerPath = frontendInteractionPath.appName
      ? service.getIssuerPath(interactionAppName)
      : providerContext.issuerPath;
    rewrittenPath = `${interactionIssuerPath}/idpOAuth/interaction/${frontendInteractionPath.uid}`;
  }

  if (rewrittenPath === originalPath) {
    return cookie;
  }

  return cookie.replace(pathMatch[0], `; path=${rewrittenPath}`);
}

function rewriteProviderJsonBody(ctx: DispatchContext, service: IdpOauthService, body: Record<string, any>) {
  const { issuer } = service.getProviderContext(ctx);
  const metadataPaths = [
    '/idpOAuth/authorize',
    '/idpOAuth/token',
    '/idpOAuth/register',
    '/idpOAuth/revoke',
    '/idpOAuth/jwks',
    '/idpOAuth/me',
    '/idpOAuth/introspection',
    '/idpOAuth/end-session',
  ] as const;
  const metadataKeys = [
    'authorization_endpoint',
    'token_endpoint',
    'registration_endpoint',
    'revocation_endpoint',
    'jwks_uri',
    'userinfo_endpoint',
    'introspection_endpoint',
    'end_session_endpoint',
  ] as const;

  if (
    ctx.path.endsWith('/.well-known/oauth-authorization-server') ||
    ctx.path.endsWith('/.well-known/openid-configuration')
  ) {
    // Discovery must advertise the public issuer-mounted endpoints rather than provider-internal paths.
    body.issuer = issuer;
    body.scopes_supported = service.getSupportedScopes();
    metadataKeys.forEach((key, index) => {
      body[key] = `${issuer}${metadataPaths[index]}`;
    });
  }

  if (typeof body.registration_client_uri === 'string') {
    const registrationClientUri = new URL(body.registration_client_uri, issuer);
    const clientId = body.client_id || registrationClientUri.pathname.split('/').pop();
    body.registration_client_uri = `${issuer}/idpOAuth/register/${clientId}`;
  }

  return body;
}

function rewriteProviderResponseHeaders(
  ctx: DispatchContext,
  service: IdpOauthService,
  headers: Record<string, string | string[] | undefined>,
) {
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    if (name.toLowerCase() === 'location') {
      const originalLocation = Array.isArray(value) ? String(value[0]) : String(value);
      ctx.set(name, rewriteProviderLocationHeader(ctx, service, originalLocation));
      continue;
    }

    if (name.toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(value) ? value.map(String) : [String(value)];
      ctx.set(
        name,
        cookies.map((cookie) => rewriteProviderSetCookieHeader(ctx, service, cookie)),
      );
      continue;
    }

    ctx.set(name, Array.isArray(value) ? value.map(String) : String(value));
  }
}

export async function dispatchToProvider(
  ctx: DispatchContext,
  provider: Provider,
  pathname: string,
  service: IdpOauthService,
) {
  ctx.withoutDataWrapping = true;
  const search = ctx.querystring ? `?${ctx.querystring}` : '';
  if (!assertRegistrationRedirectUris(ctx, pathname)) {
    return;
  }

  ctx.logger?.debug?.('idp-oauth provider request', {
    method: ctx.method,
    externalPath: ctx.path,
    internalPath: pathname,
    search,
    issuer: provider.issuer,
  });
  const response = (await inject(provider.callback(), {
    method: ctx.method as any,
    url: `${pathname}${search}`,
    headers: buildHeaders(ctx, service),
    payload: buildPayload(ctx),
  })) as any;

  ctx.status = response.statusCode;
  rewriteProviderResponseHeaders(ctx, service, response.headers as Record<string, string | string[] | undefined>);

  const payload = response.rawPayload;
  const contentType = String(response.headers['content-type'] || '').toLowerCase();
  ctx.logger?.debug?.('idp-oauth provider response', {
    method: ctx.method,
    externalPath: ctx.path,
    internalPath: pathname,
    status: response.statusCode,
    contentType,
    location: response.headers.location,
  });
  if (payload.length && (contentType.includes('application/json') || contentType.includes('+json'))) {
    try {
      const body = rewriteProviderJsonBody(ctx, service, JSON.parse(payload.toString('utf8')));
      ctx.body = body;
      return;
    } catch (error) {
      ctx.logger?.warn?.('idp-oauth provider json parse failed', {
        method: ctx.method,
        externalPath: ctx.path,
        internalPath: pathname,
        status: response.statusCode,
        contentType,
        error: error instanceof Error ? error.message : String(error),
        payloadPreview: payload.toString('utf8').slice(0, 500),
      });
      // fall through and return raw payload
    }
  }

  ctx.body = payload.length ? payload : undefined;
}

export async function dispatchCurrentRequestToProvider(
  ctx: DispatchContext,
  service: IdpOauthService,
  apiBasePath: string,
) {
  const provider = await service.ensureProviderForContext(ctx);
  return dispatchToProvider(ctx, provider, getProviderInternalPath(ctx.path, apiBasePath), service);
}
