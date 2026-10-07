/**
 * Vector collections over a pluggable vector store, with the queue that embeds their items.
 *
 * - **Stores.** `stores` registers the store types, like model providers; `sqlite-vec` and `pgvector` are there by
 *   default. The configuration names one (`agents.vectors.store`, `sqlite-vec` by default; `false` turns vectors off),
 *   apart from the application's database. When the store is unavailable (sqlite-vec cannot load, pgvector cannot be
 *   reached or has no extension), every collection says why with a code, queues nothing and its search answers null,
 *   so the caller falls back to keyword search.
 * - **Indexes.** An index is one collection's items embedded with one model at one dimension (`agVectorIndexes`),
 *   named `<collection>_<hash of store type and target, model, dimension and metric>`. Only the indexes of the store
 *   configured now are used: pointing the store elsewhere retires the others and builds the index again there. The
 *   registry and the queue stay in the application's database, so they change with the writes they follow.
 *   `sync()` reads the collection's model: when its
 *   index is not there it is created and every item of the collection's `items()` queued for it (`sync` returns once
 *   they are queued; the worker embeds them in the background), while the ready
 *   index keeps answering searches; once everything was queued and nothing is pending, it becomes ready and the
 *   older indexes are retired (dropped from the store). The dimension is the model's configured one
 *   (`dimensionsOf`), else what one probe embedding answers.
 * - **Writes** go to every index not retired (the ready one and the one being built). An item is an entry of each
 *   (`agVectorEntries`) keyed by its id, with the hash of its text: an unchanged text only has its metadata updated in
 *   the store; a changed or new one is queued.
 * - **The worker** of each instance takes due entries with a lease (so two instances never embed the same entry),
 *   at most `BATCH` of one index at a time, lets the collection `prepare` their texts, embeds them in one call,
 *   upserts them into the store and marks them done, dropping their text. A failure backs off exponentially; after
 *   `MAX_ATTEMPTS` the entry is `failed` until the item is written again.
 */
import { createHash, randomUUID } from 'node:crypto';

import { resolve } from 'node:path';

import type { DatabaseConnection } from '@nocobase/db';

import type { ModelRef } from '../../shared/models.js';
import type { Clock } from '../kernel/clock.js';
import type { IdSource } from '../kernel/ids.js';
import type { TxRunner } from '../kernel/tx.js';
import { pgvectorStoreType } from './pgvector.js';
import { SQLITE_VEC, sqliteVecStoreType } from './sqlite-vec.js';
import type {
  Embedder,
  VectorCollection,
  VectorCollectionSpec,
  VectorCollectionStatus,
  VectorFilter,
  VectorIndexInfo,
  VectorItemState,
  VectorMatch,
  VectorMetadata,
  VectorMetric,
  VectorProblem,
  Vectors,
  VectorsConfig,
  VectorSourceItem,
  VectorStore,
  VectorStoreInfo,
  VectorStoreRegistry,
  VectorStoreType,
} from './types.js';

const INDEXES = 'agVectorIndexes';
const ENTRIES = 'agVectorEntries';

/** Values per embedding call. */
export const BATCH = 64;
export const MAX_ATTEMPTS = 5;
/** The first retry's delay; each further one doubles, up to `BACKOFF_MAX_MS`. */
export const BACKOFF_MS = 5_000;
const BACKOFF_MAX_MS = 10 * 60_000;
/** How long a worker holds the entries it took. */
const LEASE_MS = 5 * 60_000;
/** How often an idle worker looks for due entries. */
const POLL_MS = 3_000;
/** How long an unavailable store is believed before it is asked again. */
const RECHECK_MS = 60_000;
const ERROR_MAX = 1000;

interface IndexRecord {
  readonly name: string;
  readonly collection: string;
  readonly storeType: string;
  readonly storeTarget: string;
  readonly modelService: string;
  readonly model: string;
  readonly dimension: number | string;
  readonly metric: string;
  readonly status: 'building' | 'ready' | 'retired';
  readonly enumeratedAt: string | Date | null;
  readonly createdAt: string | Date;
  readonly readyAt: string | Date | null;
}

interface EntryRecord {
  readonly id: string;
  readonly indexName: string;
  readonly itemId: string;
  readonly hash: string;
  readonly text: string | null;
  readonly variant: string | null;
  readonly metadata: unknown;
  readonly state: 'pending' | 'done' | 'failed';
  readonly attempts: number | string;
  readonly nextAt: number | string;
  readonly error: string | null;
  readonly leaseUntil: number | string | null;
  readonly leasedBy: string | null;
  readonly updatedAt: string | Date;
}

export interface VectorsDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly embed: Embedder;
  /** The dimension a model is configured to answer, when the application knows it. */
  readonly dimensionsOf?: (ref: ModelRef) => Promise<number | null>;
  readonly config?: VectorsConfig;
  /** The application's root and storage directories; the working directory and its `storage` by default. */
  readonly paths?: { readonly root: string; readonly storage: string };
  readonly onError?: (message: string, error: unknown) => void;
  /** How often an idle worker looks; for tests. */
  readonly pollMs?: number;
}

const iso = (value: string | Date | null): string | null =>
  value === null
    ? null
    : value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();

const num = (value: number | string | null): number =>
  value === null ? 0 : Number(value);

function metadataOf(value: unknown): VectorMetadata {
  if (typeof value === 'string')
    try {
      return JSON.parse(value) as VectorMetadata;
    } catch {
      return {};
    }
  return value && typeof value === 'object' ? (value as VectorMetadata) : {};
}

/** The hash an entry keeps of an item's text. */
export function hashOf(
  item: Pick<VectorSourceItem, 'text' | 'variant'>,
): string {
  return createHash('sha256')
    .update(`${item.variant ?? ''}\0${item.text}`)
    .digest('hex');
}

const sameMetadata = (a: VectorMetadata, b: VectorMetadata): boolean => {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.is(a[key], b[key]))
  );
};

/** Whether metadata passes a filter. */
export function matches(
  metadata: VectorMetadata,
  filter: VectorFilter,
): boolean {
  return Object.entries(filter).every(([key, wanted]) => {
    const value = metadata[key];
    if (typeof wanted === 'object' && wanted !== null)
      return wanted.in.some((option) => String(option) === String(value));
    return value !== undefined && String(value) === String(wanted);
  });
}

const stateOf = (entry: EntryRecord): VectorItemState => ({
  id: entry.itemId,
  state: entry.state,
  error: entry.state === 'failed' ? entry.error : null,
  metadata: metadataOf(entry.metadata),
});

const infoOf = (
  record: IndexRecord,
  progress: { readonly indexed: number; readonly total: number },
): VectorIndexInfo => ({
  name: record.name,
  modelService: record.modelService,
  model: record.model,
  dimension: num(record.dimension),
  status: record.status === 'ready' ? 'ready' : 'building',
  createdAt: iso(record.createdAt)!,
  readyAt: iso(record.readyAt),
  ...progress,
});

const backoff = (attempts: number): number =>
  Math.min(BACKOFF_MAX_MS, BACKOFF_MS * 2 ** Math.max(0, attempts - 1));

const NAME = /^[a-z0-9-]{1,40}$/u;

export function createVectorStoreRegistry(): VectorStoreRegistry {
  const types = new Map<string, VectorStoreType>();
  return {
    register(type) {
      types.set(type.type, type);
      return () => {
        if (types.get(type.type) === type) types.delete(type.type);
      };
    },
    get: (type) => types.get(type),
  };
}

interface Registered {
  readonly spec: VectorCollectionSpec;
  /** Indexes this instance is filling from `items()` now. */
  readonly enumerating: Set<string>;
}

export function createVectors(deps: VectorsDeps): Vectors {
  const onError =
    deps.onError ??
    ((message: string, error: unknown) => console.error(message, error));
  const config: VectorsConfig = deps.config ?? {};
  const storeTypeName =
    config.store === false ? null : (config.store ?? SQLITE_VEC);
  const paths = deps.paths ?? {
    root: process.cwd(),
    storage: resolve(process.cwd(), 'storage'),
  };
  const stores = createVectorStoreRegistry();
  stores.register(sqliteVecStoreType);
  stores.register(pgvectorStoreType);
  const collections = new Map<string, Registered>();
  const instance = randomUUID();
  const pollMs = deps.pollMs ?? POLL_MS;

  const indexes = (conn: DatabaseConnection = deps.tx.read()) =>
    conn.repository<IndexRecord>(INDEXES);
  const entries = (conn: DatabaseConnection = deps.tx.read()) =>
    conn.repository<EntryRecord>(ENTRIES);
  const now = () => deps.clock.now();

  // The store, made once from its type; its availability is asked again after `RECHECK_MS` when it was not there.
  let store: VectorStore | null = null;
  let checked: { at: number; problem: VectorProblem | null } | null = null;

  /** The store configured, made once from its type; null when vectors are off or its type is not registered. */
  function configured(): VectorStore | null {
    if (storeTypeName === null) return null;
    const type = stores.get(storeTypeName);
    if (!type) return null;
    if (!store || store.type !== type.type)
      store = type.create({ config, paths });
    return store;
  }

  async function usable(): Promise<
    | { store: VectorStore; reason: null }
    | { store: null; reason: VectorProblem }
  > {
    if (storeTypeName === null)
      return {
        store: null,
        reason: { code: 'VECTORS_OFF', message: 'Vectors are turned off.' },
      };
    const current = configured();
    if (!current)
      return {
        store: null,
        reason: {
          code: 'VECTOR_STORE_UNKNOWN',
          message: `The vector store type ${storeTypeName} is not registered.`,
        },
      };
    const at = Date.now();
    if (!checked || (checked.problem && at - checked.at >= RECHECK_MS)) {
      const answer = await current.available().catch((error: unknown) => ({
        ok: false as const,
        code: 'VECTOR_STORE_FAILED' as const,
        message: error instanceof Error ? error.message : String(error),
      }));
      checked = {
        at,
        problem: answer.ok
          ? null
          : { code: answer.code, message: answer.message },
      };
      if (checked.problem)
        onError(
          `The vector store ${current.type} is unavailable: ${checked.problem.message}`,
          null,
        );
    }
    return checked.problem
      ? { store: null, reason: checked.problem }
      : { store: current, reason: null };
  }

  /** Whether an index lives in `target`, the store configured now. */
  const inStore = (record: IndexRecord, target: VectorStore): boolean =>
    record.storeType === target.type && record.storeTarget === target.target;

  async function liveIndexes(collection: string): Promise<IndexRecord[]> {
    return indexes().findMany({
      filter: (f) =>
        f.and([
          f.string('collection').eq(collection),
          f.string('status').ne('retired'),
        ]),
      sort: (sort) => sort.field('createdAt').asc(),
    });
  }

  /** The newest ready index of a collection in `target`. */
  async function activeOf(
    collection: string,
    target: VectorStore,
  ): Promise<IndexRecord | null> {
    const ready = (await liveIndexes(collection)).filter(
      (record) => record.status === 'ready' && inStore(record, target),
    );
    ready.sort((a, b) =>
      (iso(a.readyAt) ?? '').localeCompare(iso(b.readyAt) ?? ''),
    );
    return ready.at(-1) ?? null;
  }

  // ---- writes ----------------------------------------------------------------------------------------------------

  /** Writes items to the entries of `index`: unchanged text updates metadata, anything else is queued. */
  async function enqueue(
    target: VectorStore,
    index: IndexRecord,
    items: readonly VectorSourceItem[],
  ): Promise<number> {
    let queued = 0;
    const metadataOnly: { id: string; metadata: VectorMetadata }[] = [];
    const unique = new Map(items.map((item) => [item.id, item]));
    const list = [...unique.values()];
    for (let at = 0; at < list.length; at += 100) {
      const batch = list.slice(at, at + 100);
      await deps.tx.run(async ({ conn }) => {
        const existing = new Map(
          (
            await entries(conn).findMany({
              filter: (f) =>
                f.and([
                  f.string('indexName').eq(index.name),
                  f.or(batch.map((item) => f.string('itemId').eq(item.id))),
                ]),
            })
          ).map((entry) => [entry.itemId, entry]),
        );
        const stamp = now();
        for (const item of batch) {
          const hash = hashOf(item);
          const entry = existing.get(item.id);
          const values = {
            hash,
            text: item.text,
            variant: item.variant ?? null,
            metadata: item.metadata,
            state: 'pending' as const,
            attempts: 0,
            nextAt: stamp.getTime(),
            error: null,
            updatedAt: stamp.toISOString(),
          };
          if (!entry) {
            await entries(conn).createOne({
              values: {
                id: deps.ids.next(),
                indexName: index.name,
                itemId: item.id,
                leaseUntil: null,
                leasedBy: null,
                ...values,
              },
            });
            queued += 1;
          } else if (entry.hash === hash && entry.state === 'done') {
            if (!sameMetadata(metadataOf(entry.metadata), item.metadata)) {
              await entries(conn).updateMany({
                filter: { id: entry.id },
                values: {
                  metadata: item.metadata,
                  updatedAt: stamp.toISOString(),
                },
              });
              metadataOnly.push({ id: item.id, metadata: item.metadata });
            }
          } else if (
            entry.hash === hash &&
            entry.state === 'pending' &&
            sameMetadata(metadataOf(entry.metadata), item.metadata)
          ) {
            // Already queued as it is.
          } else {
            await entries(conn).updateMany({
              filter: { id: entry.id },
              values,
            });
            queued += 1;
          }
        }
      });
    }
    if (metadataOnly.length > 0)
      try {
        await target.update(index.name, metadataOnly);
      } catch (error) {
        // Embedded again, the item carries its metadata with it.
        onError(
          `The vector store could not update metadata in ${index.name}; the items are queued again.`,
          error,
        );
        await entries().updateMany({
          filter: (f) =>
            f.and([
              f.string('indexName').eq(index.name),
              f.or(metadataOnly.map((item) => f.string('itemId').eq(item.id))),
            ]),
          values: { state: 'pending', nextAt: now().getTime() },
        });
        queued += metadataOnly.length;
      }
    return queued;
  }

  /** Removes items from `index`'s entries and the store. */
  async function removeFrom(
    target: VectorStore,
    index: IndexRecord,
    which:
      { readonly ids: readonly string[] } | { readonly filter: VectorFilter },
  ): Promise<void> {
    if ('ids' in which) {
      if (which.ids.length === 0) return;
      for (let at = 0; at < which.ids.length; at += 100) {
        const batch = which.ids.slice(at, at + 100);
        await entries().deleteMany({
          filter: (f) =>
            f.and([
              f.string('indexName').eq(index.name),
              f.or(batch.map((id) => f.string('itemId').eq(id))),
            ]),
        });
      }
      await target.delete(index.name, { ids: which.ids });
      return;
    }
    const doomed = (await allEntries(index.name))
      .filter((entry) => matches(metadataOf(entry.metadata), which.filter))
      .map((entry) => entry.itemId);
    for (let at = 0; at < doomed.length; at += 100) {
      const batch = doomed.slice(at, at + 100);
      await entries().deleteMany({
        filter: (f) =>
          f.and([
            f.string('indexName').eq(index.name),
            f.or(batch.map((id) => f.string('itemId').eq(id))),
          ]),
      });
    }
    await target.delete(index.name, { filter: which.filter });
  }

  /** Every entry of an index, its item id and metadata only. */
  async function allEntries(
    indexName: string,
  ): Promise<Pick<EntryRecord, 'itemId' | 'metadata'>[]> {
    return entries().findMany({ filter: { indexName } });
  }

  // ---- indexes ---------------------------------------------------------------------------------------------------

  /** Marks a building index ready when everything was queued and nothing is pending, retiring the older ones. */
  async function settle(index: IndexRecord): Promise<boolean> {
    if (index.status !== 'building' || index.enumeratedAt === null)
      return false;
    const pending = await entries().count({
      filter: { indexName: index.name, state: 'pending' },
    });
    if (pending > 0) return false;
    const claimed = await indexes().updateMany({
      filter: (f) =>
        f.and([
          f.string('name').eq(index.name),
          f.string('status').eq('building'),
        ]),
      values: { status: 'ready', readyAt: now().toISOString() },
    });
    if (claimed.updatedCount !== 1) return false;
    for (const other of await liveIndexes(index.collection))
      if (other.name !== index.name) await retire(other);
    return true;
  }

  async function retire(index: IndexRecord): Promise<void> {
    await indexes().updateMany({
      filter: { name: index.name },
      values: { status: 'retired' },
    });
    await entries().deleteMany({ filter: { indexName: index.name } });
    const { store: target } = await usable();
    if (target)
      await target
        .dropIndex(index.name)
        .catch((error: unknown) =>
          onError(`The vector store could not drop ${index.name}.`, error),
        );
  }

  /** Queues every item of the collection for a building index, then lets it settle. */
  async function enumerate(
    registered: Registered,
    target: VectorStore,
    index: IndexRecord,
  ): Promise<void> {
    if (registered.enumerating.has(index.name)) return;
    registered.enumerating.add(index.name);
    try {
      const seen = new Set<string>();
      for await (const batch of registered.spec.items()) {
        if (collections.get(registered.spec.name) !== registered) return;
        for (const item of batch) seen.add(item.id);
        if ((await enqueue(target, index, batch)) > 0) wake();
      }
      // Entries of items no longer there (removed while the index was built from an older listing).
      const stale = (await allEntries(index.name))
        .map((entry) => entry.itemId)
        .filter((id) => !seen.has(id));
      if (stale.length > 0) await removeFrom(target, index, { ids: stale });
      await indexes().updateMany({
        filter: { name: index.name },
        values: { enumeratedAt: now().toISOString() },
      });
      const fresh = (
        await indexes().findMany({ filter: { name: index.name } })
      )[0];
      if (fresh) await settle(fresh);
      wake();
    } finally {
      registered.enumerating.delete(index.name);
    }
  }

  async function dimensionOf(
    spec: VectorCollectionSpec,
    model: ModelRef,
  ): Promise<number> {
    const configured = await deps.dimensionsOf?.(model);
    if (configured && configured > 0) return configured;
    const probe = await deps.embed({
      model,
      values: ['dimension probe'],
      source: spec.source,
    });
    if (!(probe.dimension > 0))
      throw new Error(
        `The model ${model.modelService}/${model.model} answered no embedding.`,
      );
    return probe.dimension;
  }

  async function sync(registered: Registered): Promise<void> {
    const { spec } = registered;
    const { store: target } = await usable();
    if (!target) return;
    const model = await spec.model();
    if (!model) return;
    const metric: VectorMetric = spec.metric ?? 'cosine';
    const dimension = await dimensionOf(spec, model);
    const name = `${spec.name}_${createHash('sha256')
      .update(
        [
          target.type,
          target.target,
          model.modelService,
          model.model,
          dimension,
          metric,
        ].join('\0'),
      )
      .digest('hex')
      .slice(0, 10)}`;
    // Indexes of another store (or the same type pointed elsewhere) cannot serve from this one.
    for (const other of await liveIndexes(spec.name))
      if (!inStore(other, target)) await retire(other);
    const live = await liveIndexes(spec.name);
    let index = live.find((record) => record.name === name);
    if (index?.status === 'ready') {
      for (const other of live) if (other.name !== name) await retire(other);
      return;
    }
    // Another model's index being built is no longer wanted; the ready one keeps serving.
    for (const other of live)
      if (other.name !== name && other.status === 'building')
        await retire(other);
    await target.createIndex({
      name,
      dimension,
      metric,
      ...(spec.filterable ? { filterable: spec.filterable } : {}),
    });
    if (!index) {
      const stamp = now().toISOString();
      await indexes().deleteMany({ filter: { name } });
      await indexes().createOne({
        values: {
          name,
          collection: spec.name,
          storeType: target.type,
          storeTarget: target.target,
          modelService: model.modelService,
          model: model.model,
          dimension,
          metric,
          status: 'building',
          enumeratedAt: null,
          createdAt: stamp,
          readyAt: null,
        },
      });
      index = (await indexes().findMany({ filter: { name } }))[0]!;
    }
    // Queues every item; the worker embeds them in the background.
    await enumerate(registered, target, index);
  }

  // ---- the worker ------------------------------------------------------------------------------------------------

  let running = false;
  let loop: Promise<void> | null = null;
  let waiting: (() => void) | null = null;
  let abort = new AbortController();

  function wake(): void {
    const resolve = waiting;
    waiting = null;
    resolve?.();
  }

  /** Embeds one batch of due entries; false when nothing was due. */
  async function step(): Promise<boolean> {
    if (collections.size === 0) return false;
    const { store: target } = await usable();
    if (!target) return false;
    const live = (
      await indexes().findMany({
        filter: (f) =>
          f.and([
            f.string('status').ne('retired'),
            f.or(
              [...collections.keys()].map((name) =>
                f.string('collection').eq(name),
              ),
            ),
          ]),
      })
    ).filter((record) => inStore(record, target));
    if (live.length === 0) return false;
    const at = now().getTime();
    const due = (indexName?: string) =>
      entries().findMany({
        filter: (f) =>
          f.and([
            indexName
              ? f.string('indexName').eq(indexName)
              : f.or(live.map((index) => f.string('indexName').eq(index.name))),
            f.string('state').eq('pending'),
            f.number('nextAt').lte(at),
            f.or([
              f.number('leaseUntil').empty(),
              f.number('leaseUntil').lt(at),
            ]),
          ]),
        sort: (sort) => sort.field('nextAt').asc(),
        limit: BATCH,
      });
    const first = (await due()).at(0);
    if (!first) {
      for (const index of live) await settle(index);
      return false;
    }
    const index = live.find((record) => record.name === first.indexName)!;
    const candidates = await due(index.name);
    const leaseUntil = at + LEASE_MS;
    await entries().updateMany({
      filter: (f) =>
        f.and([
          f.or(candidates.map((entry) => f.string('id').eq(entry.id))),
          f.string('state').eq('pending'),
          f.or([f.number('leaseUntil').empty(), f.number('leaseUntil').lt(at)]),
        ]),
      values: { leasedBy: instance, leaseUntil },
    });
    const taken = await entries().findMany({
      filter: (f) =>
        f.and([
          f.string('indexName').eq(index.name),
          f.string('leasedBy').eq(instance),
          f.number('leaseUntil').eq(leaseUntil),
        ]),
    });
    if (taken.length === 0) return true;
    const registered = collections.get(index.collection);
    if (!registered) return true;
    await embedBatch(registered.spec, target, index, taken);
    await settle(index);
    return true;
  }

  async function embedBatch(
    spec: VectorCollectionSpec,
    target: VectorStore,
    index: IndexRecord,
    taken: readonly EntryRecord[],
  ): Promise<void> {
    const release = (
      ids: readonly string[],
      values: Record<string, unknown>,
    ) =>
      ids.length === 0
        ? Promise.resolve()
        : entries().updateMany({
            filter: (f) =>
              f.and([
                f.or(ids.map((id) => f.string('id').eq(id))),
                f.string('leasedBy').eq(instance),
              ]),
            values: {
              leasedBy: null,
              leaseUntil: null,
              updatedAt: now().toISOString(),
              ...values,
            },
          });
    const items: VectorSourceItem[] = taken.map((entry) => ({
      id: entry.itemId,
      text: entry.text ?? '',
      metadata: metadataOf(entry.metadata),
      ...(entry.variant ? { variant: entry.variant } : {}),
    }));
    try {
      const texts = spec.prepare
        ? await spec.prepare(items, abort.signal)
        : items.map((item) => item.text);
      if (texts.length !== items.length)
        throw new Error('The collection prepared a different number of texts.');
      const answer = await deps.embed({
        model: { modelService: index.modelService, model: index.model },
        values: texts,
        source: spec.source,
        signal: abort.signal,
      });
      const dimension = num(index.dimension);
      if (
        answer.embeddings.length !== items.length ||
        answer.embeddings.some((vector) => vector.length !== dimension)
      )
        throw new Error(
          `The model answered embeddings of another dimension than the index's ${dimension}.`,
        );
      await target.upsert(
        index.name,
        items.map((item, at) => ({
          id: item.id,
          vector: answer.embeddings[at],
          metadata: item.metadata,
        })),
      );
      // Done unless the item was written again meanwhile (another hash): then it stays queued for its new text.
      for (const entry of taken)
        await entries().updateMany({
          filter: (f) =>
            f.and([
              f.string('id').eq(entry.id),
              f.string('hash').eq(entry.hash),
              f.string('leasedBy').eq(instance),
            ]),
          values: {
            state: 'done',
            text: null,
            error: null,
            attempts: 0,
            leasedBy: null,
            leaseUntil: null,
            updatedAt: now().toISOString(),
          },
        });
      await release(
        taken.map((entry) => entry.id),
        {},
      );
    } catch (error) {
      if (abort.signal.aborted) {
        await release(
          taken.map((entry) => entry.id),
          {},
        );
        return;
      }
      const message = (
        error instanceof Error ? error.message : String(error)
      ).slice(0, ERROR_MAX);
      onError(
        `Vectors could not embed ${taken.length} items of ${index.name}.`,
        error,
      );
      const stamp = now().getTime();
      for (const entry of taken) {
        const attempts = num(entry.attempts) + 1;
        await release([entry.id], {
          attempts,
          error: message,
          ...(attempts >= MAX_ATTEMPTS
            ? { state: 'failed' }
            : { nextAt: stamp + backoff(attempts) }),
        });
      }
    }
  }

  async function run(): Promise<void> {
    while (running) {
      let worked = false;
      try {
        worked = await step();
      } catch (error) {
        onError('The vector worker failed a step.', error);
      }
      if (worked || !running) continue;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          waiting = null;
          resolve();
        }, pollMs);
        waiting = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    }
  }

  function collection(spec: VectorCollectionSpec): VectorCollection {
    if (!NAME.test(spec.name))
      throw new Error(`The vector collection name ${spec.name} is not usable.`);
    const registered: Registered = { spec, enumerating: new Set() };
    collections.set(spec.name, registered);
    const mine = () => collections.get(spec.name) === registered;

    /** The live indexes to write to, synced first when there are none; null when there is nowhere to write. */
    async function targets(): Promise<{
      store: VectorStore;
      indexes: IndexRecord[];
    } | null> {
      const { store: target } = await usable();
      if (!target || !mine()) return null;
      const here = async () =>
        (await liveIndexes(spec.name)).filter((record) =>
          inStore(record, target),
        );
      let live = await here();
      if (live.length === 0) {
        await sync(registered);
        live = await here();
      }
      return live.length > 0 ? { store: target, indexes: live } : null;
    }

    /** The index item states are read from: the one searches read, else the one being built. */
    async function reported(): Promise<IndexRecord | null> {
      const { store: target } = await usable();
      if (!target || !(await spec.model())) return null;
      const active = await activeOf(spec.name, target);
      if (active) return active;
      return (
        (await liveIndexes(spec.name))
          .filter(
            (record) => record.status === 'building' && inStore(record, target),
          )
          .at(-1) ?? null
      );
    }

    return {
      async status(): Promise<VectorCollectionStatus> {
        const { store: target, reason } = await usable();
        const model = await spec.model();
        const live = target
          ? (await liveIndexes(spec.name)).filter((record) =>
              inStore(record, target),
            )
          : [];
        const active = target ? await activeOf(spec.name, target) : null;
        const building =
          live.filter((record) => record.status === 'building').at(-1) ?? null;
        const count = async (state: string) => {
          let total = 0;
          for (const index of live)
            total += await entries().count({
              filter: { indexName: index.name, state },
            });
          return total;
        };
        const info = async (record: IndexRecord) =>
          infoOf(record, {
            indexed: await entries().count({
              filter: { indexName: record.name, state: 'done' },
            }),
            total: await entries().count({
              filter: { indexName: record.name },
            }),
          });
        return {
          available: target !== null,
          store: storeInfo(),
          reason,
          model,
          active: active ? await info(active) : null,
          building: building ? await info(building) : null,
          pending: await count('pending'),
          failed: await count('failed'),
        };
      },

      async states(ids) {
        const index = await reported();
        if (!index) return null;
        const found = new Map<string, VectorItemState>();
        const unique = [...new Set(ids)];
        for (let at = 0; at < unique.length; at += 100) {
          const batch = unique.slice(at, at + 100);
          for (const entry of await entries().findMany({
            filter: (f) =>
              f.and([
                f.string('indexName').eq(index.name),
                f.or(batch.map((id) => f.string('itemId').eq(id))),
              ]),
          }))
            found.set(entry.itemId, stateOf(entry));
        }
        return found;
      },

      async unfinished({ filter, limit }) {
        const index = await reported();
        if (!index) return null;
        const open = await entries().findMany({
          filter: (f) =>
            f.and([
              f.string('indexName').eq(index.name),
              f.string('state').ne('done'),
            ]),
        });
        return open
          .map(stateOf)
          .filter((item) => !filter || matches(item.metadata, filter))
          .sort(
            (a, b) =>
              Number(b.state === 'failed') - Number(a.state === 'failed') ||
              a.id.localeCompare(b.id),
          )
          .slice(0, Math.max(0, limit));
      },

      async upsert(items) {
        if (items.length === 0) return;
        const found = await targets();
        if (!found) return;
        let queued = 0;
        for (const index of found.indexes)
          queued += await enqueue(found.store, index, items);
        if (queued > 0) wake();
      },

      async replace(scope, items) {
        const found = await targets();
        if (!found) return;
        const keep = new Set(items.map((item) => item.id));
        let queued = 0;
        for (const index of found.indexes) {
          const others = (await allEntries(index.name))
            .filter(
              (entry) =>
                !keep.has(entry.itemId) &&
                matches(metadataOf(entry.metadata), scope),
            )
            .map((entry) => entry.itemId);
          if (others.length > 0)
            await removeFrom(found.store, index, { ids: others });
          queued += await enqueue(found.store, index, items);
        }
        if (queued > 0) wake();
      },

      async remove(target) {
        const { store: found } = await usable();
        if (!found) return;
        for (const index of await liveIndexes(spec.name))
          if (inStore(index, found)) await removeFrom(found, index, target);
      },

      async search(query, options) {
        const { store: target } = await usable();
        if (!target || !query.trim()) return target ? [] : null;
        if (!(await spec.model())) return null;
        const active = await activeOf(spec.name, target);
        if (!active) return null;
        try {
          const answer = await deps.embed({
            model: { modelService: active.modelService, model: active.model },
            values: [query],
            source: spec.source,
            ...(options.signal ? { signal: options.signal } : {}),
          });
          const vector = answer.embeddings[0];
          if (!vector || vector.length !== num(active.dimension)) return null;
          const found: VectorMatch[] = await target.query(active.name, {
            vector,
            topK: options.topK,
            ...(options.filter ? { filter: options.filter } : {}),
          });
          return found;
        } catch (error) {
          onError(`Vectors could not search ${spec.name}.`, error);
          return null;
        }
      },

      sync: () => sync(registered),

      close() {
        if (mine()) collections.delete(spec.name);
      },
    };
  }

  function storeInfo(): VectorStoreInfo | null {
    if (storeTypeName === null) return null;
    return { type: storeTypeName, target: configured()?.target ?? null };
  }

  return {
    stores,
    async status() {
      const { store: target, reason } = await usable();
      return { available: target !== null, store: storeInfo(), reason };
    },
    collection,
    start() {
      if (running) return;
      running = true;
      abort = new AbortController();
      loop = run();
    },
    async stop() {
      running = false;
      abort.abort();
      wake();
      await loop;
      loop = null;
      const current = store;
      store = null;
      checked = null;
      await current
        ?.close?.()
        .catch((error: unknown) =>
          onError('The vector store could not be closed.', error),
        );
    },
    async drain() {
      for (let guard = 0; guard < 10_000 && (await step()); guard += 1);
    },
  };
}
