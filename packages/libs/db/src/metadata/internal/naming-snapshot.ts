import type {
  CollectionMetadataStore,
  CollectionMetadataSummary,
} from '../document-store.js';

export type CollectionMetadataNamingSnapshot =
  readonly CollectionMetadataSummary[];

interface NamingSnapshotSource {
  read(): Promise<CollectionMetadataNamingSnapshot>;
  invalidate(): void;
}

const sources = new WeakMap<CollectionMetadataStore, NamingSnapshotSource>();

/** Internal opt-in: custom stores retain their existing list semantics. */
export function registerMetadataNamingSnapshot(
  store: CollectionMetadataStore,
  source: NamingSnapshotSource,
): void {
  sources.set(store, source);
}

export async function listMetadataNamingSnapshot(
  store: CollectionMetadataStore,
): Promise<CollectionMetadataNamingSnapshot> {
  const summaries: CollectionMetadataSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await store.list({ limit: 1000, cursor });
    summaries.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return summaries;
}

export function readMetadataNamingSnapshot(
  store: CollectionMetadataStore,
): Promise<CollectionMetadataNamingSnapshot> {
  return sources.get(store)?.read() ?? listMetadataNamingSnapshot(store);
}

export function invalidateMetadataNamingSnapshot(
  store: CollectionMetadataStore,
): void {
  sources.get(store)?.invalidate();
}
