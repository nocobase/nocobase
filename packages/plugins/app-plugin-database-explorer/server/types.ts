import type {
  CollectionArtifactCollectionFile,
  CollectionArtifactSchemaFile,
  CollectionMetadataDocument,
  SchemaManagementMode,
} from '@nocobase/db';

/**
 * Stable error reasons this plugin returns, in the `databaseExplorer` domain.
 * They are part of the HTTP contract, so a client branches on them instead of
 * parsing a message.
 */
export type DatabaseExplorerErrorCode =
  | 'DATABASE_UNAVAILABLE'
  | 'DATABASE_EXPLORER_FORBIDDEN'
  | 'CONNECTION_NOT_FOUND'
  | 'CONNECTION_UNAVAILABLE'
  | 'CONNECTION_UNREACHABLE'
  | 'SCHEMA_READ_DENIED'
  | 'COLLECTION_NOT_FOUND'
  | 'INVALID_LIST_OPTIONS'
  | 'INVALID_CURSOR';

/**
 * What a connection is willing to say about itself.
 *
 * Every field is copied out of the connection configuration by name in
 * `describeConnection`. Credentials and host locators are not among them — see
 * that module for why the copy is an allow-list rather than a redaction pass.
 */
export interface ConnectionSummary {
  readonly name: string;
  /** True for the connection `database.default` names. */
  readonly isDefault: boolean;
  readonly dialect: string;
  readonly driver?: string;
  /** `managed` connections run migrations; an `external` one is owned elsewhere. */
  readonly schemaManagement: SchemaManagementMode;
  /** Logical database or Oracle service the connection targets, never a file path. */
  readonly databaseName?: string;
  readonly schemas?: readonly string[];
  readonly naming?: {
    readonly underscored?: boolean;
    readonly tablePrefix?: string;
  };
  /** Physical tables the application declared as bookkeeping rather than Collections. */
  readonly internalTables?: readonly string[];
}

export interface ConnectionListResult {
  /** Name of the default connection, or null when the application configures none. */
  readonly default: string | null;
  readonly items: readonly ConnectionSummary[];
}

/**
 * One Collection in a listing. Declared here rather than re-exported from
 * `@nocobase/db`, whose `CollectionSummary` is not part of its public entry;
 * this is also the wire contract, which should not move when an internal type
 * gains a field.
 */
export interface CollectionEntry {
  readonly name: string;
  readonly tableName: string;
  readonly schema: string;
  readonly kind: string;
  readonly title?: string;
  readonly description?: string;
}

export interface CollectionListResult {
  readonly items: readonly CollectionEntry[];
  /** Opaque token for the next page, absent on the last one. */
  readonly nextPageToken?: string;
}

/**
 * One Collection's resolved definition, in the document shape the Collection
 * artifact files on disk use, so a response and a committed
 * `database/<connection>/collections/<name>/collection.json` can be compared
 * field by field.
 */
export interface CollectionDetail {
  readonly collection: CollectionArtifactCollectionFile;
  readonly metadata: CollectionMetadataDocument | null;
}

/** The physical object backing a Collection, in the `schema.json` document shape. */
export interface PhysicalCollectionDetail {
  readonly schema: CollectionArtifactSchemaFile;
}

export interface ListCollectionsQuery {
  readonly pageSize?: number;
  /** A `nextPageToken` from the previous page, passed back unchanged. */
  readonly pageToken?: string;
}

/**
 * The canonical API error statuses this plugin reports. A subset of
 * `ApiErrorStatus` from `@nocobase/app-server/router`, declared here so the
 * client can read these types without reaching the server package.
 */
export type DatabaseExplorerErrorStatus =
  'INVALID_ARGUMENT' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNAVAILABLE';

/**
 * A failure with a canonical status and a stable reason, thrown by the read
 * helpers. The routes answer it as an `ApiError` in the `databaseExplorer`
 * domain, with `code` as its `reason`.
 */
export class DatabaseExplorerError extends Error {
  public constructor(
    public readonly code: DatabaseExplorerErrorCode,
    public readonly status: DatabaseExplorerErrorStatus,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'DatabaseExplorerError';
  }
}
