import type {
  CollectionDefinition,
  DatabaseManager,
  RepositoryFilter,
  RepositoryRecord,
} from '@nocobase/db';

import type { FoundationIssue } from '../shared/foundation.js';
import { ReadQueue } from './read-queue.js';

/** One Collection as the default connection lists it: logical name, table, kind and title. */
export type CollectionSummary = Awaited<
  ReturnType<ReturnType<DatabaseManager['collections']>['list']>
>['items'][number];

/** The Collections of the default connection, read once per overview and shared by every capability. */
export class Inventory {
  private readonly definitions = new Map<
    string,
    Promise<CollectionDefinition | undefined>
  >();

  private constructor(
    public readonly database: DatabaseManager,
    public readonly collections: readonly CollectionSummary[],
    public readonly reads: ReadQueue,
  ) {}

  /** Lists every Collection of the default connection. Throws when the database cannot be read at all. */
  public static async read(
    database: DatabaseManager,
    reads: ReadQueue = new ReadQueue(),
    signal?: AbortSignal,
  ): Promise<Inventory> {
    const collections: CollectionSummary[] = [];
    let cursor: string | undefined;
    do {
      const page = await reads.run(
        () =>
          database
            .collections()
            .list({ limit: 500, ...(cursor === undefined ? {} : { cursor }) }),
        signal,
      );
      collections.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor !== undefined);
    return new Inventory(database, collections, reads);
  }

  public has(name: string): boolean {
    return this.collections.some((collection) => collection.name === name);
  }

  public definition(
    name: string,
    signal?: AbortSignal,
  ): Promise<CollectionDefinition | undefined> {
    let pending = this.definitions.get(name);
    if (!pending) {
      pending = this.reads.run(
        () => this.database.collections().get(name),
        signal,
      );
      this.definitions.set(name, pending);
    }
    return pending;
  }
}

/**
 * Reads for one capability. Every read answers `null` instead of throwing and records what it could not read, so one
 * unreadable source leaves the rest of the capability standing and is never mistaken for zero.
 */
export class Probe {
  public readonly issues: FoundationIssue[] = [];

  public constructor(
    public readonly inventory: Inventory,
    public readonly signal: AbortSignal | undefined = undefined,
  ) {}

  /** Schedule only a small number of table operations, and stop dispatching when the collector expires. */
  public async map<T, R>(
    items: readonly T[],
    read: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, items.length) }, async () => {
        while (next < items.length) {
          this.signal?.throwIfAborted();
          const index = next++;
          results[index] = await read(items[index]);
        }
      }),
    );
    return results;
  }

  public has(name: string): boolean {
    return this.inventory.has(name);
  }

  /** A listed Collection can disappear or become unreadable before its definition is inspected. */
  public async definition(name: string): Promise<CollectionDefinition | null> {
    try {
      const definition = await this.inventory.definition(name, this.signal);
      if (definition !== undefined) return definition;
    } catch {
      // Driver details must not reach a capability response.
    }
    this.unreadable(name);
    return null;
  }

  public async fieldNames(name: string): Promise<readonly string[] | null> {
    const definition = await this.definition(name);
    return definition
      ? (definition.fields ?? []).map((field) => field.name)
      : null;
  }

  public count(
    name: string,
    filter?: RepositoryFilter<RepositoryRecord>,
  ): Promise<number | null> {
    return this.read(name, () =>
      this.inventory.database
        .repository(name)
        .count(filter === undefined ? {} : { filter }),
    );
  }

  /** Records per value of `field`, such as deliveries per status. */
  public groupCount(
    name: string,
    field: string,
  ): Promise<ReadonlyMap<string, number> | null> {
    return this.read(name, async () => {
      const groups = await this.inventory.database
        .repository<Record<string, unknown>>(name)
        .groupBy({
          by: [field],
          aggregate: (aggregate) => ({ count: aggregate.count() }),
        });
      return new Map(
        groups.map((group) => [groupKey(group[field]), Number(group.count)]),
      );
    });
  }

  public sum(name: string, field: string): Promise<number | null> {
    return this.read(name, async () => {
      const result = await this.inventory.database
        .repository<Record<string, unknown>>(name)
        .aggregate({
          aggregate: (aggregate) => ({ total: aggregate.sum(field) }),
        });
      return Number(result.total ?? 0);
    });
  }

  /** Read configuration Collections in stable pages; never present a truncated prefix as a complete total. */
  public records(
    name: string,
    pageSize = 1000,
  ): Promise<readonly Record<string, unknown>[] | null> {
    return this.read(name, async () => {
      if (!Number.isSafeInteger(pageSize) || pageSize < 1)
        throw new RangeError(
          'Configuration page size must be a positive integer.',
        );
      const records: Record<string, unknown>[] = [];
      const repository =
        this.inventory.database.repository<Record<string, unknown>>(name);
      for (let offset = 0; ; offset += pageSize) {
        this.signal?.throwIfAborted();
        const page = await repository.findMany({
          limit: pageSize,
          offset,
          sort: (sort) => sort.field('id').asc(),
        });
        records.push(...page);
        if (page.length < pageSize) return records;
      }
    });
  }

  /**
   * Rows of a table the database layer keeps for itself, such as the migration history, which no Collection
   * describes.
   */
  public internalCount(
    table: string,
    where?: { readonly column: string; readonly value: string },
  ): Promise<number | null> {
    return this.read(table, async () => {
      let query = this.inventory.database
        .query()
        .selectFrom(table)
        .select((expression) => [expression.fn.countAll().as('count')]);
      if (where) query = query.where(where.column, '=', where.value);
      const row = await query.executeTakeFirst<{ count: number | string }>();
      return Number(row?.count ?? 0);
    });
  }

  public internalMax(table: string, column: string): Promise<unknown> {
    return this.read(table, async () => {
      const row = await this.inventory.database
        .query()
        .selectFrom(table)
        .select((expression) => [expression.fn.max(column).as('latest')])
        .executeTakeFirst<{ latest: unknown }>();
      return row?.latest ?? null;
    });
  }

  private async read<T>(
    source: string,
    run: () => Promise<T>,
  ): Promise<T | null> {
    try {
      return await this.inventory.reads.run(run, this.signal);
    } catch {
      // The cause is not kept: a driver's error can quote the host, database and account it failed to reach.
      this.unreadable(source);
      return null;
    }
  }

  private unreadable(source: string): void {
    if (
      !this.issues.some(
        (issue) =>
          issue.code === 'SOURCE_UNREADABLE' && issue.source === source,
      )
    )
      this.issues.push({ code: 'SOURCE_UNREADABLE', source });
  }
}

/** A grouped value as a map key: statuses and names are strings, an absent value is the empty string. */
function groupKey(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : JSON.stringify(value);
}

/** Adds counts, keeping track of whether every one of them could be read. */
export function total(values: readonly (number | null)[]): {
  readonly value: number | null;
  readonly complete: boolean;
} {
  const known = values.filter((value): value is number => value !== null);
  return {
    value:
      known.length === 0 && values.length > 0
        ? null
        : known.reduce((sum, value) => sum + value, 0),
    complete: known.length === values.length,
  };
}
