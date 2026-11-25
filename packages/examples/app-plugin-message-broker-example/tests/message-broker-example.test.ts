import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MessageBrokerOutboxProvider } from '@nocobase/app-plugin-message-broker/server';
import {
  createAppPaths,
  type AppConfigAccessor,
} from '@nocobase/app-server/config';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  createInMemoryBroker,
  createMessageBrokerService,
  type MessageBrokerConfig,
} from '@nocobase/message-broker';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, expect, vi } from 'vitest';

import packageMetadata from '../package.json' with { type: 'json' };
import { MessageBrokerExampleProvider } from '../server/providers/message-broker-example.js';
import {
  CUSTOMER_ORDER_STATS,
  CUSTOMER_STATS_COLLECTION,
  messageBrokerExampleServiceToken,
  ORDER_EVENTS,
  ORDER_SHIPMENTS,
  orderPlacedMessageId,
  ORDERS_COLLECTION,
  PAYMENT_EVENTS,
  SHIPMENTS_COLLECTION,
  type CustomerStats,
  type Order,
  type OrderPlaced,
  type Shipment,
} from '../server/service.js';

const outboxPackage = '@nocobase/app-plugin-message-broker';

const test = createDatabaseTest({
  migrations: [
    {
      packageName: outboxPackage,
      directory: path.join(
        path.dirname(
          createRequire(import.meta.url).resolve(
            `${outboxPackage}/package.json`,
          ),
        ),
        'database/migrations',
      ),
    },
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../database/migrations', import.meta.url),
      ),
    },
  ],
});

/** The examples template's binding: both subscriptions receive every message published to `orderEvents`. */
const config: MessageBrokerConfig = {
  default: 'memory',
  backends: {
    memory: {
      adapter: 'inMemory',
      subscriptions: {
        [ORDER_SHIPMENTS]: { topic: ORDER_EVENTS },
        [CUSTOMER_ORDER_STATS]: { topic: ORDER_EVENTS },
      },
    },
  },
};

const silent = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const shutdowns: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const shutdown of shutdowns.splice(0).reverse()) await shutdown();
});

/** Composes what the application does: the broker, the outbox plugin's provider and the example's provider. */
async function start(database: DatabaseManager) {
  const inMemory = createInMemoryBroker();
  const broker = createMessageBrokerService(config, {
    appName: 'main',
    logger: silent,
    inMemory,
  });
  let nextId = 1;
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(messageBrokerServiceToken, broker);
  container.instance(idGeneratorToken, {
    generate: () => nextId++,
  } as never);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { get: () => undefined } as unknown as AppConfigAccessor,
    paths: createAppPaths({ rootDir: process.cwd() }),
    router: new Hono(),
    container,
  };
  const providers = [
    new MessageBrokerOutboxProvider(app),
    new MessageBrokerExampleProvider(app),
  ];
  for (const provider of providers) provider.register();
  for (const provider of providers) await provider.boot();
  await broker.setup();
  for (const provider of providers) await provider.start();
  shutdowns.push(async () => {
    for (const provider of [...providers].reverse()) await provider.shutdown();
    await broker.shutdown();
  });
  return {
    broker,
    inMemory,
    service: container.resolve(messageBrokerExampleServiceToken),
  };
}

function orders(database: DatabaseManager): Promise<Order[]> {
  return database.repository<Order>(ORDERS_COLLECTION).findMany({});
}

function shipments(database: DatabaseManager): Promise<Shipment[]> {
  return database.repository<Shipment>(SHIPMENTS_COLLECTION).findMany({});
}

async function stats(
  database: DatabaseManager,
  customer: string,
): Promise<{ orderCount: number; totalSpent: number } | undefined> {
  const row = await database
    .repository<CustomerStats>(CUSTOMER_STATS_COLLECTION)
    .findOne({ filter: { customer } });
  return row
    ? { orderCount: Number(row.orderCount), totalSpent: Number(row.totalSpent) }
    : undefined;
}

test('a committed order reaches both independent subscriptions, which update their tables', async ({
  database,
}) => {
  const { service } = await start(database);

  await service.placeOrder({ id: 'o-1', customer: 'acme', total: 1200 });

  await vi.waitFor(async () =>
    expect(await shipments(database)).toEqual([
      { orderId: 'o-1', customer: 'acme' },
    ]),
  );
  await vi.waitFor(async () =>
    expect(await stats(database, 'acme')).toEqual({
      orderCount: 1,
      totalSpent: 1200,
    }),
  );
});

test('a rolled-back business transaction leaves no order and publishes nothing', async ({
  database,
}) => {
  const { service } = await start(database);

  await expect(
    database.transaction(async (transaction) => {
      await service.placeOrder(
        { id: 'o-rolled-back', customer: 'acme', total: 500 },
        transaction,
      );
      throw new Error('payment authorization failed');
    }),
  ).rejects.toThrow('payment authorization failed');
  // A later order travels the same path; once it arrives, the rolled-back one would have arrived before it.
  await service.placeOrder({ id: 'o-2', customer: 'acme', total: 700 });

  await vi.waitFor(async () =>
    expect(await stats(database, 'acme')).toEqual({
      orderCount: 1,
      totalSpent: 700,
    }),
  );
  await vi.waitFor(async () =>
    expect(await shipments(database)).toEqual([
      { orderId: 'o-2', customer: 'acme' },
    ]),
  );
  expect((await orders(database)).map((order) => order.id)).toEqual(['o-2']);
});

test('a failing handler rolls back its writes and is retried; the other subscription runs once', async ({
  database,
}) => {
  const { service } = await start(database);
  const countOrder = service.countOrder.bind(service);
  // The first attempt writes its increment and then fails, as a crash after the write would.
  const counted = vi
    .spyOn(service, 'countOrder')
    .mockImplementationOnce(async (event, transaction) => {
      await countOrder(event, transaction);
      throw new Error('failed after writing');
    });
  const shipped = vi.spyOn(service, 'createShipment');

  await service.placeOrder({ id: 'o-1', customer: 'acme', total: 1200 });

  await vi.waitFor(() => expect(counted).toHaveBeenCalledTimes(2));
  // The failed attempt's increment was rolled back together with its inbox record.
  await vi.waitFor(async () =>
    expect(await stats(database, 'acme')).toEqual({
      orderCount: 1,
      totalSpent: 1200,
    }),
  );
  await vi.waitFor(async () =>
    expect(await shipments(database)).toHaveLength(1),
  );
  expect(shipped).toHaveBeenCalledTimes(1);
});

test('a redelivered order event does not count the order twice', async ({
  database,
}) => {
  const { broker, service } = await start(database);
  await service.placeOrder({ id: 'o-1', customer: 'acme', total: 1200 });
  await vi.waitFor(async () =>
    expect(await stats(database, 'acme')).toEqual({
      orderCount: 1,
      totalSpent: 1200,
    }),
  );

  // What the outbox does after a crash between the middleware's confirmation and marking the row sent.
  await broker.publisher<OrderPlaced>(ORDER_EVENTS).publish({
    body: { orderId: 'o-1', customer: 'acme', total: 1200 },
    messageId: orderPlacedMessageId('o-1'),
    key: 'o-1',
    type: 'order.placed',
  });
  await service.placeOrder({ id: 'o-2', customer: 'acme', total: 300 });

  // Each subscription handles its messages in order, so o-2 arrives after the repeated o-1.
  await vi.waitFor(async () =>
    expect(await stats(database, 'acme')).toEqual({
      orderCount: 2,
      totalSpent: 1500,
    }),
  );
  await vi.waitFor(async () =>
    expect(await shipments(database)).toHaveLength(2),
  );
});

test('an external payment marks its order paid once and dead-letters what it cannot apply', async ({
  database,
}) => {
  const { broker, inMemory, service } = await start(database);
  await service.placeOrder({ id: 'o-1', customer: 'acme', total: 1200 });
  const confirmed = vi.spyOn(service, 'confirmPayment');
  const payments = broker.publisher(PAYMENT_EVENTS);

  const payment = {
    body: { paymentId: 'p-1', orderId: 'o-1', amount: 1200 },
    messageId: 'payment:p-1',
    type: 'payment.succeeded',
  };
  await payments.publish(payment);
  await payments.publish(payment);
  await payments.publish({
    body: { paymentId: 'p-2', orderId: 'missing', amount: 1 },
    messageId: 'payment:p-2',
  });
  await payments.publish({ body: { paymentId: '' }, messageId: 'payment:bad' });

  await vi.waitFor(() =>
    expect(inMemory.deadLetters(PAYMENT_EVENTS)).toHaveLength(2),
  );
  expect(
    inMemory
      .deadLetters(PAYMENT_EVENTS)
      .map((letter) => letter.message.messageId),
  ).toEqual(['payment:p-2', 'payment:bad']);
  expect(inMemory.deadLetters(PAYMENT_EVENTS)[0]!.reason).toContain(
    'unknown order missing',
  );
  expect((await orders(database)).map((order) => order.status)).toEqual([
    'paid',
  ]);
  // The repeated payment was skipped by the inbox; the malformed one never reached the handler.
  expect(confirmed).toHaveBeenCalledTimes(2);
});
