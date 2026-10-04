import type {
  AuthorizationCollection,
  DatabaseActionGrant,
  DatabaseAuthorizationFieldRequest,
} from './model.js';

export interface ResolvedDatabaseFields {
  input: '*' | readonly string[];
  output: '*' | readonly string[];
}

export function resolveDatabaseFields(
  configs: readonly DatabaseActionGrant[],
  action: string,
): ResolvedDatabaseFields {
  const fields = unionFields(configs.map((config) => config.fields));
  return action === 'read'
    ? { input: [], output: fields }
    : { input: fields, output: [] };
}

/**
 * The field allowlist one action's Policy node carries: what a read returns,
 * and what a write accepts. `'*'` becomes the Collection's fields because a
 * Policy node reads an absent allowlist as no fields rather than as every one.
 * For a write that is every field db lets a write name: a Policy naming an
 * auto-increment, generated or version field is refused as a whole, so `'*'`
 * on such a Collection would otherwise fail every write. A primary key with a
 * database default is the database's to assign too, so a create omits it.
 */
export function resolveActionFields(
  action: string,
  fields: ResolvedDatabaseFields,
  collection: AuthorizationCollection,
): readonly string[] {
  if (action === 'read')
    return fields.output === '*' ? collection.fields : fields.output;
  if (fields.input !== '*') return fields.input;
  return action === 'create' && collection.generatedPrimaryKey
    ? collection.writableFields.filter(
        (field) => field !== collection.primaryKey,
      )
    : collection.writableFields;
}

export function databaseFieldsAllowed(
  requested: DatabaseAuthorizationFieldRequest | undefined,
  allowed: ResolvedDatabaseFields,
): boolean {
  const includes = (
    fields: readonly string[] | undefined,
    permitted: '*' | readonly string[],
  ): boolean =>
    fields === undefined ||
    permitted === '*' ||
    fields.every((field) => permitted.includes(field));
  return (
    includes(requested?.input, allowed.input) &&
    includes(requested?.output, allowed.output) &&
    includes(requested?.filter, allowed.output) &&
    includes(requested?.sort, allowed.output) &&
    includes(requested?.group, allowed.output)
  );
}

export function databaseCollectionFieldsKnown(
  collection: AuthorizationCollection,
  requested: DatabaseAuthorizationFieldRequest | undefined,
): boolean {
  const registered = new Set(collection.fields);
  return [
    requested?.input,
    requested?.output,
    requested?.filter,
    requested?.sort,
    requested?.group,
  ].every(
    (fields) =>
      fields === undefined || fields.every((field) => registered.has(field)),
  );
}

function unionFields(
  values: readonly ('*' | readonly string[] | undefined)[],
): '*' | readonly string[] {
  return values.includes('*')
    ? '*'
    : [...new Set(values.flatMap((value) => value ?? []))];
}
