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
  type ServiceResolver,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { AppPluginApplication } from '../plugins/index.js';
import {
  validateResendProviderConfig,
  validateSmtpProviderConfig,
} from '@nocobase/mailer/config';
import {
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

/** What a business service needs: it sends, and its assembly owner closes. */
export interface MailSendView {
  send(message: EmailMessage, options?: MailSendOptions): Promise<MailResult>;
}

/** One exclusive sender. Its creator owns it and closes it after stopping its own work. */
export interface MailSender extends MailSendView {
  close(): Promise<void>;
}

const closedResult = (): MailResult => ({
  status: 'failed',
  disposition: 'never',
  error: { category: 'configuration', message: 'Mail sender is closed.' },
});

const initializationFailure = (): MailResult => ({
  status: 'failed',
  disposition: 'never',
  error: {
    category: 'configuration',
    message: 'Mail transport could not be initialized.',
  },
});

/** Allocate the transport on first send; close cancels supported network work, then waits for its original end. */
function createMailSender(config: EmailChannelConfig): MailSender {
  let transport: MailTransport | undefined;
  let closing: Promise<void> | undefined;
  const active = new Set<Promise<MailResult>>();
  return {
    send(message, options) {
      if (closing) return Promise.resolve(closedResult());
      try {
        transport ??= createMailTransport(config);
      } catch {
        // Initialization has not submitted anything; do not expose provider or configuration details.
        return Promise.resolve(initializationFailure());
      }
      let completion: Promise<MailResult>;
      try {
        completion = Promise.resolve(
          transport.send(message, {
            signal: options?.signal,
            idempotencyKey: options?.idempotencyKey,
          }),
        );
      } catch (error) {
        completion = Promise.reject(asError(error));
      }
      active.add(completion);
      const cleanup = (): void => {
        active.delete(completion);
      };
      void completion.then(cleanup, cleanup);
      return completion;
    },
    close() {
      closing ??= settleShutdown(
        [
          () => transport?.close(),
          async () => {
            const results = await Promise.allSettled([...active]);
            const failures: unknown[] = [];
            for (const result of results)
              if (result.status === 'rejected') failures.push(result.reason);
            if (failures.length)
              throw new AggregateError(
                failures,
                'Mail submissions failed during shutdown.',
              );
          },
        ],
        'Mail sender shutdown failed.',
      );
      return closing;
    },
  };
}

function settleShutdown(
  operations: readonly (() => void | Promise<void>)[],
  message: string,
): Promise<void> {
  const started = operations.map((operation) => {
    try {
      return Promise.resolve(operation());
    } catch (error) {
      return Promise.reject(asError(error));
    }
  });
  return Promise.allSettled(started).then((results) => {
    const failures: unknown[] = [];
    for (const result of results)
      if (result.status === 'rejected') failures.push(result.reason);
    if (failures.length) throw new AggregateError(failures, message);
  });
}

function asError(value: unknown): Error {
  return value instanceof Error
    ? value
    : new Error('Mail shutdown operation failed.', { cause: value });
}

/**
 * Validated startup snapshot of `mailers` and the only place senders are created. The factory keeps no senders:
 * every `create` returns a new exclusive instance owned by the caller.
 */
export class MailSenderFactory {
  readonly #config: MailersConfig;

  public constructor(config: MailersConfig = {}) {
    assertMailersConfig(config);
    this.#config = structuredClone(config);
  }

  public get defaultMailer(): string | undefined {
    return this.#config.default;
  }

  /** The provider of a configured, enabled mailer; the default when no name is given. */
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

  public assertReference(name: unknown, path: string): void {
    assertMailerReference(this.#config, name, path);
  }

  /** A sender for a named mailer, or `mailers.default` without a name. Missing or disabled references throw. */
  public create(name?: string, path: string = 'mailers.default'): MailSender {
    const selected = name ?? this.#config.default;
    assertMailerReference(this.#config, selected, path);
    return createMailSender(this.#config[selected!] as EmailChannelConfig);
  }

  /**
   * A sender for a legacy inline configuration recognized by its owning module. Validation matches the transport's
   * own, so configurations that worked before keep working; it runs now rather than at the first send.
   */
  public createFromConfig(config: EmailChannelConfig): MailSender {
    const snapshot = structuredClone(config);
    if (snapshot.provider === 'smtp') validateSmtpProviderConfig(snapshot);
    else validateResendProviderConfig(snapshot);
    return createMailSender(snapshot);
  }
}

export const mailSenderFactoryToken: ServiceToken<MailSenderFactory> =
  createServiceToken<MailSenderFactory>('@nocobase/app-server/mailers');

/**
 * The application's factory, or one built from `config` for hosts composed without it. Use only at an assembly
 * boundary (a Provider or a channel constructor); business services receive a sender.
 */
export function resolveMailSenderFactory(
  container?: Pick<ServiceResolver, 'has' | 'resolve'>,
  config?: MailersConfig,
): MailSenderFactory {
  return container?.has(mailSenderFactoryToken)
    ? container.resolve(mailSenderFactoryToken)
    : new MailSenderFactory(config);
}

/** Registers the factory from the startup snapshot. Configuration changes take effect on restart. */
export class MailSenderFactoryProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/mailers';
  public override register(): void {
    this.app.container.instance(
      mailSenderFactoryToken,
      new MailSenderFactory(
        this.app.config.get<MailersConfig>('mailers') ?? {},
      ),
    );
  }
}
