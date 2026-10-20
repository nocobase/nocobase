import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createRealtimeClient, type RealtimeClient } from '../src/client.js';

const sockets: MockWebSocket[] = [];
const clients: RealtimeClient[] = [];
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  readyState = 0;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onerror?: () => void;
  onclose?: () => void;
  sent: Record<string, unknown>[] = [];
  constructor(readonly url: string) {
    sockets.push(this);
  }
  send(data: string): void {
    this.sent.push(JSON.parse(data) as Record<string, unknown>);
  }
  close(): void {
    this.readyState = 3;
  }
  open(): void {
    this.readyState = 1;
    this.onopen?.();
  }
  message(value: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(value) });
  }
  ack(request = this.sent.at(-1)!): void {
    this.message({
      type: 'subscribed',
      id: request.id,
      topic: request.topic,
      subscriptionId: `sub:${String(request.id)}`,
    });
  }
  event(topic = 'test:one'): void {
    this.message({
      type: 'event',
      topic,
      payload: 'changed',
      publishedAt: new Date().toISOString(),
    });
  }
}
function setup(
  options: Partial<Parameters<typeof createRealtimeClient>[0]> = {},
): RealtimeClient {
  const client = createRealtimeClient({
    resolveUrl: () => '/main/ws',
    ...options,
  });
  clients.push(client);
  return client;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { location: { href: 'https://example.com/main/' } });
  vi.stubGlobal('WebSocket', MockWebSocket);
});
afterEach(() => {
  for (const client of clients.splice(0)) client.close();
  sockets.length = 0;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('shares one lazy subscription and waits for acknowledgement before dispatching', () => {
  const client = setup();
  expect(client.state).toBe('idle');
  const onReady = vi.fn();
  const onEvent = vi.fn();
  const first = client.watch('test:one', { onReady, onEvent });
  const second = client.watch('test:one', { onEvent });
  const socket = sockets[0]!;
  socket.open();
  expect(socket.url).toBe('wss://example.com/main/ws');
  expect(socket.sent).toHaveLength(1);
  expect(first.state).toBe('subscribing');
  expect(client.connected).toBe(true);
  expect(client.ready).toBe(false);
  socket.event();
  expect(onEvent).not.toHaveBeenCalled();
  socket.ack();
  expect(client.ready).toBe(true);
  expect(onReady).toHaveBeenCalledOnce();
  socket.event();
  expect(onEvent).toHaveBeenCalledTimes(2);
  first.close();
  first.close();
  expect(socket.sent).toHaveLength(1);
  second.close();
  expect(socket.sent.at(-1)).toMatchObject({
    type: 'unsubscribe',
    topic: 'test:one',
  });
  expect(client.active).toBe(false);
});

it('correlates denied subscriptions without blocking other topics and supports retry', () => {
  const client = setup();
  const denied = client.watch('test:one');
  const ready = vi.fn();
  client.watch('test:two', { onReady: ready });
  const socket = sockets[0]!;
  socket.open();
  socket.message({
    type: 'error',
    id: socket.sent[0]?.id,
    code: 'FORBIDDEN',
    message: 'Denied',
  });
  socket.ack(socket.sent[1]);
  expect(denied.state).toBe('error');
  expect(denied.error?.code).toBe('FORBIDDEN');
  expect(ready).toHaveBeenCalledOnce();
  denied.retry();
  socket.ack();
  expect(denied.state).toBe('subscribed');
});

it('ignores delayed replies after release, retry and identity reconnect', () => {
  const client = setup();
  const old = client.watch('test:one');
  const socket = sockets[0]!;
  socket.open();
  const oldRequest = socket.sent[0]!;
  client.watch('test:two');
  old.close();
  const ready = vi.fn();
  const replacement = client.watch('test:one', { onReady: ready });
  socket.ack(oldRequest);
  expect(replacement.state).toBe('subscribing');
  socket.ack();
  expect(ready).toHaveBeenCalledOnce();
  client.reconnect();
  socket.ack();
  expect(replacement.state).toBe('pending');
  const next = sockets[1]!;
  next.open();
  next.ack(next.sent.find((message) => message.topic === 'test:one'));
  expect(ready).toHaveBeenCalledTimes(2);
});

it('stops dispatching an event when a listener changes the connection identity', () => {
  const client = setup();
  client.watch('test:one', {
    onEvent: vi.fn().mockImplementationOnce(() => client.reconnect()),
  });
  const onEvent = vi.fn();
  client.watch('test:one', { onEvent });
  const oldSocket = sockets[0]!;
  oldSocket.open();
  oldSocket.ack();
  oldSocket.event();
  expect(onEvent).not.toHaveBeenCalled();
  sockets[1]!.open();
  sockets[1]!.ack();
  oldSocket.event();
  expect(onEvent).not.toHaveBeenCalled();
  sockets[1]!.event();
  expect(onEvent).toHaveBeenCalledOnce();
});

it('does not report readiness from an acknowledgement invalidated by a state listener', () => {
  const client = setup();
  let reconnect = true;
  const onReady = vi.fn();
  const subscription = client.watch('test:one', {
    onReady,
    onStateChange(state) {
      if (state === 'subscribed' && reconnect) {
        reconnect = false;
        client.reconnect();
      }
    },
  });
  sockets[0]!.open();
  sockets[0]!.ack();
  expect(subscription.state).toBe('pending');
  expect(onReady).not.toHaveBeenCalled();
  sockets[1]!.open();
  sockets[1]!.ack();
  expect(onReady).toHaveBeenCalledOnce();
});

it('stops notifying open listeners after a reconnect and skips released watchers', () => {
  const client = setup();
  client.onOpen(vi.fn().mockImplementationOnce(() => client.reconnect()));
  const onOpen = vi.fn();
  client.onOpen(onOpen);
  client.watch('test:one', { onEvent: () => second.close() });
  const onEvent = vi.fn();
  const second = client.watch('test:one', { onEvent });
  sockets[0]!.open();
  expect(onOpen).not.toHaveBeenCalled();
  sockets[1]!.open();
  sockets[1]!.ack();
  expect(onOpen).toHaveBeenCalledOnce();
  sockets[1]!.event();
  expect(onEvent).not.toHaveBeenCalled();
});

it('times out pending subscriptions, cancels server work and rejects old acknowledgements', () => {
  const client = setup({ subscriptionTimeout: 100 });
  const subscription = client.watch('test:one');
  const socket = sockets[0]!;
  socket.open();
  const first = socket.sent[0]!;
  vi.advanceTimersByTime(100);
  expect(subscription.error?.code).toBe('SUBSCRIPTION_TIMEOUT');
  expect(socket.sent.at(-1)?.type).toBe('unsubscribe');
  subscription.retry();
  socket.ack(first);
  expect(subscription.state).toBe('subscribing');
  socket.ack();
  expect(subscription.state).toBe('subscribed');
});

it('uses correlated pongs, reconnects half-open sockets and restores acknowledged topics', () => {
  const client = setup({ pingInterval: 100, pongTimeout: 50 });
  const ready = vi.fn();
  client.watch('test:one', { onReady: ready });
  const socket = sockets[0]!;
  socket.open();
  socket.ack();
  vi.advanceTimersByTime(100);
  const ping = socket.sent.at(-1)!;
  expect(ping.type).toBe('ping');
  socket.message({ type: 'pong', id: ping.id });
  vi.advanceTimersByTime(100);
  socket.message({ type: 'pong', id: ping.id });
  vi.advanceTimersByTime(50);
  expect(socket.readyState).toBe(3);
  expect(client.state).toBe('reconnecting');
  vi.advanceTimersByTime(1000);
  sockets[1]!.open();
  sockets[1]!.ack();
  expect(ready).toHaveBeenCalledTimes(2);
});

it('isolates listener failures and reconnects after synchronous send failures', () => {
  const client = setup();
  const listenerError = vi.spyOn(console, 'error').mockImplementation(() => {});
  client.watch('test:one', {
    onEvent: () => {
      throw new Error('failed');
    },
  });
  const event = vi.fn();
  client.watch('test:one', { onEvent: event });
  const socket = sockets[0]!;
  socket.open();
  socket.ack();
  socket.event();
  expect(event).toHaveBeenCalledOnce();
  expect(listenerError).toHaveBeenCalledOnce();
  vi.spyOn(socket, 'send').mockImplementation(() => {
    throw new Error('closed');
  });
  client.watch('test:two');
  expect(client.state).toBe('reconnecting');
  client.close();
  vi.advanceTimersByTime(60_000);
  expect(sockets).toHaveLength(1);
});

it('does not reconnect a hidden tab solely because browser heartbeat timers were delayed', () => {
  const document = { visibilityState: 'visible' };
  vi.stubGlobal('document', document);
  const client = setup({ pingInterval: 100, pongTimeout: 50 });
  client.watch('test:one');
  sockets[0]!.open();
  sockets[0]!.ack();
  vi.advanceTimersByTime(100);
  document.visibilityState = 'hidden';
  vi.advanceTimersByTime(1000);
  expect(client.connected).toBe(true);
});

it('probes a visible tab without replacing a healthy socket and cleans up on close', () => {
  const document = Object.assign(new EventTarget(), {
    visibilityState: 'visible',
  });
  vi.stubGlobal('document', document);
  const client = setup();
  client.watch('test:one');
  sockets[0]!.open();
  sockets[0]!.ack();
  document.dispatchEvent(new Event('visibilitychange'));
  expect(sockets).toHaveLength(1);
  const ping = sockets[0]!.sent.at(-1)!;
  expect(ping.type).toBe('ping');
  sockets[0]!.message({ type: 'pong', id: ping.id });
  client.close();
  document.dispatchEvent(new Event('visibilitychange'));
  expect(sockets).toHaveLength(1);
});

it('recovers transient topic errors without interrupting other subscriptions', () => {
  const client = setup({ pingInterval: 0, subscriptionRetryInterval: 10 });
  const ready = vi.fn();
  const failed = client.watch('test:one', { onReady: ready });
  const healthy = vi.fn();
  client.watch('test:two', { onEvent: healthy });
  const socket = sockets[0]!;
  socket.open();
  const old = socket.sent[0]!;
  socket.ack(socket.sent[1]);
  socket.message({
    type: 'error',
    id: old.id,
    code: 'AUTHORIZATION_TIMEOUT',
    message: 'Timeout',
  });
  socket.event('test:two');
  expect(healthy).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(10);
  expect(failed.state).toBe('subscribing');
  socket.ack(old);
  expect(ready).not.toHaveBeenCalled();
  socket.ack();
  expect(failed.state).toBe('subscribed');
  expect(ready).toHaveBeenCalledOnce();
  expect(sockets).toHaveLength(1);
});

it('bounds automatic retries and allows an explicit retry after exhaustion', () => {
  const client = setup({
    pingInterval: 0,
    subscriptionRetries: 2,
    subscriptionRetryInterval: 10,
    subscriptionTimeout: 10,
  });
  const subscription = client.watch('test:one');
  const socket = sockets[0]!;
  socket.open();
  vi.advanceTimersByTime(1_000);
  expect(subscription.error?.code).toBe('SUBSCRIPTION_TIMEOUT');
  expect(
    socket.sent.filter((message) => message.type === 'subscribe'),
  ).toHaveLength(3);
  subscription.retry();
  socket.ack();
  expect(subscription.state).toBe('subscribed');
});

it.each(['FORBIDDEN', 'AUTHENTICATION_REQUIRED', 'TOPIC_NOT_FOUND'])(
  'does not automatically retry %s',
  (code) => {
    const client = setup({ pingInterval: 0 });
    client.watch('test:one');
    const socket = sockets[0]!;
    socket.open();
    socket.message({
      type: 'error',
      id: socket.sent[0]?.id,
      code,
      message: 'Denied',
    });
    vi.advanceTimersByTime(120_000);
    expect(
      socket.sent.filter((message) => message.type === 'subscribe'),
    ).toHaveLength(1);
  },
);

it('cancels transient retries when the last watcher leaves', () => {
  const client = setup({ pingInterval: 0 });
  const subscription = client.watch('test:one');
  const socket = sockets[0]!;
  socket.open();
  socket.message({
    type: 'error',
    id: socket.sent[0]?.id,
    code: 'AUTHORIZATION_TIMEOUT',
    message: 'Timeout',
  });
  subscription.close();
  vi.advanceTimersByTime(120_000);
  expect(
    socket.sent.filter((message) => message.type === 'subscribe'),
  ).toHaveLength(1);
  expect(sockets).toHaveLength(1);
});

it('reconnects and acknowledges again when the broker reports a missed-event window', async () => {
  const client = setup({ reconnectMaxInterval: 10 });
  const onReady = vi.fn();
  client.watch('test:one', { onReady });
  const first = sockets[0]!;
  first.open();
  first.ack();
  first.message({ type: 'resync' });
  expect(first.readyState).toBe(3);
  expect(client.ready).toBe(false);
  await vi.advanceTimersByTimeAsync(20);
  const second = sockets.at(-1)!;
  expect(second).not.toBe(first);
  second.open();
  expect(onReady).toHaveBeenCalledOnce();
  second.ack();
  expect(onReady).toHaveBeenCalledTimes(2);
});
