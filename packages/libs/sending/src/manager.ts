import { randomUUID } from 'node:crypto';
import type { Logger } from '@nocobase/logging';
import { SendingRegistry } from './registry.js';
import { registerBuiltInSendingProviders } from './bootstrap.js';
import type {
  SendingChannel,
  SendingProvider,
  SendingConfig,
  ProviderSendResult,
  SendingProviderSendInput,
} from './types.js';

export interface SendingRuntime {
  readonly channel: SendingChannel;
  readonly provider: SendingProvider;
}
export interface SendingService {
  available(name: string, messageType?: string): boolean;
  config(): SendingConfig;
  runtime(name: string): Promise<SendingRuntime>;
  send(input: {
    readonly channel: string;
    readonly message: object;
    readonly deadline?: number;
    readonly deliveryId?: string;
  }): Promise<readonly ProviderSendResult[]>;
  close(): Promise<void>;
}
export interface SendingManagerOptions {
  readonly config: SendingConfig | (() => SendingConfig);
  readonly logger: Logger;
  readonly registry?: SendingRegistry;
}

/** Bounds the entire submission, including transport creation and message preparation. Late results are ignored. */
export async function boundedSubmission(
  operation: (signal: AbortSignal) => Promise<ProviderSendResult>,
  deadline: number,
): Promise<ProviderSendResult> {
  const remaining = deadline - Date.now();
  if (remaining <= 0)
    return {
      status: 'failed',
      disposition: 'never',
      error: {
        code: 'SEND_BUDGET_EXHAUSTED',
        category: 'timeout',
        message: 'Sending budget exhausted before submission.',
      },
    };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ProviderSendResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({
        status: 'submission_unknown',
        error: {
          code: 'SEND_TIMEOUT',
          category: 'timeout',
          message: 'Provider submission timed out.',
        },
      });
    }, remaining);
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeout,
    ]);
  } catch {
    return {
      status: 'submission_unknown',
      error: {
        code: 'SEND_FAILED',
        category: 'provider',
        message: 'Provider submission failed.',
      },
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class SendingManager implements SendingService {
  public readonly registry: SendingRegistry;
  private readonly runtimes = new Map<
    string,
    {
      readonly configuration: string;
      readonly promise: Promise<SendingRuntime>;
    }
  >();
  private closed = false;
  private closing: Promise<void> | undefined;
  private readonly providerShutdowns = new WeakMap<
    SendingProvider,
    Promise<void>
  >();
  public constructor(private readonly options: SendingManagerOptions) {
    this.registry = options.registry ?? new SendingRegistry();
    if (!options.registry) registerBuiltInSendingProviders(this.registry);
  }
  public config(): SendingConfig {
    return typeof this.options.config === 'function'
      ? this.options.config()
      : this.options.config;
  }
  public available(name: string, messageType?: string): boolean {
    if (this.closed) return false;
    const config = this.config().channels[name];
    if (!config || config.enabled === false) return false;
    const definition = this.registry.provider(config.provider);
    return (
      !!definition && (!messageType || definition.messageType === messageType)
    );
  }
  public async runtime(name: string): Promise<SendingRuntime> {
    if (!this.available(name))
      throw new Error('Sending channel is unavailable.');
    this.registry.seal();
    const config = this.config().channels[name];
    const configuration = JSON.stringify(config);
    const existing = this.runtimes.get(name);
    if (existing) {
      if (existing.configuration !== configuration)
        throw new Error('Sending channel changed; restart the runtime.');
      return existing.promise;
    }
    const promise = (async (): Promise<SendingRuntime> => {
      const definition = this.registry.provider(config.provider)!;
      const channelDefinition = this.registry.channel(definition.messageType);
      if (!channelDefinition)
        throw new Error('Sending message type is unavailable.');
      definition.validateConfig?.(config);
      channelDefinition.validateConfig?.(config);
      const context = {
        logger: this.options.logger,
        now: (): Promise<string> => Promise.resolve(new Date().toISOString()),
      };
      const channel = await channelDefinition.createChannel(context, config);
      const provider = await definition.createProvider(context, config);
      if (provider.type !== config.provider) {
        await this.closeProvider(provider);
        throw new Error('Sending provider type mismatch.');
      }
      const runtime: SendingRuntime = {
        channel,
        provider: {
          type: provider.type,
          close: async (): Promise<void> => {
            await this.closeProvider(provider);
          },
          capabilities: provider.capabilities ?? definition.capabilities,
          send: (input) =>
            boundedSubmission(
              (signal) =>
                provider.send({
                  ...input,
                  signal: AbortSignal.any([signal, input.signal]),
                }),
              Date.parse(input.deadline),
            ),
        },
      };
      if (this.closed) {
        await this.closeProvider(provider);
        throw new Error('Sending service closed.');
      }
      return runtime;
    })();
    this.runtimes.set(name, { configuration, promise });
    void promise.catch(() => {
      if (this.runtimes.get(name)?.promise === promise)
        this.runtimes.delete(name);
    });
    return promise;
  }
  public async send(input: {
    readonly channel: string;
    readonly message: object;
    readonly deadline?: number;
    readonly deliveryId?: string;
  }): Promise<readonly ProviderSendResult[]> {
    const deadline = Math.min(input.deadline ?? Infinity, Date.now() + 20_000);
    // Validation and creation are bounded too; a stalled SDK cannot hold an anonymous request worker indefinitely.
    const results: ProviderSendResult[] = [];
    const outcome = await boundedSubmission(async (signal) => {
      const runtime = await this.runtime(input.channel);
      signal.throwIfAborted();
      const validated = runtime.channel.validateMessage(input.message);
      const notificationId = randomUUID();
      for (const [index, recipient] of validated.recipients.entries()) {
        signal.throwIfAborted();
        const deliveryId = input.deliveryId
          ? `${input.deliveryId}:${index}`
          : randomUUID();
        const message = await runtime.channel.prepare({
          recipient,
          message: validated.message,
          deliveryId,
          notificationId,
          provider: { type: runtime.provider.type },
          signal,
        });
        signal.throwIfAborted();
        const submission: SendingProviderSendInput = {
          message,
          deliveryId,
          notificationId,
          attemptId: randomUUID(),
          signal,
          deadline: new Date(deadline).toISOString(),
        };
        results.push(await runtime.provider.send(submission));
      }
      return { status: 'accepted' };
    }, deadline);
    return outcome.status === 'accepted' ? results : [outcome];
  }
  private closeProvider(provider: SendingProvider): Promise<void> {
    let pending = this.providerShutdowns.get(provider);
    if (!pending) {
      pending = Promise.resolve().then(() => provider.close?.());
      this.providerShutdowns.set(provider, pending);
    }
    return pending;
  }
  public close(): Promise<void> {
    this.closing ??= this.closeRuntimes();
    return this.closing;
  }
  private async closeRuntimes(): Promise<void> {
    this.closed = true;
    const pending = [...this.runtimes.values()].map(async ({ promise }) =>
      (await promise).provider.close?.(),
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.allSettled(pending),
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, 20_000);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      this.runtimes.clear();
    }
  }
}
