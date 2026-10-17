import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryRecord,
} from '@nocobase/db';

import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';

export type SandboxData = Readonly<Record<string, unknown>>;

/** One thing a simulated outside system keeps: a checkout session, a charge, a reservation… */
export interface SandboxObject {
  readonly id: string;
  readonly kind: string;
  /** The system's own id, unique within its kind. */
  readonly key: string;
  readonly status: string;
  readonly data: SandboxData;
  /** Moved on by every update, which is conditioned on it. */
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SandboxChanges {
  readonly status?: string;
  readonly data?: SandboxData;
}

/**
 * Where the sandbox keeps its objects. The sandbox stands in for systems
 * outside the application, so nothing here is a lifecycle record: it is
 * the state those systems would keep on their side.
 */
export interface SandboxObjects {
  now(): Date;
  find(kind: string, key: string): Promise<SandboxObject | undefined>;
  list(kind: string): Promise<SandboxObject[]>;
  /** Inserts the object unless one with its kind and key exists, and answers the one stored. */
  insert(
    kind: string,
    key: string,
    status: string,
    data: SandboxData,
  ): Promise<SandboxObject>;
  /** Writes the changes while the object is still at the version read; answers whether it did. */
  update(object: SandboxObject, changes: SandboxChanges): Promise<boolean>;
  /** Runs `work` on objects that commit or roll back together. */
  transaction<T>(work: (objects: SandboxObjects) => Promise<T>): Promise<T>;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : '';
}

function toObject(row: Readonly<Record<string, unknown>>): SandboxObject {
  return {
    id: String(row.id),
    kind: String(row.kind),
    key: String(row.key),
    status: String(row.status),
    data:
      typeof row.data === 'object' && row.data !== null
        ? (row.data as SandboxData)
        : {},
    version: Number(row.version ?? 0),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** The sandbox's objects in the plugin's own table, on the application's database. */
export class RepositorySandboxObjects implements SandboxObjects {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly clock: () => Date = (): Date => new Date(),
    private readonly connection: DatabaseConnection | undefined = undefined,
  ) {}

  public now(): Date {
    return this.clock();
  }

  private repository() {
    const collection = LIFECYCLE_EXAMPLE_COLLECTIONS.sandboxObjects;
    return this.connection
      ? this.connection.repository(collection)
      : this.database.repository(collection);
  }

  public async find(
    kind: string,
    key: string,
  ): Promise<SandboxObject | undefined> {
    const row = await this.repository().findOne({ filter: { kind, key } });
    return row ? toObject(row) : undefined;
  }

  public async list(kind: string): Promise<SandboxObject[]> {
    const rows = await this.repository().findMany({
      filter: { kind },
      sort: (sort) => sort.field('id').asc(),
    });
    return rows.map(toObject);
  }

  public async insert(
    kind: string,
    key: string,
    status: string,
    data: SandboxData,
  ): Promise<SandboxObject> {
    const existing = await this.find(kind, key);
    if (existing) return existing;
    const now = this.now().toISOString();
    try {
      const { record } = await this.repository().createOne({
        values: {
          kind,
          key,
          status,
          data,
          version: 0,
          createdAt: now,
          updatedAt: now,
        } as RepositoryRecord,
      });
      return toObject(record);
    } catch (error) {
      // Another call with the same key inserted it first: answer that one.
      const raced = this.connection ? undefined : await this.find(kind, key);
      if (raced) return raced;
      throw error;
    }
  }

  public async update(
    object: SandboxObject,
    changes: SandboxChanges,
  ): Promise<boolean> {
    const { updatedCount } = await this.repository().updateMany({
      filter: { id: Number(object.id), version: object.version },
      values: {
        ...(changes.status === undefined ? {} : { status: changes.status }),
        ...(changes.data === undefined ? {} : { data: changes.data }),
        version: object.version + 1,
        updatedAt: this.now().toISOString(),
      } as RepositoryRecord,
    });
    return updatedCount > 0;
  }

  public transaction<T>(
    work: (objects: SandboxObjects) => Promise<T>,
  ): Promise<T> {
    if (this.connection) return work(this);
    return this.database.transaction((connection) =>
      work(new RepositorySandboxObjects(this.database, this.clock, connection)),
    );
  }
}

/** The same in memory, for tests that need no database. */
export class MemorySandboxObjects implements SandboxObjects {
  private readonly rows = new Map<string, SandboxObject>();
  private sequence = 0;

  public constructor(
    private readonly clock: () => Date = (): Date => new Date(),
  ) {}

  public now(): Date {
    return this.clock();
  }

  public find(kind: string, key: string): Promise<SandboxObject | undefined> {
    return Promise.resolve(this.rows.get(`${kind}\n${key}`));
  }

  public list(kind: string): Promise<SandboxObject[]> {
    return Promise.resolve(
      [...this.rows.values()].filter((row) => row.kind === kind),
    );
  }

  public insert(
    kind: string,
    key: string,
    status: string,
    data: SandboxData,
  ): Promise<SandboxObject> {
    const existing = this.rows.get(`${kind}\n${key}`);
    if (existing) return Promise.resolve(existing);
    this.sequence += 1;
    const now = this.now().toISOString();
    const object: SandboxObject = {
      id: String(this.sequence),
      kind,
      key,
      status,
      data,
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(`${kind}\n${key}`, object);
    return Promise.resolve(object);
  }

  public update(
    object: SandboxObject,
    changes: SandboxChanges,
  ): Promise<boolean> {
    const current = this.rows.get(`${object.kind}\n${object.key}`);
    if (!current || current.version !== object.version)
      return Promise.resolve(false);
    this.rows.set(`${object.kind}\n${object.key}`, {
      ...current,
      ...changes,
      version: current.version + 1,
      updatedAt: this.now().toISOString(),
    });
    return Promise.resolve(true);
  }

  public transaction<T>(
    work: (objects: SandboxObjects) => Promise<T>,
  ): Promise<T> {
    return work(this);
  }
}
