/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Cache } from '@nocobase/cache';
import Application, { AppSupervisor } from '@nocobase/server';
import fs from 'node:fs';
import inject from 'light-my-request';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { storagePathJoin } from '@nocobase/utils';
import { createDbAdapter } from './db-adapter';
import { normalizeBasePath } from './utils';

type OidcModule = typeof import('oidc-provider');
type JoseModule = typeof import('jose');
type ProviderInstance = import('oidc-provider').Provider;
type ResourceServer = import('oidc-provider').ResourceServer;
type TokenFormat = import('oidc-provider').TokenFormat;

let oidcModulePromise: Promise<OidcModule> | null = null;
let joseModulePromise: Promise<JoseModule> | null = null;

function getOidcModule() {
  if (!oidcModulePromise) {
    oidcModulePromise = import('oidc-provider');
  }
  return oidcModulePromise;
}

function getJoseModule() {
  if (!joseModulePromise) {
    joseModulePromise = import('jose');
  }
  return joseModulePromise;
}

export type ResourceServerConfig = {
  path?: string;
  identifier?: string;
  audience?: string;
  scope: string;
  accessTokenTTL?: number;
  accessTokenFormat?: TokenFormat;
  jwt?: ResourceServer['jwt'];
};

type ProviderContext = {
  appName: string;
  issuer: string;
  issuerPath: string;
  origin: string;
};

const defaultSupportedScopes = ['openid', 'offline_access', 'profile', 'email'] as const;
const envJwksKeys = ['IDP_OAUTH_JWKS', 'OAUTH_JWKS'] as const;
const MAX_CACHE_TTL_MS = 2_147_483_647;
type JsonWebKeySet = Awaited<ReturnType<JoseModule['exportJWK']>> extends infer T
  ? { keys: Array<T & { kid?: string; use?: string; alg?: string }> }
  : { keys: Array<Record<string, any>> };

export class IdpOauthService {
  private providers = new Map<string, ProviderInstance>();
  private pendingProviders = new Map<string, Promise<ProviderInstance>>();
  private resourceServers = new Map<string, ResourceServerConfig>();
  private resourceJwks = new Map<string, unknown>();

  constructor(
    private readonly app: Application,
    private readonly bridgeTokenCache: Cache,
  ) {}

  getOrigin(ctx: any) {
    const protocol = ctx.headers?.['x-forwarded-proto'] || ctx.protocol || 'http';
    const host = ctx.headers?.['x-forwarded-host'] || ctx.host || '';
    return process.env.APP_PUBLIC_ORIGIN || `${protocol}://${host}`;
  }

  private getApiBasePath() {
    return normalizeBasePath(process.env.API_BASE_PATH || '/api');
  }

  private getRequestPath(ctx: any) {
    if (typeof ctx?.req?.originalUrl === 'string') {
      return ctx.req.originalUrl.split('?')[0];
    }

    if (typeof ctx?.path === 'string') {
      return ctx.path;
    }

    if (typeof ctx?.req?.url === 'string') {
      return ctx.req.url.split('?')[0];
    }

    return '';
  }

  private getAppIssuerPath(appName = this.app.name) {
    const apiBasePath = this.getApiBasePath();
    if (appName === 'main') {
      return apiBasePath;
    }
    return `${apiBasePath}/__app/${appName}`;
  }

  getIssuerPath(appName = this.app.name, ctx?: any) {
    const apiBasePath = this.getApiBasePath();
    if (appName === 'main') {
      return apiBasePath;
    }

    const appSupervisor = AppSupervisor.getInstance();
    if (appSupervisor?.runningMode === 'single') {
      return apiBasePath;
    }

    const appIssuerPath = this.getAppIssuerPath(appName);
    if (!ctx) {
      return appIssuerPath;
    }

    const requestPath = this.getRequestPath(ctx);
    if (!requestPath.startsWith(appIssuerPath)) {
      return apiBasePath;
    }

    return appIssuerPath;
  }

  getIssuer(origin: string, appName = this.app.name, ctx?: any) {
    return `${origin}${this.getIssuerPath(appName, ctx)}`;
  }

  private shouldUseSubAppPublicPrefix(appName: string, issuerPath = this.getIssuerPath(appName)) {
    if (!appName || appName === 'main') {
      return false;
    }

    return issuerPath !== this.getApiBasePath();
  }

  getFrontendInteractionPath(appName: string, uid: string, issuerPath = this.getIssuerPath(appName)) {
    if (!this.shouldUseSubAppPublicPrefix(appName, issuerPath)) {
      return `/idp-oauth/interaction/${uid}`;
    }

    return `/apps/${appName}/idp-oauth/interaction/${uid}`;
  }

  getFrontendErrorPath(appName: string, issuerPath = this.getIssuerPath(appName)) {
    if (!this.shouldUseSubAppPublicPrefix(appName, issuerPath)) {
      return '/idp-oauth/error';
    }

    return `/apps/${appName}/idp-oauth/error`;
  }

  getProviderContext(ctx: any): ProviderContext {
    const appName = ctx.app?.name || this.app.name;
    const origin = this.getOrigin(ctx);
    const issuerPath = this.getIssuerPath(appName, ctx);
    const issuer = this.getIssuer(origin, appName, ctx);

    return {
      appName,
      issuer,
      issuerPath,
      origin,
    };
  }

  registerResourceServer(name: string, config: ResourceServerConfig) {
    this.resourceServers.set(name, config);
  }

  unregisterResourceServer(name: string) {
    this.resourceServers.delete(name);
  }

  getSupportedScopes() {
    const supportedScopes = new Set<string>(defaultSupportedScopes);

    for (const config of this.resourceServers.values()) {
      for (const scope of config.scope.split(/\s+/)) {
        if (scope) {
          supportedScopes.add(scope);
        }
      }
    }

    return [...supportedScopes];
  }

  private resolveResourceIdentifier(providerContext: ProviderContext, config: ResourceServerConfig) {
    if (config.identifier) {
      return config.identifier;
    }

    if (!config.path) {
      return undefined;
    }

    const normalizedPath = config.path.startsWith('/') ? config.path : `/${config.path}`;
    return new URL(`${providerContext.issuerPath}${normalizedPath}`, providerContext.origin).href;
  }

  private getResourceServerInfo(
    providerContext: ProviderContext,
    resourceIndicator: string,
  ): ResourceServer | undefined {
    for (const config of this.resourceServers.values()) {
      const identifier = this.resolveResourceIdentifier(providerContext, config);

      if (!identifier || identifier !== resourceIndicator) {
        continue;
      }

      return {
        audience: config.audience || identifier,
        scope: config.scope,
        accessTokenTTL: config.accessTokenTTL,
        accessTokenFormat: config.accessTokenFormat,
        jwt: config.jwt,
      };
    }

    return undefined;
  }

  private getResolvedResourceIdentifiers(providerContext: ProviderContext) {
    const identifiers: string[] = [];

    for (const config of this.resourceServers.values()) {
      const identifier = this.resolveResourceIdentifier(providerContext, config);
      if (identifier) {
        identifiers.push(identifier);
      }
    }

    return identifiers;
  }

  private getResourcePath(config: ResourceServerConfig) {
    if (!config.path) {
      return undefined;
    }

    const normalizedPath = config.path.startsWith('/') ? config.path : `/${config.path}`;
    return `${normalizeBasePath(process.env.API_BASE_PATH || '/api')}${normalizedPath}`;
  }

  private getRequestResourceConfig(ctx: any) {
    const requestPath = normalizeBasePath(ctx.path || this.getRequestPath(ctx) || '/');
    let matchedConfig: ResourceServerConfig | undefined;
    let matchedPathLength = -1;

    for (const config of this.resourceServers.values()) {
      const resourcePath = this.getResourcePath(config);
      if (!resourcePath) {
        continue;
      }

      const normalizedResourcePath = normalizeBasePath(resourcePath);
      const isRootResource = normalizedResourcePath === normalizeBasePath(`${this.getApiBasePath()}/`);
      const matches =
        requestPath === normalizedResourcePath ||
        requestPath.startsWith(`${normalizedResourcePath}/`) ||
        (isRootResource && requestPath.startsWith(`${this.getApiBasePath()}/`));

      if (matches) {
        if (normalizedResourcePath.length > matchedPathLength) {
          matchedConfig = config;
          matchedPathLength = normalizedResourcePath.length;
        }
      }
    }

    return matchedConfig;
  }

  private async getProviderJwks(provider: ProviderInstance) {
    if (this.resourceJwks.has(provider.issuer)) {
      return this.resourceJwks.get(provider.issuer);
    }
    const { createLocalJWKSet } = await getJoseModule();

    const issuerPath = normalizeBasePath(new URL(provider.issuer).pathname || '/');
    const jwksPath = (provider as any).pathFor('jwks') as string;
    const internalJwksPath =
      jwksPath === issuerPath
        ? '/'
        : jwksPath.startsWith(`${issuerPath}/`)
          ? jwksPath.slice(issuerPath.length) || '/'
          : jwksPath;

    const response = await inject(provider.callback(), {
      method: 'GET',
      url: internalJwksPath,
      headers: {
        host: new URL(provider.issuer).host,
        accept: 'application/json',
      },
    });

    const jwks = response.json();
    const localJwks = createLocalJWKSet(jwks);
    this.resourceJwks.set(provider.issuer, localJwks);
    return localJwks;
  }

  private async generateSigningJwks(): Promise<JsonWebKeySet> {
    const { exportJWK, generateKeyPair } = await getJoseModule();
    const { privateKey } = await generateKeyPair('RS256', { extractable: true });
    const privateJwk = await exportJWK(privateKey);

    return {
      keys: [
        {
          ...privateJwk,
          kid: privateJwk.kid || 'idp-oauth-rs256',
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };
  }

  private getDefaultJwksPath(appName: string) {
    return storagePathJoin('apps', appName, 'idp_oauth_jwks.json');
  }

  private async getProviderSigningJwks(appName: string) {
    const parseJwks = (value: string, source: string) => {
      try {
        const jwks = JSON.parse(value);
        if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
          throw new Error('must be a JSON object with a non-empty keys array');
        }
        return jwks as JsonWebKeySet;
      } catch (error) {
        throw new Error(`Failed to parse JWKS from ${source}: ${(error as Error).message}`);
      }
    };

    for (const key of envJwksKeys) {
      const value = process.env[key];
      if (value) {
        return parseJwks(value, `environment variable ${key}`);
      }
    }

    const jwksPath = this.getDefaultJwksPath(appName);
    if (fs.existsSync(jwksPath)) {
      return parseJwks(fs.readFileSync(jwksPath, 'utf8'), `file ${jwksPath}`);
    }

    const generatedJwks = await this.generateSigningJwks();
    fs.mkdirSync(path.dirname(jwksPath), { recursive: true });
    fs.writeFileSync(jwksPath, JSON.stringify(generatedJwks, null, 2), { mode: 0o600 });
    return generatedJwks;
  }

  private async issueInternalToken(userId: number, maxExpiresInMs?: number) {
    const tokenInfo = await this.app.authManager.tokenController.add({ userId });
    const config = await this.app.authManager.tokenController.getConfig();
    const expiresInMs =
      typeof maxExpiresInMs === 'number' && Number.isFinite(maxExpiresInMs)
        ? Math.max(1000, Math.min(config.tokenExpirationTime, maxExpiresInMs))
        : config.tokenExpirationTime;
    const expiresIn = Math.max(1, Math.floor(expiresInMs / 1000));

    return this.app.authManager.jwt.sign(
      {
        userId,
        temp: true,
        signInTime: tokenInfo.signInTime,
      },
      {
        jwtid: tokenInfo.jti,
        expiresIn,
      },
    );
  }

  private getBridgeTokenCacheKey(token: string, tokenId?: string) {
    return tokenId || createHash('sha256').update(token).digest('hex');
  }

  private async findUserById(userId: string | number) {
    return this.app.db.getRepository('users').findOne({
      filterByTk: String(userId),
    });
  }

  async resolveInteractionSessionUser(accountId?: string | number) {
    if (!accountId) {
      return undefined;
    }
    return this.findUserById(accountId);
  }

  async resolveInteractionBridgeUser(ctx: any) {
    const token = ctx.getBearerToken?.();
    if (!token || typeof token !== 'string') {
      ctx.logger?.debug?.('idp-oauth interaction bridge user missing token', {
        path: ctx.path,
        hasBearerToken: !!token,
      });
      return undefined;
    }

    const headerAuthenticator = ctx.get?.('x-authenticator');
    const authenticatorName = headerAuthenticator || 'basic';
    try {
      const auth = await ctx.app.authManager.get(authenticatorName, {
        app: ctx.app,
        db: ctx.db,
        cache: ctx.cache,
        logger: ctx.logger,
        log: ctx.log,
        headers: {
          ...ctx.headers,
          authorization: `Bearer ${token}`,
          'x-authenticator': authenticatorName,
        },
        req: {
          ...ctx.req,
          headers: {
            ...ctx.req.headers,
            authorization: `Bearer ${token}`,
            'x-authenticator': authenticatorName,
          },
        },
        get: (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName === 'authorization') {
            return `Bearer ${token}`;
          }
          if (lowerName === 'x-authenticator') {
            return authenticatorName;
          }
          return ctx.get?.(name);
        },
        getBearerToken: () => token,
        throw: (...args: any[]) => {
          throw new Error(args?.[0]?.message || args?.[0] || 'Authentication failed');
        },
        t: ctx.t,
        i18n: ctx.i18n,
        state: { ...ctx.state },
      } as any);
      const { user } = await auth.checkToken();
      if (user) {
        ctx.auth = auth;
        ctx.auth.user = user;
        ctx.state.currentUser = user;
        return user;
      }
      return undefined;
    } catch (error) {
      ctx.logger?.debug?.('idp-oauth interaction bridge user failed', {
        path: ctx.path,
        authenticator: authenticatorName,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  async authenticateResourceRequest(ctx: any) {
    const resourceConfig = this.getRequestResourceConfig(ctx);
    if (!resourceConfig) {
      return undefined;
    }

    const token = ctx.getBearerToken?.() || '';
    if (!token) {
      return undefined;
    }
    const { decodeJwt, jwtVerify } = await getJoseModule();

    const providerContext = this.getProviderContext(ctx);
    const audience = this.resolveResourceIdentifier(providerContext, resourceConfig);
    ctx.logger?.debug?.('idp-oauth authenticate resource request', {
      path: ctx.path,
      issuer: providerContext.issuer,
      audience,
      hasBearerToken: !!token,
    });

    try {
      const decoded = decodeJwt(token);
      if (decoded.iss !== providerContext.issuer) {
        return undefined;
      }
    } catch (_error) {
      return undefined;
    }

    const provider = await this.ensureProvider(providerContext);
    const keySet = await this.getProviderJwks(provider);

    let payload;
    try {
      ({ payload } = await jwtVerify(token, keySet as any, {
        issuer: providerContext.issuer,
        audience,
      }));
    } catch (error) {
      return undefined;
    }

    if (typeof payload.sub !== 'string' || !payload.sub) {
      ctx.throw(401, 'Invalid token subject');
    }

    const user = await this.app.db.getRepository('users').findOne({
      filterByTk: payload.sub,
    });

    if (!user) {
      ctx.throw(401, 'User not found');
    }

    const oauthExpiresInMs = typeof payload.exp === 'number' ? Math.max(0, payload.exp * 1000 - Date.now()) : undefined;
    const bridgeTokenCacheKey = this.getBridgeTokenCacheKey(
      token,
      typeof payload.jti === 'string' ? payload.jti : undefined,
    );
    const cachedInternalToken = await this.bridgeTokenCache.get<string>(bridgeTokenCacheKey);
    const internalToken = cachedInternalToken || (await this.issueInternalToken(user.id, oauthExpiresInMs));
    if (!cachedInternalToken && typeof oauthExpiresInMs === 'number' && oauthExpiresInMs > 0) {
      await this.bridgeTokenCache.set(bridgeTokenCacheKey, internalToken, Math.min(oauthExpiresInMs, MAX_CACHE_TTL_MS));
    }
    const authorizationHeader = `Bearer ${internalToken}`;

    ctx.req.headers.authorization = authorizationHeader;
    ctx.request.headers.authorization = authorizationHeader;
    ctx.getBearerToken = () => internalToken;
    ctx.req.headers['x-authenticator'] = 'basic';
    ctx.request.headers['x-authenticator'] = 'basic';
    ctx.state.currentUser = user;
    ctx.auth = ctx.auth || {};
    ctx.auth.user = user;

    return user;
  }

  private getPublicErrorLocation(appName: string, out: Record<string, any>, issuerPath = this.getIssuerPath(appName)) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(out || {})) {
      if (typeof value === 'undefined' || value === null) {
        continue;
      }
      query.set(key, String(value));
    }

    return `${this.getFrontendErrorPath(appName, issuerPath)}${query.size ? `?${query.toString()}` : ''}`;
  }

  private async createConfiguration({ appName, issuer, issuerPath, origin }: ProviderContext) {
    const app = this.app;
    const service = this;
    const cookieKey = this.app.authManager.jwt.getSecret();
    if (!cookieKey) {
      throw new Error('JWT secret is required for plugin-idp-oauth');
    }
    const jwks = await this.getProviderSigningJwks(appName);

    return {
      adapter: createDbAdapter(this.app, 'oidcStates'),
      clients: [],
      scopes: this.getSupportedScopes(),
      jwks,
      cookies: {
        keys: [cookieKey],
      },
      claims: {
        openid: ['sub'],
        profile: ['name', 'preferred_username'],
        email: ['email', 'email_verified'],
      },
      interactions: {
        url(_ctx: unknown, interaction: { uid: string }) {
          return service.getFrontendInteractionPath(appName, interaction.uid, issuerPath);
        },
      },
      routes: {
        authorization: '/idpOAuth/authorize',
        token: '/idpOAuth/token',
        jwks: '/idpOAuth/jwks',
        registration: '/idpOAuth/register',
        revocation: '/idpOAuth/revoke',
        userinfo: '/idpOAuth/me',
        introspection: '/idpOAuth/introspection',
        end_session: '/idpOAuth/end-session',
      },
      features: {
        devInteractions: { enabled: false },
        registration: { enabled: true },
        revocation: { enabled: true },
        resourceIndicators: {
          enabled: true,
          useGrantedResource: async () => true,
          // Temporary compatibility fallback for current Codex MCP OAuth login behavior.
          // Codex may omit the RFC 8707 resource parameter during authorize/token requests,
          // so when there is only one registered protected resource we default to it here.
          // Track upstream fix: https://github.com/openai/codex/issues/13891
          // This can be removed once the client consistently sends resource.
          defaultResource: async (_ctx: unknown, _client: unknown, oneOf?: string[]) => {
            if (oneOf?.length === 1) {
              return oneOf[0];
            }

            const identifiers = this.getResolvedResourceIdentifiers({ appName, issuer, issuerPath, origin });
            if (identifiers.length === 1) {
              return identifiers[0];
            }

            return undefined;
          },
          getResourceServerInfo: async (_ctx: unknown, resourceIndicator: string) => {
            const resourceServer = this.getResourceServerInfo(
              { appName, issuer, issuerPath, origin },
              resourceIndicator,
            );
            if (resourceServer) {
              return resourceServer;
            }
            const oidc = await getOidcModule();
            throw new oidc.errors.InvalidTarget();
          },
        },
      },
      ttl: {
        AccessToken: () => 10 * 60,
        AuthorizationCode: 60,
        Grant: 14 * 24 * 60 * 60,
        IdToken: 60 * 60,
        RefreshToken: () => 30 * 24 * 60 * 60,
        Session: 14 * 24 * 60 * 60,
        Interaction: 60 * 60,
      },
      pkce: {
        required: () => true,
      },
      findAccount: async (_ctx: unknown, sub: string) => {
        const repo = app.db.getRepository('users');
        const user = await repo.findOne({
          filterByTk: sub,
        });
        if (!user) {
          return undefined;
        }
        return {
          accountId: String(user.id),
          claims: async () => ({
            sub: String(user.id),
            name: user.nickname || user.username || user.email,
            preferred_username: user.username,
            email: user.email,
            email_verified: !!user.email,
          }),
        };
      },
      extraTokenClaims: async (_ctx: any, token: any) => {
        return {
          client_id: token.clientId,
          iss: issuer,
        };
      },
      renderError: async (ctx: any, out: Record<string, any>) => {
        ctx.status = 302;
        ctx.redirect(this.getPublicErrorLocation(appName, out, issuerPath));
      },
    };
  }

  async ensureProviderForContext(ctx: any) {
    return this.ensureProvider(this.getProviderContext(ctx));
  }

  async ensureProvider(providerContext: ProviderContext) {
    const { issuer } = providerContext;

    if (this.providers.has(issuer)) {
      return this.providers.get(issuer);
    }

    if (this.pendingProviders.has(issuer)) {
      return this.pendingProviders.get(issuer);
    }

    const pending = getOidcModule()
      .then(async (oidc) => {
        const provider = new oidc.Provider(issuer, await this.createConfiguration(providerContext));
        provider.proxy = true;
        this.providers.set(issuer, provider);
        return provider;
      })
      .finally(() => {
        this.pendingProviders.delete(issuer);
      });

    this.pendingProviders.set(issuer, pending);
    return pending;
  }
}
