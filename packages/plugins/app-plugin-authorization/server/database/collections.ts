import {
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
): ResolveAuthorizationCollection {
  return async (name) => {
    const parts = name.split('.');
    if (!database || parts.length !== 2)
      return describeCollection(connection, name);
    const [source, collection] = parts;
    const resolved = await describeCollection(
      database.connection(source),
      collection,
    );
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
  const physical = await connection.collections.getPhysical(name);
  const column = physical?.primaryKey?.columns[0];
  const primary = definition.constraints?.find(
    (constraint) => constraint.type === 'primary',
  );
  const primaryKey = primary?.fields[0] ?? column ?? 'id';
  const schema = physical?.columns.find(
    (candidate) => candidate.columnName === (column ?? primaryKey),
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
      schema !== undefined &&
      (schema.autoIncrement ||
        schema.default !== undefined ||
        schema.generated !== undefined),
  };
}
