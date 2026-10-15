import type {
  CollectionDefinition,
  PrimaryConstraintDefinition,
  UniqueConstraintDefinition,
} from '../../collection/types.js';
import { RepositoryError } from '../errors.js';
import type {
  FilterAst,
  FilterNode,
  RepositoryRecord,
  UniqueSelector,
} from '../types.js';

/**
 * The record selector's preferred key, required by the filter and unchanged
 * by the write. Never substitute a secondary key for the original identity:
 * a trigger can reassign that key while leaving the primary key unchanged.
 * Only equalities under AND are mandatory; a key inside OR proves nothing.
 * Relational filters retain the read-before-write path, as do keys compared
 * with a different collation or updated by this mutation.
 */
export function unchangedFilterSelector(
  collection: CollectionDefinition,
  filter: FilterAst,
  values: RepositoryRecord,
): UniqueSelector | undefined {
  // A parent's unique keys do not constrain its traditional inheritance children.
  if (collection.db?.hasInheritedChildren) return undefined;
  const scalar = (node: FilterNode): boolean =>
    node.kind === 'group'
      ? node.items.every(scalar)
      : node.kind === 'condition' && node.path.length === 1;
  if (!scalar(filter.root)) return undefined;
  const equalities = new Map<string, string | number | boolean>();
  const visit = (node: FilterNode): void => {
    if (node.kind === 'group') {
      if (node.logic === 'and') node.items.forEach(visit);
    } else if (
      node.kind === 'condition' &&
      node.operator === '$eq' &&
      node.mode !== 'insensitive' &&
      !node.jsonPath?.length &&
      (typeof node.value === 'string' ||
        typeof node.value === 'number' ||
        typeof node.value === 'boolean')
    ) {
      equalities.set(node.path[0], node.value);
    }
  };
  visit(filter.root);
  // Referential actions can reach this row through self-references or a
  // cycle through other tables, even without a Repository relation write.
  const indirectlyWritten = new Set(
    (collection.constraints ?? []).flatMap((candidate) =>
      candidate.type === 'foreignKey' &&
      (candidate.onUpdate === 'cascade' ||
        candidate.onUpdate === 'set null' ||
        candidate.onUpdate === 'set default')
        ? candidate.fields
        : [],
    ),
  );
  const constraint = identityConstraints(collection)[0];
  if (
    !constraint ||
    constraint.deferrable ||
    constraint.db?.valid === false ||
    constraint.db?.columnEquality === false ||
    !constraint.fields.every(
      (field) =>
        equalities.has(field) &&
        !Object.hasOwn(values, field) &&
        !indirectlyWritten.has(field) &&
        collection.fields?.find((definition) => definition.name === field)?.db
          ?.generated === undefined &&
        field !== collection.optimisticLock?.field,
    )
  )
    return undefined;
  return {
    kind: 'unique',
    fields: [...constraint.fields],
    values: Object.fromEntries(
      constraint.fields.map((field) => [field, equalities.get(field)]),
    ),
  };
}

export function identityConstraints(
  collection: CollectionDefinition,
): Array<PrimaryConstraintDefinition | UniqueConstraintDefinition> {
  return (collection.constraints ?? [])
    .filter(
      (
        constraint,
      ): constraint is
        PrimaryConstraintDefinition | UniqueConstraintDefinition =>
        (constraint.type === 'primary' ||
          (constraint.type === 'unique' && !constraint.predicate)) &&
        constraint.fields.length > 0,
    )
    .sort(
      (left, right) =>
        Number(right.type === 'primary') - Number(left.type === 'primary'),
    );
}

export function recordSelector(
  collection: CollectionDefinition,
  record: RepositoryRecord,
): UniqueSelector {
  const constraint = identityConstraints(collection).find((candidate) =>
    candidate.fields.every(
      (field) => record[field] !== undefined && record[field] !== null,
    ),
  );
  if (!constraint) {
    throw new RepositoryError(
      'INVALID_UNIQUE_SELECTOR',
      'Repository record requires a complete, non-null primary or unconditional unique selector.',
      { collection: collection.name },
    );
  }
  return {
    kind: 'unique',
    fields: [...constraint.fields],
    values: Object.fromEntries(
      constraint.fields.map((field) => [field, record[field]]),
    ),
  };
}

export function createdRecordSelector(
  collection: CollectionDefinition,
  values: RepositoryRecord,
  returned: unknown,
): UniqueSelector {
  const record = { ...values };
  const generated = (collection.fields ?? []).filter(
    (field) =>
      !('target' in field) &&
      (field.autoIncrement || field.type === 'increments'),
  );
  const insertId: unknown = Array.isArray(returned) ? returned[0] : undefined;
  // Drivers without RETURNING may supply one generated numeric identity, not a value for every primary field.
  if (
    generated.length === 1 &&
    (typeof insertId === 'number' ||
      typeof insertId === 'string' ||
      typeof insertId === 'bigint')
  ) {
    const field = generated[0].name;
    if (record[field] === undefined) record[field] = insertId;
  }
  return recordSelector(collection, record);
}
