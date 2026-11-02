import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRealtimeService,
  type RealtimeServerMessage,
} from '@nocobase/app-server/realtime';
import { RealtimeExampleService } from '../server/demo-service.js';
import { COUNTER_TOPIC, PERSONAL_TOPIC } from '../shared/demo.js';

const dispose: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const close of dispose.splice(0)) await close();
});

async function setup(
  options: ConstructorParameters<typeof RealtimeExampleService>[1] = {},
) {
  const realtime = createRealtimeService();
  const demo = new RealtimeExampleService(realtime, options);
  await realtime.setup();
  dispose.push(async () => {
    demo.close();
    await realtime.close();
  });
  const connect = (userId: string) => {
    const messages: RealtimeServerMessage[] = [];
    const close = vi.fn();
    const connection = realtime.connect(
      {
        readyState: 1,
        send: (value) =>
          messages.push(JSON.parse(value) as RealtimeServerMessage),
        close,
      },
      { principal: { userId } },
    );
    return { connection, messages, close };
  };
  return { realtime, demo, connect };
}

describe('isolated realtime demonstrations', () => {
  it('delivers personal events to every local tab of the owner and no other account', async () => {
    const { realtime, demo, connect } = await setup();
    const first = connect('alice');
    const second = connect('alice');
    const other = connect('bob');
    for (const tab of [first, second, other])
      await realtime.subscribe(tab.connection, PERSONAL_TOPIC);
    const receipt = await demo.sendPersonal('alice');
    await realtime.flush();
    expect(receipt).toMatchObject({
      topic: PERSONAL_TOPIC,
      eventId: expect.any(String),
    });
    for (const tab of [first, second])
      expect(tab.messages.filter((m) => m.type === 'event')).toHaveLength(1);
    expect(other.messages.filter((m) => m.type === 'event')).toHaveLength(0);
    expect(demo.personal('alice').value).toBe(1);
    expect(demo.personal('bob').value).toBe(0);
  });

  it('uses the same room policy for HTTP reads, publication and live delivery, including revocation', async () => {
    const { realtime, demo, connect } = await setup();
    const { room } = demo.state('alice');
    const topic = `realtime-example:rooms:${room.id}`;
    const alice = connect('alice');
    const bob = connect('bob');
    await expect(
      realtime.subscribe(alice.connection, topic, 'denied'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(() => demo.readRoom('alice', room.id)).toThrow('ROOM_FORBIDDEN');
    await expect(demo.setAccess('bob', room.id, true)).rejects.toThrow(
      'ROOM_NOT_FOUND',
    );
    await demo.setAccess('alice', room.id, true);
    await expect(
      realtime.subscribe(bob.connection, topic),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await realtime.subscribe(alice.connection, topic, 'allowed');
    await demo.sendRoom('alice', room.id);
    await realtime.flush();
    expect(demo.readRoom('alice', room.id).value).toBe(1);
    await demo.setAccess('alice', room.id, false);
    await realtime.flush();
    expect(alice.messages.filter((m) => m.type === 'event')).toHaveLength(1);
    expect(alice.messages).toContainEqual(
      expect.objectContaining({
        type: 'error',
        code: 'FORBIDDEN',
        id: 'allowed',
      }),
    );
    expect(alice.connection.subscriptions.size).toBe(0);
    await expect(demo.sendRoom('alice', room.id)).rejects.toThrow(
      'ROOM_FORBIDDEN',
    );
    await demo.setAccess('alice', room.id, true);
    await realtime.subscribe(alice.connection, topic, 'retry');
    await demo.sendRoom('alice', room.id);
    await realtime.flush();
    expect(demo.readRoom('alice', room.id).value).toBe(2);
  });

  it('retains a snapshot when events are missed and disconnects only the current account', async () => {
    const { realtime, demo, connect } = await setup();
    const alice = connect('alice');
    const bob = connect('bob');
    await realtime.subscribe(alice.connection, COUNTER_TOPIC);
    await demo.burst('alice', 5);
    await realtime.flush();
    expect(alice.messages.filter((m) => m.type === 'event')).toHaveLength(5);
    expect(await demo.disconnect('alice')).toBe(1);
    expect(alice.close).toHaveBeenCalledOnce();
    expect(bob.close).not.toHaveBeenCalled();
    await demo.burst('alice', 5);
    await realtime.flush();
    expect(demo.counter('alice').value).toBe(10);
    expect(demo.counter('bob').value).toBe(0);
  });

  it('bounds transient state and expires the former room before allocating a replacement', async () => {
    let now = 0;
    const { demo } = await setup({
      now: () => now,
      maxAccounts: 1,
      idleMs: 100,
    });
    const first = demo.state('alice');
    await demo.setAccess('alice', first.room.id, true);
    expect(() => demo.state('bob')).toThrow('DEMO_CAPACITY');
    now = 100;
    expect(demo.canReadRoom('alice', first.room.id)).toBe(false);
    expect(() => demo.readRoom('alice', first.room.id)).toThrow(
      'ROOM_NOT_FOUND',
    );
    const replacement = demo.state('alice');
    expect(replacement.room.id).not.toBe(first.room.id);
    expect(replacement.room.allowed).toBe(false);
  });
});
