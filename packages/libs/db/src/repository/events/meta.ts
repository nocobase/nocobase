import { RepositoryError } from '../errors.js';
import type {
  RepositoryEventMeta,
  RepositoryEventMetaBag,
  RepositoryEventMetaEntry,
} from './types.js';

/**
 * Define a namespace for metadata a write passes to its mutation event, for
 * example who made the change. The handle builds the entries a write
 * method's `meta` option takes and reads the value back from an event,
 * typed, without an assertion.
 *
 * ```ts
 * const audit = defineRepositoryEventMeta<{ actorId: string }>('audit');
 * await repository.updateOne({ filter, values, meta: [audit({ actorId })] });
 * audit.read(event); // { actorId: string } | undefined
 * ```
 *
 * Metadata reaches every row change of the call, nested writes included.
 * Writes made by a listener do not inherit it. It is not the `context` of
 * filter and value variables, and no Policy reads it.
 */
export function defineRepositoryEventMeta<T>(
  namespace: string,
): RepositoryEventMeta<T> {
  if (typeof namespace !== 'string' || namespace.length === 0) {
    throw new TypeError(
      'defineRepositoryEventMeta() needs a non-empty namespace.',
    );
  }
  const entry = (value: T): RepositoryEventMetaEntry<T> =>
    Object.freeze({ kind: 'repositoryEventMeta', namespace, value });
  return Object.assign(entry, {
    namespace,
    read(source: { readonly meta: RepositoryEventMetaBag }): T | undefined {
      return Object.hasOwn(source.meta, namespace)
        ? (source.meta[namespace] as T)
        : undefined;
    },
  });
}

/** The bag an event carries for a write's `meta` option; one value per namespace. */
export function normalizeRepositoryEventMeta(
  entries: readonly RepositoryEventMetaEntry[] | undefined,
  collection: string,
): RepositoryEventMetaBag | undefined {
  if (entries === undefined) return undefined;
  if (!Array.isArray(entries)) {
    invalidMeta('meta must be an array of event metadata entries.', collection);
  }
  const bag: Record<string, unknown> = {};
  entries.forEach((entry: unknown, index) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      (entry as Partial<RepositoryEventMetaEntry>).kind !==
        'repositoryEventMeta' ||
      typeof (entry as Partial<RepositoryEventMetaEntry>).namespace !== 'string'
    ) {
      invalidMeta(
        'meta entries must be built by a defineRepositoryEventMeta() handle.',
        collection,
        index,
      );
    }
    const { namespace, value } = entry as RepositoryEventMetaEntry;
    if (Object.hasOwn(bag, namespace)) {
      invalidMeta(
        `meta names namespace "${namespace}" more than once.`,
        collection,
        index,
      );
    }
    bag[namespace] = value;
  });
  return Object.freeze(bag);
}

function invalidMeta(
  message: string,
  collection: string,
  index?: number,
): never {
  throw new RepositoryError('INVALID_MUTATION', message, {
    collection,
    path: index === undefined ? ['meta'] : ['meta', index],
  });
}
