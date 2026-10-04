import type { DatabaseConnection } from '@nocobase/db';
import {
  APIError,
  betterAuth,
  getBaseURL,
  getOrigin,
  type BetterAuthOptions,
  type BetterAuthPlugin,
  type FilteredAPI,
  type Session,
  type User,
} from 'better-auth';
import { username } from 'better-auth/plugins';
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

  async getSession(headers: Headers): Promise<AuthSession> {
    const session = await this.auth.api.getSession({ headers });
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
