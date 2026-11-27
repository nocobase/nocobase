import { randomUUID } from 'node:crypto';

import { jsonCodec } from './codec.js';
import {
  bindingOptions,
  declaringBackend,
  resolveSubscriptionBinding,
  validateMessageBrokerConfig,
  type BindingKind,
} from './config.js';
import {
  createInMemoryBroker,
  IN_MEMORY_ADAPTER,
  type InMemoryBroker,
} from './memory.js';
import type {
  BrokerImplementation,
  BrokerRuntime,
  DeliverMessage,
  DeliveryOutcome,
  MissingResource,
  PublisherBinding,
  ResolvedBackendConfig,
  StopConsuming,
  SubscriptionBinding,
} from './runtime.js';
import type {
  BrokerCapability,
  BrokerMessage,
  Codec,
  EncodedMessage,
  MessageBrokerConfig,
  MessageBrokerDescription,
  MessageBrokerLogger,
  MessageBrokerService,
  MessageBrokerServiceOptions,
  MessageHandler,
  MessageInbox,
  MessageOutbox,
  MessageResult,
  OutgoingMessage,
  PublishOptions,
  PublishReceipt,
  Publisher,
  PublisherOptions,
  Subscription,
  SubscriptionOptions,
  UnregisterHandler,
} from './types.js';

/** How long a direct publish waits for the backend to confirm. */
const PUBLISH_TIMEOUT_MS = 10_000;

export interface CreateMessageBrokerServiceOptions extends MessageBrokerServiceOptions {
  /** The in-process backend registered under `inMemory`; a fresh one by default. Tests pass one to read its dead letters. */
  readonly inMemory?: InMemoryBroker;
}

/** Thrown when a configuration or a call needs a capability its backend does not declare. */
export class UnsupportedCapabilityError extends Error {
  public constructor(
    public readonly backend: string,
    public readonly capability: BrokerCapability,
    usage: string,
  ) {
    super(
      `Message broker backend "${backend}" does not support ${capability}, which ${usage} needs.`,
    );
    this.name = 'UnsupportedCapabilityError';
  }
}

/** Thrown at setup when the middleware lacks resources the bindings need. */
export class MissingTopologyError extends Error {
  public constructor(
    public readonly backend: string,
    public readonly missing: readonly MissingResource[],
  ) {
    super(
      `Message broker backend "${backend}" is missing ${missing
        .map(
          (resource) =>
            `${resource.kind} "${resource.name}" (${resource.usedBy})`,
        )
        .join(', ')}. Create them in the middleware; the application does not.`,
    );
    this.name = 'MissingTopologyError';
  }
}

const consoleLogger: MessageBrokerLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: (bindings, message) => console.warn(message, bindings),
  error: (bindings, message) => console.error(message, bindings),
};

type State = 'idle' | 'starting' | 'ready' | 'closed';

interface Backend {
  readonly name: string;
  readonly config: ResolvedBackendConfig;
  readonly implementation: BrokerImplementation;
  readonly runtime: BrokerRuntime;
  /** Late bindings whose topology was checked, by `kind:name`. */
  readonly checked: Map<string, Promise<void>>;
}

interface SubscriptionState {
  readonly name: string;
  readonly options: SubscriptionOptions<unknown>;
  handler: MessageHandler<unknown> | undefined;
  stop: StopConsuming | undefined;
  starting: Promise<void> | undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Thrown inside an inbox transaction so that a retry or a reject rolls the inbox row back. */
class SettleWithoutCommit extends Error {
  public constructor(public readonly result: MessageResult) {
    super('The handler did not acknowledge the message.');
  }
}

function isMessageResult(value: unknown): value is MessageResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    ['ack', 'retry', 'reject'].includes((value as { kind: string }).kind)
  );
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} was not confirmed within ${PUBLISH_TIMEOUT_MS} ms.`,
          ),
        ),
      PUBLISH_TIMEOUT_MS,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function encodeMessage<T>(
  message: OutgoingMessage<T>,
  codec: Codec<T>,
): EncodedMessage {
  if (typeof message !== 'object' || message === null) {
    throw new TypeError('A message must be an object with a body.');
  }
  const headers = message.headers ?? {};
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value !== 'string') {
      throw new TypeError(`Message header "${name}" must be a string.`);
    }
  }
  const encoded: EncodedMessage = {
    body: codec.encode(message.body),
    contentType: message.contentType ?? codec.contentType,
    headers: { ...headers },
    messageId: message.messageId ?? randomUUID(),
    timestamp: message.timestamp ?? new Date(),
    ...(message.key === undefined ? {} : { key: message.key }),
    ...(message.correlationId === undefined
      ? {}
      : { correlationId: message.correlationId }),
    ...(message.replyTo === undefined ? {} : { replyTo: message.replyTo }),
    ...(message.type === undefined ? {} : { type: message.type }),
  };
  if (typeof encoded.messageId !== 'string' || encoded.messageId === '') {
    throw new TypeError('messageId must be a non-empty string.');
  }
  return encoded;
}

class DefaultMessageBrokerService implements MessageBrokerService {
  private readonly implementations = new Map<string, BrokerImplementation>();
  private readonly logger: MessageBrokerLogger;
  private readonly requested: Record<BindingKind, Set<string>> = {
    publisher: new Set(),
    subscription: new Set(),
  };
  private readonly subscriptions = new Map<string, SubscriptionState>();
  private readonly backends = new Map<string, Backend>();
  private readonly abort = new AbortController();
  private outbox: MessageOutbox | undefined;
  private inbox: MessageInbox | undefined;
  private state: State = 'idle';

  public constructor(
    private readonly config: MessageBrokerConfig | undefined,
    private readonly options: CreateMessageBrokerServiceOptions,
  ) {
    validateMessageBrokerConfig(config);
    this.logger = options.logger ?? consoleLogger;
    this.implementations.set(
      IN_MEMORY_ADAPTER,
      options.inMemory ?? createInMemoryBroker(),
    );
  }

  public registerImplementation(
    adapter: string,
    implementation: BrokerImplementation,
  ): void {
    this.assertRegistrationOpen(`register adapter "${adapter}"`);
    if (adapter === IN_MEMORY_ADAPTER) {
      throw new Error(
        'The inMemory adapter is built in and cannot be replaced.',
      );
    }
    if (this.implementations.has(adapter)) {
      throw new Error(
        `Message broker adapter "${adapter}" is already registered.`,
      );
    }
    if (
      typeof implementation?.createRuntime !== 'function' ||
      typeof implementation.validateConfig !== 'function' ||
      typeof implementation.capabilities !== 'object'
    ) {
      throw new TypeError(
        `Message broker adapter "${adapter}" must provide capabilities, validateConfig() and createRuntime().`,
      );
    }
    this.implementations.set(adapter, implementation);
  }

  public registerOutbox(outbox: MessageOutbox): void {
    this.assertRegistrationOpen('register an outbox');
    if (this.outbox)
      throw new Error('A message broker outbox is already registered.');
    this.outbox = outbox;
  }

  public registerInbox(inbox: MessageInbox): void {
    this.assertRegistrationOpen('register an inbox');
    if (this.inbox)
      throw new Error('A message broker inbox is already registered.');
    this.inbox = inbox;
  }

  public publisher<T = unknown>(
    name: string,
    options: PublisherOptions<T> = {},
  ): Publisher<T> {
    this.request('publisher', name);
    const codec = (options.codec ?? jsonCodec) as Codec<T>;
    return {
      publish: async (
        message: OutgoingMessage<T>,
        publishOptions: PublishOptions = {},
      ): Promise<PublishReceipt> => {
        // Encoding happens before anything is written, so a body that cannot be encoded fails the caller's
        // transaction instead of a relay after commit.
        const encoded = encodeMessage(message, codec);
        if (publishOptions.transaction) {
          if (!this.outbox) {
            throw new Error(
              'Publishing inside a transaction needs an outbox; register @nocobase/app-plugin-message-broker.',
            );
          }
          // Once set up, a transactional publish checks its binding the way a direct one does, so that a message the
          // middleware cannot route fails the business transaction instead of waiting in the outbox. Before setup the
          // outbox takes it, and setup checks every publisher requested by then.
          if (this.state === 'ready') await this.lateBinding('publisher', name);
          await this.outbox.enqueue(publishOptions.transaction, name, encoded);
          return { messageId: encoded.messageId, deferred: true };
        }
        await this.publishEncoded(name, encoded);
        return { messageId: encoded.messageId, deferred: false };
      },
    };
  }

  public subscription<T = unknown>(
    name: string,
    options: SubscriptionOptions<T> = {},
  ): Subscription<T> {
    this.request('subscription', name);
    let state = this.subscriptions.get(name);
    if (!state) {
      state = {
        name,
        options: options,
        handler: undefined,
        stop: undefined,
        starting: undefined,
      };
      this.subscriptions.set(name, state);
    } else if (
      options.codec !== undefined ||
      options.schema !== undefined ||
      options.inbox !== undefined
    ) {
      if (
        state.options.codec !== options.codec ||
        state.options.schema !== options.schema ||
        state.options.inbox !== options.inbox
      ) {
        throw new Error(
          `Subscription "${name}" was already requested with other options; request it once.`,
        );
      }
    }
    const subscription = state;
    return {
      consume: (handler: MessageHandler<T>): UnregisterHandler => {
        if (this.state === 'closed') {
          throw new Error('The message broker service has shut down.');
        }
        if (subscription.handler) {
          throw new Error(
            `Subscription "${name}" already has a handler; a subscription takes one.`,
          );
        }
        subscription.handler = handler as MessageHandler<unknown>;
        if (this.state === 'ready') {
          subscription.starting = this.startSubscription(subscription);
          subscription.starting.catch((error: unknown) => {
            this.logger.error(
              { subscription: name, error: errorMessage(error) },
              'Message broker subscription failed to start.',
            );
          });
        }
        return async () => {
          if (subscription.handler !== handler) return;
          await subscription.starting?.catch(() => undefined);
          subscription.handler = undefined;
          const stop = subscription.stop;
          subscription.stop = undefined;
          await stop?.();
        };
      },
    };
  }

  public async publishEncoded(
    publisher: string,
    message: EncodedMessage,
  ): Promise<void> {
    if (this.state !== 'ready') {
      throw new Error(
        this.state === 'closed'
          ? 'The message broker service has shut down.'
          : 'The message broker service is not set up yet; publish after startup or inside a transaction.',
      );
    }
    const { backend, binding } = await this.lateBinding('publisher', publisher);
    await withTimeout(
      backend.runtime.publish(binding, message),
      `Message "${message.messageId}" on publisher "${publisher}"`,
    );
  }

  public async setup(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error('The message broker service is already set up.');
    }
    this.state = 'starting';
    const opened: Backend[] = [];
    try {
      const plans = this.plan();
      for (const plan of plans.values()) {
        plan.implementation.validateConfig(plan.config);
      }
      for (const plan of plans.values()) {
        const runtime = plan.implementation.createRuntime({
          config: plan.config,
          appName: this.options.appName,
          logger: this.logger,
        });
        const backend: Backend = { ...plan, runtime, checked: new Map() };
        opened.push(backend);
        await runtime.open();
      }
      const failures: MissingTopologyError[] = [];
      for (const backend of opened) {
        const missing = await backend.runtime.checkTopology({
          publishers: backend.config.publishers,
          subscriptions: backend.config.subscriptions,
        });
        if (missing.length > 0) {
          failures.push(new MissingTopologyError(backend.name, missing));
        }
      }
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) {
        throw new Error(failures.map((failure) => failure.message).join(' '));
      }
      for (const backend of opened) this.backends.set(backend.name, backend);
      this.state = 'ready';
    } catch (error) {
      this.state = 'closed';
      await Promise.allSettled(
        opened.map((backend) => backend.runtime.close()),
      );
      throw error;
    }
    for (const subscription of this.subscriptions.values()) {
      if (subscription.handler) {
        subscription.starting = this.startSubscription(subscription);
        await subscription.starting;
      }
    }
  }

  public async shutdown(): Promise<void> {
    if (this.state === 'closed' && this.backends.size === 0) return;
    this.state = 'closed';
    this.abort.abort();
    await Promise.allSettled(
      [...this.subscriptions.values()].map(async (subscription) => {
        await subscription.starting?.catch(() => undefined);
        const stop = subscription.stop;
        subscription.stop = undefined;
        await stop?.();
      }),
    );
    const backends = [...this.backends.values()];
    this.backends.clear();
    await Promise.allSettled(
      backends.map((backend) => backend.runtime.close()),
    );
  }

  public describe(): MessageBrokerDescription {
    const configured = this.config?.backends ?? {};
    const bindingBackend = (kind: BindingKind, name: string): string =>
      declaringBackend(this.config, kind, name) ?? this.config?.default ?? '';
    const names = (kind: BindingKind): string[] => {
      const field = kind === 'publisher' ? 'publishers' : 'subscriptions';
      const all = new Set(this.requested[kind]);
      for (const entry of Object.values(configured)) {
        for (const name of Object.keys(entry[field] ?? {})) all.add(name);
      }
      return [...all].sort();
    };
    return {
      default: this.config?.default ?? null,
      backends: Object.entries(configured).map(([name, entry]) => {
        const implementation = this.implementations.get(entry.adapter);
        return {
          name,
          adapter: entry.adapter,
          registered: implementation !== undefined,
          sharing: implementation?.sharing ?? 'unknown',
          capabilities: implementation
            ? { ...implementation.capabilities }
            : null,
        };
      }),
      publishers: names('publisher').map((name) => ({
        name,
        backend: bindingBackend('publisher', name),
      })),
      subscriptions: names('subscription').map((name) => ({
        name,
        backend: bindingBackend('subscription', name),
        consuming: this.subscriptions.get(name)?.stop !== undefined,
      })),
      outbox: this.outbox !== undefined,
      inbox: this.inbox !== undefined,
    };
  }

  private assertRegistrationOpen(action: string): void {
    if (this.state !== 'idle') {
      throw new Error(
        `Cannot ${action} after the message broker service was set up; do it in a provider's register() or boot().`,
      );
    }
  }

  private request(kind: BindingKind, name: string): void {
    if (typeof name !== 'string' || name === '') {
      throw new TypeError(`A ${kind} needs a logical name.`);
    }
    this.requested[kind].add(name);
  }

  /** The backend a logical name binds to, or an error saying where to declare it. */
  private backendFor(kind: BindingKind, name: string): string {
    const declared = declaringBackend(this.config, kind, name);
    if (declared !== undefined) return declared;
    const fallback = this.config?.default;
    if (fallback === undefined) {
      throw new Error(
        `No message broker backend declares the ${kind} "${name}" and messageBroker.default is not set; declare it under messageBroker.backends.<name>.${kind}s.`,
      );
    }
    const adapter = this.config!.backends![fallback].adapter;
    const implementation = this.implementations.get(adapter);
    if (implementation && implementation.implicitBindings !== true) {
      throw new Error(
        `The ${kind} "${name}" is not declared, and the default backend "${fallback}" (${adapter}) needs it declared under messageBroker.backends.${fallback}.${kind}s with its physical names.`,
      );
    }
    return fallback;
  }

  private subscriptionBinding(
    backendName: string,
    name: string,
    implementation: BrokerImplementation,
  ): SubscriptionBinding {
    const entry = this.config!.backends![backendName];
    const options = bindingOptions(entry, 'subscription', name);
    return resolveSubscriptionBinding(
      name,
      options,
      `messageBroker.backends.${backendName}`,
      options.maxAttempts === undefined
        ? implementation.defaultMaxAttempts?.(options)
        : undefined,
    );
  }

  /** Which backends setup opens, with the bindings each serves. */
  private plan(): Map<
    string,
    {
      name: string;
      config: ResolvedBackendConfig;
      implementation: BrokerImplementation;
    }
  > {
    const used = new Map<
      string,
      { publishers: Set<string>; subscriptions: Set<string> }
    >();
    const use = (backend: string) => {
      let entry = used.get(backend);
      if (!entry)
        used.set(
          backend,
          (entry = { publishers: new Set(), subscriptions: new Set() }),
        );
      return entry;
    };
    if (this.config?.default !== undefined) use(this.config.default);
    for (const [backend, entry] of Object.entries(
      this.config?.backends ?? {},
    )) {
      for (const name of Object.keys(entry.publishers ?? {}))
        use(backend).publishers.add(name);
      for (const name of Object.keys(entry.subscriptions ?? {}))
        use(backend).subscriptions.add(name);
    }
    for (const name of this.requested.publisher) {
      use(this.backendFor('publisher', name)).publishers.add(name);
    }
    for (const name of this.requested.subscription) {
      use(this.backendFor('subscription', name)).subscriptions.add(name);
    }
    const plans = new Map<
      string,
      {
        name: string;
        config: ResolvedBackendConfig;
        implementation: BrokerImplementation;
      }
    >();
    for (const [name, bindings] of used) {
      const entry = this.config!.backends![name];
      const implementation = this.implementations.get(entry.adapter);
      if (!implementation) {
        throw new Error(
          `Message broker backend "${name}" uses adapter "${entry.adapter}", which no plugin registered; register the plugin that provides it.`,
        );
      }
      const config: ResolvedBackendConfig = {
        name,
        entry,
        publishers: [...bindings.publishers].map((publisher) => ({
          name: publisher,
          options: bindingOptions(entry, 'publisher', publisher),
        })),
        subscriptions: [...bindings.subscriptions].map((subscription) =>
          this.subscriptionBinding(name, subscription, implementation),
        ),
      };
      for (const subscription of config.subscriptions) {
        this.checkSubscription(name, implementation, subscription);
      }
      plans.set(name, { name, config, implementation });
    }
    return plans;
  }

  private checkSubscription(
    backend: string,
    implementation: BrokerImplementation,
    binding: SubscriptionBinding,
  ): void {
    const usage = `subscription "${binding.name}"`;
    const needs = (capability: BrokerCapability, why: string) => {
      if (!implementation.capabilities[capability]) {
        throw new UnsupportedCapabilityError(
          backend,
          capability,
          `${usage} (${why})`,
        );
      }
    };
    needs('deadLetter', 'final failure handling');
    if (binding.concurrency > 1)
      needs('perMessageAck', `concurrency ${binding.concurrency}`);
    if (binding.retryDelay > 0)
      needs('delayedRetry', `retryDelay ${binding.retryDelay}`);
    if (binding.ordered) needs('orderedByKey', 'ordered: true');
    const state = this.subscriptions.get(binding.name);
    if (state?.options.inbox && !this.inbox) {
      throw new Error(
        `Subscription "${binding.name}" uses the inbox, which needs @nocobase/app-plugin-message-broker registered.`,
      );
    }
  }

  /** A binding for a name used after setup; names requested before setup were checked by it. */
  private async lateBinding(
    kind: BindingKind,
    name: string,
  ): Promise<{
    backend: Backend;
    binding: PublisherBinding | SubscriptionBinding;
  }> {
    const backendName = this.backendFor(kind, name);
    const backend = this.backends.get(backendName);
    if (!backend) {
      throw new Error(
        `Message broker backend "${backendName}" was not opened at setup; request the ${kind} "${name}" before startup.`,
      );
    }
    const binding =
      kind === 'publisher'
        ? (backend.config.publishers.find((entry) => entry.name === name) ?? {
            name,
            options: bindingOptions(backend.config.entry, 'publisher', name),
          })
        : (backend.config.subscriptions.find((entry) => entry.name === name) ??
          this.subscriptionBinding(backendName, name, backend.implementation));
    const known =
      kind === 'publisher'
        ? backend.config.publishers.some((entry) => entry.name === name)
        : backend.config.subscriptions.some((entry) => entry.name === name);
    if (!known) {
      const key = `${kind}:${name}`;
      let check = backend.checked.get(key);
      if (!check) {
        const pending = (async () => {
          if (kind === 'subscription') {
            this.checkSubscription(
              backendName,
              backend.implementation,
              binding as SubscriptionBinding,
            );
          }
          const missing = await backend.runtime.checkTopology(
            kind === 'publisher'
              ? { publishers: [binding], subscriptions: [] }
              : {
                  publishers: [],
                  subscriptions: [binding as SubscriptionBinding],
                },
          );
          if (missing.length > 0)
            throw new MissingTopologyError(backendName, missing);
        })();
        check = pending;
        backend.checked.set(key, pending);
        // A failed check is not remembered: once an operator creates the missing resource, the next call passes.
        pending.catch(() => {
          if (backend.checked.get(key) === pending) backend.checked.delete(key);
        });
      }
      await check;
    }
    return { backend, binding };
  }

  private async startSubscription(
    subscription: SubscriptionState,
  ): Promise<void> {
    const { backend, binding } = await this.lateBinding(
      'subscription',
      subscription.name,
    );
    if (!subscription.handler || this.state !== 'ready') return;
    subscription.stop = await backend.runtime.startConsuming(
      binding as SubscriptionBinding,
      this.deliverer(subscription, binding as SubscriptionBinding, backend),
    );
  }

  private deliverer(
    subscription: SubscriptionState,
    binding: SubscriptionBinding,
    backend: Backend,
  ): DeliverMessage {
    const codec = subscription.options.codec ?? jsonCodec;
    const schema = subscription.options.schema;
    const useInbox = subscription.options.inbox === true;
    const log = { subscription: subscription.name, backend: backend.name };
    const usage = `subscription "${subscription.name}"`;
    const retryOutcome = (
      attempt: number,
      reason: string,
      delay: number | undefined,
    ): DeliveryOutcome => {
      if (attempt >= binding.maxAttempts) {
        return {
          kind: 'deadLetter',
          reason: `Gave up after ${attempt} attempt(s): ${reason}`,
        };
      }
      return { kind: 'retry', delay: delay ?? binding.retryDelay };
    };
    const settle = (
      result: MessageResult | void,
      attempt: number,
    ): DeliveryOutcome => {
      if (result === undefined || result.kind === 'ack') return { kind: 'ack' };
      if (result.kind === 'reject')
        return { kind: 'deadLetter', reason: result.reason };
      if (
        result.delay !== undefined &&
        result.delay > 0 &&
        !backend.implementation.capabilities.delayedRetry
      ) {
        // Retrying at once instead would spend the attempts before whatever the handler waits for recovers.
        const error = new UnsupportedCapabilityError(
          backend.name,
          'delayedRetry',
          `retry({ delay: ${result.delay} }) in ${usage}`,
        );
        this.logger.error(
          { ...log, capability: 'delayedRetry' },
          error.message,
        );
        return { kind: 'deadLetter', reason: error.message };
      }
      return retryOutcome(attempt, 'the handler asked to retry', result.delay);
    };
    return async (encoded, { attempt }) => {
      const handler = subscription.handler;
      if (!handler || this.abort.signal.aborted)
        return { kind: 'retry', delay: 0 };
      let body: unknown;
      try {
        body = codec.decode(encoded.body, encoded.contentType);
      } catch (error) {
        return {
          kind: 'deadLetter',
          reason: `Cannot decode the body: ${errorMessage(error)}`,
        };
      }
      if (schema) {
        try {
          const result = await schema['~standard'].validate(body);
          if (result.issues) {
            return {
              kind: 'deadLetter',
              reason: `The body does not match the schema: ${result.issues.map((issue) => issue.message).join('; ')}`,
            };
          }
          body = result.value;
        } catch (error) {
          return {
            kind: 'deadLetter',
            reason: `Schema validation failed: ${errorMessage(error)}`,
          };
        }
      }
      const message: BrokerMessage = { ...encoded, body };
      const call = async (
        transaction: unknown,
      ): Promise<MessageResult | void> => {
        const result = await handler(message, {
          attempt,
          signal: this.abort.signal,
          ...(transaction === undefined ? {} : { transaction }),
        });
        if (result !== undefined && !isMessageResult(result)) {
          throw new TypeError(
            'A handler returns nothing, ack(), retry() or reject().',
          );
        }
        return result;
      };
      try {
        if (!useInbox) return settle(await call(undefined), attempt);
        const outcome = await this.inbox!.process(
          subscription.name,
          encoded.messageId,
          async (transaction) => {
            const result = await call(transaction);
            if (result !== undefined && result.kind !== 'ack') {
              throw new SettleWithoutCommit(result);
            }
            return result;
          },
        );
        return outcome.duplicate
          ? { kind: 'ack' }
          : settle(outcome.value, attempt);
      } catch (error) {
        if (error instanceof SettleWithoutCommit)
          return settle(error.result, attempt);
        if (this.abort.signal.aborted) return { kind: 'retry', delay: 0 };
        const reason = errorMessage(error);
        this.logger.warn(
          { ...log, messageId: encoded.messageId, attempt, error: reason },
          'Message broker handler failed.',
        );
        return retryOutcome(attempt, reason, undefined);
      }
    };
  }
}

/** Creates the application's message broker service. Holds no module-level state. */
export function createMessageBrokerService(
  config: MessageBrokerConfig | undefined,
  options: CreateMessageBrokerServiceOptions,
): MessageBrokerService {
  return new DefaultMessageBrokerService(config, options);
}
