// A runtime holding the hand-written second layers' lifecycles on one memory
// store, with a fake clock and an outbox. Services are handed to each
// lifecycle as they are; the layers read and write their own rows through
// the transaction handle a transition or `runtime.transaction()` passes them.
import {
  LifecycleRuntime,
  MemoryLifecycleStore,
  type JsonObject,
  type Lifecycle,
  type LifecycleActor,
  type LifecycleRecord,
  type LifecycleTypes,
  type RecordId,
} from '@nocobase/lifecycle';
import { expect } from 'vitest';

import type { SecondLayerServices } from '../fixtures/second-layer/rows.js';

export interface SentMessage {
  readonly to: string;
  readonly subject: string;
  readonly key: string;
}

export interface HarnessOptions {
  readonly now?: string;
  readonly lifecycles: readonly Lifecycle<LifecycleTypes>[];
}

function actorOf(actor: string | LifecycleActor | undefined): LifecycleActor {
  if (actor === undefined) return { id: 'tester' };
  return typeof actor === 'string' ? { id: actor } : actor;
}

export function createHarness(options: HarnessOptions) {
  let clock = new Date(options.now ?? '2026-10-01T09:00:00Z').getTime();
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({
    store,
    clock: (): Date => new Date(clock),
  });
  const sent: SentMessage[] = [];
  const delivered = new Set<string>();
  const services: SecondLayerServices = {
    outbox: {
      send: (to, subject, key) => {
        if (delivered.has(key)) return;
        delivered.add(key);
        sent.push({ to, subject, key });
      },
    },
  };
  const collections = new Map<string, string>();
  for (const lifecycle of options.lifecycles) {
    collections.set(lifecycle.name, lifecycle.collection);
    runtime.register(lifecycle, { services: services as never });
  }
  const collectionOf = (lifecycle: string): string => {
    const collection = collections.get(lifecycle);
    if (!collection)
      throw new Error(`Lifecycle "${lifecycle}" is not in the harness.`);
    return collection;
  };

  const harness = {
    runtime,
    store,
    sent,
    advance: ({
      days = 0,
      hours = 0,
      minutes = 0,
    }: {
      days?: number;
      hours?: number;
      minutes?: number;
    }): void => {
      clock += days * 86_400_000 + hours * 3_600_000 + minutes * 60_000;
    },
    async create(
      lifecycle: string,
      values: Readonly<Record<string, unknown>>,
      actor?: string | LifecycleActor,
    ): Promise<LifecycleRecord> {
      const { record } = await runtime.create(lifecycle, values, {
        actor: actorOf(actor),
      });
      return harness.get(lifecycle, record.id);
    },
    async fire(
      lifecycle: string,
      id: RecordId,
      transition: string,
      input: JsonObject = {},
      actor?: string | LifecycleActor,
    ): Promise<LifecycleRecord> {
      await runtime.fire(lifecycle, id, transition, {
        actor: actorOf(actor),
        input,
      });
      return harness.get(lifecycle, id);
    },
    get(lifecycle: string, id: RecordId): LifecycleRecord {
      const record = store.record(collectionOf(lifecycle), id);
      if (!record) throw new Error(`No ${lifecycle} record "${String(id)}".`);
      return record;
    },
    async history(lifecycle: string, id: RecordId): Promise<string[]> {
      return (await runtime.history(lifecycle, id)).transitions.map(
        (entry) => entry.transition,
      );
    },
    async allowed(
      lifecycle: string,
      id: RecordId,
      actor: string | LifecycleActor,
    ): Promise<string[]> {
      return (await runtime.available(lifecycle, id, actorOf(actor)))
        .filter((transition) => transition.allowed)
        .map((transition) => transition.name);
    },
    messagesTo(person: string): string[] {
      return sent
        .filter((message) => message.to === person)
        .map((message) => message.subject);
    },
  };
  return harness;
}

export type Harness = ReturnType<typeof createHarness>;

export async function refusal(
  promise: Promise<unknown>,
): Promise<{ code: string; message: string }> {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(Error);
  return error as { code: string; message: string };
}
