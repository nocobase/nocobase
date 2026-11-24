import {
  createAppPaths,
  type AppConfigAccessor,
} from '@nocobase/app-server/config';
import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  createInMemoryBroker,
  createMessageBrokerService,
  type MessageInbox,
} from '@nocobase/message-broker';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MessageBrokerExampleProvider } from '../server/providers/message-broker-example.js';
import {
  messageBrokerExampleServiceToken,
  ORDER_EVENTS,
} from '../server/service.js';

const silent = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/** Remembers processed messages in memory, the way the plugin's inbox table does. */
function memoryInbox(): MessageInbox {
  const seen = new Set<string>();
  return {
    async process(subscription, messageId, run) {
      const id = `${subscription}\0${messageId}`;
      if (seen.has(id)) return { duplicate: true };
      const value = await run(undefined);
      seen.add(id);
      return { duplicate: false, value };
    },
  };
}

const shutdowns: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const shutdown of shutdowns.splice(0).reverse()) await shutdown();
});

async function start() {
  const inMemory = createInMemoryBroker();
  const broker = createMessageBrokerService(
    { default: 'memory', backends: { memory: { adapter: 'inMemory' } } },
    { appName: 'main', logger: silent, inMemory },
  );
  broker.registerInbox(memoryInbox());
  const container = new ServiceContainer();
  container.instance(messageBrokerServiceToken, broker);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { get: () => undefined } as unknown as AppConfigAccessor,
    paths: createAppPaths({ rootDir: process.cwd() }),
    router: new Hono(),
    container,
  };
  const provider = new MessageBrokerExampleProvider(app);
  provider.register();
  await provider.boot();
  await broker.setup();
  shutdowns.push(async () => {
    await provider.shutdown();
    await broker.shutdown();
  });
  return {
    broker,
    inMemory,
    service: container.resolve(messageBrokerExampleServiceToken),
  };
}

describe('message broker example plugin', () => {
  it('handles a published order once even when it is delivered twice', async () => {
    const { service } = await start();
    const order = { orderId: 'o-1', total: 42 };

    await expect(service.publishOrderPlaced(order)).resolves.toEqual({
      messageId: 'order-placed:o-1',
      deferred: false,
    });
    await vi.waitFor(() => expect(service.handled()).toEqual([order]));

    // A redelivery carries the same messageId; the inbox acknowledges it without running the handler.
    await service.publishOrderPlaced(order);
    await service.publishOrderPlaced({ orderId: 'o-2', total: 1 });
    await vi.waitFor(() => expect(service.handled()).toHaveLength(2));
    expect(service.handled()).toEqual([{ orderId: 'o-2', total: 1 }, order]);
  });

  it('dead-letters an order that does not match the schema', async () => {
    const { broker, inMemory, service } = await start();

    await broker
      .publisher(ORDER_EVENTS)
      .publish({ body: { orderId: '', total: -1 }, messageId: 'bad' });

    await vi.waitFor(() =>
      expect(inMemory.deadLetters(ORDER_EVENTS)).toHaveLength(1),
    );
    expect(inMemory.deadLetters(ORDER_EVENTS)[0]!.message.messageId).toBe(
      'bad',
    );
    expect(service.handled()).toEqual([]);
  });

  it('refuses a transactional publish when no outbox is registered', async () => {
    const { service } = await start();
    await expect(
      service.publishOrderPlaced(
        { orderId: 'o-3', total: 0 },
        { afterCommit: () => undefined },
      ),
    ).rejects.toThrow('outbox');
  });
});
