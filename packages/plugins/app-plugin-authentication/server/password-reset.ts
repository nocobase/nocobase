import { assertAuthEmailConfig, type AuthEmailConfig } from './email-config.js';
import { createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  createMailTransport,
  MailExecutions,
  type MailTransport,
  type EmailMessage,
} from '@nocobase/mailer';
import type { Mailer } from '@nocobase/app-server/mailer';
import type { DatabaseConnection } from '@nocobase/db';
import {
  APIError,
  type AuthContext,
  type BetterAuthOptions,
  type BetterAuthPlugin,
} from 'better-auth';
import { createAuthMiddleware, getIP } from 'better-auth/api';

type ResetSender = NonNullable<
  NonNullable<BetterAuthOptions['emailAndPassword']>['sendResetPassword']
>;
type ResetData = Parameters<ResetSender>[0];

export interface PasswordResetConfig {
  readonly enabled?: boolean;
  /** @deprecated Legacy applications only. Configure auth.email instead. */
  readonly emailChannel?: string;
  readonly template?: (data: ResetData, appName: string) => EmailMessage;
}

export interface PasswordResetServices {
  readonly mailer?: Mailer;
  readonly increment?: (key: string) => Promise<number>;
  readonly warning?: (message: string) => void;
  readonly report?: (category: string) => void;
  readonly executions?: MailExecutions;
}

export class PasswordResetPolicy {
  public readonly available: boolean;
  public readonly automatic: boolean;
  private readonly sender: ResetSender | undefined;
  private readonly executions: MailExecutions;
  private transport?: MailTransport;
  private readonly buckets = new Map<
    string,
    { count: number; expires: number }
  >();
  private readonly resetWrites = new AsyncLocalStorage<string>();
  private readonly requestAddress = new AsyncLocalStorage<string | undefined>();

  public constructor(
    config: PasswordResetConfig,
    private readonly options: BetterAuthOptions,
    private readonly connection: DatabaseConnection,
    private readonly services: PasswordResetServices,
    email?: AuthEmailConfig,
  ) {
    assertAuthEmailConfig(email);
    this.executions = services.executions ?? new MailExecutions();
    const configuredSender = options.emailAndPassword?.sendResetPassword;
    const custom =
      typeof configuredSender === 'function' ? configuredSender : undefined;
    const channel = config.emailChannel ?? 'system-email';
    this.automatic =
      !custom &&
      config.enabled === true &&
      configuredResetOrigin(options.baseURL) &&
      (email !== undefined || services.mailer?.available(channel) === true);
    this.available =
      options.emailAndPassword?.enabled !== false &&
      config.enabled !== false &&
      (Boolean(custom) || this.automatic);
    if (this.available) {
      if (custom && email !== undefined)
        services.warning?.(
          'auth.email is unused for password reset; auth.emailAndPassword.sendResetPassword takes precedence.',
        );
      if (config.emailChannel !== undefined && (custom || email !== undefined))
        services.warning?.(
          custom
            ? 'auth.passwordReset.emailChannel is unused; auth.emailAndPassword.sendResetPassword takes precedence.'
            : 'auth.passwordReset.emailChannel is unused; auth.email takes precedence.',
        );
      if (this.automatic && email === undefined)
        services.warning?.(
          'auth.passwordReset.emailChannel is deprecated. Migrate to auth.email; legacy applications remain supported.',
        );
    }
    this.sender = this.available
      ? (custom ??
        (async (data, request) => {
          const message = (config.template ?? defaultPasswordResetEmail)(
            data,
            options.appName ?? 'NocoBase',
          );
          const sendOptions = { signal: request?.signal };
          // Lazily allocate once: transaction-bound administration instances never open an unused sender.
          const transport =
            email === undefined
              ? undefined
              : (this.transport ??= createMailTransport(email, {
                  reuseConnections: true,
                }));
          const result = transport
            ? await transport.send(message, sendOptions)
            : await services.mailer!.send(channel, message, sendOptions);
          if (result.status !== 'accepted')
            services.report?.(result.error.category);
        }))
      : undefined;
  }

  public async eligible(userId: string): Promise<boolean> {
    const user = await this.connection.query
      .selectFrom('user')
      .select(['id', 'kind', 'disabledAt', 'deletedAt'])
      .where('id', '=', userId)
      .executeTakeFirst();
    if (
      !user ||
      user.kind === 'service' ||
      user.disabledAt != null ||
      user.deletedAt != null
    )
      return false;
    const credential = await this.connection.query
      .selectFrom('account')
      .select('password')
      .where('userId', '=', userId)
      .where('providerId', '=', 'credential')
      .executeTakeFirst();
    return (
      typeof credential?.password === 'string' && credential.password.length > 0
    );
  }

  /** Return immediately; only original completion releases the reserved slot. */
  public send: ResetSender = async (data, request): Promise<void> => {
    if (!this.sender || !this.available) return;
    const execution = this.executions.submit(async (signal) => {
      if (!(await this.eligible(data.user.id)) || signal.aborted) return;
      // Abort is advisory for custom callbacks; ignoring it retains the execution slot.
      const backgroundRequest = request
        ? requestWithSignal(request, signal)
        : this.automatic
          ? new Request(data.url, { signal })
          : undefined;
      await this.sender!(data, backgroundRequest);
    });
    if (!execution) {
      this.services.report?.('capacity');
      return;
    }
    void execution.completion.catch(() => this.services.report?.('sender'));
  };

  public async prepareRequest(ctx: {
    readonly path?: string;
    readonly request?: Request;
    readonly context: { logger: AuthContext['logger'] };
  }): Promise<void> {
    if (
      ctx.path !== '/request-password-reset' &&
      ctx.path !== '/reset-password' &&
      !ctx.path?.startsWith('/reset-password/')
    )
      return;
    // Dispatch owns a fresh context for this request. Provider errors never reach ordinary auth logs.
    const originalLogger = ctx.context.logger;
    const safeLog = (): void => this.services.report?.('request');
    ctx.context.logger = {
      ...originalLogger,
      debug: safeLog,
      info: safeLog,
      warn: safeLog,
      error: safeLog,
      success: safeLog,
    };
    if (!this.available)
      throw APIError.from('BAD_REQUEST', {
        code: 'RESET_PASSWORD_DISABLED',
        message: 'Password reset is disabled.',
      });
    if (ctx.path === '/request-password-reset') {
      const ip = this.clientAddress(ctx.request);
      const key = createHash('sha256')
        .update(ip ?? 'no-trusted-ip')
        .digest('hex');
      if ((await this.increment(key)) > 3)
        throw APIError.from('TOO_MANY_REQUESTS', {
          code: 'PASSWORD_RESET_RATE_LIMIT',
          message: 'Please try again later.',
        });
    }
  }

  public plugin(): BetterAuthPlugin {
    return {
      id: 'password-reset-policy',
      hooks: {
        before: [
          {
            matcher: (ctx) =>
              ctx.path === '/request-password-reset' ||
              ctx.path === '/reset-password' ||
              ctx.path?.startsWith('/reset-password/') === true,
            handler: createAuthMiddleware(async (ctx) => {
              if (ctx.path === '/request-password-reset') {
                const adapter = ctx.context.internalAdapter;
                // Keep Better Auth's input/origin validation and anonymous missing-user response for every account state.
                ctx.context.internalAdapter = {
                  ...adapter,
                  findUserByEmail: async (email, options) => {
                    const user = await adapter.findUserByEmail(email, options);
                    return user && !(await this.eligible(user.user.id))
                      ? null
                      : user;
                  },
                };
                return;
              }
              if (ctx.path !== '/reset-password') {
                const adapter = ctx.context.internalAdapter;
                // Let the endpoint validate callbackURL and use its normal invalid-link redirect.
                ctx.context.internalAdapter = {
                  ...adapter,
                  findVerificationValue: async (identifier) => {
                    const value =
                      await adapter.findVerificationValue(identifier);
                    return value &&
                      identifier.startsWith('reset-password:') &&
                      !(await this.eligible(value.value))
                      ? null
                      : value;
                  },
                };
                return;
              }
              const body: unknown = ctx.body;
              const token: unknown =
                (body && typeof body === 'object'
                  ? (Reflect.get(body, 'token') as unknown)
                  : undefined) || ctx.query?.token;
              if (typeof token !== 'string') return;
              const verification =
                await ctx.context.internalAdapter.findVerificationValue(
                  `reset-password:${token}`,
                );
              if (verification && !(await this.eligible(verification.value)))
                throw APIError.from('BAD_REQUEST', {
                  code: 'INVALID_TOKEN',
                  message: 'Invalid token.',
                });
              if (ctx.path === '/reset-password') {
                const adapter = ctx.context.internalAdapter;
                ctx.context.internalAdapter = {
                  ...adapter,
                  updatePassword: async (userId, password) => {
                    if (!(await this.eligible(userId)))
                      throw APIError.from('BAD_REQUEST', {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid token.',
                      });
                    return this.resetWrites.run(userId, () =>
                      adapter.updatePassword(userId, password),
                    );
                  },
                  createAccount: async (account) => {
                    if (!(await this.eligible(account.userId)))
                      throw APIError.from('BAD_REQUEST', {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid token.',
                      });
                    return this.resetWrites.run(account.userId, () =>
                      adapter.createAccount(account),
                    );
                  },
                };
              }
            }),
          },
        ],
      },
    };
  }

  private async increment(key: string): Promise<number> {
    if (this.services.increment) return this.services.increment(key);
    const now = Date.now();
    for (const [name, bucket] of this.buckets)
      if (bucket.expires <= now) this.buckets.delete(name);
    // A standalone Auth instance without caching still has bounded, account-independent protection.
    if (!this.buckets.has(key) && this.buckets.size >= 10_000) return 4;
    const bucket = this.buckets.get(key) ?? { count: 0, expires: now + 60_000 };
    bucket.count += 1;
    this.buckets.set(key, bucket);
    return bucket.count;
  }

  public async close(): Promise<void> {
    await this.executions.close();
    await this.transport?.close();
  }

  public runRequest<T>(address: string | undefined, handler: () => T): T {
    return this.requestAddress.run(address, handler);
  }

  private clientAddress(request: Request | undefined): string | null {
    const peer = this.requestAddress.getStore();
    if (!peer) return null;
    const ipOptions = this.options.advanced?.ipAddress;
    const headers = new Headers();
    for (const name of ipOptions?.ipAddressHeaders ?? ['x-forwarded-for']) {
      // Anchor proxy parsing to the actual peer. An untrusted peer wins over every forwarded value.
      const forwarded = ipOptions?.trustedProxies?.length
        ? request?.headers.get(name)
        : undefined;
      headers.set(name, forwarded ? `${forwarded},${peer}` : peer);
    }
    return getIP(headers, this.options);
  }

  public async guardWrite(
    context: { path?: string; context: object } | null | undefined,
  ): Promise<void> {
    if (context?.path !== '/reset-password') return;
    const userId = this.resetWrites.getStore();
    if (!this.available || !userId || !(await this.eligible(userId)))
      throw APIError.from('BAD_REQUEST', {
        code: 'INVALID_TOKEN',
        message: 'Invalid token.',
      });
  }
}

/** Automatic credential links need an operator-controlled origin, not an inferred Host header. */
function configuredResetOrigin(baseURL: BetterAuthOptions['baseURL']): boolean {
  if (typeof baseURL === 'string') {
    try {
      const url = new URL(baseURL);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  }
  return Boolean(
    baseURL &&
    (!baseURL.fallback || configuredResetOrigin(baseURL.fallback)) &&
    Array.isArray(baseURL.allowedHosts) &&
    baseURL.allowedHosts.length &&
    baseURL.allowedHosts.every(
      (host) => typeof host === 'string' && host.trim() && !host.includes('*'),
    ),
  );
}

/** Keep consumed bodies, HTTP methods and native Request getters intact while exposing advisory cancellation. */
function requestWithSignal(request: Request, signal: AbortSignal): Request {
  return new Proxy(request, {
    get(target, property): unknown {
      if (property === 'signal') return signal;
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export function defaultPasswordResetEmail(
  data: ResetData,
  appName: string,
): EmailMessage {
  const escape = (value: string): string =>
    value.replace(
      /[&<>"']/gu,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]!,
    );
  return {
    to: data.user.email,
    subject: `${appName} — Reset your password / 重置密码`,
    text: `Reset your ${appName} password using this link:\n${data.url}\n\n请通过此链接重置密码。若非本人申请，请忽略此邮件。\nIf you did not request this, ignore this email.`,
    html: `<p>Reset your ${escape(appName)} password / 重置密码</p><p><a href="${escape(data.url)}">Reset password / 重置密码</a></p><p>If you did not request this, ignore this email. 若非本人申请，请忽略此邮件。</p>`,
  };
}
