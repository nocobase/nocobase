import type {
  GuardVerdict,
  JsonPrimitive,
  LifecycleActor,
  LifecycleRecord,
  MemoryRows,
  RecordId,
} from '@nocobase/lifecycle';

// A test fixture: it runs only on the memory store, through the `MemoryRows`
// handle a memory transaction hands out, and is not part of the published
// plugin. A real plugin keeps a second layer's rows in tables of its own,
// created by a migration and written through the transaction's Repository.
//
// What the hand-written second layers share: their rows, read and written
// through the transaction a transition or `runtime.transaction()` hands
// them, their refusals, and the services they are registered with. On
// `@nocobase/db` the same four operations would be `createOne`, `findOne`,
// `findMany` and a filtered `updateMany` on the transaction's connection.

/** A row of a second layer: an exchange, an agent run. */
export type Row = LifecycleRecord;

export type Match = Readonly<Record<string, JsonPrimitive>>;

export interface Rows {
  insert(
    collection: string,
    values: Readonly<Record<string, unknown>>,
  ): Promise<Row>;
  get(collection: string, id: RecordId): Promise<Row | undefined>;
  /** The rows whose fields equal `match`, oldest first. */
  find(collection: string, match: Match): Promise<Row[]>;
  /**
   * Writes `values` only while the row still matches `match`: the
   * serialization point between two answers to the same row.
   */
  update(
    collection: string,
    id: RecordId,
    match: Match,
    values: Readonly<Record<string, unknown>>,
  ): Promise<boolean>;
}

function matches(row: Row, match: Match): boolean {
  return Object.entries(match).every(([field, value]) =>
    value === null
      ? row[field] === null || row[field] === undefined
      : row[field] === value,
  );
}

/** The rows of a memory store's transaction. */
export function rowsOf(handle: unknown): Rows {
  const memory = handle as MemoryRows | undefined;
  if (!memory || typeof memory.insertRecord !== 'function')
    throw new Error(
      'The hand-written second layers need the transaction handle of a memory store.',
    );
  return {
    insert: (collection, values) =>
      Promise.resolve(memory.insertRecord(collection, values)),
    get: (collection, id) => Promise.resolve(memory.record(collection, id)),
    find: (collection, match) =>
      Promise.resolve(
        memory.records(collection).filter((row) => matches(row, match)),
      ),
    update: (collection, id, match, values) => {
      const current = memory.record(collection, id);
      if (!current || !matches(current, match)) return Promise.resolve(false);
      memory.patchRecord(collection, id, values);
      return Promise.resolve(true);
    },
  };
}

export type SecondLayerErrorCode =
  'NOT_FOUND' | 'STALE' | 'NOT_YOUR_TURN' | 'NOT_ASSIGNEE' | 'CONFLICT';

/**
 * A refusal of a second layer, such as an answer that is not the actor's
 * to give. Nothing is written when one is thrown, because each operation
 * runs in one transaction.
 */
export class SecondLayerError extends Error {
  public readonly code: SecondLayerErrorCode;

  public constructor(code: SecondLayerErrorCode, message: string) {
    super(message);
    this.name = 'SecondLayerError';
    this.code = code;
  }
}

/** Messages, keyed so a retried effect delivers each one once. */
export interface Outbox {
  send(to: string, subject: string, key: string): void | Promise<void>;
}

/** The services the hand-written layers' lifecycles are registered with. */
export interface SecondLayerServices {
  readonly outbox: Outbox;
}

export function isActor(
  actor: LifecycleActor,
  person: string,
  message: string,
): GuardVerdict {
  return actor.id === person || { code: 'notAllowed', message };
}

export function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
