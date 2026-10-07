import { joinBasePath, normalizeBasePath } from '@nocobase/app-server/support';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';
import { databaseManagerToken } from '@nocobase/db';
import { cachingToken } from '@nocobase/app-server/caching';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { loggingToken } from '@nocobase/app-server/logging';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { type AppIdentityConfig } from '@nocobase/app-server/config';
import type { NodeServerConfig } from '@nocobase/app-server/node';
import {
  realtimePrincipalResolverToken,
  realtimeServiceToken,
  type RealtimePrincipal,
} from '@nocobase/app-server/realtime';
import { apiDocsToken, cliToken } from '@nocobase/app-server/router';
import { APIError, type BetterAuthPlugin } from 'better-auth';
import {
  deviceAuthorization,
  type DeviceAuthorizationOptions,
} from 'better-auth/plugins';

import {
  createAuthentication,
  type Auth,
  type CreateAuthenticationOptions,
} from '../auth.js';
import {
  createAuthenticationApiFragment,
  createSessionApiDocsAccess,
  createSessionSecurityFragment,
} from '../api-docs.js';
import { createAuthStorage } from '../auth-storage.js';
import { authenticationToken } from '../tokens.js';
import { userAdministrationServiceToken } from '../tokens.js';
import { createUserAdministrationService } from '../user-administration.js';
import { type AuthConfig, resolveAuthSecrets } from '../config.js';

interface RequestInitWithDuplex extends RequestInit {
  duplex?: 'half';
}

export interface AuthenticationProviderConfig {
  readonly app: {
    readonly name: string;
    readonly publicOrigin: string | undefined;
    readonly publicBasePath: string;
  };
  readonly auth: Omit<
    CreateAuthenticationOptions,
    'basePath' | 'baseURL' | 'connection'
  >;
}

export type AuthenticationProviderApplication<
  TConfig extends AuthenticationProviderConfig = AuthenticationProviderConfig,
> = AppPluginApplication<TConfig>;

export class AuthenticationProvider<
  TConfig extends AuthenticationProviderConfig = AuthenticationProviderConfig,
  TApplication extends AuthenticationProviderApplication<TConfig> =
    AuthenticationProviderApplication<TConfig>,
> extends ServiceProvider<TApplication> {
  public readonly name: string = '@nocobase/app-plugin-authentication';

  public override register(): void {
    this.app.container.singleton(authenticationToken, (container) =>
      this.createAuthentication(container),
    );
    this.app.container.singleton(
      userAdministrationServiceToken,
      (container) => {
        const database = container.resolve(databaseManagerToken);
        return createUserAdministrationService({
          auth: container.resolve(authenticationToken),
          connection: database.connection(),
          ...(container.has(realtimeServiceToken)
            ? { realtime: container.resolve(realtimeServiceToken) }
            : {}),
        });
      },
    );
    if (!this.app.container.has(realtimePrincipalResolverToken)) {
      this.app.container.singleton(
        realtimePrincipalResolverToken,
        (container) => ({
          async resolve(
            request: Request,
          ): Promise<RealtimePrincipal | undefined> {
            try {
              const session = await container
                .resolve(authenticationToken)
                .getSession(request.headers);
              // An issued credential, such as an agent's run token, is not the person's own connection.
              return session && !session.credential
                ? { userId: session.user.id }
                : undefined;
            } catch (error) {
              // A refused credential (Better Auth APIError) is not signed in, here.
              if (error instanceof APIError) return undefined;
              throw error;
            }
          },
        }),
      );
    }
  }

  /**
   * Lets a signed-in session read the API documentation, and adds the session cookie's security scheme and Better
   * Auth's endpoints to it. All are resolved lazily, on the first request for the document, so starting the application
   * does not build Better Auth's schema.
   */
  public override async boot(): Promise<void> {
    // Better Auth's endpoints are the browser's sign-in and session flow: a command line signs in its own way.
    if (this.app.container.has(cliToken))
      this.app.container.resolve(cliToken).exclude({ paths: ['/api/auth/'] });
    if (!this.app.container.has(apiDocsToken)) return;
    const apiDocs = this.app.container.resolve(apiDocsToken);
    const resolveAuth = (): Auth =>
      this.app.container.resolve(authenticationToken);
    apiDocs.addAccess(createSessionApiDocsAccess(resolveAuth));
    apiDocs.addFragment(() => createSessionSecurityFragment(resolveAuth()));
    apiDocs.addFragment(() =>
      createAuthenticationApiFragment(
        resolveAuth(),
        this.app.config.get<AppIdentityConfig>('app')?.publicBasePath ?? '',
      ),
    );
  }

  private createAuthentication(container: ServiceResolver): Auth {
    const app = this.app.config.get<AppIdentityConfig>('app')!;
    const configuredAuth = this.app.config.get<AuthConfig>('auth') ?? {};
    const { secret: _secret, secrets: _secrets, ...rest } = configuredAuth;
    const authConfig = {
      ...rest,
      ...(rest.plugins
        ? {
            plugins: resolveDeviceVerificationUri(
              rest.plugins,
              app.publicBasePath,
            ),
          }
        : {}),
      ...resolveAuthSecrets(
        configuredAuth,
        container.has(secretsServiceToken)
          ? container.resolve(secretsServiceToken)
          : undefined,
      ),
    };
    const caching = container.resolve(cachingToken);
    const idGenerator = container.resolve(idGeneratorToken);
    const database = container.has(databaseManagerToken)
      ? container.resolve(databaseManagerToken)
      : undefined;
    const logger = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('auth')
      : undefined;
    const publicPaths = this.app.config.publicPaths?.();
    if (
      publicPaths &&
      !publicPaths.includes('auth.emailAndPassword.disableSignUp')
    ) {
      logger?.warn(
        {},
        'The auth section is not declared with defineAuthConfig, so its settings are not validated and the browser cannot tell whether sign-up is open. Declare it with defineAuthConfig from @nocobase/app-plugin-authentication/server in server/config/auth.ts.',
      );
    }
    const auth = createAuthentication({
      connection: database?.connection(),
      secondaryStorage: createAuthStorage(caching),
      appName: app.name,
      ...authConfig,
      logger:
        authConfig.logger ??
        (logger
          ? {
              level: 'debug',
              log: (level, message, ...details: unknown[]) => {
                logger[level](
                  { ...(details.length ? { details } : {}) },
                  message,
                );
              },
            }
          : undefined),
      baseURL: app.publicOrigin,
      basePath: resolvePublicPath('/api/auth', app.publicBasePath),
      advanced: {
        cookiePrefix: createCookiePrefix(app.name, {
          publicOrigin: app.publicOrigin,
          // Only a standalone app owns its port. An embedded app carries a
          // `server` config all the same, because the template's defaults are
          // merged in both modes, but there the port belongs to the host and
          // says nothing about which app a cookie belongs to.
          listenPort:
            this.app.mode === 'standalone'
              ? this.app.config.get<NodeServerConfig>('server')?.port
              : undefined,
        }),
        ...authConfig.advanced,
        database: {
          ...authConfig.advanced?.database,
          generateId:
            authConfig.advanced?.database?.generateId ??
            (() => idGenerator.generateString()),
        },
        defaultCookieAttributes: {
          path: app.publicBasePath || '/',
          ...authConfig.advanced?.defaultCookieAttributes,
        },
      },
    });
    const originalAuthHandler = auth.handler.bind(auth);
    auth.handler = (request: Request): Promise<Response> =>
      originalAuthHandler(toPublicRequest(request, app.publicBasePath));
    return auth;
  }
}

export interface CookiePrefixOptions {
  /** The origin browsers reach this app on, when the app knows it. */
  readonly publicOrigin?: string;
  /** The port this app listens on, when it owns one. */
  readonly listenPort?: number;
}

/**
 * Names this app's cookies so they cannot collide with another app's.
 *
 * Cookies are scoped by host and path but never by port (RFC 6265), so two
 * apps on one host share a cookie jar even on different ports. The name is
 * the only thing left to separate them, and the app name alone does not:
 * every standalone app defaults to `main`. Appending the port the app is
 * reached on restores the distinction, and is stable for as long as the app
 * stays where it is. An app that owns no port of its own passes none, and
 * keeps the bare name.
 */
export function createCookiePrefix(
  appName: string,
  options: CookiePrefixOptions = {},
): string {
  const normalized = appName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = normalized || 'nocobase3';
  const port = resolveCookieScopePort(options);
  return port === undefined ? base : `${base}-${port}`;
}

/**
 * Resolves the port that distinguishes this app within its host's cookie jar.
 *
 * A configured `publicOrigin` is what browsers actually see, so it wins over
 * the listen port a reverse proxy hides. It deliberately yields nothing when
 * it carries no explicit port: a production `https://example.com` keeps the
 * bare app name, so deployments that already have sessions keep them.
 *
 * The listen port is the fallback for development, where `publicOrigin` is
 * usually unset and the port is the only thing telling two apps apart. The
 * caller passes it only for a standalone app, which is the one case where the
 * app owns the port it is reached on; embedded apps take their names from
 * their base paths and are already distinct without it.
 */
function resolveCookieScopePort(
  options: CookiePrefixOptions,
): number | undefined {
  const publicOrigin = options.publicOrigin
    ? parseOrigin(options.publicOrigin)
    : undefined;
  if (publicOrigin) {
    return publicOrigin.port ? Number(publicOrigin.port) : undefined;
  }
  return options.listenPort;
}

function parseOrigin(publicOrigin: string): URL | undefined {
  try {
    return new URL(publicOrigin);
  } catch {
    return undefined;
  }
}

/**
 * Places the device authorization's approval page below the application's public base path. Better Auth resolves a
 * `verificationUri` that starts with `/` against its base URL's origin, which would drop the base path an application
 * is served under; an app-local `/device` (also the default) becomes `/main/device` under `/main`. An absolute URL is
 * left as it is.
 */
export function resolveDeviceVerificationUri(
  plugins: readonly BetterAuthPlugin[],
  publicBasePath: string,
): BetterAuthPlugin[] {
  const basePath = normalizeBasePath(publicBasePath);
  if (!basePath) return [...plugins];
  return plugins.map((plugin) => {
    if (plugin.id !== 'device-authorization') return plugin;
    const options = (plugin.options ?? {}) as DeviceAuthorizationOptions;
    const uri = options.verificationUri ?? '/device';
    if (!uri.startsWith('/') || uri.startsWith(`${basePath}/`)) return plugin;
    return deviceAuthorization({
      ...options,
      verificationUri: resolvePublicPath(uri, publicBasePath),
    });
  });
}

/** Resolves an app-local pathname to the path exposed by the app runtime. */
export function resolvePublicPath(
  appLocalPath: string,
  publicBasePath: string,
): string {
  const basePath = normalizeBasePath(publicBasePath);
  const localPath = normalizeBasePath(appLocalPath);

  if (!basePath) {
    return localPath || '/';
  }

  return localPath ? joinBasePath(basePath, localPath) : `${basePath}/`;
}

/** Restores the public mount path on an app-local request. */
export function toPublicRequest(
  request: Request,
  publicBasePath: string,
): Request {
  if (!normalizeBasePath(publicBasePath)) {
    return request;
  }

  const url = new URL(request.url);
  url.pathname = resolvePublicPath(url.pathname, publicBasePath);

  const init: RequestInitWithDuplex = {
    method: request.method,
    headers: request.headers,
    signal: request.signal,
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  return new Request(url, init);
}
