import type { Knex } from 'knex';
import type {
  DatabaseConnection,
  DatabaseWrite,
  DatabaseWriteCheck,
  ScopedDatabaseConnection,
} from '../connection.js';

export class DatabaseWriteCheckRegistry {
  private checks: readonly { check: DatabaseWriteCheck }[] = [];

  get empty(): boolean {
    return this.checks.length === 0;
  }

  add(check: DatabaseWriteCheck): () => void {
    const registration = { check };
    this.checks = [...this.checks, registration];
    return () => {
      this.checks = this.checks.filter((current) => current !== registration);
    };
  }

  async run(
    write: DatabaseWrite,
    connection: DatabaseConnection,
  ): Promise<void> {
    Object.freeze(write);
    for (const { check } of this.checks) await check(write, connection);
  }
}

/** Keep check rejections out of retries for retryable driver errors. */
export class DatabaseWriteCheckRejection extends Error {
  constructor(readonly error: unknown) {
    super('Database write check rejected the statement.');
  }
}

export interface DatabaseWriteCheckBinding {
  readonly registry: DatabaseWriteCheckRegistry;
  readonly connectionName: string;
  connectionFor(client: Knex): DatabaseConnection;
}

// Used by the public physical upsert helper, which takes a connection rather than an adapter.
export const writeChecksByConnection: WeakMap<
  DatabaseConnection | ScopedDatabaseConnection,
  DatabaseWriteCheckBinding
> = new WeakMap();

export function inheritWriteChecks(
  connection: DatabaseConnection | ScopedDatabaseConnection,
  inner: DatabaseConnection,
): void {
  const checks = writeChecksByConnection.get(inner);
  if (checks) writeChecksByConnection.set(connection, checks);
}

/** Knex formats qualifiers and aliases separately from the physical table name. */
export function physicalWriteTable(tableExpression: string): string {
  const alias = tableExpression.toLowerCase().indexOf(' as ');
  const identifier =
    alias < 0 ? tableExpression : tableExpression.slice(0, alias);
  return identifier.slice(identifier.lastIndexOf('.') + 1);
}
