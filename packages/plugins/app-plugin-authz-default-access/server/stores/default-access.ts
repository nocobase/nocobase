import type { DatabaseConnection } from '@nocobase/db';
import type { RuleAction } from '@nocobase/authorization/core';
import type { DatabaseConnectionSource } from '@nocobase/app-plugin-authorization/server/extension';
import type {
  DefaultAccessRule,
  DefaultAccessStore,
} from '@nocobase/authorization/default-access';

const RULES = 'authorizationDefaultAccessRules';
const COLUMNS = ['key', 'resourceType', 'resourceId', 'actions'] as const;

export class DatabaseDefaultAccessStore implements DefaultAccessStore<DatabaseConnection> {
  constructor(private readonly connection: DatabaseConnectionSource) {}

  withTransaction(
    connection: DatabaseConnection,
  ): DefaultAccessStore<DatabaseConnection> {
    return new DatabaseDefaultAccessStore(() => connection);
  }

  async list(): Promise<readonly DefaultAccessRule[]> {
    const rows = await this.connection()
      .query.selectFrom(RULES)
      .select([...COLUMNS])
      .orderBy('key', 'asc')
      .execute();
    return rows.map((row) => fromRow(row));
  }

  async get(key: string): Promise<DefaultAccessRule | undefined> {
    const row = await this.connection()
      .query.selectFrom(RULES)
      .select([...COLUMNS])
      .where('key', '=', key)
      .executeTakeFirst();
    return row && fromRow(row);
  }

  async create(rule: DefaultAccessRule): Promise<DefaultAccessRule> {
    const now = new Date();
    await this.connection()
      .query.insertInto(RULES)
      .values({
        id: crypto.randomUUID(),
        ...toValues(rule),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    return rule;
  }

  async update(
    key: string,
    rule: DefaultAccessRule,
  ): Promise<DefaultAccessRule> {
    await this.connection()
      .query.updateTable(RULES)
      .set({ ...toValues(rule), updatedAt: new Date() })
      .where('key', '=', key)
      .execute();
    return rule;
  }

  async delete(key: string): Promise<void> {
    await this.connection()
      .query.deleteFrom(RULES)
      .where('key', '=', key)
      .execute();
  }
}

function toValues(rule: DefaultAccessRule): Record<string, unknown> {
  return {
    key: rule.key,
    resourceType: rule.resource.type,
    resourceId: rule.resource.id,
    actions: JSON.stringify(rule.actions),
  };
}

function fromRow(row: object): DefaultAccessRule {
  const value = row as Record<string, unknown>;
  return {
    key: String(value.key),
    resource: {
      type: String(value.resourceType),
      id: String(value.resourceId),
    },
    actions: parseJson<readonly RuleAction[]>(value.actions, []),
  };
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
}
