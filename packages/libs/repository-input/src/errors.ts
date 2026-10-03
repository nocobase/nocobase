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
    this.retryable = options.retryable ?? false;
    this.path = options.path;
    this.collection = options.collection;
    this.field = options.field;
    this.relation = options.relation;
    this.details = options.details;
  }
}
