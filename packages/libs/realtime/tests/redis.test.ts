import { Redis } from 'ioredis';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createRedisRealtimeBroker,
  createRealtimeService,
  type RealtimeService,
} from '../src/server/index.js';

const services: RealtimeService[] = [];
const clients: Redis[] = [];
const port = Number(process.env.REALTIME_TEST_REDIS_PORT);
afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.close()));
  for (const client of clients.splice(0)) client.disconnect();
});
function setup(namespace: string) {
  const broker = createRedisRealtimeBroker({
    namespace,
    connection: { host: '127.0.0.1', port },
    onError: vi.fn(),
  });
  const service = createRealtimeService({ namespace, broker });
  services.push(service);
  return { service, broker };
}
function socket() {
  return {
    readyState: 1,
    send: vi.fn<(data: string) => void>(),
    close: vi.fn(),
  };
}

it.runIf(port > 0)(
  'fans out across services, isolates namespaces, deduplicates and revokes remote sessions',
  async () => {
    const namespace = `test-${crypto.randomUUID()}`;
    const first = setup(namespace);
    const second = setup(namespace);
    const isolated = setup(`${namespace}-other`);
    const publisher = first.service.defineTopic('test:distributed', {
      audience: 'user',
    });
    second.service.defineTopic('test:distributed', { audience: 'user' });
    isolated.service.defineTopic('test:distributed', { audience: 'user' });
    const remote = socket();
    const other = socket();
    await second.service.subscribe(
      second.service.connect(remote, {
        principal: { userId: 'owner', sessionId: 'session' },
      }),
      publisher.name,
    );
    await isolated.service.subscribe(
      isolated.service.connect(other, { principal: { userId: 'owner' } }),
      publisher.name,
    );
    expect(first.service.subscriptionCount(publisher.name)).toBe(0);
    await publisher.publishFor('owner', { changed: true });
    await vi.waitFor(() => expect(remote.send).toHaveBeenCalledOnce());
    expect(other.send).not.toHaveBeenCalled();
    const event = {
      eventId: crypto.randomUUID(),
      origin: 'test',
      namespace,
      topic: publisher.name,
      userId: 'owner',
      payload: { changed: true },
      publishedAt: new Date().toISOString(),
    };
    await first.broker.publish(event);
    await first.broker.publish(event);
    await vi.waitFor(() =>
      expect(second.service.diagnostics().duplicates).toBe(1),
    );
    expect(remote.send).toHaveBeenCalledTimes(2);
    // The publishing process can lack a topic that another process uses.
    const unrelated = second.service.defineTopic('test:worker-only', {
      audience: 'public',
    });
    await unrelated.publish({ changed: true });
    await expect(first.service.disconnectSession('session')).resolves.toBe(0);
    await vi.waitFor(() => expect(remote.close).toHaveBeenCalledOnce());
    expect(other.close).not.toHaveBeenCalled();
    const another = socket();
    second.service.connect(another, {
      principal: { userId: 'owner', sessionId: 'different' },
    });
    await first.service.disconnectUser('owner');
    await vi.waitFor(() => expect(another.close).toHaveBeenCalledOnce());
  },
);

it.runIf(port > 0)(
  'requests a new snapshot after Redis resubscription while browser sockets stay open',
  async () => {
    const { service } = setup(`test-${crypto.randomUUID()}`);
    const topic = service.defineTopic('test:recovery', { audience: 'public' });
    const ws = socket();
    await service.subscribe(service.connect(ws), topic.name);
    const admin = new Redis({ host: '127.0.0.1', port });
    clients.push(admin);
    await admin.client('KILL', 'TYPE', 'pubsub');
    await vi.waitFor(
      () =>
        expect(ws.send).toHaveBeenCalledWith(
          JSON.stringify({ type: 'resync' }),
        ),
      { timeout: 5_000 },
    );
    expect(ws.close).not.toHaveBeenCalled();
    await topic.publish({ afterRecovery: true });
    await vi.waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2));
    expect(service.diagnostics().brokerState).toBe('ready');
  },
);

it.runIf(port > 0)(
  'rejects an ambiguous publish timeout without automatically sending the event again',
  async () => {
    const namespace = `test-${crypto.randomUUID()}`;
    const broker = createRedisRealtimeBroker({
      namespace,
      connection: { host: '127.0.0.1', port, commandTimeout: 50 },
      onError: vi.fn(),
    });
    const service = createRealtimeService({ namespace, broker });
    services.push(service);
    const topic = service.defineTopic('test:ambiguous', { audience: 'public' });
    const ws = socket();
    await service.subscribe(service.connect(ws), topic.name);
    const admin = new Redis({ host: '127.0.0.1', port });
    clients.push(admin);
    await admin.client('PAUSE', 200, 'ALL');
    await expect(topic.publish({ changed: true })).rejects.toThrow(/timed out/);
    // Redis can process the original publication after the caller times out.
    await vi.waitFor(() => expect(ws.send).toHaveBeenCalledOnce(), {
      timeout: 2_000,
    });
    expect(service.diagnostics()).toMatchObject({
      publishFailures: 1,
      published: 0,
      received: 1,
    });
  },
);
