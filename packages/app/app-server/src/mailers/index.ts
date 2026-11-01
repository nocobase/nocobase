import {
  createMailTransport,
  type EmailChannelConfig,
  type EmailMessage,
  type MailResult,
  type MailSendOptions,
  type MailTransport,
} from '@nocobase/mailer';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { AppPluginApplication } from '../plugins/index.js';
import {
  assertMailerConfig,
  assertMailerReference,
  assertMailersConfig,
  type MailersConfig,
} from './config.js';

export * from './config.js';
export type {
  EmailMessage,
  MailResult,
  MailSendOptions,
} from '@nocobase/mailer';

export interface ApplicationMailSendOptions extends MailSendOptions {
  readonly mailer?: string;
}

/** A compatibility binding cannot close an application-owned transport. */
export interface ApplicationMailSender {
  send(message: EmailMessage, options?: MailSendOptions): Promise<MailResult>;
}

const unavailable = (): MailResult => ({
  status: 'failed',
  disposition: 'never',
  error: {
    category: 'configuration',
    message: 'Application mailer is unavailable.',
  },
});

/** One instance per application. Configuration changes take effect on restart. */
export class ApplicationMailer {
  readonly #config: MailersConfig;
  private readonly transports = new Map<string | object, MailTransport>();
  private readonly bindings = new WeakMap<object, ApplicationMailSender>();
  private readonly active = new Set<Promise<MailResult>>();
  private closed = false;
  private closePromise?: Promise<void>;

  public constructor(config: MailersConfig = {}) {
    assertMailersConfig(config);
    this.#config = structuredClone(config);
  }

  public get defaultMailer(): string | undefined {
    return this.#config.default;
  }

  public assertReference(name: unknown, path: string): void {
    assertMailerReference(this.#config, name, path);
  }

  public provider(
    name: string | undefined = this.#config.default,
  ): EmailChannelConfig['provider'] | undefined {
    const selected =
      name && Object.hasOwn(this.#config, name)
        ? this.#config[name]
        : undefined;
    return selected &&
      typeof selected === 'object' &&
      selected.enabled !== false
      ? selected.provider
      : undefined;
  }

  public send(
    message: EmailMessage,
    options: ApplicationMailSendOptions = {},
  ): Promise<MailResult> {
    const name =
      options.mailer === undefined ? this.#config.default : options.mailer;
    const config =
      name && Object.hasOwn(this.#config, name)
        ? this.#config[name]
        : undefined;
    if (
      !name ||
      !config ||
      typeof config !== 'object' ||
      config.enabled === false
    )
      return Promise.resolve(unavailable());
    return this.submit(name, config, message, options);
  }

  /** Source identity is private to the owning module; credentials never become cache keys. */
  public bindInline(
    source: object,
    config: EmailChannelConfig,
  ): ApplicationMailSender {
    const existing = this.bindings.get(source);
    if (existing) return existing;
    assertMailerConfig(config, 'mailer');
    const snapshot = structuredClone(config);
    const sender: ApplicationMailSender = Object.freeze({
      send: (
        message: EmailMessage,
        options?: MailSendOptions,
      ): Promise<MailResult> => this.submit(source, snapshot, message, options),
    });
    this.bindings.set(source, sender);
    return sender;
  }

  public close(): Promise<void> {
    this.closed = true;
    this.closePromise ??= this.closeTransports();
    return this.closePromise;
  }

  private async closeTransports(): Promise<void> {
    // Transport close cancels supported network operations. Keep tracking original completion, even after consumer timeouts.
    const results = await Promise.allSettled(
      [...this.transports.values()].map((transport) => transport.close()),
    );
    await Promise.allSettled([...this.active]);
    this.transports.clear();
    if (results.some((result) => result.status === 'rejected'))
      throw new Error('Application mailer shutdown failed.');
  }

  private submit(
    key: string | object,
    config: EmailChannelConfig,
    message: EmailMessage,
    options?: MailSendOptions,
  ): Promise<MailResult> {
    if (this.closed || config.enabled === false)
      return Promise.resolve(unavailable());
    // Creation is synchronous and cached before invoking send: concurrent first calls share the same transport.
    let transport = this.transports.get(key);
    if (!transport) {
      transport = createMailTransport(config);
      this.transports.set(key, transport);
    }
    const completion = transport.send(message, {
      signal: options?.signal,
      idempotencyKey: options?.idempotencyKey,
    });
    this.active.add(completion);
    void completion.then(
      () => this.active.delete(completion),
      () => this.active.delete(completion),
    );
    return completion;
  }
}

export const applicationMailerToken: ServiceToken<ApplicationMailer> =
  createServiceToken<ApplicationMailer>('@nocobase/app-server/mailers');

export class ApplicationMailerProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/mailers';
  public override register(): void {
    // Capture during registration, before lazy business services can read reloaded configuration.
    this.app.container.instance(
      applicationMailerToken,
      new ApplicationMailer(
        this.app.config.get<MailersConfig>('mailers') ?? {},
      ),
    );
  }
  public override async shutdown(): Promise<void> {
    await this.app.container.resolve(applicationMailerToken).close();
  }
}
