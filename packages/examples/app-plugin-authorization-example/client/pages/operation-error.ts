import { ApiClientError } from '@nocobase/app-client';

/** The message key for a failed operation, decided by the error's `reason` and, for broad categories, its status. */
export function operationError(error: unknown): string {
  if (!(error instanceof ApiClientError)) return 'sales.errors.request';
  if (error.reason === 'STATE_CONFLICT' || error.reason === 'VERSION_CONFLICT')
    return 'sales.errors.conflict';
  if (error.status === 401) return 'sales.errors.session';
  if (error.status === 403 || error.status === 404) return 'forbidden';
  if (error.status === 400 || error.status === 413) return 'sales.errors.input';
  return 'sales.errors.request';
}
