import { PermissionSetConflictError } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  decodeAuthorizationTitle,
} from '@nocobase/authorization/core';
import {
  isUniqueConstraintViolation,
  type DatabaseConnection,
} from '@nocobase/db';
import type { DatabaseConnectionSource } from './connection.js';
import type { Knex } from 'knex';
import type { PermissionGrant } from '@nocobase/authorization/core';
import type {
  PermissionSet,
  PermissionSetAssignment,
  PermissionSetSubject,
} from '@nocobase/authorization/permission-sets';
import type { PermissionSetStore } from '@nocobase/authorization/permission-sets';

export class DatabasePermissionSetStore implements PermissionSetStore<DatabaseConnection> {
  constructor(
    private readonly connection: DatabaseConnectionSource,
    private lockTableName?: string,
  ) {}

  transaction<T>(
    run: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return this.resolveLockTable().then(() =>
      this.connection().transaction(run),
    );
  }

  withTransaction(
    connection: DatabaseConnection,
  ): PermissionSetStore<DatabaseConnection> {
    return new DatabasePermissionSetStore(() => connection, this.lockTableName);
  }

  async list(): Promise<readonly PermissionSet[]> {
    const rows = await this.connection()
      .query.selectFrom('authorizationPermissionSets')
      .select(['key', 'title', 'grants', 'revision'])
      .orderBy('key', 'asc')
      .execute();
    return rows.map((row) => permissionSetFromRow(row));
  }

  async findAssignments(
    subjects: readonly PermissionSetSubject[],
  ): Promise<readonly PermissionSetAssignment[]> {
    if (subjects.length === 0) return [];
    const rows = await this.connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .select(['id', 'subjectType', 'subjectId', 'permissionSetKey'])
      .where((builder) =>
        builder.or(
          subjects.map((subject) =>
            builder.and({
              subjectType: subject.type,
              subjectId: subject.id,
            }),
          ),
        ),
      )
      .execute();
    return rows.map((row) => ({
      id: String(row.id),
      subject: {
        type: String(row.subjectType),
        id: String(row.subjectId),
      },
      permissionSet: String(row.permissionSetKey),
    }));
  }

  async get(key: string): Promise<PermissionSet | undefined> {
    const row = await this.connection()
      .query.selectFrom('authorizationPermissionSets')
      .select(['key', 'title', 'grants', 'revision'])
      .where('key', '=', key)
      .executeTakeFirst();
    if (!row) return undefined;
    return permissionSetFromRow(row);
  }

  async getMany(keys: readonly string[]): Promise<readonly PermissionSet[]> {
    if (keys.length === 0) return [];
    const rows = await this.connection()
      .query.selectFrom('authorizationPermissionSets')
      .select(['key', 'title', 'grants', 'revision'])
      .where('key', 'in', [...new Set(keys)])
      .execute();
    return rows.map(permissionSetFromRow);
  }

  async create(input: PermissionSet): Promise<PermissionSet> {
    const now = new Date();
    const revision = crypto.randomUUID();
    await this.connection()
      .query.insertInto('authorizationPermissionSets')
      .values({
        id: crypto.randomUUID(),
        key: input.key,
        title: encodeAuthorizationTitle(input.title),
        grants: JSON.stringify(input.grants),
        revision,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    return { ...input, revision };
  }

  async update(
    key: string,
    input: PermissionSet,
    expectedRevision?: string,
  ): Promise<PermissionSet> {
    const revision = crypto.randomUUID();
    await this.connection().transaction(async (connection): Promise<void> => {
      let update = connection.query
        .updateTable('authorizationPermissionSets')
        .set({
          key: input.key,
          title: encodeAuthorizationTitle(input.title),
          grants: JSON.stringify(input.grants),
          revision,
          updatedAt: new Date(),
        })
        .where('key', '=', key);
      if (expectedRevision !== undefined)
        update = update.where('revision', '=', expectedRevision);
      const result = await update.execute();
      if (
        result.updatedCount === 0 ||
        (expectedRevision !== undefined && result.updatedCount !== 1)
      )
        throw new PermissionSetConflictError(
          'The Permission Set changed. Reload it before saving.',
        );
      if (key !== input.key) {
        await connection.query
          .updateTable('authorizationPermissionSetAssignments')
          .set({ permissionSetKey: input.key })
          .where('permissionSetKey', '=', key)
          .execute();
      }
    });
    return { ...input, revision };
  }

  async delete(key: string): Promise<void> {
    await this.connection().transaction(async (connection): Promise<void> => {
      await connection.query
        .deleteFrom('authorizationPermissionSetAssignments')
        .where('permissionSetKey', '=', key)
        .execute();
      await connection.query
        .deleteFrom('authorizationPermissionSets')
        .where('key', '=', key)
        .execute();
    });
  }

  async assign(
    input: PermissionSetAssignment,
  ): Promise<PermissionSetAssignment> {
    const now = new Date();
    try {
      // A savepoint inside a caller's transaction, so the lookup below can still run after the insert fails.
      await this.connection().transaction(async (connection) => {
        await connection.query
          .insertInto('authorizationPermissionSetAssignments')
          .values({
            id: input.id,
            subjectType: input.subject.type,
            subjectId: input.subject.id,
            permissionSetKey: input.permissionSet,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      });
    } catch (error) {
      if (
        reportsGrantConflict(error) ||
        (isUniqueConstraintViolation(error) && (await this.holdsGrant(input)))
      )
        throw new PermissionSetConflictError(
          `Permission Set ${input.permissionSet} is already assigned to this subject.`,
        );
      throw error;
    }
    return input;
  }

  /**
   * Whether the assignment id already holds this very grant, as when a request is retried; the database may then report
   * the primary key rather than the grant. An id held by another grant, or by none any more, is not a duplicate grant.
   */
  private async holdsGrant(input: PermissionSetAssignment): Promise<boolean> {
    const row = await this.connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .select(['subjectType', 'subjectId', 'permissionSetKey'])
      .where('id', '=', input.id)
      .executeTakeFirst();
    return (
      row !== undefined &&
      rowValue(row, 'subjectType') === input.subject.type &&
      rowValue(row, 'subjectId') === input.subject.id &&
      rowValue(row, 'permissionSetKey') === input.permissionSet
    );
  }

  async revoke(id: string): Promise<void> {
    await this.connection()
      .query.deleteFrom('authorizationPermissionSetAssignments')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Serializes changes to one Permission Set on its own row, so a check that
   * counts the assignments left cannot run against a snapshot another
   * transaction is about to invalidate.
   */
  async lock(key: string): Promise<void> {
    if (this.connection().dialect === 'sqlite') {
      // SQLite has no row locks; writing the row takes the write lock instead.
      await this.connection()
        .query.updateTable('authorizationPermissionSets')
        .set({ updatedAt: new Date() })
        .where('key', '=', key)
        .execute();
      return;
    }
    const tableName = await this.resolveLockTable();
    const knex = await this.connection().client<Knex>();
    await knex(tableName).where({ key }).select('id').forUpdate();
  }

  private async resolveLockTable(): Promise<string> {
    // Resolve metadata before opening an owned transaction: even a metadata
    // SELECT can establish an old repeatable-read snapshot before the guard.
    if (this.lockTableName) return this.lockTableName;
    const physical = await this.connection().collections.getPhysical(
      'authorizationPermissionSets',
    );
    if (!physical) throw new Error('Permission Set schema is unavailable');
    return (this.lockTableName = physical.tableName);
  }

  async listAssignments(
    permissionSet?: string,
  ): Promise<readonly PermissionSetAssignment[]> {
    let query = this.connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .select(['id', 'subjectType', 'subjectId', 'permissionSetKey']);
    if (permissionSet !== undefined) {
      query = query.where('permissionSetKey', '=', permissionSet);
    }
    const rows = await query.orderBy('id', 'asc').execute();
    return rows.map((row) => assignmentFromRow(row));
  }
}

function permissionSetFromRow(row: object): PermissionSet {
  const key = rowValue(row, 'key');
  const title = rowValue(row, 'title');
  const grants = rowValue(row, 'grants');
  return {
    key: scalarString(key, 'Permission Set key'),
    revision: scalarString(
      rowValue(row, 'revision'),
      'Permission Set revision',
    ),
    ...(title == null ? {} : { title: decodeAuthorizationTitle(title) }),
    grants: jsonValue<PermissionGrant[]>(grants, []),
  };
}

function assignmentFromRow(row: object): PermissionSetAssignment {
  return {
    id: scalarString(rowValue(row, 'id'), 'Permission Set assignment id'),
    subject: {
      type: scalarString(
        rowValue(row, 'subjectType'),
        'Permission Set subject type',
      ),
      id: scalarString(rowValue(row, 'subjectId'), 'Permission Set subject id'),
    },
    permissionSet: scalarString(
      rowValue(row, 'permissionSetKey'),
      'Permission Set assignment key',
    ),
  };
}

function rowValue(row: object, key: string): unknown {
  return Reflect.get(row, key);
}

function jsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
}

function scalarString(value: unknown, label: string): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  throw new Error(`Invalid ${label}`);
}

/** The `(subjectType, subjectId, permissionSetKey)` unique constraint, named by the migration that creates the table. */
const GRANT_CONSTRAINT =
  'uq_authorization_permission_set_assignments_subject_set';

/**
 * Whether the failed write itself reports the grant's unique constraint, read from the driver's structured fields
 * rather than its message or the rows left afterwards. PostgreSQL names the constraint; SQLite tells the primary key
 * apart from other unique keys, and the grant is this table's only other one. Any other report, including the primary
 * key and databases that name the key only in their message, is not taken as a duplicate grant.
 */
function reportsGrantConflict(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (record.code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
    if (record.code === '23505') return record.constraint === GRANT_CONSTRAINT;
    current = record.cause ?? record.originalError;
  }
  return false;
}
