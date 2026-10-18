import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { RedisOptions } from 'ioredis';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TxRunner } from '../server/kernel/tx.js';
import type { NativeUIChunk } from '../server/online-agent/native.js';
import {
  OnlineAgentUIStreams,
  type OnlineAgentRecoveryConfig,
} from '../server/online-agent/ui-streams.js';

// Keep the real resumable-stream engine and SDK framing in deterministic tests.
// Only Redis I/O is replaced; explicitly configured integration tests use the real client.
vi.mock('ioredis', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ioredis')>();
  const { EventEmitter } = await import('node:events');
  const values = new Map<string, string>();
  const clients = new Set<MemoryRedis>();
  class MemoryRedis extends EventEmitter {
    status = 'wait';
    subscriptions = new Set<string>();
    async connect() {
      this.status = 'ready';
      clients.add(this);
    }
    async ping() {
      return 'PONG';
    }
    async get(key: string) {
      return values.get(key) ?? null;
    }
    async set(key: string, value: string, ...options: unknown[]) {
      if (options.includes('NX') && values.has(key)) return null;
      values.set(key, value);
      return 'OK';
    }
    async incr(key: string) {
      const value = Number(values.get(key) ?? 0) + 1;
      values.set(key, String(value));
      return value;
    }
    async publish(key: string, value: string) {
      let count = 0;
      for (const client of clients) {
        if (!client.subscriptions.has(key)) continue;
        count++;
        client.emit('message', key, value);
      }
      return count;
    }
    async subscribe(key: string) {
      this.subscriptions.add(key);
      return this.subscriptions.size;
    }
    async unsubscribe(key: string) {
      this.subscriptions.delete(key);
      return this.subscriptions.size;
    }
    async eval(script: string, _count: number, key: string, owner: string) {
      if (values.get(key) !== owner) return 0;
      if (script.includes("redis.call('del'")) values.delete(key);
      return 1;
    }
    disconnect() {
      this.status = 'end';
      clients.delete(this);
    }
  }
  return {
    ...actual,
    Redis: function Redis(options: RedisOptions) {
      return options.host === 'pinned-unit'
        ? new MemoryRedis()
        : new actual.Redis(options);
    },
  };
});

const active: OnlineAgentUIStreams[] = [];
afterEach(async () => {
  await Promise.all(active.splice(0).map((streams) => streams.shutdown()));
});

function fixture(recovery?: OnlineAgentRecoveryConfig) {
  // Association storage is deliberately minimal: these tests own stream identity, not database provisioning.
  const row = { id: 'conversation', userId: 'alice', metadata: {} };
  const conn = {
    repository: () => ({
      findOne: async () => structuredClone(row),
      updateMany: async ({ values }: { values: Record<string, unknown> }) => {
        Object.assign(row, values);
        return { updatedCount: 1 };
      },
    }),
  } as unknown as DatabaseConnection;
  const tx: TxRunner = {
    read: () => conn,
    run: async (work) => work({ conn, emit: () => {} }),
  };
  const errors: unknown[] = [];
  const create = () => {
    const streams = new OnlineAgentUIStreams({
      tx,
      recovery,
      onError: (error) => errors.push(error),
    });
    active.push(streams);
    return streams;
  };
  return { streams: create(), create, row, errors };
}

async function collect(stream: ReadableStream<NativeUIChunk> | null) {
  expect(stream).not.toBeNull();
  const chunks: NativeUIChunk[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  return chunks;
}

it('does not attach a consumed local submission to the next producer', async () => {
  const { streams } = fixture();
  const previous = await streams.open(
    'alice',
    'conversation',
    'first',
    'native',
  );
  previous.write({ type: 'start', messageId: 'first' });
  await streams.close('conversation', previous);
  expect(
    await collect(await streams.receive('alice', 'conversation', previous)),
  ).toEqual([{ type: 'start', messageId: 'first' }]);
  const next = await streams.open('alice', 'conversation', 'second', 'native');
  next.write({ type: 'start', messageId: 'second' });
  expect(await streams.receive('alice', 'conversation', previous)).toBeNull();
  await streams.close('conversation', next);
  expect(
    await collect(await streams.receive('alice', 'conversation', next)),
  ).toEqual([{ type: 'start', messageId: 'second' }]);
});

function sharedIdentityTests(redis: RedisOptions) {
  const recovery = (): OnlineAgentRecoveryConfig => ({
    namespace: `pinned-streams:${randomUUID()}`,
    redis,
  });

  it.each(['native', 'runner'] as const)(
    'resumes a pinned %s submission after cancellation without changing execution',
    async (backend) => {
      const { streams, errors } = fixture(recovery());
      const channel = await streams.open(
        'alice',
        'conversation',
        'first',
        backend,
      );
      channel.write({ type: 'start', messageId: 'first' });
      const initial = (await streams.receive(
        'alice',
        'conversation',
        channel,
      ))!.getReader();
      expect((await initial.read()).value).toEqual({
        type: 'start',
        messageId: 'first',
      });
      await initial.cancel();

      const resumed = (await streams.receive(
        'alice',
        'conversation',
        channel,
      ))!.getReader();
      expect((await resumed.read()).value).toEqual({
        type: 'start',
        messageId: 'first',
      });
      channel.write({ type: 'finish' });
      channel.close();
      expect((await resumed.read()).value).toEqual({ type: 'finish' });
      expect((await resumed.read()).done).toBe(true);
      expect(errors).toEqual([]);
    },
  );

  it('rejects an old consumed submission while an unpinned read recovers the next producer', async () => {
    const { streams, create, errors } = fixture(recovery());
    const previous = await streams.open(
      'alice',
      'conversation',
      'first',
      'native',
    );
    previous.write({ type: 'start', messageId: 'first' });
    await streams.close('conversation', previous);
    expect(
      await collect(await streams.receive('alice', 'conversation', previous)),
    ).toEqual([{ type: 'start', messageId: 'first' }]);

    const next = await streams.open(
      'alice',
      'conversation',
      'second',
      'runner',
    );
    next.write({ type: 'start', messageId: 'second' });
    await expect(
      streams.receive('alice', 'conversation', previous),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    const remote = create();
    const current = (await remote.receive(
      'alice',
      'conversation',
    ))!.getReader();
    expect((await current.read()).value).toEqual({
      type: 'start',
      messageId: 'second',
    });
    next.write({ type: 'finish' });
    next.close();
    expect((await current.read()).value).toEqual({ type: 'finish' });
    expect((await current.read()).done).toBe(true);
    expect(errors).toEqual([]);
  });

  it('keeps a supplied channel pinned even when the conversation association is absent', async () => {
    const { streams, row } = fixture(recovery());
    const channel = await streams.open(
      'alice',
      'conversation',
      'first',
      'native',
    );
    channel.write({ type: 'start', messageId: 'first' });
    const initial = (await streams.receive(
      'alice',
      'conversation',
      channel,
    ))!.getReader();
    await initial.read();
    await initial.cancel();
    row.metadata = {};

    expect(await streams.receive('alice', 'conversation')).toBeNull();
    const pinned = (await streams.receive(
      'alice',
      'conversation',
      channel,
    ))!.getReader();
    expect((await pinned.read()).value).toEqual({
      type: 'start',
      messageId: 'first',
    });
    await pinned.cancel();
    await expect(streams.receive('bob', 'conversation')).rejects.toMatchObject({
      code: 'CONVERSATION_NOT_FOUND',
    });
  });

  it('returns only the original initial response when it is first claimed after a newer execution opens', async () => {
    const { streams } = fixture(recovery());
    const previous = await streams.open(
      'alice',
      'conversation',
      'first',
      'runner',
    );
    previous.write({ type: 'start', messageId: 'first' });
    await streams.close('conversation', previous);
    const next = await streams.open(
      'alice',
      'conversation',
      'second',
      'runner',
    );
    next.write({ type: 'start', messageId: 'second' });

    expect(
      await collect(await streams.receive('alice', 'conversation', previous)),
    ).toEqual([{ type: 'start', messageId: 'first' }]);
    await expect(
      streams.receive('alice', 'conversation', previous),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
}

describe('pinned submission streams with deterministic Redis I/O', () => {
  sharedIdentityTests({ host: 'pinned-unit' });
});

describe.skipIf(!process.env.PM481_REDIS_PORT)(
  'pinned submission streams with real Redis',
  () => {
    sharedIdentityTests({
      host: '127.0.0.1',
      port: Number(process.env.PM481_REDIS_PORT),
    });
  },
);
