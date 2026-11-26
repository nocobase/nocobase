import { fileURLToPath } from 'node:url';

import { createDatabaseTest } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import {
  createMessageBrokerService,
  type BrokerMessage,
  type MessageBrokerLogger,
  type MessageBrokerService,
} from '@nocobase/message-broker';
import { afterEach, expect, vi } from 'vitest';

import {
  backoff,
  lazyExclusion,
  OutboxRelay,
  type RelayExclusion,
} from '../../server/relay.js';
import {
  INBOX_COLLECTION,
  MAX_OUTBOX_BODY_BYTES,
  MessageBrokerStore,
  OUTBOX_COLLECTION,
  type OutboxRow,
} from '../../server/store.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const test = createDatabaseTest({
  migrations: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
});

const silent: MessageBrokerLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

let nextId = 1;
const cleanups: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** Lets one round run at a time, the way the concurrency plugin's lock does across instances. */
function sharedExclusion(): RelayExclusion {
  let held = false;
  return async (tick) => {
    if (held) return false;
    held = true;
    try {
      await tick();
      return true;
    } finally {
      held = false;
    }
  };
}

interface Instance {
  readonly broker: MessageBrokerService;
  readonly relay: OutboxRelay;
  readonly store: MessageBrokerStore;
  readonly received: BrokerMessage[];
}

/** One application instance: its own broker service, store and relay on the shared database. */
async function instance(
  database: DatabaseManager,
  options: {
    exclusive?: RelayExclusion;
    publish?: (message: BrokerMessage) => void;
    onCommitted?: boolean;
    now?: () => number;
  } = {},
): Promise<Instance> {
  const broker = createMessageBrokerService(
    { default: 'memory', backends: { memory: { adapter: 'inMemory' } } },
    { appName: 'test', logger: silent },
  );
  const received: BrokerMessage[] = [];
  const relay = new OutboxRelay({
    database: () => database,
    broker: () => broker,
    exclusive: options.exclusive ?? sharedExclusion(),
    logger: silent,
    pollInterval: 60_000,
    outboxRetention: 1000,
    inboxRetention: 1000,
    ...(options.now ? { now: options.now } : {}),
  });
  const store = new MessageBrokerStore({
    database: () => database,
    generateId: () => nextId++,
    onCommitted: () => {
      if (options.onCommitted !== false) relay.kick();
    },
    ...(options.now ? { now: options.now } : {}),
  });
  broker.registerOutbox(store);
  broker.registerInbox(store);
  broker.subscription('orders').consume((message) => {
    options.publish?.(message);
    received.push(message);
  });
  await broker.setup();
  cleanups.push(async () => {
    await relay.stop();
    await broker.shutdown();
  });
  return { broker, relay, store, received };
}

function rows(database: DatabaseManager): Promise<OutboxRow[]> {
  return database
    .repository<OutboxRow>(OUTBOX_COLLECTION)
    .findMany({ sort: (sort) => sort.field('id').asc() });
}

test('a rolled-back transaction sends nothing', async ({ database }) => {
  const { broker, relay, received } = await instance(database);
  relay.start();
  await expect(
    database.transaction(async (transaction) => {
      await broker
        .publisher('orders')
        .publish({ body: { id: 1 } }, { transaction });
      throw new Error('business failure');
    }),
  ).rejects.toThrow('business failure');
  await relay.round();
  expect(await rows(database)).toEqual([]);
  expect(received).toEqual([]);
});

test('a committed message is sent once the transaction commits and is marked sent', async ({
  database,
}) => {
  const { broker, relay, received } = await instance(database);
  relay.start();
  const receipt = await database.transaction((transaction) =>
    broker.publisher('orders').publish(
      {
        body: { id: 2 },
        messageId: 'order-2',
        key: 'o-2',
        headers: { tenant: 'acme' },
        type: 'order.created',
      },
      { transaction },
    ),
  );
  expect(receipt).toEqual({ messageId: 'order-2', deferred: true });
  await vi.waitFor(() => expect(received).toHaveLength(1));
  expect(received[0]).toMatchObject({
    body: { id: 2 },
    messageId: 'order-2',
    key: 'o-2',
    headers: { tenant: 'acme' },
    type: 'order.created',
    contentType: 'application/json',
  });
  await relay.idle();
  const [row] = await rows(database);
  expect(row!.sentAt).not.toBeNull();
  expect(Number(row!.attempts)).toBe(0);
});

test('a message committed before a crash is sent by the next process', async ({
  database,
}) => {
  // The first process commits and dies before its relay ran.
  const crashed = await instance(database, { onCommitted: false });
  await database.transaction((transaction) =>
    crashed.broker
      .publisher('orders')
      .publish({ body: { id: 3 }, messageId: 'order-3' }, { transaction }),
  );
  await crashed.broker.shutdown();
  expect((await rows(database))[0]!.sentAt).toBeNull();

  const restarted = await instance(database);
  restarted.relay.start();
  await vi.waitFor(() => expect(restarted.received).toHaveLength(1));
  expect(restarted.received[0]!.messageId).toBe('order-3');
});

test('two instances relaying the same outbox send each message once', async ({
  database,
}) => {
  const exclusive = sharedExclusion();
  const deliveries: string[] = [];
  const first = await instance(database, {
    exclusive,
    onCommitted: false,
    publish: (message) => deliveries.push(message.messageId),
  });
  const second = await instance(database, {
    exclusive,
    onCommitted: false,
    publish: (message) => deliveries.push(message.messageId),
  });
  await database.transaction(async (transaction) => {
    for (let index = 0; index < 20; index += 1) {
      await first.broker
        .publisher('orders')
        .publish({ body: { index }, messageId: `m-${index}` }, { transaction });
    }
  });
  first.relay.start();
  second.relay.start();
  for (let round = 0; round < 5; round += 1) {
    first.relay.kick();
    second.relay.kick();
    await Promise.all([first.relay.idle(), second.relay.idle()]);
  }
  await vi.waitFor(() => expect(deliveries).toHaveLength(20));
  expect(new Set(deliveries).size).toBe(20);
  expect((await rows(database)).every((row) => row.sentAt !== null)).toBe(true);
});

test('a failed send is retried with backoff and keeps the error', async ({
  database,
}) => {
  let clock = 1_000_000;
  const { broker, relay, received } = await instance(database, {
    onCommitted: false,
    now: () => clock,
  });
  await database.transaction((transaction) =>
    broker
      .publisher('orders')
      .publish({ body: {}, messageId: 'stuck' }, { transaction }),
  );
  await database.transaction((transaction) =>
    broker
      .publisher('orders')
      .publish({ body: {}, messageId: 'fine' }, { transaction }),
  );
  // Break the first message's publisher so that its send fails.
  const original = broker.publishEncoded.bind(broker);
  let failing = true;
  broker.publishEncoded = (publisher, message) =>
    failing && message.messageId === 'stuck'
      ? Promise.reject(new Error('middleware unavailable'))
      : original(publisher, message);
  await relay.round();
  const [firstStuck, fine] = await rows(database);
  let stuck = firstStuck;
  expect(stuck).toMatchObject({
    lastError: 'middleware unavailable',
    sentAt: null,
  });
  expect(Number(stuck!.attempts)).toBe(1);
  expect(Number(stuck!.nextAttemptAt)).toBe(clock + backoff(1));
  expect(fine!.sentAt).not.toBeNull();

  // Not due yet: nothing is retried.
  await relay.round();
  expect(Number((await rows(database))[0]!.attempts)).toBe(1);

  failing = false;
  clock += backoff(1);
  await relay.round();
  [stuck] = await rows(database);
  expect(stuck!.sentAt).not.toBeNull();
  await vi.waitFor(() =>
    expect(received.map((message) => message.messageId).sort()).toEqual([
      'fine',
      'stuck',
    ]),
  );
});

test('an inbox skips a repeated messageId and forgets one whose handler failed', async ({
  database,
}) => {
  const { store } = await instance(database);
  const handled: string[] = [];
  await expect(
    store.process('erp', 'a', () =>
      Promise.reject(new Error('handler failed')),
    ),
  ).rejects.toThrow('handler failed');
  expect(
    await store.process('erp', 'a', () => {
      handled.push('a');
      return Promise.resolve('done');
    }),
  ).toEqual({ duplicate: false, value: 'done' });
  expect(
    await store.process('erp', 'a', () => {
      handled.push('again');
      return Promise.resolve('done');
    }),
  ).toEqual({ duplicate: true });
  // Another subscription has its own record of the same message.
  expect(
    await store.process('billing', 'a', () => Promise.resolve('billed')),
  ).toEqual({ duplicate: false, value: 'billed' });
  expect(handled).toEqual(['a']);
});

test('cleanup removes sent outbox rows and inbox rows past their retention', async ({
  database,
}) => {
  let clock = 5_000_000;
  const { broker, relay, store } = await instance(database, {
    onCommitted: false,
    now: () => clock,
  });
  await database.transaction((transaction) =>
    broker.publisher('orders').publish({ body: {} }, { transaction }),
  );
  await store.process('erp', 'old', () => Promise.resolve());
  await relay.round();
  expect(await rows(database)).toHaveLength(1);
  clock += 60 * 60 * 1000;
  await relay.round();
  expect(await rows(database)).toEqual([]);
  expect(await database.repository(INBOX_COLLECTION).count()).toBe(0);
});

test('the outbox refuses a transaction on another connection', async ({
  database,
}) => {
  const { store } = await instance(database);
  const foreign = {
    name: 'reporting',
    repository: () => undefined,
    afterCommit: () => undefined,
  };
  await expect(
    store.enqueue(foreign as never, 'orders', {
      body: Buffer.from('{}'),
      headers: {},
      messageId: 'x',
      timestamp: new Date(),
    }),
  ).rejects.toThrow('publish inside a transaction on it');
});

test('the outbox refuses a body larger than every dialect stores', async ({
  database,
}) => {
  const { broker } = await instance(database);
  await expect(
    database.transaction((transaction) =>
      broker
        .publisher('orders')
        .publish(
          { body: 'x'.repeat(MAX_OUTBOX_BODY_BYTES), messageId: 'large' },
          { transaction },
        ),
    ),
  ).rejects.toThrow('the outbox stores bodies of up to 65535 bytes');
  expect(await rows(database)).toEqual([]);
});

test('the outbox refuses a connection outside a transaction, so a rollback leaves nothing behind', async ({
  database,
}) => {
  const { broker } = await instance(database);
  await expect(
    database.transaction(async () => {
      await broker
        .publisher('orders')
        .publish(
          { body: {}, messageId: 'root' },
          { transaction: database.connection() },
        );
      throw new Error('business failure');
    }),
  ).rejects.toThrow('not inside a transaction');
  expect(await rows(database)).toEqual([]);
});

test('an idle poll takes no lock and cleanup still runs on schedule', async ({
  database,
}) => {
  let clock = 5_000_000;
  const locked: number[] = [];
  const shared = sharedExclusion();
  const { relay, store } = await instance(database, {
    onCommitted: false,
    now: () => clock,
    exclusive: (tick) => {
      locked.push(clock);
      return shared(tick);
    },
  });
  await store.process('erp', 'old', () => Promise.resolve());
  // The first round cleans up; the polls after it find nothing to send and lock nothing.
  await relay.round();
  expect(locked).toEqual([clock]);
  clock += 1000;
  await relay.round();
  await relay.round();
  expect(locked).toHaveLength(1);
  expect(await database.repository(INBOX_COLLECTION).count()).toBe(1);

  clock += 60 * 60 * 1000;
  await relay.round();
  expect(locked).toHaveLength(2);
  expect(await database.repository(INBOX_COLLECTION).count()).toBe(0);
});

test('a lock that failed to start is created again at the next round', async () => {
  let attempts = 0;
  const exclusive = lazyExclusion(() => {
    attempts += 1;
    return attempts === 1
      ? Promise.reject(new Error('lock backend unavailable'))
      : Promise.resolve(async (tick) => {
          await tick();
          return true;
        });
  });
  const ran: number[] = [];
  await expect(
    exclusive(() => Promise.resolve(void ran.push(1))),
  ).rejects.toThrow('lock backend unavailable');
  expect(await exclusive(() => Promise.resolve(void ran.push(2)))).toBe(true);
  expect(await exclusive(() => Promise.resolve(void ran.push(3)))).toBe(true);
  expect(ran).toEqual([2, 3]);
  expect(attempts).toBe(2);
});
