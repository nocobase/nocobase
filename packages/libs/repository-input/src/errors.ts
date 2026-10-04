export type RepositoryErrorCode =
  | 'COLLECTION_NOT_FOUND'
  | 'FIELD_NOT_FOUND'
  | 'FIELD_CAPABILITY_NOT_SUPPORTED'
  | 'FIELD_NOT_WRITABLE'
  | 'RELATION_NOT_FOUND'
  | 'READ_ONLY_COLLECTION'
  | 'INVALID_AST'
  | 'INVALID_CONTEXT'
  | 'INVALID_FILTER'
  | 'INVALID_PAGINATION'
  | 'INVALID_SELECT'
  | 'INVALID_SORT'
  | 'INVALID_AGGREGATE'
  | 'INVALID_GROUP_BY'
  | 'INVALID_DISTINCT'
  | 'INVALID_STREAM'
  | 'QUERY_ALREADY_CONSUMED'
  | 'QUERY_TRANSACTION_COMPLETED'
  | 'INVALID_MUTATION'
  | 'INVALID_STORED_VALUE'
  | 'INVALID_UNIQUE_SELECTOR'
  | 'VARIABLE_NOT_FOUND'
  | 'MUTATION_LIMIT_EXCEEDED'
  | 'RECORD_NOT_FOUND'
  | 'MULTIPLE_RECORDS_MATCHED'
  | 'RELATION_TARGET_NOT_FOUND'
  | 'MULTIPLE_RELATION_TARGETS_MATCHED'
  | 'RELATION_UPSERT_TARGET_OUTSIDE_SCOPE'
  | 'VERSION_CONFLICT'
  | 'INVALID_WRITE_POLICY'
  | 'INVALID_POLICY'
  | 'POLICY_REQUIRED'
  | 'READ_FORBIDDEN'
  | 'FIELD_READ_FORBIDDEN'
  | 'RELATION_READ_FORBIDDEN'
  | 'SCOPE_VIOLATION'
  | 'RECORD_OUTSIDE_SCOPE'
  | 'WRITE_FORBIDDEN'
  | 'FIELD_WRITE_FORBIDDEN'
  | 'RELATION_WRITE_FORBIDDEN'
  | 'RELATION_ACTION_NOT_ALLOWED'
  | 'RELATION_REASSIGNMENT_REQUIRED'
  | 'REPOSITORY_EVENT_RECURSION';

/**
 * What kind of failure a Repository error is, named with Google's canonical error codes (AIP-193). These are the names
 * `ApiError.status` uses, so an HTTP layer maps a Repository error to its response without knowing any error code, and
 * a code added here cannot reach a caller with a status nobody chose for it.
 *
 * `INTERNAL` marks the server's own fault, such as a Policy the server built wrongly: the caller cannot repair the
 * request, so an HTTP layer answers it with an opaque 500 and reveals neither its message nor its details.
 */
export type RepositoryErrorStatus =
  | 'INVALID_ARGUMENT'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'ABORTED'
  | 'INTERNAL';

/**
 * The status of every error code. Typing it as a `Record` over `RepositoryErrorCode` makes a new code fail to compile
 * until it has a status.
 *
 * An error whose status is not `INTERNAL` is shown to the caller with its `path` and `details`, so those must describe
 * only the caller's own request: never another user's data, SQL, or server configuration.
 */
export const repositoryErrorStatuses: Readonly<
  Record<RepositoryErrorCode, RepositoryErrorStatus>
> = Object.freeze({
  // The request names something that does not exist or cannot be used that way.
  FIELD_NOT_FOUND: 'INVALID_ARGUMENT',
  FIELD_CAPABILITY_NOT_SUPPORTED: 'INVALID_ARGUMENT',
  FIELD_NOT_WRITABLE: 'INVALID_ARGUMENT',
  RELATION_NOT_FOUND: 'INVALID_ARGUMENT',
  READ_ONLY_COLLECTION: 'INVALID_ARGUMENT',
  INVALID_AST: 'INVALID_ARGUMENT',
  INVALID_CONTEXT: 'INVALID_ARGUMENT',
  INVALID_FILTER: 'INVALID_ARGUMENT',
  INVALID_PAGINATION: 'INVALID_ARGUMENT',
  INVALID_SELECT: 'INVALID_ARGUMENT',
  INVALID_SORT: 'INVALID_ARGUMENT',
  INVALID_AGGREGATE: 'INVALID_ARGUMENT',
  INVALID_GROUP_BY: 'INVALID_ARGUMENT',
  INVALID_DISTINCT: 'INVALID_ARGUMENT',
  INVALID_STREAM: 'INVALID_ARGUMENT',
  INVALID_MUTATION: 'INVALID_ARGUMENT',
  INVALID_UNIQUE_SELECTOR: 'INVALID_ARGUMENT',
  VARIABLE_NOT_FOUND: 'INVALID_ARGUMENT',
  MUTATION_LIMIT_EXCEEDED: 'INVALID_ARGUMENT',
  RELATION_ACTION_NOT_ALLOWED: 'INVALID_ARGUMENT',
  // A target the request body refers to is missing, or outside the relation's scope, which reads the same so that
  // forbidden and absent stay indistinguishable. The body named it, so this is a bad request rather than a 404.
  RELATION_TARGET_NOT_FOUND: 'INVALID_ARGUMENT',
  // The record the operation addresses does not exist, or is outside the caller's scope.
  RECORD_NOT_FOUND: 'NOT_FOUND',
  // SCOPE_VIOLATION is PERMISSION_DENIED rather than NOT_FOUND because the caller can see the record; it was their own
  // values that pushed it out of scope. Saying so leaks nothing about anyone else's data, and the request cannot be
  // repaired without being told. A scope that simply does not match is a different thing: it is RECORD_NOT_FOUND or an
  // empty result, so that forbidden and absent stay indistinguishable.
  READ_FORBIDDEN: 'PERMISSION_DENIED',
  FIELD_READ_FORBIDDEN: 'PERMISSION_DENIED',
  RELATION_READ_FORBIDDEN: 'PERMISSION_DENIED',
  WRITE_FORBIDDEN: 'PERMISSION_DENIED',
  FIELD_WRITE_FORBIDDEN: 'PERMISSION_DENIED',
  RELATION_WRITE_FORBIDDEN: 'PERMISSION_DENIED',
  SCOPE_VIOLATION: 'PERMISSION_DENIED',
  // The data changed or matched differently from what the request assumed.
  VERSION_CONFLICT: 'ABORTED',
  MULTIPLE_RECORDS_MATCHED: 'ABORTED',
  MULTIPLE_RELATION_TARGETS_MATCHED: 'ABORTED',
  RELATION_UPSERT_TARGET_OUTSIDE_SCOPE: 'ABORTED',
  RECORD_OUTSIDE_SCOPE: 'ABORTED',
  RELATION_REASSIGNMENT_REQUIRED: 'ABORTED',
  // Policies, write policies and Collections are server-owned, so one that is missing or cannot be built is a
  // misconfiguration rather than something the caller got wrong. The rest are server-side defects.
  COLLECTION_NOT_FOUND: 'INTERNAL',
  INVALID_WRITE_POLICY: 'INTERNAL',
  INVALID_POLICY: 'INTERNAL',
  POLICY_REQUIRED: 'INTERNAL',
  INVALID_STORED_VALUE: 'INTERNAL',
  QUERY_ALREADY_CONSUMED: 'INTERNAL',
  QUERY_TRANSACTION_COMPLETED: 'INTERNAL',
  REPOSITORY_EVENT_RECURSION: 'INTERNAL',
});

export interface RepositoryErrorOptions {
  readonly path?: readonly (string | number)[];
  readonly collection?: string;
  readonly field?: string;
  readonly relation?: string;
  readonly retryable?: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
}

export class RepositoryError extends Error {
  /** What kind of failure this is, decided by `code` through `repositoryErrorStatuses`. */
  readonly status: RepositoryErrorStatus;
  readonly retryable: boolean;
  readonly path?: readonly (string | number)[];
  readonly collection?: string;
  readonly field?: string;
  readonly relation?: string;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    readonly code: RepositoryErrorCode,
    message: string,
    options: RepositoryErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'RepositoryError';
    this.status = repositoryErrorStatuses[code];
    this.retryable = options.retryable ?? false;
    this.path = options.path;
    this.collection = options.collection;
    this.field = options.field;
    this.relation = options.relation;
    this.details = options.details;
  }
}
