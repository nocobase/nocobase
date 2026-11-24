import type {
  BrokerImplementation,
  BrokerRuntime,
  BrokerRuntimeContext,
  DeliverMessage,
  MissingResource,
  PublisherBinding,
  ResolvedBackendConfig,
  StopConsuming,
  SubscriptionBinding,
} from './runtime.js';
import type { BrokerCapabilities, EncodedMessage } from './types.js';

/** The adapter name of the in-process backend. */
export const IN_MEMORY_ADAPTER = 'inMemory';

const ENTRY_FIELDS: ReadonlySet<string> = new Set([
  'adapter',
  'topics',
  'publishers',
  'subscriptions',
]);
const SUBSCRIPTION_FIELDS: ReadonlySet<string> = new Set([
  'topic',
  'maxAttempts',
  'retryDelay',
  'concurrency',
  'ordered',
]);

export const IN_MEMORY_CAPABILITIES: BrokerCapabilities = {
  perMessageAck: true,
  delayedRetry: true,
  orderedByKey: true,
  deadLetter: true,
};

/** A message the in-process backend moved to a subscription's dead letter. */
export interface DeadLetter {
  readonly message: EncodedMessage;
  readonly reason: string;
  readonly attempts: number;
}

export interface InMemoryBrokerOptions {
  /** Declares fewer capabilities, to exercise how the service rejects what a backend cannot do. */
  readonly capabilities?: Partial<BrokerCapabilities>;
}

/**
 * The in-process backend: each topic fans out to every subscription bound to it, and each subscription is a queue
 * of its own, like a consumer group. Nothing survives the process; it is meant for development and tests.
 */
export interface InMemoryBroker extends BrokerImplementation {
  /** Messages moved to the dead letter of `subscription`, oldest first. */
  deadLetters(subscription: string): readonly DeadLetter[];
}

interface Pending {
  readonly message: EncodedMessage;
  attempt: number;
}

function topicOf(binding: PublisherBinding | SubscriptionBinding): string {
  return typeof binding.options.topic === 'string'
    ? binding.options.topic
    : binding.name;
}

function checkFields(
  value: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) {
      throw new TypeError(`${label} has an unknown field "${field}".`);
    }
  }
}

function checkTopic(value: unknown, label: string): void {
  if (value !== undefined && (typeof value !== 'string' || value === '')) {
    throw new TypeError(`${label}.topic must be a non-empty string.`);
  }
}

class SubscriptionQueue {
  private readonly pending: Pending[] = [];
  private readonly busyKeys = new Set<string>();
  private readonly running = new Set<Promise<void>>();
  private readonly timers = new Set<NodeJS.Timeout>();
  private deliver: DeliverMessage | undefined;

  public constructor(
    private readonly binding: SubscriptionBinding,
    private readonly deadLetters: DeadLetter[],
  ) {}

  public push(message: EncodedMessage): void {
    this.pending.push({ message, attempt: 1 });
    this.pump();
  }

  public start(deliver: DeliverMessage): StopConsuming {
    this.deliver = deliver;
    this.pump();
    return async () => {
      this.deliver = undefined;
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
      await Promise.all(this.running);
    };
  }

  private pump(): void {
    const deliver = this.deliver;
    if (!deliver) return;
    while (this.running.size < this.binding.concurrency) {
      const index = this.pending.findIndex(
        (entry) =>
          !this.binding.ordered ||
          entry.message.key === undefined ||
          !this.busyKeys.has(entry.message.key),
      );
      if (index < 0) return;
      const [entry] = this.pending.splice(index, 1);
      this.run(entry, deliver);
    }
  }

  private run(entry: Pending, deliver: DeliverMessage): void {
    const key = this.binding.ordered ? entry.message.key : undefined;
    if (key !== undefined) this.busyKeys.add(key);
    const task = (async () => {
      const outcome = await deliver(entry.message, { attempt: entry.attempt });
      if (outcome.kind === 'retry') {
        entry.attempt += 1;
        // An ordered key stays busy while its message waits, so later messages with the key cannot overtake it.
        const requeue = () => {
          if (key !== undefined) this.busyKeys.delete(key);
          this.pending.unshift(entry);
          this.pump();
        };
        if (outcome.delay > 0) {
          const timer = setTimeout(() => {
            this.timers.delete(timer);
            requeue();
          }, outcome.delay);
          this.timers.add(timer);
        } else {
          requeue();
        }
        return;
      }
      if (outcome.kind === 'deadLetter') {
        this.deadLetters.push({
          message: entry.message,
          reason: outcome.reason,
          attempts: entry.attempt,
        });
      }
      if (key !== undefined) this.busyKeys.delete(key);
    })();
    this.running.add(task);
    void task.finally(() => {
      this.running.delete(task);
      this.pump();
    });
  }
}

class InMemoryRuntime implements BrokerRuntime {
  private readonly queues = new Map<string, SubscriptionQueue>();
  /** Topic to the subscriptions bound to it. */
  private readonly routes = new Map<string, Set<string>>();
  private readonly topics: ReadonlySet<string> | undefined;

  public constructor(
    private readonly context: BrokerRuntimeContext,
    private readonly deadLetters: (subscription: string) => DeadLetter[],
  ) {
    const topics = context.config.entry.topics;
    this.topics = Array.isArray(topics)
      ? new Set(topics as string[])
      : undefined;
    for (const subscription of context.config.subscriptions) {
      this.bind(subscription);
    }
  }

  public open(): Promise<void> {
    return Promise.resolve();
  }

  public checkTopology(bindings: {
    readonly publishers: readonly PublisherBinding[];
    readonly subscriptions: readonly SubscriptionBinding[];
  }): Promise<readonly MissingResource[]> {
    const missing: MissingResource[] = [];
    for (const [kind, list] of [
      ['publisher', bindings.publishers],
      ['subscription', bindings.subscriptions],
    ] as const) {
      for (const binding of list) {
        const topic = topicOf(binding);
        if (this.topics && !this.topics.has(topic)) {
          missing.push({
            kind: 'topic',
            name: topic,
            usedBy: `${kind} "${binding.name}"`,
          });
        }
      }
    }
    for (const subscription of bindings.subscriptions) this.bind(subscription);
    return Promise.resolve(missing);
  }

  public publish(
    publisher: PublisherBinding,
    message: EncodedMessage,
  ): Promise<void> {
    const topic = topicOf(publisher);
    if (this.topics && !this.topics.has(topic)) {
      return Promise.reject(
        new Error(
          `Message broker backend "${this.context.config.name}" has no topic "${topic}".`,
        ),
      );
    }
    for (const subscription of this.routes.get(topic) ?? []) {
      this.queues.get(subscription)!.push(message);
    }
    return Promise.resolve();
  }

  public startConsuming(
    subscription: SubscriptionBinding,
    deliver: DeliverMessage,
  ): Promise<StopConsuming> {
    return Promise.resolve(this.bind(subscription).start(deliver));
  }

  public close(): Promise<void> {
    return Promise.resolve();
  }

  private bind(subscription: SubscriptionBinding): SubscriptionQueue {
    let queue = this.queues.get(subscription.name);
    if (!queue) {
      queue = new SubscriptionQueue(
        subscription,
        this.deadLetters(subscription.name),
      );
      this.queues.set(subscription.name, queue);
      const topic = topicOf(subscription);
      let route = this.routes.get(topic);
      if (!route) this.routes.set(topic, (route = new Set()));
      route.add(subscription.name);
    }
    return queue;
  }
}

/** Creates an in-process backend. The service registers one under `inMemory` itself. */
export function createInMemoryBroker(
  options: InMemoryBrokerOptions = {},
): InMemoryBroker {
  const deadLetters = new Map<string, DeadLetter[]>();
  const listFor = (subscription: string): DeadLetter[] => {
    let list = deadLetters.get(subscription);
    if (!list) deadLetters.set(subscription, (list = []));
    return list;
  };
  return {
    sharing: 'local',
    capabilities: { ...IN_MEMORY_CAPABILITIES, ...options.capabilities },
    implicitBindings: true,
    validateConfig(config: ResolvedBackendConfig): void {
      const label = `messageBroker.backends.${config.name}`;
      checkFields(config.entry, ENTRY_FIELDS, label);
      const topics = config.entry.topics;
      if (
        topics !== undefined &&
        (!Array.isArray(topics) ||
          !topics.every((topic) => typeof topic === 'string' && topic !== ''))
      ) {
        throw new TypeError(`${label}.topics must be a list of topic names.`);
      }
      for (const publisher of config.publishers) {
        const at = `${label}.publishers.${publisher.name}`;
        checkFields(publisher.options, new Set(['topic']), at);
        checkTopic(publisher.options.topic, at);
      }
      for (const subscription of config.subscriptions) {
        const at = `${label}.subscriptions.${subscription.name}`;
        checkFields(subscription.options, SUBSCRIPTION_FIELDS, at);
        checkTopic(subscription.options.topic, at);
      }
    },
    createRuntime(context: BrokerRuntimeContext): BrokerRuntime {
      return new InMemoryRuntime(context, listFor);
    },
    deadLetters(subscription: string): readonly DeadLetter[] {
      return [...(deadLetters.get(subscription) ?? [])];
    },
  };
}
