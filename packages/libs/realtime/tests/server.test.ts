import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRealtimeService,
  type RealtimeService,
  type RealtimeTransport,
} from '../src/server/index.js';
import type { RealtimeServerMessage } from '../src/protocol.js';

const services: RealtimeService[] = [];
function service(
  options: Parameters<typeof createRealtimeService>[0] = {},
): RealtimeService {
  const result = createRealtimeService(options);
  services.push(result);
  return result;
}
function socket(): RealtimeTransport & {
  messages: RealtimeServerMessage[];
  bufferedAmount: number;
} {
  return {
    readyState: 1,
    bufferedAmount: 0,
    messages: [],
    send(data) {
      this.messages.push(JSON.parse(data) as RealtimeServerMessage);
    },
    close: vi.fn(),
  };
}
afterEach(async () => {
  await Promise.all(services.splice(0).map((instance) => instance.close()));
  vi.useRealTimers();
});

describe('authorized realtime service', () => {
  it('rejects undeclared topics and correlates subscription errors', async () => {
    const realtime = service();
    const ws = socket();
    const connection = realtime.connect(ws);
    await realtime.handleClientMessage(
      connection,
      JSON.stringify({
        type: 'subscribe',
        id: 'request-1',
        topic: 'missing:topic',
      }),
    );
    expect(ws.messages).toEqual([
      expect.objectContaining({
        type: 'error',
        id: 'request-1',
        code: 'TOPIC_NOT_FOUND',
      }),
    ]);
    await expect(realtime.publish('missing:topic', {})).rejects.toMatchObject({
      code: 'TOPIC_NOT_FOUND',
    });
    realtime.defineTopic('private:topic', { audience: 'user' });
    await realtime.handleClientMessage(
      connection,
      JSON.stringify({
        type: 'subscribe',
        id: 'request-2',
        topic: 'private:topic',
      }),
    );
    expect(ws.messages.at(-1)).toMatchObject({
      id: 'request-2',
      code: 'AUTHENTICATION_REQUIRED',
    });
  });

  it('routes personal events only to the authenticated recipient', async () => {
    const realtime = service();
    const topic = realtime.defineTopic<{ changed: boolean }, 'user'>(
      'test:inbox',
      { audience: 'user' },
    );
    const first = socket();
    const second = socket();
    await realtime.subscribe(
      realtime.connect(first, { principal: { userId: 'first' } }),
      topic.name,
    );
    await realtime.subscribe(
      realtime.connect(second, { principal: { userId: 'second' } }),
      topic.name,
    );
    expect(await topic.publishFor('first', { changed: true })).toMatchObject({
      eventId: expect.any(String),
      topic: topic.name,
    });
    expect(first.messages).toHaveLength(1);
    expect(second.messages).toEqual([]);
    await expect(realtime.publish(topic.name, {})).rejects.toMatchObject({
      code: 'USER_AUDIENCE_REQUIRED',
    });
  });

  it('checks resource access again on delivery and rejects overlapping definitions', async () => {
    const realtime = service();
    let allowed = true;
    const family = realtime.defineTopicFamily<
      { runId: string },
      { lastSeq: number }
    >('runs:{runId}', {
      audience: 'public',
      authenticated: true,
      authorize: ({ principal, params }) =>
        allowed && principal?.userId === 'owner' && params.runId === '42',
    });
    expect(() =>
      realtime.defineTopic('runs:42', { audience: 'public' }),
    ).toThrow(/overlap/);
    expect(() => family.topic({ runId: '42:events' })).toThrow();
    const ws = socket();
    const connection = realtime.connect(ws, { principal: { userId: 'owner' } });
    await realtime.subscribe(
      connection,
      family.topic({ runId: '42' }),
      'subscription-1',
    );
    await family.publish({ runId: '42' }, { lastSeq: 1 });
    allowed = false;
    await family.publish({ runId: '42' }, { lastSeq: 2 });
    expect(ws.messages).toEqual([
      expect.objectContaining({ type: 'event', payload: { lastSeq: 1 } }),
      expect.objectContaining({
        type: 'error',
        code: 'FORBIDDEN',
        id: 'subscription-1',
      }),
    ]);
    expect(realtime.subscriptionCount('runs:42')).toBe(0);
  });

  it.each(['unsubscribe', 'disconnect', 'close-topic'] as const)(
    'does not resurrect an authorizing subscription after %s',
    async (action) => {
      const realtime = service();
      const gate = Promise.withResolvers<boolean>();
      const topic = realtime.defineTopic('test:pending', {
        audience: 'public',
        authorize: () => gate.promise,
      });
      const ws = socket();
      const connection = realtime.connect(ws);
      const pending = realtime.handleClientMessage(
        connection,
        JSON.stringify({ type: 'subscribe', id: 'attempt', topic: topic.name }),
      );
      if (action === 'unsubscribe')
        realtime.unsubscribe(connection, { topic: topic.name });
      if (action === 'disconnect') realtime.disconnect(connection);
      if (action === 'close-topic') topic.close();
      gate.resolve(true);
      await pending;
      expect(
        ws.messages.filter((message) => message.type === 'subscribed'),
      ).toEqual([]);
      expect(realtime.diagnostics()).toMatchObject({
        subscriptions: 0,
        pendingSubscriptions: 0,
      });
    },
  );

  it('bounds pending subscriptions and authorization time', async () => {
    vi.useFakeTimers();
    const realtime = service({
      maxSubscriptionsPerConnection: 1,
      authorizationTimeoutMs: 50,
    });
    realtime.defineTopicFamily('pending:{id}', {
      audience: 'public',
      authorize: () => new Promise(() => undefined),
    });
    const connection = realtime.connect(socket());
    const pending = realtime.subscribe(connection, 'pending:first');
    const outcome = pending.catch((error: unknown) => error);
    await expect(
      realtime.subscribe(connection, 'pending:second'),
    ).rejects.toMatchObject({ code: 'TOO_MANY_SUBSCRIPTIONS' });
    await vi.advanceTimersByTimeAsync(51);
    expect(await outcome).toMatchObject({ code: 'AUTHORIZATION_TIMEOUT' });
    expect(realtime.diagnostics().pendingSubscriptions).toBe(0);
  });

  it('closes old handles without allowing them to publish through a replacement', async () => {
    const realtime = service();
    const old = realtime.defineTopic('test:lifecycle', { audience: 'public' });
    const ws = socket();
    await realtime.subscribe(realtime.connect(ws), old.name, 'request');
    old.close();
    const replacement = realtime.defineTopic('test:lifecycle', {
      audience: 'user',
    });
    old.close();
    await expect(old.publish({})).rejects.toMatchObject({
      code: 'TOPIC_CLOSED',
    });
    await expect(replacement.publishFor('owner', {})).resolves.toHaveProperty(
      'eventId',
    );
    expect(ws.messages).toEqual([
      expect.objectContaining({ type: 'unsubscribed', id: 'request' }),
    ]);
  });

  it('snapshots and validates payloads even when nobody is subscribed', async () => {
    const realtime = service();
    const topic = realtime.defineTopic<{ value: number }, 'public'>(
      'test:payload',
      { audience: 'public' },
    );
    await expect(topic.publish({ value: NaN })).rejects.toMatchObject({
      code: 'INVALID_PAYLOAD',
    });
    await expect(
      realtime.publish(topic.name, { value: 'x'.repeat(65_536) }),
    ).rejects.toMatchObject({ code: 'MESSAGE_TOO_LARGE' });
    const ws = socket();
    await realtime.subscribe(realtime.connect(ws), topic.name);
    const payload = { value: 1 };
    const publication = topic.publish(payload);
    payload.value = 2;
    await publication;
    expect(ws.messages[0]).toMatchObject({ payload: { value: 1 } });
  });

  it('isolates failed and slow connections from healthy recipients', async () => {
    const logger = { error: vi.fn() };
    const realtime = service({ logger, maxBufferedBytesPerConnection: 512 });
    const topic = realtime.defineTopic('test:delivery', { audience: 'public' });
    const failed = socket();
    const slow = socket();
    const healthy = socket();
    failed.send = () => {
      throw new Error('Transport failed');
    };
    slow.bufferedAmount = 512;
    for (const ws of [failed, slow, healthy])
      await realtime.subscribe(realtime.connect(ws), topic.name);
    await topic.publish({ changed: true });
    expect(healthy.messages).toHaveLength(1);
    expect(failed.close).toHaveBeenCalled();
    expect(slow.close).toHaveBeenCalled();
    expect(realtime.diagnostics().connections).toBe(1);
  });

  it('revalidates the original session before delivering and while idle', async () => {
    vi.useFakeTimers();
    const realtime = service({ sessionCheckIntervalMs: 50 });
    const topic = realtime.defineTopic('test:session', { audience: 'user' });
    let valid = true;
    const ws = socket();
    await realtime.subscribe(
      realtime.connect(ws, {
        principal: { userId: 'user', sessionId: 'session' },
        validatePrincipal: () => Promise.resolve(valid),
      }),
      topic.name,
    );
    valid = false;
    await vi.advanceTimersByTimeAsync(51);
    await topic.publishFor('user', {});
    expect(ws.messages).toEqual([]);
    expect(ws.close).toHaveBeenCalled();
    expect(realtime.diagnostics().connections).toBe(0);
  });

  it('does not share events between independent memory services', async () => {
    const first = service();
    const second = service();
    const topic = first.defineTopic('test:isolated', { audience: 'public' });
    second.defineTopic('test:isolated', { audience: 'public' });
    const ws = socket();
    await second.subscribe(second.connect(ws), topic.name);
    await topic.publish({ changed: true });
    expect(ws.messages).toEqual([]);
  });
});
