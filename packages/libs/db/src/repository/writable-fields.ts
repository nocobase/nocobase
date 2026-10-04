import type { ConnectionCollections } from '../collection/registry/types.js';
import type {
  AnyFieldDefinition,
  CollectionDefinition,
  FieldDefinition,
  RelationFieldDefinition,
} from '../collection/types.js';
import { invalid } from './internal/guards.js';
import { identityConstraints } from './internal/identity.js';
import {
  invalidWritePolicy,
  type FieldWritePolicy,
  type PolicyPath,
  type ThroughWritePolicy,
  type WritePolicy,
} from './write-policy.js';

/** One way a write policy does not fit a Collection: where in the policy, and why. */
export interface WritePolicyProblem {
  /** The offending member, such as `['relations', 'tags', 'create', 'fields', 0]`. */
  readonly path: readonly (string | number)[];
  readonly message: string;
}

/**
 * Whether the database or the Repository assigns a scalar field's value, so no write may name it: an `increments` or
 * auto-increment column, a generated column, or the optimistic-lock version.
 */
export function isManagedField(
  collection: CollectionDefinition,
  field: FieldDefinition,
): boolean {
  return (
    field.type === 'increments' ||
    field.autoIncrement === true ||
    field.db?.generated !== undefined ||
    collection.optimisticLock?.field === field.name
  );
}

/**
 * The fields of a Collection a write may name: every scalar field the database and the Repository leave to the caller.
 * A relation is written through a policy's `relations`, never through its field list. This is the list a write policy's
 * `fields` must stay within.
 */
export function writableFields(collection: CollectionDefinition): string[] {
  return (collection.fields ?? [])
    .filter(
      (field): field is FieldDefinition =>
        isScalarField(field) && !isManagedField(collection, field),
    )
    .map((field) => field.name);
}

/**
 * Every member of a write policy that does not fit the Collection metadata: a field that is missing or not a writable
 * scalar, a relation that does not exist or whose target is missing, and `through` on anything but a `belongsToMany`.
 * The same checks a write runs before it starts, which would refuse the policy with `INVALID_WRITE_POLICY`, collected
 * rather than thrown so configuration can be checked when it is saved.
 */
export async function writePolicyProblems(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  policy: WritePolicy,
): Promise<WritePolicyProblem[]> {
  const problems: WritePolicyProblem[] = [];
  await walkWritePolicy(collections, collection, policy, [], {
    report: (message, path) => {
      problems.push({ path, message });
    },
    target: async (relation, path) => {
      const target = await collections.get(relation.target);
      if (!target)
        problems.push({
          path,
          message: `Relation target "${relation.target}" does not exist.`,
        });
      return target;
    },
  });
  return problems;
}

/** Throws `INVALID_WRITE_POLICY` for the first field of `policy` that is not writable. */
export function validatePolicyFields(
  collection: CollectionDefinition,
  policy: FieldWritePolicy,
  path: PolicyPath,
  managed: readonly string[] = [],
): void {
  fieldProblems(collection, policy, path, managed, invalidWritePolicy);
}

/** Throws for the first member of `policy` that does not fit the Collection metadata. */
export async function validateWritePolicyMetadata(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  policy: true | WritePolicy,
  path: PolicyPath = ['writePolicy'],
): Promise<void> {
  if (policy === true) return;
  await walkWritePolicy(collections, collection, policy, path, {
    report: invalidWritePolicy,
    target: async (relation, rulePath) => {
      const target = await collections.get(relation.target);
      if (!target)
        invalid(
          'COLLECTION_NOT_FOUND',
          `Relation target "${relation.target}" does not exist.`,
          {
            collection: relation.target,
            relation: relation.name,
            path: rulePath,
          },
        );
      return target;
    },
  });
}

interface WalkOptions {
  readonly report: (message: string, path: PolicyPath) => void;
  readonly target: (
    relation: RelationFieldDefinition,
    path: PolicyPath,
  ) => Promise<CollectionDefinition | undefined>;
}

function fieldProblems(
  collection: CollectionDefinition,
  policy: FieldWritePolicy,
  path: PolicyPath,
  managed: readonly string[],
  report: WalkOptions['report'],
): void {
  for (const [index, name] of (policy.fields || []).entries()) {
    const field = collection.fields?.find((field) => field.name === name);
    if (
      !field ||
      !isScalarField(field) ||
      isManagedField(collection, field) ||
      managed.includes(name)
    )
      report(
        `Field "${name}" is not a writable scalar field of "${collection.name}".`,
        [...path, 'fields', index],
      );
  }
}

async function walkWritePolicy(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  policy: WritePolicy,
  path: PolicyPath,
  options: WalkOptions,
): Promise<void> {
  fieldProblems(collection, policy, path, [], options.report);
  for (const [name, rule] of Object.entries(policy.relations || {})) {
    const relation = collection.fields?.find((field) => field.name === name);
    const rulePath = [...path, 'relations', name];
    if (!relation || isScalarField(relation)) {
      options.report(
        `Relation "${name}" does not exist on "${collection.name}".`,
        rulePath,
      );
      continue;
    }
    const target = await options.target(relation, rulePath);
    if (!target) continue;
    for (const operation of ['create', 'update'] as const) {
      const config = rule[operation];
      if (config)
        await walkWritePolicy(
          collections,
          target,
          config,
          [...rulePath, operation],
          options,
        );
    }
    if (rule.upsert) {
      await walkWritePolicy(
        collections,
        target,
        rule.upsert.create,
        [...rulePath, 'upsert', 'create'],
        options,
      );
      await walkWritePolicy(
        collections,
        target,
        rule.upsert.update,
        [...rulePath, 'upsert', 'update'],
        options,
      );
    }
    for (const operation of ['create', 'connect', 'set'] as const) {
      const config: ThroughWritePolicy | undefined = rule[operation];
      if (!config?.through) continue;
      const throughPath = [...rulePath, operation, 'through'];
      if (relation.type !== 'belongsToMany' || !relation.through) {
        options.report(
          'through requires a belongsToMany relation.',
          throughPath,
        );
        continue;
      }
      const through = await collections.get(relation.through);
      if (!through) {
        options.report('Through collection does not exist.', throughPath);
        continue;
      }
      // The junction keys and its primary key are the relation's to maintain.
      fieldProblems(
        through,
        config.through,
        throughPath,
        [
          relation.foreignKey,
          relation.otherKey,
          ...primaryFields(through),
        ].filter((name): name is string => typeof name === 'string'),
        options.report,
      );
    }
  }
}

function isScalarField(field: AnyFieldDefinition): field is FieldDefinition {
  return !('target' in field);
}

function primaryFields(collection: CollectionDefinition): string[] {
  return (
    identityConstraints(collection).find(
      (constraint) => constraint.type === 'primary',
    )?.fields ?? []
  );
}
