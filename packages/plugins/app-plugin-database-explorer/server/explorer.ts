import {
  COLLECTION_ARTIFACT_FORMAT_VERSION,
  type ConnectionConfig,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';

import { describeConnections } from './connection-summary.js';
import { toExplorerError } from './errors.js';
import {
  DatabaseExplorerError,
  type CollectionDetail,
  type CollectionListResult,
  type ConnectionListResult,
  type ListCollectionsQuery,
  type PhysicalCollectionDetail,
} from './types.js';

/** The connection configuration this plugin reads; a narrowing of the app's `database` namespace. */
export interface ExplorerDatabaseConfig {
  readonly default?: string;
  readonly connections: Readonly<Record<string, ConnectionConfig>>;
}

/**
 * The API's standard page size cap. The page reads every page of a listing,
 * asking for this many at a time.
 */
export const MAX_COLLECTION_PAGE_SIZE: number = 100;
const DEFAULT_COLLECTION_PAGE_SIZE = 20;

/**
 * Lists the configured connections without opening any of them.
 *
 * `DatabaseManager` keeps its configuration and its connection map private and
 * offers no enumeration, so the names come from configuration — which is also
 * what makes this cheap. Asking each connection for anything would mean opening
 * every database to render the first screen, and a single unreachable external
 * database would then take the whole page down with it. That isolation is a
 * property of not making the call, not of a `try` around it.
 */
export function listConnections(
  config: ExplorerDatabaseConfig | undefined,
): ConnectionListResult {
  const connections = config?.connections ?? {};
  const names = Object.keys(connections);
  const configured = config?.default;
  const fallback = names.length > 0 ? (names[0] ?? null) : null;
  const defaultConnection =
    configured !== undefined && Object.hasOwn(connections, configured)
      ? configured
      : fallback;
  return {
    default: defaultConnection,
    items: describeConnections(connections, defaultConnection),
  };
}

export async function listCollections(
  manager: DatabaseManager,
  config: ExplorerDatabaseConfig | undefined,
  connectionName: string,
  query: ListCollectionsQuery = {},
): Promise<CollectionListResult> {
  const page = await read(connectionName, async () => {
    const connection = openConnection(manager, config, connectionName);
    return connection.collections.list({
      limit: query.pageSize ?? DEFAULT_COLLECTION_PAGE_SIZE,
      // The page token is the inspector's opaque cursor, which encodes the
      // filter it was issued under, so it travels back unread.
      ...(query.pageToken === undefined ? {} : { cursor: query.pageToken }),
    });
  });
  return {
    items: page.items.map((item) => ({
      name: item.name,
      tableName: item.tableName,
      schema: item.schema,
      kind: item.kind,
      ...(item.title === undefined ? {} : { title: item.title }),
      ...(item.description === undefined
        ? {}
        : { description: item.description }),
    })),
    ...(page.nextCursor === undefined
      ? {}
      : { nextPageToken: page.nextCursor }),
  };
}

/**
 * Reads one Collection's resolved definition.
 *
 * `getResolution` rather than `get`: it costs the same and adds the inspection
 * warnings, which are what distinguish "this Collection has no foreign keys"
 * from "this dialect cannot report foreign keys".
 */
export async function readCollection(
  manager: DatabaseManager,
  config: ExplorerDatabaseConfig | undefined,
  connectionName: string,
  collectionName: string,
): Promise<CollectionDetail> {
  const [resolution, stored] = await read(connectionName, async () => {
    const connection = openConnection(manager, config, connectionName);
    return Promise.all([
      connection.collections.getResolution(collectionName),
      connection.collectionMetadata.get(collectionName),
    ]);
  });
  if (!resolution) throw collectionNotFound(connectionName, collectionName);
  return {
    collection: {
      formatVersion: COLLECTION_ARTIFACT_FORMAT_VERSION,
      name: collectionName,
      collection: resolution.collection,
      warnings: resolution.warnings,
    },
    metadata: stored?.document ?? null,
  };
}

/**
 * Reads the physical object behind a Collection.
 *
 * This is its own endpoint rather than part of the detail response because
 * `getResolution` and `getPhysical` each run a full inspection with no shared
 * cache. Bundling them would pay for two round trips against a possibly remote
 * database on every Collection a user clicks, for a view most never open.
 */
export async function readPhysicalCollection(
  manager: DatabaseManager,
  config: ExplorerDatabaseConfig | undefined,
  connectionName: string,
  collectionName: string,
): Promise<PhysicalCollectionDetail> {
  const physical = await read(connectionName, async () => {
    const connection = openConnection(manager, config, connectionName);
    return connection.collections.getPhysical(collectionName);
  });
  if (!physical) throw collectionNotFound(connectionName, collectionName);
  return {
    schema: {
      formatVersion: COLLECTION_ARTIFACT_FORMAT_VERSION,
      name: collectionName,
      physical,
    },
  };
}

/**
 * Resolves a configured connection.
 *
 * `manager.connection()` constructs without opening — the client is lazy — but
 * it does throw for a dialect whose driver is not registered and for an
 * external connection with no metadata store, so the call sits inside `read`.
 */
function openConnection(
  manager: DatabaseManager,
  config: ExplorerDatabaseConfig | undefined,
  connectionName: string,
): DatabaseConnection {
  // `hasOwn` rather than `in`: every object inherits `toString`, so `in` would
  // accept a request for a connection named after a prototype member and send
  // it to the Manager instead of reporting it as unconfigured.
  if (!Object.hasOwn(config?.connections ?? {}, connectionName)) {
    throw new DatabaseExplorerError(
      'CONNECTION_NOT_FOUND',
      'NOT_FOUND',
      `Connection "${connectionName}" is not configured.`,
    );
  }
  try {
    return manager.connection(connectionName);
  } catch (error) {
    throw new DatabaseExplorerError(
      'CONNECTION_UNAVAILABLE',
      'UNAVAILABLE',
      `Connection "${connectionName}" cannot be opened by this application.`,
      { cause: error },
    );
  }
}

function collectionNotFound(
  connectionName: string,
  collectionName: string,
): DatabaseExplorerError {
  return new DatabaseExplorerError(
    'COLLECTION_NOT_FOUND',
    'NOT_FOUND',
    `Collection "${collectionName}" does not exist on connection "${connectionName}".`,
  );
}

async function read<T>(
  connectionName: string,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toExplorerError(connectionName, error);
  }
}
