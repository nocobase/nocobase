import type { CollectionDefinition } from '../collection/types.js';
import type { RepositoryRecord } from './types.js';
import { identityConstraints } from './internal/identity.js';

const identities = new WeakMap<object, Readonly<RepositoryRecord>>();

/** Internal mutation metadata stays separate from the public projection and is never serialized. */
export function rememberMutationIdentity<T extends object>(
  result: T,
  collection: CollectionDefinition,
  record: RepositoryRecord,
): T {
  const identity = identityConstraints(collection).find((constraint) =>
    constraint.fields.every(
      (field) => record[field] !== undefined && record[field] !== null,
    ),
  );
  if (identity)
    identities.set(
      result,
      Object.freeze(
        Object.fromEntries(
          identity.fields.map((field) => [field, record[field]]),
        ),
      ),
    );
  return result;
}

/** Trusted server adapters can locate a mutation's root row without requesting or disclosing hidden fields. */
export function getRepositoryMutationIdentity(
  result: object,
): Readonly<RepositoryRecord> | undefined {
  return identities.get(result);
}
