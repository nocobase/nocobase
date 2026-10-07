/**
 * The revision lock as the pages meet it: an agent or a skill is saved against the revision it was read at, and the
 * server answers 409 `REVISION_CONFLICT` when someone saved it since.
 */
import { ApiClientError } from '@nocobase/app-client';

/** Whether `error` says the record changed since it was read. */
export function isRevisionConflict(error: unknown): boolean {
  return (
    error instanceof ApiClientError && error.reason === 'REVISION_CONFLICT'
  );
}
