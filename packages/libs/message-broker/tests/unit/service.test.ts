import { afterEach, describe, expect, it } from 'vitest';

import {
  createInMemoryBroker,
  createMessageBrokerService,
  MissingTopologyError,
  retry,
  UnsupportedCapabilityError,
  validateMessageBrokerConfig,
  type BrokerTransaction,
  type EncodedMessage,
  type MessageBrokerConfig,
  type MessageBrokerService,
  type MessageInbox,
  type MessageOutbox,
} from '@nocobase/message-broker';

import { silentLogger, waitFor } from '../contract/broker-contract.js';

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
    ['deadLetter', 'every subscription'],
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

  it('reports a retry delay the backend cannot honour and retries without it', async () => {
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
    service.registerImplementation(
      'limited',
      createInMemoryBroker({ capabilities: { delayedRetry: false } }),
    );
    const attempts: number[] = [];
    service.subscription('worker').consume((_message, { attempt }) => {
      attempts.push(attempt);
      return attempt === 1 ? retry({ delay: 60_000 }) : undefined;
    });
    await service.setup();
    await service.publisher('worker').publish({ body: {} });
    await waitFor(() => attempts.length === 2);
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
