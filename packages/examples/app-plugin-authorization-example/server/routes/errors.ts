import type { ErrorHandler } from 'hono';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import { apiErrorHandler } from '@nocobase/app-server/router';
import { RepositoryError } from '@nocobase/db';

import { forbidden } from './mutations.js';

/**
 * Repository errors this example deliberately answers as `403 FORBIDDEN` instead of the framework's mapping. A record
 * outside the caller's scope reads as missing, so answering `404` for it would tell the caller which ids exist; every
 * denied, hidden or out-of-scope target therefore gets the same 403, before and regardless of existence.
 */
const maskedRepositoryErrors = new Set([
  'RECORD_NOT_FOUND',
  'RELATION_TARGET_NOT_FOUND',
  'RECORD_OUTSIDE_SCOPE',
]);

export const handleRouteError: ErrorHandler<AuthorizationEnv> = (error, c) =>
  apiErrorHandler(
    error instanceof RepositoryError && maskedRepositoryErrors.has(error.code)
      ? forbidden()
      : error,
    c,
  );
