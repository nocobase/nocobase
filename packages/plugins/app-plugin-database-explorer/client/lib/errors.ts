import { ApiClientError } from '@nocobase/app-client';

import type { DatabaseExplorerErrorCode } from '../../server/types.js';

const MESSAGE_KEYS: Readonly<Record<DatabaseExplorerErrorCode, string>> = {
  DATABASE_UNAVAILABLE: 'errors.databaseUnavailable',
  DATABASE_EXPLORER_FORBIDDEN: 'errors.forbidden',
  CONNECTION_NOT_FOUND: 'errors.connectionNotFound',
  CONNECTION_UNAVAILABLE: 'errors.connectionUnavailable',
  CONNECTION_UNREACHABLE: 'errors.connectionUnreachable',
  SCHEMA_READ_DENIED: 'errors.schemaReadDenied',
  COLLECTION_NOT_FOUND: 'errors.collectionNotFound',
  INVALID_LIST_OPTIONS: 'errors.invalidListOptions',
  INVALID_CURSOR: 'errors.invalidCursor',
};

/**
 * Reads a failure into the viewer's language.
 *
 * The server answers with a stable `reason` and a fixed English message, so
 * the wording lives here rather than in Server locale resources: an API error
 * is rendered by the browser that knows which language is on screen, and the
 * reason is what stays constant for anything else reading the response.
 */
export function explorerErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  const key = MESSAGE_KEYS[errorReason(error) as DatabaseExplorerErrorCode];
  if (key) return t(key);
  return error instanceof Error && error.message
    ? error.message
    : t('errors.unknown');
}

/** The plugin's `reason` for a failed API request, when it reported one. */
export function errorReason(error: unknown): string | undefined {
  return error instanceof ApiClientError && error.domain === 'databaseExplorer'
    ? error.reason
    : undefined;
}
