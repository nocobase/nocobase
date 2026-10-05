import { describeRoute } from '@nocobase/app-server/router';
import type { MiddlewareHandler } from 'hono';

/**
 * The error domain of every route this application owns, such as `/api/articles` and `/api/numericExamples`: one
 * domain for the whole application, as one plugin has one, whatever URL prefixes its routes use. Routes the
 * framework generates, such as Repository data endpoints, report the framework's domain `app` instead.
 */
export const EXAMPLES_APP_DOMAIN = 'examples';

/** The API document lists every route this application owns under one tag, its namespace in PascalCase. */
export const EXAMPLES_APP_TAGS: string[] = ['Examples'];

/**
 * Hides a stand-in route from the API document. While the application runs without a database, each database-backed
 * route is replaced by one that only answers `503 DATABASE_UNAVAILABLE`; it is not a contract a caller relies on, and
 * the route it stands in for is documented once a database is configured.
 */
export const hideDatabaseUnavailable: MiddlewareHandler = describeRoute({
  hide: true,
});
