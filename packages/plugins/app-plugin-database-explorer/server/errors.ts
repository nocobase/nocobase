import {
  DatabaseExplorerError,
  type DatabaseExplorerErrorCode,
  type DatabaseExplorerErrorStatus,
} from './types.js';

interface MappedInspectorFailure {
  readonly code: DatabaseExplorerErrorCode;
  readonly status: DatabaseExplorerErrorStatus;
  readonly message: string;
}

/**
 * How a Schema Inspector failure is reported.
 *
 * The two `INVALID_ARGUMENT`s are the caller's fault and say so; everything
 * else is an upstream database this application could not read, which is
 * `UNAVAILABLE` (503) rather than `INTERNAL` because the failing dependency is
 * not this application.
 */
const INSPECTOR_FAILURES: ReadonlyMap<string, MappedInspectorFailure> = new Map(
  [
    [
      'SCHEMA_INSPECTION_PERMISSION_DENIED',
      {
        code: 'SCHEMA_READ_DENIED',
        status: 'UNAVAILABLE',
        message: 'The database account may not read this schema.',
      },
    ],
    [
      'SCHEMA_INSPECTION_INVALID_CURSOR',
      {
        code: 'INVALID_CURSOR',
        status: 'INVALID_ARGUMENT',
        message:
          'The cursor does not belong to this listing. Start the listing again.',
      },
    ],
    [
      'SCHEMA_INSPECTION_INVALID_OPTIONS',
      {
        code: 'INVALID_LIST_OPTIONS',
        status: 'INVALID_ARGUMENT',
        message: 'The listing options are not valid for this connection.',
      },
    ],
  ],
);

/**
 * True for an error raised by the Schema Inspector.
 *
 * Matching on shape rather than identity is deliberate: the error class is
 * internal to `@nocobase/db` and absent from the public entry its own package
 * guards with a public-API check, so `instanceof` is not available here.
 */
export function isSchemaInspectorError(
  error: unknown,
): error is Error & { readonly code: string } {
  return (
    error instanceof Error &&
    error.name === 'SchemaInspectorError' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

/**
 * Converts a failure raised while reading a connection into one this plugin is
 * willing to return.
 *
 * The original message never survives. A driver's connection error routinely
 * quotes the host, port, database, and account it failed to reach, and an
 * inspector error carries that driver error as its `cause`; keeping those out
 * of responses is most of what this endpoint does. The caller logs the
 * original.
 */
export function toExplorerError(
  connectionName: string,
  error: unknown,
): DatabaseExplorerError {
  if (error instanceof DatabaseExplorerError) return error;
  const mapped = isSchemaInspectorError(error)
    ? INSPECTOR_FAILURES.get(error.code)
    : undefined;
  if (mapped) {
    return new DatabaseExplorerError(
      mapped.code,
      mapped.status,
      mapped.message,
      {
        cause: error,
      },
    );
  }
  return new DatabaseExplorerError(
    'CONNECTION_UNREACHABLE',
    'UNAVAILABLE',
    `Connection "${connectionName}" could not be read.`,
    { cause: error },
  );
}
