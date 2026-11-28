import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createInMemoryBroker,
  createMessageBrokerService,
  MissingTopologyError,
  rawCodec,
  reject,
  retry,
  UnsupportedCapabilityError,
  validateMessageBrokerConfig,
  type BrokerImplementation,
  type BrokerMessage,
  type BrokerTransaction,
  type DeliveryOutcome,
  type EncodedMessage,
  type HandlerContext,
  type MessageBrokerConfig,
  type MessageBrokerService,
  type MessageInbox,
  type MessageOutbox,
} from '@nocobase/message-broker';

import { silentLogger, waitFor } from '@nocobase/message-broker/contract';

const services: MessageBrokerService[] = [];

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.shutdown()));
});

function create(
  config: MessageBrokerConfig | undefined,
  inMemory = createInMemoryBroker(),
): MessageBrokerService {
  const service = createMessageBrokerService(config, {
    appName: 'test',
    logger: silentLogger,
    inMemory,
  });
  services.push(service);
  return service;
}

const memory: MessageBrokerConfig = {
  default: 'memory',
  backends: { memory: { adapter: 'inMemory' } },
};

describe('configuration', () => {
  it('accepts only default and backends at the root', () => {
    expect(() =>
      validateMessageBrokerConfig({
        adapter: 'inMemory',
      } as MessageBrokerConfig),
    ).toThrow('accepts only "default" and "backends"');
  });

  it('requires default to name a backend', () => {
    expect(() =>
      validateMessageBrokerConfig({ default: 'rabbit', backends: {} }),
    ).toThrow('not in messageBroker.backends');
  });

  it('rejects a logical name declared by two backends', () => {
    expect(() =>
      validateMessageBrokerConfig({
        backends: {
          a: { adapter: 'inMemory', publishers: { orders: {} } },
          b: { adapter: 'inMemory', publishers: { orders: {} } },
        },
      }),
    ).toThrow('declared by both backend "a" and backend "b"');
  });

  it('rejects invalid common subscription options', () => {
    expect(() =>
      validateMessageBrokerConfig({
        backends: {
          a: { adapter: 'inMemory', subscriptions: { s: { maxAttempts: 0 } } },
        },
      }),
    ).toThrow('maxAttempts must be a positive integer');
  });

  it('has no built-in fallback when no default is set', async () => {
    const service = create({ backends: {} });
    service.publisher('orders');
    await expect(service.setup()).rejects.toThrow(
      'messageBroker.default is not set',
    );
  });

  it('binds an undeclared name only to a default backend that accepts implicit names', async () => {
    const service = create({
      default: 'strict',
      backends: { strict: { adapter: 'strict' } },
    });
    const inMemory = createInMemoryBroker();
    service.registerImplementation('strict', {
      ...inMemory,
      implicitBindings: false,
    });
    service.publisher('orders');
    await expect(service.setup()).rejects.toThrow(
      'needs it declared under messageBroker.backends.strict.publishers',
    );
  });

  it('fails setup when a used backend has no registered adapter', async () => {
    const service = create({
      default: 'rabbit',
      backends: {
        rabbit: {
          adapter: 'rabbitmq',
          publishers: { orders: { exchange: 'x' } },
        },
      },
    });
    await expect(service.setup()).rejects.toThrow(
      'adapter "rabbitmq", which no plugin registered',
    );
  });

  it('lets the implementation reject unknown binding fields', async () => {
    const service = create({
      default: 'memory',
      backends: {
        memory: {
          adapter: 'inMemory',
          publishers: { orders: { exchange: 'x' } },
        },
      },
    });
    await expect(service.setup()).rejects.toThrow('unknown field "exchange"');
  });

  it('routes a logical name to the backend that declares it, so switching backends changes only configuration', async () => {
    const service = create({
      default: 'memory',
      backends: {
        memory: { adapter: 'inMemory' },
        other: {
          adapter: 'inMemory',
          publishers: { orders: { topic: 'physical-orders' } },
          subscriptions: { erp: { topic: 'physical-orders' } },
        },
      },
    });
    const received: unknown[] = [];
    service.subscription('erp').consume((message) => {
      received.push(message.body);
    });
    await service.setup();
    await service.publisher('orders').publish({ body: { id: 1 } });
    await waitFor(() => received.length === 1);
    expect(service.describe().publishers).toEqual([
      { name: 'orders', backend: 'other' },
    ]);
  });
});

describe('subscription attempt defaults', () => {
  it.each([
    {
      scenario: 'uses the adapter default',
      adapter: 'custom',
      options: { topic: 'orders' },
      expectedAttempts: [1],
      expectedHookCalls: [[{ topic: 'orders' }]],
    },
    {
      scenario: 'prefers an explicit limit even when the adapter has a default',
      adapter: 'custom',
      options: { topic: 'orders', maxAttempts: 2 },
      expectedAttempts: [1, 2],
      expectedHookCalls: [],
    },
    {
      scenario: 'defaults to three attempts for an adapter without a default',
      adapter: 'inMemory',
      options: { topic: 'orders' },
      expectedAttempts: [1, 2, 3],
      expectedHookCalls: [],
    },
  ])(
    '$scenario',
    async ({ adapter, options, expectedAttempts, expectedHookCalls }) => {
      const inMemory = createInMemoryBroker();
      const service = create(
        {
          default: 'broker',
          backends: { broker: { adapter, subscriptions: { worker: options } } },
        },
        inMemory,
      );
      const defaultMaxAttempts = vi.fn<
        NonNullable<BrokerImplementation['defaultMaxAttempts']>
      >(() => 1);
      if (adapter === 'custom') {
        service.registerImplementation(adapter, {
          ...inMemory,
          defaultMaxAttempts,
        });
      }
      const attempts: number[] = [];
      service.subscription('worker').consume((_message, { attempt }) => {
        attempts.push(attempt);
        return retry();
      });
      await service.setup();
      await service.publisher('orders').publish({ body: {} });
      await waitFor(() => inMemory.deadLetters('worker').length === 1);
      expect(attempts).toEqual(expectedAttempts);
      expect(defaultMaxAttempts.mock.calls).toEqual(expectedHookCalls);
    },
  );

  it('uses the adapter default for an implicit subscription first used after setup', async () => {
    const inMemory = createInMemoryBroker();
    const service = create({
      default: 'custom',
      backends: { custom: { adapter: 'custom' } },
    });
    service.registerImplementation('custom', {
      ...inMemory,
      defaultMaxAttempts: () => 1,
    });
    await service.setup();
    const attempts: number[] = [];
    service.subscription('late').consume((_message, { attempt }) => {
      attempts.push(attempt);
      return retry();
    });
    await waitFor(() => service.describe().subscriptions[0]!.consuming);
    await service.publisher('late').publish({ body: {} });
    await waitFor(() => inMemory.deadLetters('late').length === 1);
    expect(attempts).toEqual([1]);
  });

  it.each([
    { behavior: 'throw', inbox: false },
    { behavior: 'retry', inbox: false },
    { behavior: 'retry', inbox: true },
    { behavior: 'reject', inbox: false },
    { behavior: 'reject', inbox: true },
  ] as const)(
    'settles shutdown $behavior at the adapter limit of one (inbox $inbox)',
    async ({ behavior, inbox }) => {
      const inMemory = createInMemoryBroker();
      const service = create({
        default: 'custom',
        backends: { custom: { adapter: 'custom' } },
      });
      const started = Promise.withResolvers<void>();
      const interrupted = Promise.withResolvers<DeliveryOutcome>();
      service.registerImplementation('custom', {
        ...inMemory,
        defaultMaxAttempts: () => 1,
        createRuntime(context) {
          const runtime = inMemory.createRuntime(context);
          return {
            open: () => runtime.open(),
            checkTopology: (bindings) => runtime.checkTopology(bindings),
            publish: (binding, message) => runtime.publish(binding, message),
            close: () => runtime.close(),
            startConsuming: (binding, deliver) =>
              runtime.startConsuming(binding, async (message, delivery) => {
                const outcome = await deliver(message, delivery);
                interrupted.resolve(outcome);
                return outcome;
              }),
          };
        },
      });
      const commit = vi.fn();
      if (inbox) {
        service.registerInbox({
          async process(_subscription, _messageId, run) {
            const value = await run('tx');
            commit();
            return { duplicate: false, value };
          },
        });
      }
      service
        .subscription('worker', { inbox })
        .consume(async (_message, { signal }) => {
          const abort = new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve(), { once: true });
          });
          started.resolve();
          await abort;
          if (behavior === 'throw') throw signal.reason;
          if (behavior === 'reject') return reject('invalid business event');
          return retry({ delay: 60_000 });
        });
      await service.setup();
      await service.publisher('worker').publish({ body: {} });
      await started.promise;
      await service.shutdown();
      await expect(interrupted.promise).resolves.toEqual(
        behavior === 'reject'
          ? {
              kind: 'deadLetter',
              failure: 'handlerRejected',
              reason: 'invalid business event',
            }
          : { kind: 'retry', delay: 0 },
      );
      expect(commit).not.toHaveBeenCalled();
    },
  );

  it('rejects an invalid adapter default before opening the backend', async () => {
    const service = create({
      backends: {
        custom: { adapter: 'custom', subscriptions: { worker: {} } },
      },
    });
    const inMemory = createInMemoryBroker();
    const createRuntime = vi.fn(inMemory.createRuntime);
    service.registerImplementation('custom', {
      ...inMemory,
      createRuntime,
      defaultMaxAttempts: () => 0,
    });
    await expect(service.setup()).rejects.toThrow(
      'messageBroker.backends.custom.subscriptions.worker.maxAttempts must be a positive integer.',
    );
    expect(createRuntime).not.toHaveBeenCalled();
  });
});

describe('capabilities', () => {
  function limited(capabilities: Parameters<typeof createInMemoryBroker>[0]) {
    const service = create({
      default: 'limited',
      backends: {
        limited: {
          adapter: 'limited',
          subscriptions: {
            plain: {},
            parallel: { concurrency: 2 },
            delayed: { retryDelay: 100 },
            ordered: { ordered: true },
          },
        },
      },
    });
    service.registerImplementation(
      'limited',
      createInMemoryBroker(capabilities),
    );
    return service;
  }

  it.each([
    ['perMessageAck', 'concurrency 2'],
    ['delayedRetry', 'retryDelay 100'],
    ['orderedByKey', 'ordered: true'],
    ['deadLetter', 'final failure handling'],
  ] as const)(
    'rejects at setup a subscription needing %s',
    async (capability, usage) => {
      const service = limited({ capabilities: { [capability]: false } });
      const error = await service.setup().catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(UnsupportedCapabilityError);
      expect((error as Error).message).toContain(capability);
      expect((error as Error).message).toContain(usage);
    },
  );

  it('dead-letters a retry delay the backend cannot honour, with the reason, instead of retrying at once', async () => {
    const errors: string[] = [];
    const service = createMessageBrokerService(
      {
        default: 'limited',
        backends: {
          limited: {
            adapter: 'limited',
            subscriptions: { worker: { maxAttempts: 3 } },
          },
        },
      },
      {
        appName: 'test',
        logger: {
          ...silentLogger,
          error: (_b, message) => errors.push(message),
        },
      },
    );
    services.push(service);
    const limitedBroker = createInMemoryBroker({
      capabilities: { delayedRetry: false },
    });
    service.registerImplementation('limited', limitedBroker);
    const attempts: number[] = [];
    service.subscription('worker').consume((_message, { attempt }) => {
      attempts.push(attempt);
      return retry({ delay: 60_000 });
    });
    await service.setup();
    await service.publisher('worker').publish({ body: {} });
    await waitFor(() => limitedBroker.deadLetters('worker').length === 1);
    expect(attempts).toEqual([1]);
    const [deadLetter] = limitedBroker.deadLetters('worker');
    expect(deadLetter!.reason).toContain('does not support delayedRetry');
    expect(deadLetter!.reason).toContain('retry({ delay: 60000 })');
    expect(errors[0]).toContain('delayedRetry');
  });

  it('describes backends with their sharing and capabilities', async () => {
    const service = create(memory);
    service.subscription('erp').consume(() => undefined);
    service.publisher('orders');
    await service.setup();
    expect(service.describe()).toEqual({
      default: 'memory',
      backends: [
        {
          name: 'memory',
          adapter: 'inMemory',
          registered: true,
          sharing: 'local',
          capabilities: {
            perMessageAck: true,
            delayedRetry: true,
            orderedByKey: true,
            deadLetter: true,
          },
        },
      ],
      publishers: [{ name: 'orders', backend: 'memory' }],
      subscriptions: [{ name: 'erp', backend: 'memory', consuming: true }],
      outbox: false,
      inbox: false,
    });
  });
});

describe('topology', () => {
  it('collects every missing resource of a backend into one error', async () => {
    const service = create({
      default: 'memory',
      backends: {
        memory: {
          adapter: 'inMemory',
          topics: ['orders'],
          publishers: { a: { topic: 'missing-a' } },
          subscriptions: { b: { topic: 'missing-b' } },
        },
      },
    });
    const error = await service.setup().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MissingTopologyError);
    expect((error as Error).message).toBe(
      'Message broker backend "memory" is missing topic "missing-a" (publisher "a"), topic "missing-b" (subscription "b"). Create them in the middleware; the application does not.',
    );
  });

  it('checks a name first used after setup before publishing on it', async () => {
    const service = create({
      default: 'memory',
      backends: { memory: { adapter: 'inMemory', topics: ['orders'] } },
    });
    await service.setup();
    await expect(
      service.publisher('late').publish({ body: {} }),
    ).rejects.toThrow('missing topic "late"');
  });
});

describe('topology after setup', () => {
  /** An inMemory backend whose middleware lacks topic "late" until `create()` is called. */
  function lateTopic() {
    const inMemory = createInMemoryBroker();
    let exists = false;
    const implementation: BrokerImplementation = {
      ...inMemory,
      createRuntime: (context) => {
        const runtime = inMemory.createRuntime(context);
        return {
          ...runtime,
          open: () => runtime.open(),
          publish: (binding, message) => runtime.publish(binding, message),
          startConsuming: (binding, deliver) =>
            runtime.startConsuming(binding, deliver),
          close: () => runtime.close(),
          checkTopology: async (bindings) =>
            exists
              ? runtime.checkTopology(bindings)
              : bindings.publishers.map((binding) => ({
                  kind: 'topic',
                  name: binding.name,
                  usedBy: `publisher "${binding.name}"`,
                })),
        };
      },
    };
    const service = create({
      default: 'lazy',
      backends: { lazy: { adapter: 'lazy' } },
    });
    service.registerImplementation('lazy', implementation);
    return {
      service,
      create: () => {
        exists = true;
      },
    };
  }

  it('refuses a transactional publish on a missing resource as a direct one does', async () => {
    const written: string[] = [];
    const { service } = lateTopic();
    service.registerOutbox({
      enqueue: (_transaction, _publisher, message) => {
        written.push(message.messageId);
        return Promise.resolve();
      },
    });
    await service.setup();
    const transaction: BrokerTransaction = { afterCommit: () => undefined };
    await expect(
      service.publisher('late').publish({ body: {} }, { transaction }),
    ).rejects.toThrow('missing topic "late"');
    await expect(
      service.publisher('late').publish({ body: {} }),
    ).rejects.toThrow('missing topic "late"');
    expect(written).toEqual([]);
  });

  it('checks a failed name again, so a resource created later works without a restart', async () => {
    const { service, create: createTopic } = lateTopic();
    const received: unknown[] = [];
    await service.setup();
    await expect(
      service.publisher('late').publish({ body: 1 }),
    ).rejects.toThrow('missing topic "late"');
    createTopic();
    service.subscription('late').consume((message) => {
      received.push(message.body);
    });
    await waitFor(() => service.describe().subscriptions[0]!.consuming);
    await service.publisher('late').publish({ body: 2 });
    await waitFor(() => received.length === 1);
    expect(received).toEqual([2]);
  });
});

describe('registration and lifecycle', () => {
  it('freezes registration at setup', async () => {
    const service = create(memory);
    await service.setup();
    expect(() =>
      service.registerImplementation('x', createInMemoryBroker()),
    ).toThrow('after the message broker service was set up');
  });

  it('refuses to replace inMemory', () => {
    const service = create(memory);
    expect(() =>
      service.registerImplementation('inMemory', createInMemoryBroker()),
    ).toThrow('built in');
  });

  it('refuses a direct publish before setup', async () => {
    const service = create(memory);
    await expect(
      service.publisher('orders').publish({ body: {} }),
    ).rejects.toThrow('not set up yet');
  });

  it('takes one handler per subscription and stops it on unregister', async () => {
    const service = create(memory);
    const received: unknown[] = [];
    const unregister = service.subscription('erp').consume((message) => {
      received.push(message.body);
    });
    expect(() => service.subscription('erp').consume(() => undefined)).toThrow(
      'already has a handler',
    );
    await service.setup();
    await unregister();
    expect(service.describe().subscriptions[0]!.consuming).toBe(false);
  });

  it('encodes before anything is written, so a bad body fails the caller', async () => {
    const service = create(memory);
    await service.setup();
    await expect(
      service.publisher('orders').publish({ body: undefined }),
    ).rejects.toThrow('JSON value');
  });
});

describe('outbox and inbox', () => {
  it('writes into the outbox inside a transaction instead of publishing', async () => {
    const written: { publisher: string; message: EncodedMessage }[] = [];
    const outbox: MessageOutbox = {
      enqueue: (_transaction, publisher, message) => {
        written.push({ publisher, message });
        return Promise.resolve();
      },
    };
    const service = create(memory);
    service.registerOutbox(outbox);
    const received: unknown[] = [];
    service.subscription('orders').consume((message) => {
      received.push(message.body);
    });
    const transaction: BrokerTransaction = { afterCommit: () => undefined };
    // Allowed before setup: the relay sends it once the service is up.
    const receipt = await service
      .publisher('orders')
      .publish({ body: { id: 1 }, messageId: 'm-1' }, { transaction });
    expect(receipt).toEqual({ messageId: 'm-1', deferred: true });
    expect(written[0]!.publisher).toBe('orders');
    expect(JSON.parse(written[0]!.message.body.toString())).toEqual({ id: 1 });
    await service.setup();
    await service.publishEncoded('orders', written[0]!.message);
    await waitFor(() => received.length === 1);
    expect(received).toEqual([{ id: 1 }]);
  });

  it('refuses a transaction without a registered outbox', async () => {
    const service = create(memory);
    await expect(
      service
        .publisher('orders')
        .publish(
          { body: {} },
          { transaction: { afterCommit: () => undefined } },
        ),
    ).rejects.toThrow('needs an outbox');
  });

  it('refuses an inbox subscription without a registered inbox', async () => {
    const service = create(memory);
    service.subscription('erp', { inbox: true }).consume(() => undefined);
    await expect(service.setup()).rejects.toThrow('uses the inbox');
  });

  it('skips a duplicate messageId and rolls the inbox back when the handler does not acknowledge', async () => {
    const processed = new Set<string>();
    const inbox: MessageInbox = {
      async process(subscription, messageId, run) {
        const key = `${subscription}:${messageId}`;
        if (processed.has(key)) return { duplicate: true };
        const value = await run('tx');
        processed.add(key);
        return { duplicate: false, value };
      },
    };
    const service = create(memory);
    service.registerInbox(inbox);
    const calls: { attempt: number; transaction: unknown }[] = [];
    service
      .subscription('erp', { inbox: true })
      .consume((_message, context) => {
        calls.push({
          attempt: context.attempt,
          transaction: context.transaction,
        });
        return context.attempt === 1 ? retry() : undefined;
      });
    await service.setup();
    await service.publisher('erp').publish({ body: {}, messageId: 'same' });
    await waitFor(() => calls.length === 2);
    await service.publisher('erp').publish({ body: {}, messageId: 'same' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls).toEqual([
      { attempt: 1, transaction: 'tx' },
      { attempt: 2, transaction: 'tx' },
    ]);
    expect([...processed]).toEqual(['erp:same']);
  });
});

describe('inMemory backend', () => {
  it('logs handler failure context without the error or body', async () => {
    const warn = vi.fn();
    const inMemory = createInMemoryBroker();
    const service = createMessageBrokerService(memory, {
      appName: 'test',
      logger: { ...silentLogger, warn },
      inMemory,
    });
    services.push(service);
    service.subscription('orders').consume(() => {
      throw new Error(
        'https://example.invalid/file?sig=fixture-signature fixture-body',
      );
    });
    await service.setup();
    await service
      .publisher('orders')
      .publish({ body: 'fixture-body', messageId: 'order-event' });
    await waitFor(() => inMemory.deadLetters('orders').length === 1);
    expect(warn.mock.calls).toEqual(
      [1, 2, 3].map((attempt) => [
        {
          backend: 'memory',
          subscription: 'orders',
          messageId: 'order-event',
          attempt,
        },
        'Message broker handler failed.',
      ]),
    );
  });

  it('keeps a delayed retry due at its time and first in line across unsubscribe', async () => {
    vi.useFakeTimers();
    try {
      const service = create({
        default: 'memory',
        backends: {
          memory: {
            adapter: 'inMemory',
            subscriptions: { orders: { ordered: true } },
          },
        },
      });
      const handled: string[] = [];
      const handler = (message: BrokerMessage, { attempt }: HandlerContext) => {
        handled.push(`${message.messageId}#${attempt}`);
        return message.messageId === 'first' && attempt === 1
          ? retry({ delay: 60_000 })
          : undefined;
      };
      const stop = service.subscription('orders').consume(handler);
      await service.setup();
      const publisher = service.publisher('orders');
      await publisher.publish({ body: 1, messageId: 'first', key: 'k' });
      await vi.advanceTimersByTimeAsync(0);
      expect(handled).toEqual(['first#1']);
      await stop();
      await vi.advanceTimersByTimeAsync(10_000);
      service.subscription('orders').consume(handler);
      await publisher.publish({ body: 2, messageId: 'second', key: 'k' });
      // Consuming again neither retries early nor lets the next message of the key overtake the waiting one.
      await vi.advanceTimersByTimeAsync(49_999);
      expect(handled).toEqual(['first#1']);
      await vi.advanceTimersByTimeAsync(1);
      expect(handled).toEqual(['first#1', 'first#2', 'second#1']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('puts a retry that falls due while nothing consumes first in line for the next consumer', async () => {
    vi.useFakeTimers();
    try {
      const service = create({
        default: 'memory',
        backends: {
          memory: {
            adapter: 'inMemory',
            subscriptions: { orders: { ordered: true } },
          },
        },
      });
      const handled: string[] = [];
      const handler = (message: BrokerMessage, { attempt }: HandlerContext) => {
        handled.push(`${message.messageId}#${attempt}`);
        return message.messageId === 'first' && attempt === 1
          ? retry({ delay: 1000 })
          : undefined;
      };
      const stop = service.subscription('orders').consume(handler);
      await service.setup();
      const publisher = service.publisher('orders');
      await publisher.publish({ body: 1, messageId: 'first', key: 'k' });
      await vi.advanceTimersByTimeAsync(0);
      await stop();
      await publisher.publish({ body: 2, messageId: 'second', key: 'k' });
      await vi.advanceTimersByTimeAsync(5000);
      expect(handled).toEqual(['first#1']);
      service.subscription('orders').consume(handler);
      await vi.advanceTimersByTimeAsync(0);
      expect(handled).toEqual(['first#1', 'first#2', 'second#1']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('delivers what was published even when the publisher reuses its Buffer', async () => {
    const service = create(memory);
    const received: string[] = [];
    // Requested but not consumed yet: the message waits in the subscription's queue.
    const subscription = service.subscription('raw', { codec: rawCodec });
    await service.setup();
    const body = Buffer.from('A');
    await service.publisher('raw', { codec: rawCodec }).publish({ body });
    body.write('B');
    subscription.consume((message) => {
      received.push(message.body.toString());
    });
    await waitFor(() => received.length === 1);
    expect(received).toEqual(['A']);
  });

  it('gives each subscription and each retry its own copy of the message', async () => {
    const service = create({
      default: 'memory',
      backends: {
        memory: {
          adapter: 'inMemory',
          subscriptions: {
            first: { topic: 'orders' },
            second: { topic: 'orders' },
          },
        },
      },
    });
    const seen: string[] = [];
    const consume = (name: string) =>
      service
        .subscription(name, { codec: rawCodec })
        .consume((message, { attempt }) => {
          seen.push(`${name}#${attempt}:${message.body.toString()}`);
          message.body.write('X');
          message.headers.tampered = 'yes';
          return name === 'first' && attempt === 1 ? retry() : undefined;
        });
    consume('first');
    consume('second');
    await service.setup();
    await service
      .publisher('orders', { codec: rawCodec })
      .publish({ body: Buffer.from('A') });
    await waitFor(() => seen.length === 3);
    expect(seen.sort()).toEqual(['first#1:A', 'first#2:A', 'second#1:A']);
  });
});
