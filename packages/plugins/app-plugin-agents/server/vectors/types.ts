/**
 * The vector side of the plugin, as the application uses it: a pluggable vector store (`VectorStore`, one type per
 * implementation, registered like model providers), and vector collections over it (`VectorCollection`): items of
 * text the application names, embedded with the embedding model it chooses, kept in an index of that model and
 * dimension, and searched by meaning. See `vectors.ts`.
 */
import type { ModelRef } from '../../shared/models.js';

export type VectorMetric = 'cosine' | 'l2' | 'ip';
export type VectorValue = string | number | boolean | null;
export type VectorMetadata = Readonly<Record<string, VectorValue>>;
/** Every key must match: equal to the value, or one of `in`. */
export type VectorFilter = Readonly<
  Record<
    string,
    string | number | boolean | { readonly in: readonly (string | number)[] }
  >
>;

export interface VectorItem {
  readonly id: string;
  readonly vector: readonly number[];
  readonly metadata: VectorMetadata;
}

export interface VectorMatch {
  readonly id: string;
  /** Similarity: higher is closer (1 - cosine distance, the negative L2 distance, or the inner product). */
  readonly score: number;
  readonly metadata: VectorMetadata;
}

/**
 * Why vectors cannot be used, as a stable code the interface translates: vectors turned off, a store type nobody
 * registered, sqlite-vec unable to load or to open its file, pgvector without connection settings, unreachable, or
 * without the `vector` extension; `VECTOR_STORE_FAILED` for anything else a store reports.
 */
export type VectorUnavailableCode =
  | 'VECTORS_OFF'
  | 'VECTOR_STORE_UNKNOWN'
  | 'SQLITE_VEC_UNSUPPORTED'
  | 'SQLITE_VEC_OPEN_FAILED'
  | 'PGVECTOR_NOT_CONFIGURED'
  | 'PGVECTOR_CONNECTION_FAILED'
  | 'PGVECTOR_EXTENSION_MISSING'
  | 'VECTOR_STORE_FAILED';

/** A store that cannot be used: `code` for people (translated), `message` for logs (English, may name the cause). */
export interface VectorProblem {
  readonly code: VectorUnavailableCode;
  readonly message: string;
}

export type VectorAvailability =
  { readonly ok: true } | ({ readonly ok: false } & VectorProblem);

export interface VectorIndexSpec {
  readonly name: string;
  readonly dimension: number;
  readonly metric: VectorMetric;
  /** Metadata keys filters name, which the store may index. */
  readonly filterable?: readonly string[];
}

/** Where vectors are kept and searched. Every index name is the store's own to map to its storage. */
export interface VectorStore {
  readonly type: string;
  /**
   * Where the vectors are, with no secret: a file path, or `postgres://user@host:port/database`. Part of every index's
   * identity, so pointing the store elsewhere builds the indexes again there.
   */
  readonly target: string;
  available(): Promise<VectorAvailability>;
  /** Idempotent. */
  createIndex(spec: VectorIndexSpec): Promise<void>;
  dropIndex(name: string): Promise<void>;
  upsert(index: string, items: readonly VectorItem[]): Promise<void>;
  /** Replaces the metadata of items already there. */
  update(
    index: string,
    items: readonly {
      readonly id: string;
      readonly metadata: VectorMetadata;
    }[],
  ): Promise<void>;
  /** The `topK` closest items that pass `filter`, closest first; the filter applies before the limit. */
  query(
    index: string,
    request: {
      readonly vector: readonly number[];
      readonly topK: number;
      readonly filter?: VectorFilter;
    },
  ): Promise<VectorMatch[]>;
  delete(
    index: string,
    target:
      { readonly ids: readonly string[] } | { readonly filter: VectorFilter },
  ): Promise<void>;
  close?(): Promise<void>;
}

export interface VectorStoreContext {
  /** `agents.vectors` of the configuration. */
  readonly config: Readonly<Record<string, unknown>>;
  /** The application's root and storage directories, which relative paths of the configuration resolve against. */
  readonly paths: { readonly root: string; readonly storage: string };
}

export interface VectorStoreType {
  readonly type: string;
  create(context: VectorStoreContext): VectorStore;
}

export interface VectorStoreRegistry {
  /** Answers what removes it again. */
  register(type: VectorStoreType): () => void;
  get(type: string): VectorStoreType | undefined;
}

/** An item of a collection as the application gives it. */
export interface VectorSourceItem {
  readonly id: string;
  readonly text: string;
  readonly metadata: VectorMetadata;
  /** Part of the text hash, such as `ctx` when the text gets a context sentence before it is embedded. */
  readonly variant?: string;
}

export interface VectorCollectionSpec {
  /** `[a-z0-9-]{1,40}`. */
  readonly name: string;
  /** What embedding calls are recorded as used for. */
  readonly source: string;
  /** The embedding model now; null for none (search answers null, nothing is queued). */
  model(): Promise<ModelRef | null>;
  /** Every item, in batches, for a rebuild. */
  items(): AsyncIterable<readonly VectorSourceItem[]>;
  readonly filterable?: readonly string[];
  /** Cosine by default. */
  readonly metric?: VectorMetric;
  /**
   * The texts actually embedded, in the same order (with a context sentence, say). Called by the worker; a failure
   * is retried as an embedding failure is.
   */
  prepare?(
    items: readonly VectorSourceItem[],
    signal: AbortSignal,
  ): Promise<readonly string[]>;
}

export interface VectorIndexInfo {
  readonly name: string;
  readonly modelService: string;
  readonly model: string;
  readonly dimension: number;
  readonly status: 'building' | 'ready';
  readonly createdAt: string;
  readonly readyAt: string | null;
  /** Items embedded into it, of `total` it holds or is about to. */
  readonly indexed: number;
  readonly total: number;
}

export interface VectorCollectionStatus {
  /** Whether the vector store can be used. */
  readonly available: boolean;
  /** The store configured; null when vectors are turned off. */
  readonly store: VectorStoreInfo | null;
  /** Why not. */
  readonly reason: VectorProblem | null;
  /** The embedding model now. */
  readonly model: ModelRef | null;
  /** The index searches read. */
  readonly active: VectorIndexInfo | null;
  /** The index being built for the model now, while `active` serves. */
  readonly building: VectorIndexInfo | null;
  /** Items waiting to be embedded, over both. */
  readonly pending: number;
  /** Items whose embedding failed after every attempt. */
  readonly failed: number;
}

/** Where one item stands in the index searches read: embedded, waiting, or failed after every attempt (with why). */
export interface VectorItemState {
  readonly id: string;
  readonly state: 'pending' | 'done' | 'failed';
  /** The last embedding failure, when it failed. */
  readonly error: string | null;
  readonly metadata: VectorMetadata;
}

export interface VectorCollection {
  status(): Promise<VectorCollectionStatus>;
  /**
   * The state of each of `ids` that has an entry, in the index searches read (the one being built while none is
   * ready); null when there is no store, model or index. An item without an entry is not there yet.
   */
  states(ids: readonly string[]): Promise<Map<string, VectorItemState> | null>;
  /**
   * The items still pending or failed in that index, whose metadata passes `filter`, at most `limit`, failed first;
   * null as `states` is.
   */
  unfinished(options: {
    readonly filter?: VectorFilter;
    readonly limit: number;
  }): Promise<VectorItemState[] | null>;
  /** Queues the items; an item whose text is unchanged only has its metadata updated. */
  upsert(items: readonly VectorSourceItem[]): Promise<void>;
  /** Upserts the items and removes the other items of `scope`. */
  replace(
    scope: VectorFilter,
    items: readonly VectorSourceItem[],
  ): Promise<void>;
  remove(
    target:
      { readonly ids: readonly string[] } | { readonly filter: VectorFilter },
  ): Promise<void>;
  /** The closest items; null when the store is unavailable, there is no model, or no index is ready yet. */
  search(
    query: string,
    options: {
      readonly topK: number;
      readonly filter?: VectorFilter;
      readonly signal?: AbortSignal;
    },
  ): Promise<VectorMatch[] | null>;
  /**
   * Reads the model again: when its index (model and dimension) is not there, builds it in the background from
   * `items()` while the ready one serves, then retires the old one.
   */
  sync(): Promise<void>;
  /** Stops working for this collection; what is stored stays. */
  close(): void;
}

/** The store configured, as people may see it. */
export interface VectorStoreInfo {
  readonly type: string;
  /** `VectorStore.target`; null when the store type is not registered. */
  readonly target: string | null;
}

export interface VectorsStatus {
  readonly available: boolean;
  /** The store configured; null when vectors are turned off. */
  readonly store: VectorStoreInfo | null;
  readonly reason: VectorProblem | null;
}

export interface Vectors {
  /** The store types; `sqlite-vec` and `pgvector` are registered by default. */
  readonly stores: VectorStoreRegistry;
  status(): Promise<VectorsStatus>;
  collection(spec: VectorCollectionSpec): VectorCollection;
  /** Starts this instance's embedding worker. */
  start(): void;
  /** Stops the worker and closes the store (it opens again when next used). */
  stop(): Promise<void>;
  /** Embeds everything due now, then returns; for tests and maintenance. */
  drain(): Promise<void>;
}

/** Embeds `values` with `model`; throws on failure. */
export type Embedder = (request: {
  readonly model: ModelRef;
  readonly values: readonly string[];
  readonly source: string;
  readonly signal?: AbortSignal;
}) => Promise<{
  readonly embeddings: number[][];
  readonly dimension: number;
  readonly model: string;
  readonly tokens: number;
}>;

/**
 * `agents.vectors` of the configuration: where vectors are kept, apart from the application's database.
 *
 * - `store`: `sqlite-vec` (the default), `pgvector`, another registered type, or `false` to turn vectors off.
 * - `sqlite-vec`: `path`, the database file (relative to the application root; `storage/vectors.sqlite` by default).
 * - `pgvector`: its own PostgreSQL, never the application's connection: `url` (`postgres://user:password@host:port/db`),
 *   or `host`, `port`, `database`, `user`, `password`; `ssl` (true, or the `pg` driver's TLS options) with either.
 */
export interface VectorsConfig {
  readonly store?: string | false;
  readonly path?: string;
  readonly url?: string;
  readonly host?: string;
  readonly port?: number;
  readonly database?: string;
  readonly user?: string;
  readonly password?: string;
  readonly ssl?: boolean | Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}
