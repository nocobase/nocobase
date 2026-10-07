import type {
  DatabaseConnection,
  DatabaseManager,
  Repository,
} from '@nocobase/db';

import { WORKFLOW_COLLECTIONS } from './names.js';

/**
 * The workflow collections, as Repositories.
 *
 * Everything the engine persists goes through here rather than through
 * `database.query()`. The difference is not style: the query builder is
 * documented as Collection-metadata unaware, so it binds a value exactly as
 * given and returns exactly what the driver decoded. A `datetimeTz` column
 * therefore means nothing to it, and the per-database work that logical type
 * implies — a UTC wall clock on MySQL's `DATETIME(3)`, a zone-carrying
 * timestamp on PostgreSQL and SQL Server, canonical text on SQLite — had no
 * layer to happen in. The plugin grew one of its own, which was a second,
 * weaker implementation of something `@nocobase/db` already does: the
 * Repository formats these columns at the SQL boundary, so no driver ever gets
 * the chance to apply the host's time zone in either direction.
 *
 * A run's instants are consequently ordinary values here. They are written as
 * canonical `YYYY-MM-DDTHH:mm:ss.sssZ` strings and read back as the same, on
 * every dialect, with no connection option to set and no dialect to branch on.
 *
 * The one thing to know is that a `bigInt` filter takes a JavaScript number,
 * never the string an id often arrives as — `asIdFilter` in `engine/utils.ts`
 * is the conversion.
 */
export interface WorkflowStore {
  readonly workflows: Repository;
  readonly nodes: Repository;
  readonly runs: Repository;
  readonly nodeRuns: Repository;
  readonly resumeRequests: Repository;
  readonly stats: Repository;
  readonly versionStats: Repository;
}

/**
 * Resolved per access rather than up front, because asking for a Repository
 * asks for the connection behind it. A `WorkflowStore` is built in constructors
 * that must not open anything — the timeout reaper's, for one, which may never
 * be started.
 */
function createWorkflowStore(
  repository: (collection: string) => Repository,
): WorkflowStore {
  return {
    get workflows(): Repository {
      return repository(WORKFLOW_COLLECTIONS.workflows);
    },
    get nodes(): Repository {
      return repository(WORKFLOW_COLLECTIONS.nodes);
    },
    get runs(): Repository {
      return repository(WORKFLOW_COLLECTIONS.runs);
    },
    get nodeRuns(): Repository {
      return repository(WORKFLOW_COLLECTIONS.nodeRuns);
    },
    get resumeRequests(): Repository {
      return repository(WORKFLOW_COLLECTIONS.resumeRequests);
    },
    get stats(): Repository {
      return repository(WORKFLOW_COLLECTIONS.stats);
    },
    get versionStats(): Repository {
      return repository(WORKFLOW_COLLECTIONS.versionStats);
    },
  };
}

/** The workflow collections on a named connection of this manager. */
export function workflowStore(
  database: DatabaseManager,
  connectionName?: string,
): WorkflowStore {
  return createWorkflowStore((collection) =>
    database.repository(collection, connectionName),
  );
}

/**
 * The workflow collections on one connection, which inside
 * `database.transaction()` is that transaction.
 */
export function workflowStoreOf(connection: DatabaseConnection): WorkflowStore {
  return createWorkflowStore((collection) => connection.repository(collection));
}
