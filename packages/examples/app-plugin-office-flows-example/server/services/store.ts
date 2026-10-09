import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import type {
  DatabaseConnection,
  DatabaseManager,
  Repository,
  Row,
} from '@nocobase/db';

import { personName } from '../../shared/people.js';
import {
  createWorkCalendar,
  type CalendarEntry,
  type WorkCalendar,
} from '../calendar.js';
import { COLLECTIONS } from '../scope.js';
import { text } from '../../shared/text.js';

export type TaskKind = 'clerk' | 'team' | 'executor';

/** The level a distribution row sends to, and what it creates there. */
export const LEVELS: Readonly<
  Record<
    1 | 2 | 3,
    {
      readonly kind: TaskKind;
      readonly collection: string;
      readonly prefix: string;
      readonly initial: string;
    }
  >
> = {
  1: {
    kind: 'clerk',
    collection: COLLECTIONS.clerkTasks,
    prefix: 'SWSQ_BSRY',
    initial: 'signing',
  },
  2: {
    kind: 'team',
    collection: COLLECTIONS.teamTasks,
    prefix: 'SWSQ_ZXTDCL',
    initial: 'processing',
  },
  3: {
    kind: 'executor',
    collection: COLLECTIONS.executorTasks,
    prefix: 'SWSQ_BSRY_ZB',
    initial: 'processing',
  },
};

export const TASK_COLLECTIONS: Readonly<Record<TaskKind, string>> = {
  clerk: COLLECTIONS.clerkTasks,
  team: COLLECTIONS.teamTasks,
  executor: COLLECTIONS.executorTasks,
};

export type Plain = Record<string, unknown>;

/** A bigInt filter takes a number; ids travel as strings. */
export function idOf(value: unknown): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id))
    throw new Error(`"${text(value)}" is not an id.`);
  return id;
}

export function plain(row: Row | undefined): Plain | undefined {
  if (!row) return undefined;
  const values: Plain = {};
  for (const [field, value] of Object.entries(row))
    values[field] = value instanceof Date ? value.toISOString() : value;
  return values;
}

export function people(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.startsWith('['))
    return (JSON.parse(value) as unknown[]).map(String);
  return [];
}

/** These errors confirm a deadlock victim's transaction was aborted. */
function isDeadlock(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (
      record.code === 'ER_LOCK_DEADLOCK' ||
      record.code === '40P01' ||
      record.number === 1205
    )
      return true;
    current = record.cause ?? record.originalError;
  }
  return false;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export interface NoticeInput {
  readonly rootKind: 'incoming' | 'dataRequest';
  readonly rootId: number;
  /** Each recipient is reminded once per root and level. */
  readonly level: string;
  readonly recipients: readonly string[];
  readonly message: string;
  readonly sourceKind: string;
  readonly sourceId: number;
}

export interface DispatchResult {
  readonly created: readonly {
    readonly kind: TaskKind;
    readonly id: number;
    readonly number: string;
    readonly departmentName: string;
  }[];
  readonly notified: readonly string[];
  readonly skipped: readonly string[];
}

/**
 * Database operations the lifecycles' guards and effects share. Each one is
 * safe to repeat: an effect may run more than once, so creating a task
 * claims its distribution row first and reminders go through a ledger with
 * a unique key.
 */
export class OfficeStore {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly clock: () => Date = (): Date => new Date(),
    private readonly connection: DatabaseConnection | undefined = undefined,
  ) {}

  /**
   * The same operations on one transaction's connection. Guards run inside
   * the transition's transaction and must read through it: SQLite has one
   * connection, and a read elsewhere would wait for it.
   */
  public bound(handle: unknown): OfficeStore {
    return handle === undefined
      ? this
      : new OfficeStore(
          this.database,
          this.clock,
          handle as DatabaseConnection,
        );
  }

  public repository(collection: string): Repository {
    return this.connection
      ? this.connection.repository(collection)
      : this.database.repository(collection);
  }

  private transaction<T>(
    work: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return this.connection
      ? work(this.connection)
      : this.database.transaction(work);
  }

  public now(): string {
    return this.clock().toISOString();
  }

  public async find(
    collection: string,
    id: unknown,
  ): Promise<Plain | undefined> {
    return plain(
      await this.repository(collection).findOne({ filter: { id: idOf(id) } }),
    );
  }

  public async list(
    collection: string,
    filter: Record<string, string | number | boolean | null>,
  ): Promise<Plain[]> {
    const rows = await this.repository(collection).findMany({
      filter,
      sort: (sort) => sort.field('id').asc(),
    });
    return rows.map((row) => plain(row)!);
  }

  /** `PREFIX-YYYYMM-0001`, numbered per prefix and month. */
  public async nextNumber(prefix: string): Promise<string> {
    const period = this.now().slice(0, 7).replace('-', '');
    const key = `${prefix}-${period}`;
    // The value the upsert itself wrote: a separate read could see another
    // caller's increment and hand out the same number twice.
    for (let attempt = 0; ; attempt++) {
      try {
        const { record } = await this.repository(COLLECTIONS.serials).upsertOne(
          {
            filter: { key },
            create: { key, value: 1 },
            update: { value: (value) => value.increment(1) },
          },
        );
        return `${key}-${text(Number(record.value)).padStart(4, '0')}`;
      } catch (error) {
        // A new counter can deadlock with another insert. Retry only the
        // implicit transaction we own, never part of a caller's aborted
        // transaction or an error with an unknown commit outcome.
        if (this.connection || attempt >= 5 || !isDeadlock(error)) throw error;
        await delay(5 * 2 ** attempt + Math.floor(Math.random() * 5));
      }
    }
  }

  public async calendar(): Promise<WorkCalendar> {
    const rows = await this.repository(COLLECTIONS.holidays).findMany({});
    return createWorkCalendar(
      rows.map((row) => ({
        date: text(row.date),
        kind: row.kind === 'workday' ? 'workday' : 'holiday',
      })) satisfies CalendarEntry[],
    );
  }

  /** Extraction tasks of a request, by status. Voided tasks never count. */
  public async countExtractions(
    requestId: unknown,
    statuses: readonly string[],
  ): Promise<number> {
    return this.repository(COLLECTIONS.extractions).count({
      filter: (filter) =>
        filter.and([
          filter.number('requestId').eq(idOf(requestId)),
          filter.or(
            statuses.map((status) => filter.string('status').eq(status)),
          ),
        ]),
    });
  }

  /**
   * Creates an extraction task for a request in acceptance, unless the
   * period already has one: the (request, period) key is unique, so a
   * repeated sweep or a retried effect creates nothing twice. A manual task
   * has no period and takes its number as its key. Returns nothing when the
   * task exists or the request has left acceptance.
   *
   * The insert and the request's acceptance are decided together: the task's
   * transaction first bumps the request's `lifecycleVersion` while it is
   * still `accepting`, which locks the row against a `complete` deciding at
   * the same time and makes the one that commits second meet a conflict.
   * The version belongs to the lifecycle, and this is why it is touched from
   * outside it: a transition that counted the request's tasks must not
   * commit over a task it did not see.
   */
  public async createExtraction(values: {
    readonly requestId: number;
    readonly periodKey?: string;
    readonly origin: 'scheduled' | 'once' | 'manual';
    readonly scheduledDate: string;
    readonly topic: string;
    readonly requirement: string;
    readonly executorIds: readonly string[];
  }): Promise<Plain | undefined> {
    const { periodKey } = values;
    const existing = async (
      repository: Repository,
    ): Promise<Row | undefined> =>
      periodKey === undefined
        ? undefined
        : repository.findOne({
            filter: { requestId: values.requestId, periodKey },
          });
    if (await existing(this.repository(COLLECTIONS.extractions)))
      return undefined;
    // Numbered before the transaction: SQLite has one connection, and a
    // read outside the transaction would wait for it.
    const number = await this.nextNumber('SJSY_CS');
    const now = this.now();
    return this.transaction(async (connection) => {
      const accepting = await connection
        .repository(COLLECTIONS.dataRequests)
        .updateMany({
          filter: { id: values.requestId, status: 'accepting' },
          values: { lifecycleVersion: { increment: 1 } },
        });
      if (accepting.updatedCount === 0) return undefined;
      const extractions = connection.repository(COLLECTIONS.extractions);
      if (await existing(extractions)) return undefined;
      try {
        const created = await extractions.createOne({
          values: {
            ...values,
            periodKey: periodKey ?? `manual:${number}`,
            executorIds: [...values.executorIds],
            feedbackFiles: [],
            number,
            status: 'pending',
            statusChangedAt: now,
            lifecycleVersion: 0,
            createdAt: now,
          },
        });
        return plain(created.record);
      } catch (error) {
        // Another sweep created it between the read and the insert.
        if (await existing(extractions)) return undefined;
        throw error;
      }
    });
  }

  /**
   * Reminds each recipient once per root document and level; returns who
   * was reminded now. Someone already reminded at this level is skipped,
   * however many rows or rounds name them again.
   */
  public async notify(input: NoticeInput): Promise<string[]> {
    const reached: string[] = [];
    for (const recipient of unique(input.recipients)) {
      const key = {
        rootKind: input.rootKind,
        rootId: input.rootId,
        level: input.level,
        recipient,
      };
      if (await this.repository(COLLECTIONS.notices).exists({ filter: key }))
        continue;
      try {
        await this.repository(COLLECTIONS.notices).createOne({
          values: {
            ...key,
            message: input.message,
            sourceKind: input.sourceKind,
            sourceId: input.sourceId,
            createdAt: this.now(),
          },
        });
        reached.push(recipient);
      } catch (error) {
        // The unique key: a concurrent dispatch reminded them first.
        if (
          !(await this.repository(COLLECTIONS.notices).exists({ filter: key }))
        )
          throw error;
      }
    }
    return reached;
  }

  /**
   * Adds a line to a document's distribution record. An effect passes its
   * run's idempotency key, so a retry after a partial attempt writes the
   * line once; without a key every call writes one.
   */
  public async trace(values: {
    readonly docKind: string;
    readonly docId: number;
    readonly actorId: string;
    readonly action: string;
    readonly detail: Plain;
    readonly key?: string;
  }): Promise<void> {
    const key = values.key ?? `trace:${randomUUID()}`;
    const traces = this.repository(COLLECTIONS.traces);
    if (values.key && (await traces.exists({ filter: { key } }))) return;
    try {
      await traces.createOne({
        values: { ...values, key, at: this.now() },
      });
    } catch (error) {
      // The unique key: a concurrent attempt wrote it first.
      if (!(await traces.exists({ filter: { key } }))) throw error;
    }
  }

  /**
   * Sends distribution rows down one level: each row not yet dispatched
   * becomes a task for its department, and everyone the row names is
   * reminded. Claiming the row and creating its task are one transaction.
   * A row an earlier attempt already dispatched is reported again rather
   * than skipped, so a retry after the reminders failed still sends them;
   * the reminders themselves go out once per person and level.
   */
  public async dispatch(
    level: 1 | 2 | 3,
    rowIds: readonly number[],
  ): Promise<DispatchResult> {
    const target = LEVELS[level];
    const created: {
      kind: TaskKind;
      id: number;
      number: string;
      departmentName: string;
    }[] = [];
    const recipients: string[] = [];
    let rootId = 0;
    for (const rowId of rowIds) {
      // Numbered before the transaction: SQLite has one connection, and a
      // read outside the transaction would wait for it. A claim that loses
      // leaves a gap in the sequence, nothing worse.
      const number = await this.nextNumber(target.prefix);
      const task = await this.transaction(async (connection) => {
        const rows = connection.repository(COLLECTIONS.assignments);
        const claimed = await rows.updateMany({
          filter: { id: rowId, dispatched: false, level },
          values: { dispatched: true },
        });
        if (claimed.updatedCount === 0) {
          const done = plain(await rows.findOne({ filter: { id: rowId } }));
          if (!done || done.level !== level || done.childId == null)
            return undefined;
          const child = plain(
            await connection
              .repository(target.collection)
              .findOne({ filter: { id: idOf(done.childId) } }),
          );
          return child
            ? { row: done, id: idOf(done.childId), number: text(child.number) }
            : undefined;
        }
        const row = plain(await rows.findOne({ filter: { id: rowId } }))!;
        const now = this.now();
        const record = await connection
          .repository(target.collection)
          .createOne({
            values: {
              number,
              rootId: idOf(row.rootId),
              parentId: idOf(row.parentId),
              assignmentId: rowId,
              departmentName: text(row.departmentName),
              assignees: people(row.assignees),
              ccHeads: people(row.ccHeads),
              ccLeaders: people(row.ccLeaders),
              signedBy: [],
              attachments: [],
              status: target.initial,
              statusChangedAt: now,
              lifecycleVersion: 0,
              createdAt: now,
            },
          });
        const id = idOf(record.record.id);
        // Publish ownership with the task and the dispatch claim. A retry
        // reuses the existing task, so it cannot duplicate these memberships.
        for (const personId of unique(people(row.assignees))) {
          await connection.repository(COLLECTIONS.taskAssignees).createOne({
            values: { kind: target.kind, taskId: id, personId },
          });
        }
        await rows.updateMany({
          filter: { id: rowId },
          values: { childId: id },
        });
        return { row, id, number };
      });
      if (!task) continue;
      rootId = idOf(task.row.rootId);
      recipients.push(
        ...people(task.row.assignees),
        ...people(task.row.ccHeads),
        ...people(task.row.ccLeaders),
      );
      created.push({
        kind: target.kind,
        id: task.id,
        number: task.number,
        departmentName: text(task.row.departmentName),
      });
    }
    if (!created.length) return { created, notified: [], skipped: [] };
    const root = await this.find(COLLECTIONS.incoming, rootId);
    const title = text(root?.title);
    const notified = await this.notify({
      rootKind: 'incoming',
      rootId,
      level: text(level),
      recipients,
      message: `收文《${title}》已派发至${created.map((item) => item.departmentName).join('、')}`,
      sourceKind: target.kind,
      sourceId: created[0].id,
    });
    return {
      created,
      notified,
      skipped: unique(recipients).filter(
        (person) => !notified.includes(person),
      ),
    };
  }

  /** Readable names, for messages and traces. */
  public names(ids: readonly string[]): string {
    return ids.map(personName).join('、');
  }
}
