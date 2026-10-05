import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';

import {
  listCollections,
  listConnections,
  readCollection,
  readPhysicalCollection,
  type ExplorerDatabaseConfig,
} from '../explorer.js';
import { isSchemaInspectorError } from '../errors.js';
import {
  DatabaseExplorerError,
  type DatabaseExplorerErrorCode,
} from '../types.js';
import {
  CollectionDetailSchema,
  CollectionEntrySchema,
  CollectionParams,
  ConnectionParams,
  ConnectionSummarySchema,
  ListCollectionsQuery,
  PhysicalCollectionDetailSchema,
} from './schemas.js';

/**
 * The page this plugin owns. The Client Route declares the same resource, so a
 * single `page:database-explorer/access` grant governs both the navigation
 * entry and a direct call to these endpoints.
 */
export const DATABASE_EXPLORER_PAGE: string = 'database-explorer';

/**
 * The plugin's URL namespace, which is also the domain of its error reasons.
 */
export const DATABASE_EXPLORER_NAMESPACE: string = 'databaseExplorer';

/**
 * Failures of a database this application could not read, which an operator
 * needs to hear about.
 */
const tags = ['DatabaseExplorer'];

/** Every route can answer 503 `DATABASE_UNAVAILABLE` when the application is configured without a database. */
const databaseUnavailable = apiErrorResponse(
  503,
  'The application is configured without a database (`DATABASE_UNAVAILABLE`).',
);

/** What a route reading one connection answers when that connection cannot be read. */
const connectionErrors = {
  404: apiErrorResponse(
    404,
    'The connection is not configured (`CONNECTION_NOT_FOUND`) or, for a Collection route, the Collection does not exist on it (`COLLECTION_NOT_FOUND`).',
  ),
  503: apiErrorResponse(
    503,
    'The application is configured without a database (`DATABASE_UNAVAILABLE`), or the connection cannot be opened (`CONNECTION_UNAVAILABLE`), reached (`CONNECTION_UNREACHABLE`) or inspected with its account (`SCHEMA_READ_DENIED`). The body never quotes the driver error.',
  ),
};

const UNREADABLE_CONNECTION: ReadonlySet<DatabaseExplorerErrorCode> = new Set([
  'CONNECTION_UNAVAILABLE',
  'CONNECTION_UNREACHABLE',
  'SCHEMA_READ_DENIED',
]);

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const router = new Hono();
    const routes = new Hono<AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const logger = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('database-explorer')
      : undefined;

    // Translate this plugin's own errors and hand everything to the framework's
    // handler, which renders what it recognizes in the standard body even when
    // this router is mounted on its own and rethrows anything else.
    routes.onError((error, context) => {
      if (
        error instanceof DatabaseExplorerError &&
        UNREADABLE_CONNECTION.has(error.code)
      ) {
        // Only the classification is recorded. A driver's connection error
        // quotes the host, database, and account it failed to reach, so
        // writing the cause here would put into the log file exactly what
        // the response body goes to such lengths to withhold -- and a log is
        // the easier of the two to copy into an issue.
        logger?.warn(
          {
            event: 'connection.unreadable',
            code: error.code,
            cause: classifyCause(error.cause),
          },
          'A connection could not be read.',
        );
      }
      return apiErrorHandler(
        error instanceof DatabaseExplorerError ? toApiError(error) : error,
        context,
      );
    });

    routes.use('*', authentication.required(), authorization.middleware());

    routes.use('*', async (context, next) => {
      const allowed = await context.get('authz').can({
        resource: { type: 'page', id: DATABASE_EXPLORER_PAGE },
        action: 'access',
      });
      if (!allowed) {
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'DATABASE_EXPLORER_FORBIDDEN',
          domain: DATABASE_EXPLORER_NAMESPACE,
          message: 'Database Explorer access is required.',
        });
      }
      await next();
    });

    routes.use('*', async (_context, next) => {
      // `database.default: none` leaves the Manager unregistered while the
      // configuration may still list connections. Reporting those would offer
      // a list of databases that cannot be opened.
      if (!container.has(databaseManagerToken)) {
        throw new ApiError({
          status: 'UNAVAILABLE',
          reason: 'DATABASE_UNAVAILABLE',
          domain: DATABASE_EXPLORER_NAMESPACE,
          message: 'This application is configured without a database.',
        });
      }
      await next();
    });

    // Connections are read from configuration rather than from the Manager, so
    // rendering the first screen opens no databases.
    const config = (): ExplorerDatabaseConfig | undefined =>
      app.config.get<ExplorerDatabaseConfig>('database');
    const manager = () => container.resolve(databaseManagerToken);

    // Every connection in one response: they come from configuration, so the
    // list is short and costs nothing to read. The default one is marked by
    // `isDefault` on its entry.
    routes.get(
      '/connections',
      describeRoute({
        tags,
        summary: 'List the configured database connections',
        operationId: 'databaseExplorerListConnections',
        description:
          'Every connection in the application configuration, in one unpaged response with `meta.total`. Reading the list opens no database. Requires the `page:database-explorer/access` grant.',
        responses: {
          200: listResponse(ConnectionSummarySchema),
          ...apiErrorResponses,
          503: databaseUnavailable,
        },
      }),
      (context) => {
        const { items } = listConnections(config());
        return context.json({ data: items, meta: { total: items.length } });
      },
    );

    routes.get(
      '/connections/:connection/collections',
      describeRoute({
        tags,
        summary: 'List the Collections of a connection',
        operationId: 'databaseExplorerListCollections',
        description:
          'Pages by `pageToken`: pass `meta.nextPageToken` back unchanged; it is absent on the last page. A token that is not one this list issued answers 400 `INVALID_CURSOR`.',
        responses: {
          200: listResponse(CollectionEntrySchema),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The `pageToken` was not issued by this list (`INVALID_CURSOR`), or the listing options do not suit the connection (`INVALID_LIST_OPTIONS`).',
          ),
          ...connectionErrors,
        },
      }),
      apiValidator('param', ConnectionParams),
      apiValidator('query', ListCollectionsQuery),
      async (context) => {
        const { connection } = context.req.valid('param');
        const query = context.req.valid('query');
        const page = await listCollections(manager(), config(), connection, {
          ...(query.pageSize === undefined ? {} : { pageSize: query.pageSize }),
          ...(query.pageToken === undefined
            ? {}
            : { pageToken: query.pageToken }),
        });
        return context.json({
          data: page.items,
          meta:
            page.nextPageToken === undefined
              ? {}
              : { nextPageToken: page.nextPageToken },
        });
      },
    );

    routes.get(
      '/connections/:connection/collections/:collection',
      describeRoute({
        tags,
        summary: 'Get the resolved definition of a Collection',
        operationId: 'databaseExplorerGetCollection',
        description:
          'The Collection definition as the connection resolves it, with inspection warnings and the stored metadata document.',
        responses: {
          200: dataResponse(CollectionDetailSchema),
          ...apiErrorResponses,
          ...connectionErrors,
        },
      }),
      apiValidator('param', CollectionParams),
      async (context) => {
        const { connection, collection } = context.req.valid('param');
        const data = await readCollection(
          manager(),
          config(),
          connection,
          collection,
        );
        return context.json({ data });
      },
    );

    // A singleton sub-resource of the Collection: the physical schema behind
    // it, read on demand because each read runs a full inspection.
    routes.get(
      '/connections/:connection/collections/:collection/physicalSchema',
      describeRoute({
        tags,
        summary: 'Get the physical schema behind a Collection',
        operationId: 'databaseExplorerGetPhysicalSchema',
        description:
          'Runs a full inspection of the table or view on every request, so it is read separately from the Collection definition.',
        responses: {
          200: dataResponse(PhysicalCollectionDetailSchema),
          ...apiErrorResponses,
          ...connectionErrors,
        },
      }),
      apiValidator('param', CollectionParams),
      async (context) => {
        const { connection, collection } = context.req.valid('param');
        const data = await readPhysicalCollection(
          manager(),
          config(),
          connection,
          collection,
        );
        return context.json({ data });
      },
    );

    router.route(`/${DATABASE_EXPLORER_NAMESPACE}`, routes);
    return router;
  });

function toApiError(error: DatabaseExplorerError): ApiError {
  return new ApiError({
    status: error.status,
    reason: error.code,
    domain: DATABASE_EXPLORER_NAMESPACE,
    message: error.message,
    cause: error,
  });
}

/**
 * Names the kind of failure underneath without quoting it. An inspector error
 * carries a stable code; anything else is identified by its constructor name,
 * which no driver puts a credential in.
 */
function classifyCause(cause: unknown): string {
  if (isSchemaInspectorError(cause)) return cause.code;
  return cause instanceof Error ? cause.name : typeof cause;
}

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
