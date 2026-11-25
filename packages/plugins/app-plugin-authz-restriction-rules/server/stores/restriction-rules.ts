import {
  encodeAuthorizationTitle,
  decodeAuthorizationTitle,
} from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import type { DatabaseConnectionSource } from '@nocobase/app-plugin-authorization/server/extension';
import type { RestrictionRule } from '@nocobase/authorization/restriction-rules';
import type { RestrictionRuleStore } from '@nocobase/authorization/restriction-rules';

const COLLECTION = 'authorizationRestrictionRules';
const ASSIGNMENTS = 'authorizationRestrictionRuleAssignments';

export class DatabaseRestrictionRuleStore implements RestrictionRuleStore<DatabaseConnection> {
  constructor(private readonly connection: DatabaseConnectionSource) {}

  withTransaction(
    connection: DatabaseConnection,
  ): RestrictionRuleStore<DatabaseConnection> {
    return new DatabaseRestrictionRuleStore(() => connection);
  }
  async create(rule: RestrictionRule): Promise<RestrictionRule> {
    const now = new Date();
    const id = crypto.randomUUID();
    await this.connection().transaction(async (connection): Promise<void> => {
      await connection.query
        .insertInto(COLLECTION)
        .values(this.toValues(rule, id, now, now))
        .execute();
      await this.replaceAssignments(connection, id, rule.subjects);
    });
    return rule;
  }
  async update(key: string, rule: RestrictionRule): Promise<RestrictionRule> {
    await this.connection().transaction(async (connection): Promise<void> => {
      const row = await connection.query
        .selectFrom(COLLECTION)
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst();
      if (!row) throw new Error(`Unknown Restriction Rule: ${key}`);
      const id = String(row.id);
      await connection.query
        .updateTable(COLLECTION)
        .set({ ...this.toUpdateValues(rule), updatedAt: new Date() })
        .where('id', '=', id)
        .execute();
      await connection.query
        .deleteFrom(ASSIGNMENTS)
        .where('restrictionRuleId', '=', id)
        .execute();
      await this.replaceAssignments(connection, id, rule.subjects);
    });
    return rule;
  }
  async delete(key: string): Promise<void> {
    await this.connection().transaction(async (connection): Promise<void> => {
      const row = await connection.query
        .selectFrom(COLLECTION)
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst();
      if (!row) return;
      await connection.query
        .deleteFrom(ASSIGNMENTS)
        .where('restrictionRuleId', '=', String(row.id))
        .execute();
      await connection.query
        .deleteFrom(COLLECTION)
        .where('id', '=', String(row.id))
        .execute();
    });
  }
  async get(key: string): Promise<RestrictionRule | undefined> {
    const row = await this.connection()
      .query.selectFrom(COLLECTION)
      .select([
        'id',
        'key',
        'title',
        'resourceType',
        'resourceId',
        'actions',
        'reason',
      ])
      .where('key', '=', key)
      .executeTakeFirst();
    if (!row) return undefined;
    return this.fromRow(row, await this.loadAssignments([String(row.id)]));
  }
  async list(): Promise<readonly RestrictionRule[]> {
    const rows = await this.connection()
      .query.selectFrom(COLLECTION)
      .select([
        'id',
        'key',
        'title',
        'resourceType',
        'resourceId',
        'actions',
        'reason',
      ])
      .orderBy('key', 'asc')
      .execute();
    const ids = rows.map((row) => String(row.id));
    const assignments = await this.loadAssignments(ids);
    return rows.map((row) => this.fromRow(row, assignments));
  }
  private toValues(
    rule: RestrictionRule,
    id: string,
    createdAt: Date,
    updatedAt: Date,
  ): Record<string, unknown> {
    return { id, ...this.toUpdateValues(rule), createdAt, updatedAt };
  }
  private toUpdateValues(rule: RestrictionRule): Record<string, unknown> {
    return {
      key: rule.key,
      title: encodeAuthorizationTitle(rule.title),
      resourceType: rule.resource.type,
      resourceId: rule.resource.id,
      actions: JSON.stringify(rule.actions),
      reason: rule.reason ?? null,
    };
  }
  private async replaceAssignments(
    connection: DatabaseConnection,
    ruleId: string,
    subjects: RestrictionRule['subjects'],
  ): Promise<void> {
    if (subjects.length > 0)
      await connection.query
        .insertInto(ASSIGNMENTS)
        .values(
          subjects.map((subject) => ({
            id: crypto.randomUUID(),
            restrictionRuleId: ruleId,
            subjectType: subject.type,
            subjectId: subject.id,
            createdAt: new Date(),
          })),
        )
        .execute();
  }
  private async loadAssignments(
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, RestrictionRule['subjects']>> {
    if (ids.length === 0) return new Map();
    const rows = await this.connection()
      .query.selectFrom(ASSIGNMENTS)
      .select(['restrictionRuleId', 'subjectType', 'subjectId'])
      .where('restrictionRuleId', 'in', ids)
      .execute();
    const result = new Map<string, { type: string; id: string }[]>();
    for (const row of rows) {
      const id = String(row.restrictionRuleId);
      const values = result.get(id) ?? [];
      values.push({ type: String(row.subjectType), id: String(row.subjectId) });
      result.set(id, values);
    }
    return result;
  }
  private fromRow(
    row: object,
    assignments: ReadonlyMap<string, RestrictionRule['subjects']>,
  ): RestrictionRule {
    const value = row as Record<string, unknown>;
    const title = decodeAuthorizationTitle(value.title);
    const reason = optionalString(value.reason, 'restriction rule reason');
    return {
      key: String(value.key),
      ...(title === undefined ? {} : { title }),
      resource: {
        type: String(value.resourceType),
        id: String(value.resourceId),
      },
      actions: parseJson(value.actions, []),
      subjects: assignments.get(String(value.id)) ?? [],
      ...(reason === undefined ? {} : { reason }),
    };
  }
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  throw new Error(`Invalid ${label}`);
}
