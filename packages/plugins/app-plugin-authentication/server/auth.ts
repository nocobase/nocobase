import type { DatabaseConnection } from '@nocobase/db';
import {
  APIError,
  betterAuth,
  getBaseURL,
  getOrigin,
  type AuthContext,
  type BetterAuthOptions,
  type BetterAuthPlugin,
  type FilteredAPI,
  type Session,
  type User,
} from 'better-auth';
import {
  openAPI,
  username,
  type OpenAPIModelSchema,
  type Path,
} from 'better-auth/plugins';
import type { Context, MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  ApiError,
  apiErrorHandler,
  apiErrorStatusFromHttp,
} from '@nocobase/app-server/router';
import { databaseAdapter } from './better-auth/database-adapter.js';

export interface AuthOptions extends Omit<BetterAuthOptions, 'database'> {
  connection: DatabaseConnection;
}

export interface CreateAuthenticationOptions extends Omit<
  AuthOptions,
  'connection'
> {
  connection?: DatabaseConnection;
}

export type AuthSession = { user: User; session: Session } | null;

export interface AuthEnv {
  Variables: { auth: AuthSession };
}

/** How `Auth.getSession()` resolves a request's credential. */
export interface GetSessionOptions {
  /**
   * Leave the session's expiry as it is instead of extending it. A read that must not change state, such as
   * deciding whether a request may read the API documentation, passes `true`.
   */
  readonly disableRefresh?: boolean;
}

/** One operation of Better Auth's OpenAPI description, as its generator writes it. */
export type AuthOpenAPIOperation = NonNullable<Path['get']>;

/** What `Auth.openAPISchema()` returns: Better Auth's paths, keyed by path then lower-case method, and its models. */
export interface AuthOpenAPISchema {
  /** The public path Better Auth serves its endpoints under, including the application's base path. */
  readonly basePath: string;
  readonly paths: Record<string, Record<string, AuthOpenAPIOperation>>;
  readonly components: {
    readonly schemas: Record<string, OpenAPIModelSchema>;
  };
}

export interface AuthMiddlewareOptions {
  skip?: (context: Context) => boolean;
}

export class Auth {
  private readonly auth;
  private readonly connection: DatabaseConnection;
  private readonly options: AuthOptions;

  constructor(options: AuthOptions) {
    const { connection, ...config } = options;
    this.connection = connection;
    this.options = options;
    if (!config.secret || config.secret.trim().length === 0) {
      throw new Error('Authentication secret is required.');
    }
    const plugins = (config.plugins ?? []).some(
      (plugin) => Reflect.get(plugin, 'id') === 'username',
    )
      ? config.plugins
      : [username({ displayUsername: false }), ...(config.plugins ?? [])];
    const configuredSessionCreate = config.databaseHooks?.session?.create;
    this.auth = betterAuth({
      ...config,
      appName: config.appName ?? 'NocoBase3',
      database: databaseAdapter(connection),
      plugins,
      emailAndPassword: {
        ...config.emailAndPassword,
        enabled: config.emailAndPassword?.enabled ?? true,
      },
      user: {
        ...config.user,
        additionalFields: {
          ...config.user?.additionalFields,
          deletedAt: { type: 'date', required: false, input: false },
          deletedBy: { type: 'string', required: false, input: false },
          disabledAt: {
            type: 'date',
            required: false,
            input: false,
          },
        },
      },
      databaseHooks: {
        ...config.databaseHooks,
        session: {
          ...config.databaseHooks?.session,
          create: {
            ...configuredSessionCreate,
            after: async (session, context) => {
              await configuredSessionCreate?.after?.(session, context);
              const user = context
                ? await context.context.internalAdapter.findUserById(
                    session.userId,
                  )
                : await connection.query
                    .selectFrom('user')
                    .select('disabledAt')
                    .where('id', '=', session.userId)
                    .executeTakeFirst();
              if (!user || Reflect.get(user, 'disabledAt') != null) {
                // A login already in flight may persist after user deletion.
                // Remove its new session before returning it to the caller.
                const adapter =
                  context?.context.internalAdapter ??
                  (await this.auth.$context).internalAdapter;
                await adapter.deleteSession(session.token);
                throw APIError.from('FORBIDDEN', {
                  code: 'ACCOUNT_DISABLED',
                  message: 'This account is disabled.',
                });
              }
            },
            before: async (session, context) => {
              const configuredResult = await configuredSessionCreate?.before?.(
                session,
                context,
              );
              if (configuredResult === false) return false;
              const candidate =
                typeof configuredResult === 'object' &&
                configuredResult !== null &&
                'data' in configuredResult
                  ? { ...session, ...configuredResult.data }
                  : session;
              const user = context
                ? await context.context.internalAdapter.findUserById(
                    candidate.userId,
                  )
                : await connection.query
                    .selectFrom('user')
                    .select(['id', 'disabledAt'])
                    .where('id', '=', candidate.userId)
                    .executeTakeFirst();
              if (!user || Reflect.get(user, 'disabledAt') != null) {
                throw APIError.from('FORBIDDEN', {
                  code: 'ACCOUNT_DISABLED',
                  message: 'This account is disabled.',
                });
              }
              return configuredResult;
            },
          },
        },
      },
      advanced: {
        ...config.advanced,
        database: {
          ...config.advanced?.database,
          generateId:
            config.advanced?.database?.generateId ??
            (() => crypto.randomUUID()),
        },
      },
    });
  }

  handler(request: Request): Promise<Response> {
    return this.auth.handler(request);
  }

  async getSession(
    headers: Headers,
    options: GetSessionOptions = {},
  ): Promise<AuthSession> {
    const session = await this.auth.api.getSession({
      headers,
      ...(options.disableRefresh ? { query: { disableRefresh: true } } : {}),
    });
    if (!session) return null;
    const user = await this.connection.query
      .selectFrom('user')
      .select(['id', 'disabledAt'])
      .where('id', '=', session.user.id)
      .executeTakeFirst();
    if (!user || user.disabledAt != null) return null;
    return session;
  }

  /** Protect writes authenticated by a browser cookie, including routes that skip normal session lookup. */
  private async checkCookieWriteOrigin(
    context: Context,
  ): Promise<Response | undefined> {
    if (['GET', 'HEAD', 'OPTIONS'].includes(context.req.method)) return;
    // A credential header is not proof that it was used: an invalid API key may fall back to a valid cookie.
    // Cookie-free API key requests have no ambient browser credential to forge.
    if (!context.req.header('cookie')) return;

    const authContext = await this.auth.$context;
    const origin = context.req.header('origin');
    const inferredBaseURL =
      origin === 'null' &&
      context.req.header('sec-fetch-site') === 'same-origin'
        ? getBaseURL(
            undefined,
            authContext.options.basePath,
            context.req.raw,
            false,
            authContext.options.advanced?.trustedProxyHeaders,
          )
        : undefined;
    const source =
      (inferredBaseURL ? getOrigin(inferredBaseURL) : undefined) ??
      origin ??
      context.req.header('referer');
    if (!source || source === 'null') {
      return invalidCsrfOrigin(context);
    }

    // Better Auth also accepts per-request trusted origins. Its static context contains the
    // configured base URL, static origins, plugin origins, and BETTER_AUTH_TRUSTED_ORIGINS.
    const configuredOrigins = authContext.options.trustedOrigins;
    const mergedOrigins =
      typeof configuredOrigins === 'function'
        ? await configuredOrigins(context.req.raw)
        : (configuredOrigins ?? []);
    const requestAuthContext = Object.create(authContext) as typeof authContext;
    requestAuthContext.trustedOrigins = [
      ...authContext.trustedOrigins,
      ...mergedOrigins.filter(
        (origin): origin is string =>
          typeof origin === 'string' && Boolean(origin),
      ),
    ];
    const trustedByAuth = requestAuthContext.isTrustedOrigin(source, {
      allowRelativePaths: false,
    });
    if (!trustedByAuth) {
      return invalidCsrfOrigin(context);
    }
  }

  /** Returns only a registered plugin's API methods, including the normal hook pipeline. */
  pluginApi<TPlugin extends BetterAuthPlugin>(
    pluginId: TPlugin['id'],
  ): FilteredAPI<NonNullable<TPlugin['endpoints']>> {
    const plugin = this.options.plugins?.find((item) => item.id === pluginId);
    if (!plugin?.endpoints)
      throw new Error(`Authentication plugin "${pluginId}" is not registered.`);
    const api: Record<string, unknown> = {};
    for (const name of Object.keys(plugin.endpoints)) {
      const endpoint: unknown = Reflect.get(this.auth.api, name);
      if (typeof endpoint === 'function') api[name] = endpoint;
    }
    return api as FilteredAPI<NonNullable<TPlugin['endpoints']>>;
  }

  /** The Better Auth plugin registered under `pluginId`, as the application configured it, or `undefined`. */
  plugin<TPlugin extends BetterAuthPlugin>(
    pluginId: TPlugin['id'],
  ): TPlugin | undefined {
    return this.options.plugins?.find((item) => item.id === pluginId) as
      TPlugin | undefined;
  }

  /**
   * Better Auth's OpenAPI description of every endpoint it serves, built by its own generator. Paths are relative to
   * Better Auth's base path, and each operation's `operationId` is the name of its `auth.api` method.
   */
  async openAPISchema(): Promise<AuthOpenAPISchema> {
    // The same context object: its type is parameterized by this instance's literal options, which TypeScript holds
    // invariant against the generator's `AuthContext<BetterAuthOptions>`.
    const context = (await this.auth.$context) as unknown as AuthContext;
    const schema = await generateOpenAPISchema(context);
    const methodNames = new Map<string, string>();
    for (const [name, endpoint] of Object.entries(this.auth.api)) {
      const path: unknown = Reflect.get(endpoint, 'path');
      const options: unknown = Reflect.get(endpoint, 'options');
      if (typeof path !== 'string' || typeof options !== 'object' || !options)
        continue;
      const method: unknown = Reflect.get(options, 'method');
      for (const verb of Array.isArray(method) ? method : [method]) {
        if (typeof verb === 'string')
          methodNames.set(`${verb.toLowerCase()} ${toOpenAPIPath(path)}`, name);
      }
    }
    const used = new Set<string>();
    const paths: Record<string, Record<string, AuthOpenAPIOperation>> = {};
    for (const [path, item] of Object.entries(schema.paths)) {
      const operations: Record<string, AuthOpenAPIOperation> = {};
      for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
        const operation = item[method];
        if (!operation) continue;
        const name =
          methodNames.get(`${method} ${path}`) ?? operation.operationId;
        let operationId = name;
        if (operationId && used.has(operationId))
          operationId = `${operationId}${method.charAt(0).toUpperCase()}${method.slice(1)}`;
        if (operationId) used.add(operationId);
        operations[method] = {
          ...operation,
          ...(operationId ? { operationId } : {}),
        };
      }
      paths[path] = operations;
    }
    return {
      basePath: context.options.basePath ?? '/api/auth',
      paths,
      components: { schemas: schema.components.schemas },
    };
  }

  /**
   * The name of the cookie that carries a signed-in session, as Better Auth sets it under this configuration: the cookie
   * prefix (`advanced.cookiePrefix`), `__Secure-` in front when cookies are secure, and any `advanced.cookies` rename.
   */
  async sessionCookieName(): Promise<string> {
    return (await this.auth.$context).authCookies.sessionToken.name;
  }

  /** @internal Used by the Authentication-owned administration service. */
  administrationContext(): typeof this.auth.$context {
    return this.auth.$context;
  }

  /** Binds trusted server operations to a caller-owned connection or transaction. */
  forConnection(connection: DatabaseConnection): Auth {
    return new Auth({ ...this.options, connection });
  }

  optional(options: AuthMiddlewareOptions = {}): MiddlewareHandler<AuthEnv> {
    return async (context, next) => {
      const originFailure = await this.checkCookieWriteOrigin(context);
      if (originFailure) return originFailure;
      if (options.skip?.(context)) {
        await next();
        return;
      }
      try {
        context.set('auth', await this.getSession(context.req.raw.headers));
      } catch (error) {
        if (error instanceof APIError)
          return rejectedCredential(context, error);
        throw error;
      }
      await next();
    };
  }

  required(options: AuthMiddlewareOptions = {}): MiddlewareHandler<AuthEnv> {
    return async (context, next) => {
      const originFailure = await this.checkCookieWriteOrigin(context);
      if (originFailure) return originFailure;
      if (options.skip?.(context)) {
        await next();
        return;
      }
      let auth: AuthSession;
      try {
        auth = await this.getSession(context.req.raw.headers);
        // A refused credential is Better Auth's APIError; answer with its status, and its code as the reason.
      } catch (error) {
        if (error instanceof APIError)
          return rejectedCredential(context, error);
        throw error;
      }
      if (!auth) {
        return apiErrorHandler(
          new ApiError({
            status: 'UNAUTHENTICATED',
            reason: 'AUTHENTICATION_REQUIRED',
            domain: 'authentication',
            message: 'Authentication required.',
          }),
          context,
        );
      }
      context.set('auth', auth);
      await next();
    };
  }
}

export function createAuthentication(
  options: CreateAuthenticationOptions,
): Auth {
  if (!options.connection) {
    throw new Error('Authentication requires a database connection.');
  }
  return new Auth({
    ...options,
    connection: options.connection,
  });
}

/**
 * Runs Better Auth's own OpenAPI generator. `better-auth/plugins` declares `generator` but does not export it at
 * runtime, so this calls the `openAPI` plugin's endpoint function directly with the application's auth context. The
 * plugin is never registered, so neither its `/open-api/generate-schema` route nor its `/reference` page is served.
 */
async function generateOpenAPISchema(context: AuthContext) {
  return openAPI().endpoints.generateOpenAPISchema({ context });
}

/** Better Auth's `/reset-password/:token` as its generator writes it, `/reset-password/{token}`. */
function toOpenAPIPath(path: string): string {
  return path
    .split('/')
    .map((part) => (part.startsWith(':') ? `{${part.slice(1)}}` : part))
    .join('/');
}

/** A cookie-bearing write whose origin is neither the application's own nor a trusted one. */
function invalidCsrfOrigin(context: Context): Response {
  return apiErrorHandler(
    new ApiError({
      status: 'PERMISSION_DENIED',
      reason: 'INVALID_CSRF_ORIGIN',
      domain: 'authentication',
      message:
        'The request origin is not trusted for a cookie-authenticated write.',
    }),
    context,
  );
}

/** A credential Better Auth refused, answered in the standard API error body with Better Auth's code as the reason. */
function rejectedCredential(context: Context, error: APIError): Response {
  return apiErrorHandler(
    new ApiError({
      status: apiErrorStatusFromHttp(error.statusCode),
      reason:
        typeof error.body?.code === 'string'
          ? error.body.code
          : 'AUTHENTICATION_FAILED',
      domain: 'authentication',
      message: error.message,
      httpStatus: error.statusCode as ContentfulStatusCode,
      cause: error,
    }),
    context,
  );
}
