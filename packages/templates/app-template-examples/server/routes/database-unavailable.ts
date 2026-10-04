import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import type { Context } from 'hono';

/**
 * The answer every database-backed route gives while the application runs without a database, so the rest of the
 * application stays usable and no data is exposed. `domain` is that of the route answering: the application's own for a
 * route it wrote, and `app` for a Repository data endpoint, which the framework defines.
 */
export function databaseUnavailable(
  context: Context,
  domain: string,
): Response {
  return apiErrorHandler(
    new ApiError({
      status: 'UNAVAILABLE',
      reason: 'DATABASE_UNAVAILABLE',
      domain,
      message: 'The database is not configured for this application.',
    }),
    context,
  );
}
