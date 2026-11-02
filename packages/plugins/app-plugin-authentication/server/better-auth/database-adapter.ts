import type {
  ComparisonOperator,
  DatabaseConnection,
  DeleteQuery,
  Expression,
  ExpressionBuilder,
  SelectQuery,
  SqlBool,
  UpdateQuery,
} from '@nocobase/db';
import type { BetterAuthOptions, DBAdapterInstance, Where } from 'better-auth';
import { createAdapterFactory, type CustomAdapter } from 'better-auth/adapters';
import type { Knex } from 'knex';

export interface DatabaseAdapterOptions {
  debugLogs?: boolean;
  initializeUser?(
    user: Record<string, unknown>,
    connection: DatabaseConnection,
  ): Promise<void>;
}

type CleanWhere = Required<Where>;

function conditionExpression(
  eb: ExpressionBuilder,
  condition: CleanWhere,
): Expression<SqlBool> {
  const { field, value, operator } = condition;
  if (value === null) {
    return eb(field, operator === 'ne' ? 'is not' : 'is', null);
  }
  if (operator === 'in' || operator === 'not_in') {
    return eb(
      field,
      operator === 'in' ? 'in' : 'not in',
      Array.isArray(value) ? value : [value],
    );
  }
  if (
    operator === 'contains' ||
    operator === 'starts_with' ||
    operator === 'ends_with'
  ) {
    const pattern =
      operator === 'contains'
        ? `%${value}%`
        : operator === 'starts_with'
          ? `${value}%`
          : `%${value}`;
    return eb(field, 'like', pattern);
  }
  const sqlOperator = {
    eq: '=',
    ne: '<>',
    lt: '<',
    lte: '<=',
    gt: '>',
    gte: '>=',
  }[operator] as ComparisonOperator | undefined;
  if (!sqlOperator) {
    throw new Error(`Unsupported Better Auth operator: ${operator}`);
  }
  return eb(field, sqlOperator, value);
}

function whereExpression(
  eb: ExpressionBuilder,
  where: CleanWhere[],
): Expression<SqlBool> {
  const branches: Array<Array<Expression<SqlBool>>> = [[]];
  for (const condition of where) {
    if (condition.connector === 'OR' && branches.at(-1)!.length) {
      branches.push([]);
    }
    branches.at(-1)!.push(conditionExpression(eb, condition));
  }
  const expressions = branches
    .filter((branch) => branch.length)
    .map((branch) => (branch.length === 1 ? branch[0] : eb.and(branch)));
  return expressions.length === 1 ? expressions[0] : eb.or(expressions);
}

function applySelectWhere(
  query: SelectQuery,
  where: CleanWhere[],
): SelectQuery {
  return where.length ? query.where((eb) => whereExpression(eb, where)) : query;
}

function applyUpdateWhere(
  query: UpdateQuery,
  where: CleanWhere[],
): UpdateQuery {
  return where.length ? query.where((eb) => whereExpression(eb, where)) : query;
}

function applyDeleteWhere(
  query: DeleteQuery,
  where: CleanWhere[],
): DeleteQuery {
  return where.length ? query.where((eb) => whereExpression(eb, where)) : query;
}

function equalityCondition(field: string, value: unknown): CleanWhere {
  return {
    field,
    value: value as CleanWhere['value'],
    operator: 'eq',
    connector: 'AND',
    mode: 'sensitive',
  };
}

async function resolveInsensitiveWhere(
  connection: DatabaseConnection,
  model: string,
  where: CleanWhere[] = [],
): Promise<CleanWhere[]> {
  if (
    !where.some(
      (condition) =>
        condition.mode === 'insensitive' && typeof condition.value === 'string',
    )
  ) {
    return where;
  }
  const knex = await connection.client<Knex>();
  return Promise.all(
    where.map(async (condition) => {
      const { field, value, operator, mode } = condition;
      if (mode !== 'insensitive' || typeof value !== 'string') {
        return condition;
      }

      // Let the Database Query API resolve logical model/field names first. The
      // stable lowercase aliases keep this small raw fallback independent of the
      // configured naming strategy.
      const source = connection.query
        .selectFrom(model)
        .select(['id as authrecordid', `${field} as authcomparevalue`])
        .compile();
      const query = knex
        .from(
          knex.raw(`(${source.sql}) as ??`, [
            ...(source.parameters as readonly Knex.RawBinding[]),
            'authsource',
          ]),
        )
        .select({ id: 'authrecordid' });
      if (
        operator === 'contains' ||
        operator === 'starts_with' ||
        operator === 'ends_with'
      ) {
        const pattern =
          operator === 'contains'
            ? `%${value}%`
            : operator === 'starts_with'
              ? `${value}%`
              : `%${value}`;
        query.whereRaw('lower(??) like lower(?)', [
          'authcomparevalue',
          pattern,
        ]);
      } else {
        const sqlOperator =
          operator === 'eq'
            ? '='
            : operator === 'ne'
              ? '<>'
              : operator === 'lt'
                ? '<'
                : operator === 'lte'
                  ? '<='
                  : operator === 'gt'
                    ? '>'
                    : operator === 'gte'
                      ? '>='
                      : undefined;
        if (!sqlOperator) {
          return condition;
        }
        query.whereRaw(`lower(??) ${sqlOperator} lower(?)`, [
          'authcomparevalue',
          value,
        ]);
      }
      const ids = (await query).map((row) => row.id);
      return {
        ...condition,
        field: 'id',
        value: ids,
        operator: 'in',
        mode: 'sensitive',
      };
    }),
  );
}

function buildCustomAdapter(
  connection: DatabaseConnection,
  fieldsForModel: (model: string) => string[],
  mapField: (model: string, field: string) => string,
  isUserModel: (model: string) => boolean,
  options: DatabaseAdapterOptions,
): CustomAdapter {
  return {
    async create({ model, data, select }) {
      if (isUserModel(model) && options.initializeUser) {
        await connection.transaction(async (transaction) => {
          await transaction.query.insertInto(model).values(data).execute();
          await options.initializeUser!(data, transaction);
        });
      } else {
        await connection.query.insertInto(model).values(data).execute();
      }
      return (await connection.query
        .selectFrom(model)
        .select(select?.length ? select : fieldsForModel(model))
        .where('id', '=', data.id)
        .executeTakeFirst()) as typeof data;
    },
    async findOne({ model, where, select, join }) {
      if (join) {
        throw new Error(
          'Better Auth joins are not enabled by the NocoBase database adapter',
        );
      }
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      return (
        (await applySelectWhere(connection.query.selectFrom(model), normalized)
          .select(select?.length ? select : fieldsForModel(model))
          .executeTakeFirst()) ?? null
      );
    },
    async findMany({ model, where, limit, select, sortBy, offset, join }) {
      if (join) {
        throw new Error(
          'Better Auth joins are not enabled by the NocoBase database adapter',
        );
      }
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      let query = applySelectWhere(
        connection.query.selectFrom(model),
        normalized,
      ).select(select?.length ? select : fieldsForModel(model));
      if (sortBy) {
        query = query.orderBy(mapField(model, sortBy.field), sortBy.direction);
      } else if (offset != null) {
        query = query.orderBy('id');
      }
      if (limit != null) {
        query = query.limit(limit);
      }
      if (offset != null) {
        query = query.offset(offset);
      }
      return query.execute();
    },
    async update({ model, where, update }) {
      if (!where.length) {
        return null;
      }
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      const existing = await applySelectWhere(
        connection.query.selectFrom(model),
        normalized,
      )
        .select('id')
        .executeTakeFirst();
      if (!existing) {
        return null;
      }
      await connection.query
        .updateTable(model)
        .set(update as Record<string, unknown>)
        .where('id', '=', existing.id)
        .execute();
      return (
        (await connection.query
          .selectFrom(model)
          .select(fieldsForModel(model))
          .where('id', '=', existing.id)
          .executeTakeFirst()) ?? null
      );
    },
    async updateMany({ model, where, update }) {
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      const result = await applyUpdateWhere(
        connection.query
          .updateTable(model)
          .set(update as Record<string, unknown>),
        normalized,
      ).execute();
      return result.updatedCount ?? 0;
    },
    async delete({ model, where }) {
      if (!where.length) {
        return;
      }
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      await applyDeleteWhere(
        connection.query.deleteFrom(model),
        normalized,
      ).execute();
    },
    async deleteMany({ model, where }) {
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      const result = await applyDeleteWhere(
        connection.query.deleteFrom(model),
        normalized,
      ).execute();
      return result.deletedCount ?? 0;
    },
    async consumeOne<T>({
      model,
      where,
    }: {
      model: string;
      where: CleanWhere[];
    }): Promise<T | null> {
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      while (true) {
        const existing = await applySelectWhere(
          connection.query.selectFrom(model),
          normalized,
        )
          .select(fieldsForModel(model))
          .executeTakeFirst<Record<string, unknown>>();
        if (!existing) {
          return null;
        }
        const result = await applyDeleteWhere(
          connection.query.deleteFrom(model),
          normalized,
        )
          .where('id', '=', existing.id as CleanWhere['value'])
          .execute();
        if (result.deletedCount === 1) {
          return existing as T;
        }
      }
    },
    async incrementOne<T>({
      model,
      where,
      increment,
      set,
    }: {
      model: string;
      where: CleanWhere[];
      increment: Record<string, number>;
      set?: Record<string, unknown>;
    }): Promise<T | null> {
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      while (true) {
        const existing = await applySelectWhere(
          connection.query.selectFrom(model),
          normalized,
        )
          .select(fieldsForModel(model))
          .executeTakeFirst<Record<string, unknown>>();
        if (!existing) {
          return null;
        }
        const update = { ...set };
        const snapshotGuards: CleanWhere[] = [];
        for (const [field, delta] of Object.entries(increment)) {
          const current = existing[field];
          update[field] = Number(current) + delta;
          snapshotGuards.push(equalityCondition(field, current));
        }
        let query = applyUpdateWhere(
          connection.query.updateTable(model).set(update),
          normalized,
        ).where('id', '=', existing.id as CleanWhere['value']);
        for (const guard of snapshotGuards) {
          query = query.where(guard.field, '=', guard.value);
        }
        const result = await query.execute();
        if (result.updatedCount === 1) {
          return (await connection.query
            .selectFrom(model)
            .select(fieldsForModel(model))
            .where('id', '=', existing.id as CleanWhere['value'])
            .executeTakeFirst()) as T;
        }
      }
    },
    async count({ model, where }) {
      const normalized = await resolveInsensitiveWhere(
        connection,
        model,
        where,
      );
      const row = await applySelectWhere(
        connection.query.selectFrom(model),
        normalized,
      )
        .select(({ fn }) => [fn.countAll().as('count')])
        .executeTakeFirst<{ count: number | string }>();
      return Number(row?.count ?? 0);
    },
  };
}

export function databaseAdapter(
  connection: DatabaseConnection,
  options: DatabaseAdapterOptions = {},
): DBAdapterInstance {
  let betterAuthOptions: BetterAuthOptions | undefined;
  const factory = (currentConnection: DatabaseConnection): DBAdapterInstance =>
    createAdapterFactory({
      config: {
        adapterId: 'nocobase-database',
        adapterName: 'NocoBase Database',
        debugLogs: options.debugLogs,
        supportsJSON: false,
        supportsDates: true,
        supportsBooleans: true,
        supportsNumericIds: false,
        customTransformOutput: ({ data, fieldAttributes }) =>
          fieldAttributes.type === 'date' && typeof data === 'string'
            ? new Date(data)
            : data,
        transaction: async (callback) => {
          if (!betterAuthOptions) {
            throw new Error('Better Auth adapter is not initialized');
          }
          return currentConnection.transaction(async (transaction) =>
            callback(factory(transaction)(betterAuthOptions!)),
          );
        },
      },
      adapter: ({
        options: initializedOptions,
        schema,
        getDefaultModelName,
        getFieldName,
      }) => {
        betterAuthOptions = initializedOptions;
        const fieldsForModel = (model: string) => {
          const defaultModel = getDefaultModelName(model);
          const fields = new Set([
            'id',
            ...Object.keys(schema[defaultModel]?.fields ?? {}),
          ]);
          return [...fields].map((field) =>
            getFieldName({ model: defaultModel, field }),
          );
        };
        return buildCustomAdapter(
          currentConnection,
          fieldsForModel,
          (model, field) =>
            getFieldName({ model: getDefaultModelName(model), field }),
          (model) => getDefaultModelName(model) === 'user',
          options,
        );
      },
    });
  return factory(connection);
}
