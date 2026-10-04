import type { ApiClient } from '@nocobase/app-client';

import type {
  CollectionDetail,
  CollectionEntry,
  CollectionListResult,
  ConnectionListResult,
  ConnectionSummary,
  ListCollectionsQuery,
  PhysicalCollectionDetail,
} from '../server/types.js';

// The contract types are declared once, beside the routes that produce them.
// Every one is type-only, so nothing from `server/` reaches the client bundle.
export type {
  CollectionDetail,
  CollectionEntry,
  CollectionListResult,
  ConnectionListResult,
  ConnectionSummary,
  PhysicalCollectionDetail,
} from '../server/types.js';

interface DataResponse<T> {
  readonly data: T;
}

interface ListResponse<T, M> {
  readonly data: readonly T[];
  readonly meta?: M;
}

const NAMESPACE = 'databaseExplorer';

/**
 * The largest page the server accepts. `allCollections` reads whole listings,
 * so it asks for the most it may to keep the number of round trips down.
 */
const MAX_PAGE_SIZE = 100;

/** Typed reads against the plugin's endpoints. Every call is a GET; there is nothing to write. */
export class DatabaseExplorerClient {
  public constructor(private readonly api: ApiClient) {}

  /** Every configured connection, with the default one named. */
  public async connections(): Promise<ConnectionListResult> {
    const { data } = await this.api.request<
      ListResponse<ConnectionSummary, unknown>
    >({ path: `${NAMESPACE}/connections`, query: {} });
    return {
      default: data.find((item) => item.isDefault)?.name ?? null,
      items: data,
    };
  }

  public async collections(
    connection: string,
    query: ListCollectionsQuery = {},
  ): Promise<CollectionListResult> {
    const { data, meta } = await this.api.request<
      ListResponse<CollectionEntry, { readonly nextPageToken?: string }>
    >({
      path: `${this.connectionPath(connection)}/collections`,
      query: {
        ...(query.pageSize === undefined ? {} : { pageSize: query.pageSize }),
        // Passed back exactly as issued: the token encodes the filter it was
        // created under and the server rejects a rewritten one.
        ...(query.pageToken === undefined
          ? {}
          : { pageToken: query.pageToken }),
      },
    });
    return {
      items: data,
      ...(meta?.nextPageToken === undefined
        ? {}
        : { nextPageToken: meta.nextPageToken }),
    };
  }

  /**
   * Reads every collection on a connection, following the cursor to the end.
   *
   * The page filters by name in the browser, which is only honest if it is
   * filtering the whole set: stopping at the first page would hide collections
   * a connection genuinely has and let a search come back empty for one of
   * them. `maxPages` bounds the walk so a connection that keeps issuing
   * tokens cannot hold the request open forever; the default reads up to
   * 10,000 collections.
   */
  public async allCollections(
    connection: string,
    maxPages = 100,
  ): Promise<{
    readonly items: readonly CollectionEntry[];
    readonly truncated: boolean;
  }> {
    const items: CollectionEntry[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < maxPages; page += 1) {
      const result = await this.collections(connection, {
        pageSize: MAX_PAGE_SIZE,
        ...(pageToken === undefined ? {} : { pageToken }),
      });
      items.push(...result.items);
      pageToken = result.nextPageToken;
      if (pageToken === undefined) return { items, truncated: false };
    }
    return { items, truncated: true };
  }

  public collection(
    connection: string,
    collection: string,
  ): Promise<CollectionDetail> {
    return this.get<CollectionDetail>(
      this.collectionPath(connection, collection),
    );
  }

  public physicalCollection(
    connection: string,
    collection: string,
  ): Promise<PhysicalCollectionDetail> {
    return this.get<PhysicalCollectionDetail>(
      `${this.collectionPath(connection, collection)}/physicalSchema`,
    );
  }

  private connectionPath(connection: string): string {
    return `${NAMESPACE}/connections/${encodeURIComponent(connection)}`;
  }

  private collectionPath(connection: string, collection: string): string {
    return `${this.connectionPath(connection)}/collections/${encodeURIComponent(collection)}`;
  }

  private get<T>(path: string): Promise<T> {
    return this.api
      .request<DataResponse<T>>({ path, query: {} })
      .then(({ data }) => data);
  }
}
