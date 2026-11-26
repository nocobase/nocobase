import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import { databaseManagerToken } from '@nocobase/db';
import type { BrokerMessage } from '@nocobase/message-broker';
import {
  CUSTOMER_STATS_COLLECTION,
  messageBrokerExampleServiceToken,
  SHIPMENTS_COLLECTION,
  type CustomerStats,
} from '@nocobase/app-plugin-message-broker-example/server';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});

test('the template composes an in-memory broker with the outbox and inbox', async ({
  app,
}) => {
  const broker = app.container.resolve(messageBrokerServiceToken);
  expect(app.config.get('messageBroker')).toEqual({
    default: 'memory',
    backends: {
      memory: {
        adapter: 'inMemory',
        subscriptions: {
          orderShipments: { topic: 'orderEvents' },
          customerOrderStats: { topic: 'orderEvents' },
        },
      },
    },
  });
  expect(broker.describe()).toMatchObject({
    default: 'memory',
    backends: [
      {
        name: 'memory',
        adapter: 'inMemory',
        registered: true,
        sharing: 'local',
      },
    ],
    outbox: true,
    inbox: true,
  });
});

test('a message published in a committed transaction reaches its subscriber; a rolled-back one does not', async ({
  app,
}) => {
  const broker = app.container.resolve(messageBrokerServiceToken);
  const database = app.container.resolve(databaseManagerToken);
  const received: BrokerMessage[] = [];
  const stop = broker
    .subscription('templateOrders', { inbox: true })
    .consume((message) => {
      received.push(message);
    });
  try {
    await expect(
      database.transaction(async (transaction) => {
        await broker
          .publisher('templateOrders')
          .publish(
            { body: { id: 'rolled-back' }, messageId: 'rolled-back' },
            { transaction },
          );
        throw new Error('business failure');
      }),
    ).rejects.toThrow('business failure');
    await database.transaction((transaction) =>
      broker
        .publisher('templateOrders')
        .publish(
          { body: { id: 'committed' }, messageId: 'committed' },
          { transaction },
        ),
    );
    await vi.waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toMatchObject({
      messageId: 'committed',
      body: { id: 'committed' },
    });
  } finally {
    await stop();
  }
});

test('the example plugin updates the tables of both subscriptions once for a committed order', async ({
  app,
}) => {
  const example = app.container.resolve(messageBrokerExampleServiceToken);
  const database = app.container.resolve(databaseManagerToken);
  await database.transaction((transaction) =>
    example.placeOrder(
      { id: 'template-order', customer: 'template-customer', total: 10 },
      transaction,
    ),
  );
  await vi.waitFor(async () =>
    expect(
      await database.repository(SHIPMENTS_COLLECTION).findMany({}),
    ).toEqual([{ orderId: 'template-order', customer: 'template-customer' }]),
  );
  await vi.waitFor(async () =>
    expect(
      await database
        .repository<CustomerStats>(CUSTOMER_STATS_COLLECTION)
        .findOne({ filter: { customer: 'template-customer' } }),
    ).toMatchObject({ orderCount: 1, totalSpent: 10 }),
  );
});
