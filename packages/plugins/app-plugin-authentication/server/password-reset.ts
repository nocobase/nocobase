import type { BetterAuthOptions, User } from 'better-auth';
import {
  parseAcceptLanguage,
  resolveSupportedLocale,
  type I18nRuntime,
} from '@nocobase/i18n';
import type { Logger } from '@nocobase/logging';
import type { SendingService } from '@nocobase/app-server/sending';
import enUS from './locales/en-US.js';
import zhCN from './locales/zh-CN.js';

export interface PasswordResetEmail {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}
export interface PasswordResetConfig {
  readonly enabled?: boolean;
  readonly emailChannel?: string;
  readonly renderEmail?: (input: {
    readonly user: User;
    readonly url: string;
    readonly appName: string;
    readonly locale: string;
  }) => PasswordResetEmail | Promise<PasswordResetEmail>;
}

/** Managed process-local work: no token-bearing payload is persisted. */
export class PasswordResetTasks {
  private active = 0;
  private readonly queue: Array<() => void> = [];
  private readonly pending = new Set<Promise<void>>();
  private closing = false;
  public constructor(private readonly logger: Logger | undefined) {}
  public submit(work: () => Promise<void>): Promise<void> {
    if (this.closing || this.pending.size >= 128) {
      this.failed();
      return Promise.resolve();
    }
    const promise = new Promise<void>((resolve) => {
      const start = (): void => {
        this.active++;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Reset send timeout.')),
            20_000,
          );
        });
        void Promise.race([
          Promise.resolve().then(() => (this.closing ? undefined : work())),
          timeout,
        ])
          .catch(() => this.failed())
          .finally(() => {
            if (timer) clearTimeout(timer);
            this.active--;
            resolve();
            this.queue.shift()?.();
          });
      };
      if (this.active < 4) start();
      else this.queue.push(start);
    });
    this.pending.add(promise);
    void promise.finally(() => this.pending.delete(promise));
    return promise;
  }
  public track(promise: Promise<unknown>): void {
    const safe = promise.then(
      () => undefined,
      () => this.failed(),
    );
    this.pending.add(safe);
    void safe.finally(() => this.pending.delete(safe));
  }
  private failed(): void {
    this.logger?.warn(
      { event: 'auth.password_reset.send_failed', code: 'RESET_EMAIL_FAILED' },
      'Password reset email submission failed.',
    );
  }
  public async close(): Promise<void> {
    this.closing = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.allSettled([...this.pending]),
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, 20_000);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!,
  );
}
export function automaticResetSender(options: {
  readonly sending: SendingService;
  readonly channel: string;
  readonly appName: string;
  readonly config: PasswordResetConfig;
  readonly i18n?: I18nRuntime;
  readonly current?: () => PasswordResetConfig;
  readonly defaultLocale?: string;
}): NonNullable<
  NonNullable<BetterAuthOptions['emailAndPassword']>['sendResetPassword']
> {
  return async ({ user, url }, request) => {
    const config = options.current?.() ?? options.config;
    const channel = config.emailChannel ?? options.channel;
    const preferences = parseAcceptLanguage(
      request?.headers.get('accept-language') ?? undefined,
    );
    const locale =
      options.i18n?.resolvePreferredLocale(preferences) ??
      preferences
        .map((candidate) =>
          resolveSupportedLocale(candidate, ['en-US', 'zh-CN']),
        )
        .find((candidate) => candidate !== undefined) ??
      options.defaultLocale ??
      'en-US';
    let message: PasswordResetEmail;
    if (config.renderEmail)
      message = await config.renderEmail({
        user,
        url,
        appName: options.appName,
        locale,
      });
    else {
      const fallback = locale.startsWith('zh')
        ? zhCN.passwordResetEmail
        : enUS.passwordResetEmail;
      await options.i18n?.ensureLocaleLoaded(locale);
      const translate = options.i18n?.getFixedT(
        '@nocobase/app-plugin-authentication',
        locale,
      );
      const values = { name: user.name, app: options.appName, url };
      const fill = (template: string, html: boolean): string =>
        template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
          html
            ? escapeHtml(values[key as keyof typeof values] ?? '')
            : (values[key as keyof typeof values] ?? ''),
        );
      const render = (key: keyof PasswordResetEmail): string =>
        translate
          ? String(
              translate(`passwordResetEmail.${key}`, {
                ...Object.fromEntries(
                  Object.entries(values).map(([name, value]) => [
                    name,
                    key === 'html' ? escapeHtml(value) : value,
                  ]),
                ),
                interpolation: { escapeValue: false },
                defaultValue: fill(fallback[key], key === 'html'),
              }),
            )
          : fill(fallback[key], key === 'html');
      message = {
        subject: render('subject'),
        text: render('text'),
        html: render('html'),
      };
    }
    const results = await options.sending.send({
      channel,
      message: { to: user.email, ...message },
    });
    if (
      !results.length ||
      results.some((result) => result.status !== 'accepted')
    )
      throw new Error('Reset email submission failed.');
  };
}
