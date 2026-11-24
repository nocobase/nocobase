import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import {
  ack,
  rawCodec,
  reject,
  retry,
  type BrokerCapabilities,
  type BrokerMessage,
  type MessageBrokerBackendEntry,
  type MessageBrokerLogger,
  type MessageBrokerService,
  type StandardSchema,
  type SubscriptionBindingOptions,
} from '@nocobase/message-broker';

/**
 * The behavior every message broker backend shares, grouped by capability: `core` runs for every backend, each other
 * group only for a backend that declares its capability. A third-party backend runs it by calling
 * `defineMessageBrokerContract()` from its own test with a target for its middleware.
 */
export const messageBrokerContractVersion: number = 1;

export interface ContractBindings {
  /** Unique per test; derive physical names from it so that tests never share middleware resources. */
  readonly scope: string;
  /** Logical publisher name to the channel it sends on. */
  readonly publishers: Readonly<Record<string, string>>;
  /** Logical subscription name to the channel it receives from, with its common options. */
  readonly subscriptions: Readonly<
    Record<string, SubscriptionBindingOptions & { readonly channel: string }>
  >;
}

export interface ContractDeadLetter {
  readonly messageId: string;
  readonly reason: string;
}

export interface ContractService {
  readonly service: MessageBrokerService;
  /** Messages in the dead letter of a subscription. */
  deadLetters(subscription: string): Promise<readonly ContractDeadLetter[]>;
}

/** A backend the contract runs against. */
export interface MessageBrokerContractTarget {
  readonly name: string;
  readonly capabilities: BrokerCapabilities;
  /**
   * A backend entry serving the bindings. A channel is the backend's physical route: a topic, or an exchange with a
   * routing key and the queues bound to it. Create the physical resources here; the application never does.
   */
  entry(
    bindings: ContractBindings,
  ): MessageBrokerBackendEntry | Promise<MessageBrokerBackendEntry>;
  /** A backend entry whose publisher "missing" needs a resource the middleware lacks, and that resource's name. */
  missingTopology(scope: string):
    | { readonly entry: MessageBrokerBackendEntry; readonly resource: string }
    | Promise<{
        readonly entry: MessageBrokerBackendEntry;
        readonly resource: string;
      }>;
  /** Creates a service on `messageBroker: { default: 'contract', backends: { contract: entry } }`. */
  create(entry: MessageBrokerBackendEntry): ContractService;
}

export const silentLogger: MessageBrokerLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
): Promise<void> {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) {
      throw new Error('Timed out waiting for a condition.');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

const passOrders: StandardSchema<{ readonly orderId: string }> = {
  '~standard': {
    version: 1,
    vendor: 'contract',
    validate: (value) =>
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { orderId?: unknown }).orderId === 'string'
        ? { value: value as { orderId: string } }
        : { issues: [{ message: 'orderId must be a string' }] },
  },
};

export function defineMessageBrokerContract(
  target: MessageBrokerContractTarget,
): void {
  const running: MessageBrokerService[] = [];

  afterEach(async () => {
    await Promise.all(running.splice(0).map((service) => service.shutdown()));
  });

  async function start(
    publishers: Record<string, string>,
    subscriptions: Record<
      string,
      SubscriptionBindingOptions & { readonly channel: string }
    >,
  ): Promise<ContractService> {
    const scope = `contract-${randomUUID().slice(0, 8)}`;
    const created = target.create(
      await target.entry({ scope, publishers, subscriptions }),
    );
    running.push(created.service);
    return created;
  }

  describe(`message broker contract v${messageBrokerContractVersion}: ${target.name}`, () => {
    describe('core', () => {
      it('publishes and consumes by logical name, keeping every message field', async () => {
        const { service } = await start(
          { 'order-events': 'orders' },
          { 'erp-orders': { channel: 'orders' } },
        );
        const received: BrokerMessage[] = [];
        service.subscription('erp-orders').consume((message) => {
          received.push(message);
        });
        await service.setup();
        const timestamp = new Date('2026-01-02T03:04:05.000Z');
        const receipt = await service.publisher('order-events').publish({
          body: { orderId: 'o-1', total: 12.5 },
          headers: { tenant: 'acme' },
          messageId: 'm-1',
          key: 'o-1',
          correlationId: 'c-1',
          replyTo: 'replies',
          type: 'order.created',
          timestamp,
        });
        expect(receipt).toEqual({ messageId: 'm-1', deferred: false });
        await waitFor(() => received.length === 1);
        const [message] = received;
        expect(message).toMatchObject({
          body: { orderId: 'o-1', total: 12.5 },
          contentType: 'application/json',
          messageId: 'm-1',
          key: 'o-1',
          correlationId: 'c-1',
          replyTo: 'replies',
          type: 'order.created',
        });
        expect(message!.headers.tenant).toBe('acme');
        expect(message!.timestamp.getTime()).toBe(timestamp.getTime());
      });

      it('carries raw bytes with the raw codec', async () => {
        const { service } = await start(
          { files: 'blobs' },
          { archive: { channel: 'blobs' } },
        );
        const received: Buffer[] = [];
        service
          .subscription('archive', { codec: rawCodec })
          .consume((message) => {
            received.push(message.body);
          });
        await service.setup();
        const bytes = Buffer.from([0, 1, 2, 254, 255]);
        await service
          .publisher('files', { codec: rawCodec })
          .publish({ body: bytes, contentType: 'application/x-test' });
        await waitFor(() => received.length === 1);
        expect(received[0]!.equals(bytes)).toBe(true);
      });

      it('acknowledges a handler that returns and retries one that throws', async () => {
        const { service } = await start(
          { events: 'events' },
          { worker: { channel: 'events', maxAttempts: 3 } },
        );
        const attempts: number[] = [];
        let settled = 0;
        service.subscription('worker').consume((message, { attempt }) => {
          attempts.push(attempt);
          if ((message.body as { fail: boolean }).fail && attempt === 1) {
            throw new Error('temporary failure');
          }
          settled += 1;
          return ack();
        });
        await service.setup();
        await service.publisher('events').publish({ body: { fail: true } });
        await service.publisher('events').publish({ body: { fail: false } });
        await waitFor(() => settled === 2);
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(attempts.sort()).toEqual([1, 1, 2]);
      });

      it('fails setup naming the resource the middleware lacks', async () => {
        const scope = `contract-${randomUUID().slice(0, 8)}`;
        const { entry, resource } = await target.missingTopology(scope);
        const { service } = target.create(entry);
        running.push(service);
        service.publisher('missing');
        await expect(service.setup()).rejects.toThrow(resource);
      });
    });

    describe.runIf(target.capabilities.deadLetter)('deadLetter', () => {
      it('moves a rejected message to the dead letter without retrying it', async () => {
        const created = await start(
          { events: 'events' },
          { worker: { channel: 'events', maxAttempts: 5 } },
        );
        let calls = 0;
        created.service.subscription('worker').consume(() => {
          calls += 1;
          return reject('not for us');
        });
        await created.service.setup();
        await created.service
          .publisher('events')
          .publish({ body: {}, messageId: 'r-1' });
        await waitFor(
          async () => (await created.deadLetters('worker')).length === 1,
        );
        expect(calls).toBe(1);
        expect(await created.deadLetters('worker')).toEqual([
          expect.objectContaining({
            messageId: 'r-1',
            reason: expect.stringContaining('not for us'),
          }),
        ]);
      });

      it('moves a message to the dead letter after maxAttempts failures', async () => {
        const created = await start(
          { events: 'events' },
          { worker: { channel: 'events', maxAttempts: 2 } },
        );
        let calls = 0;
        created.service.subscription('worker').consume(() => {
          calls += 1;
          throw new Error('always fails');
        });
        await created.service.setup();
        await created.service
          .publisher('events')
          .publish({ body: {}, messageId: 'f-1' });
        await waitFor(
          async () => (await created.deadLetters('worker')).length === 1,
        );
        expect(calls).toBe(2);
        expect((await created.deadLetters('worker'))[0]!.reason).toContain(
          'always fails',
        );
      });

      it('moves a message that fails the schema to the dead letter without calling the handler', async () => {
        const created = await start(
          { events: 'events' },
          { worker: { channel: 'events' } },
        );
        const handled: unknown[] = [];
        created.service
          .subscription('worker', { schema: passOrders })
          .consume((message) => {
            handled.push(message.body);
          });
        await created.service.setup();
        await created.service
          .publisher('events')
          .publish({ body: { orderId: 1 }, messageId: 's-1' });
        await created.service
          .publisher('events')
          .publish({ body: { orderId: 'o-2' } });
        await waitFor(() => handled.length === 1);
        await waitFor(
          async () => (await created.deadLetters('worker')).length === 1,
        );
        expect(handled).toEqual([{ orderId: 'o-2' }]);
        expect((await created.deadLetters('worker'))[0]!.reason).toContain(
          'orderId must be a string',
        );
      });
    });

    describe.runIf(target.capabilities.delayedRetry)('delayedRetry', () => {
      it('redelivers after the delay a handler asks for', async () => {
        const { service } = await start(
          { events: 'events' },
          { worker: { channel: 'events' } },
        );
        const seen: number[] = [];
        service.subscription('worker').consume((_message, { attempt }) => {
          seen.push(Date.now());
          return attempt === 1 ? retry({ delay: 200 }) : ack();
        });
        await service.setup();
        await service.publisher('events').publish({ body: {} });
        await waitFor(() => seen.length === 2);
        expect(seen[1]! - seen[0]!).toBeGreaterThanOrEqual(190);
      });
    });

    describe.runIf(target.capabilities.perMessageAck)('perMessageAck', () => {
      it('handles several messages at once with concurrency above 1', async () => {
        const { service } = await start(
          { events: 'events' },
          { worker: { channel: 'events', concurrency: 2 } },
        );
        let active = 0;
        let peak = 0;
        let done = 0;
        service.subscription('worker').consume(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 100));
          active -= 1;
          done += 1;
        });
        await service.setup();
        await Promise.all(
          [1, 2, 3, 4].map(() =>
            service.publisher('events').publish({ body: {} }),
          ),
        );
        await waitFor(() => done === 4);
        expect(peak).toBe(2);
      });
    });

    describe.runIf(target.capabilities.orderedByKey)('orderedByKey', () => {
      it('keeps the order of messages with the same key, even across a retry', async () => {
        const { service } = await start(
          { events: 'events' },
          {
            worker: {
              channel: 'events',
              ordered: true,
              concurrency: 4,
              maxAttempts: 3,
            },
          },
        );
        const order: string[] = [];
        service.subscription('worker').consume(async (message, { attempt }) => {
          const { step } = message.body as { step: string };
          if (step === 'a1' && attempt === 1) throw new Error('retry a1');
          await new Promise((resolve) => setTimeout(resolve, 10));
          order.push(step);
        });
        await service.setup();
        for (const [key, step] of [
          ['a', 'a1'],
          ['a', 'a2'],
          ['b', 'b1'],
          ['a', 'a3'],
          ['b', 'b2'],
        ] as const) {
          await service.publisher('events').publish({ body: { step }, key });
        }
        await waitFor(() => order.length === 5);
        expect(order.filter((step) => step.startsWith('a'))).toEqual([
          'a1',
          'a2',
          'a3',
        ]);
        expect(order.filter((step) => step.startsWith('b'))).toEqual([
          'b1',
          'b2',
        ]);
      });
    });
  });
}
