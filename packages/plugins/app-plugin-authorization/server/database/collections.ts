import {
  isDatabaseTransactionOf,
  writableFields,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import type {
  AuthorizationCollection,
  ResolveAuthorizationCollection,
} from './model.js';

const relationTypes: ReadonlySet<string> = new Set([
  'belongsTo',
  'hasOne',
  'hasMany',
  'belongsToMany',
]);

/**
 * Reads one Collection's metadata from db. db's registry caches, so this stays
 * a plain lookup rather than a second cache that could disagree with it.
 */
export function collectionResolver(
  connection: DatabaseConnection,
  database?: DatabaseManager,
  transaction?: DatabaseConnection,
): ResolveAuthorizationCollection {
  return async (name) => {
    const parts = name.split('.');
    if (transaction && !isDatabaseTransactionOf(transaction, connection))
      throw new TypeError(
        'Authorization requires an active transaction on its database connection',
      );
    if (!database || parts.length !== 2)
      return describeCollection(transaction ?? connection, name);
    const [source, collection] = parts;
    const owner = database.connection(source);
    if (transaction && owner !== connection)
      throw new TypeError(
        `Authorization cannot read data source "${source}" in this transaction`,
      );
    const resolved = await describeCollection(transaction ?? owner, collection);
    return (
      resolved && {
        ...resolved,
        name,
        relations: Object.fromEntries(
          Object.entries(resolved.relations ?? {}).map(([key, relation]) => [
            key,
            {
              ...relation,
              target: `${source}.${relation.target}`,
              ...(relation.through
                ? { through: `${source}.${relation.through}` }
                : {}),
            },
          ]),
        ),
      }
    );
  };
}

export async function describeCollection(
  connection: DatabaseConnection,
  name: string,
): Promise<AuthorizationCollection | undefined> {
  const definition = await connection.collections.get(name);
  if (!definition) return undefined;
  // A relation is governed by a Policy's `relations`, never by a field list.
  const fields = (definition.fields ?? [])
    .filter((field) => !relationTypes.has(field.type))
    .map((field) => field.name);
  const primary = definition.constraints?.find(
    (constraint) => constraint.type === 'primary',
  );
  const primaryKey = primary?.fields[0] ?? 'id';
  const keyField = definition.fields?.find(
    (field) => field.name === primaryKey,
  );
  return {
    name,
    fields,
    writableFields: writableFields(definition),
    relations: Object.fromEntries(
      (definition.fields ?? []).flatMap((field) =>
        relationTypes.has(field.type) &&
        'target' in field &&
        typeof field.target === 'string'
          ? [
              [
                field.name,
                {
                  target: field.target,
                  ...('through' in field ? { through: field.through } : {}),
                },
              ],
            ]
          : [],
      ),
    ),
    primaryKey,
    generatedPrimaryKey:
      keyField !== undefined &&
      (keyField.autoIncrement === true ||
        keyField.defaultValue !== undefined ||
        keyField.db?.defaultExpression !== undefined ||
        keyField.db?.generated !== undefined),
  };
}
