# Value normalization and errors: signatures

Inspect structured repository errors, discover supported field operations, normalize temporal values and work with portable JSON values. Error status metadata is a library contract; this reference does not document HTTP routes.

[Chapter](../errors-and-values.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                 | Access               |
| ----------------------------------------------------------- | -------------------- |
| [JsonResultForm](#jsonresultform)                           | `@nocobase/db` type  |
| [JsonValue](#jsonvalue)                                     | `@nocobase/db` type  |
| [RepositoryError](#repositoryerror)                         | `@nocobase/db` value |
| [RepositoryErrorCode](#repositoryerrorcode)                 | `@nocobase/db` type  |
| [RepositoryErrorOptions](#repositoryerroroptions)           | `@nocobase/db` type  |
| [RepositoryErrorStatus](#repositoryerrorstatus)             | `@nocobase/db` type  |
| [TemporalSqlClient](#temporalsqlclient)                     | Supporting contract  |
| [TemporalType](#temporaltype)                               | Supporting contract  |
| [WritePolicyProblem](#writepolicyproblem)                   | `@nocobase/db` type  |
| [filterOperatorsForFieldType](#filteroperatorsforfieldtype) | `@nocobase/db` value |
| [isManagedField](#ismanagedfield)                           | `@nocobase/db` value |
| [isSortableFieldType](#issortablefieldtype)                 | `@nocobase/db` value |
| [isTemporalType](#istemporaltype)                           | `@nocobase/db` value |
| [normalizeTemporalValue](#normalizetemporalvalue)           | `@nocobase/db` value |
| [repositoryErrorStatuses](#repositoryerrorstatuses)         | `@nocobase/db` value |
| [supportsFilterShorthand](#supportsfiltershorthand)         | `@nocobase/db` value |
| [writableFields](#writablefields)                           | `@nocobase/db` value |
| [writePolicyProblems](#writepolicyproblems)                 | `@nocobase/db` value |

## JsonResultForm

[Source](../../../src/json.ts)

Import: `import type { JsonResultForm } from '@nocobase/db'`.

How a driver hands back a `json` column. Declared by the dialect through `jsonResults`, because the returned value carries no evidence of which it is.

```ts
/**
 * How a driver hands back a `json` column. Declared by the dialect through
 * `jsonResults`, because the returned value carries no evidence of which it is.
 */
export type JsonResultForm = 'parsed' | 'text';
```

## JsonValue

[Source](../../../../repository-input/src/json.ts)

Import: `import type { JsonValue } from '@nocobase/db'`.

The values that can be sent in a Repository JSON request.

```ts
/** The values that can be sent in a Repository JSON request. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | {
      readonly [key: string]: JsonValue;
    };
```

## RepositoryError

[Source](../../../../repository-input/src/errors.ts)

Import: `import { RepositoryError } from '@nocobase/db'`.

```ts
export declare class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly status: RepositoryErrorStatus;
  readonly retryable: boolean;
  readonly path?: readonly (string | number)[];
  readonly collection?: string;
  readonly field?: string;
  readonly relation?: string;
  readonly details?: Readonly<Record<string, unknown>>;
  constructor(
    code: RepositoryErrorCode,
    message: string,
    options?: RepositoryErrorOptions,
  );
}
```

Related declarations: [RepositoryErrorCode](./values.md#repositoryerrorcode), [RepositoryErrorOptions](./values.md#repositoryerroroptions), [RepositoryErrorStatus](./values.md#repositoryerrorstatus).

## RepositoryErrorCode

[Source](../../../../repository-input/src/errors.ts)

Import: `import type { RepositoryErrorCode } from '@nocobase/db'`.

```ts
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
```

## RepositoryErrorOptions

[Source](../../../../repository-input/src/errors.ts)

Import: `import type { RepositoryErrorOptions } from '@nocobase/db'`.

```ts
export interface RepositoryErrorOptions {
  readonly path?: readonly (string | number)[];
  readonly collection?: string;
  readonly field?: string;
  readonly relation?: string;
  readonly retryable?: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
}
```

## RepositoryErrorStatus

[Source](../../../../repository-input/src/errors.ts)

Import: `import type { RepositoryErrorStatus } from '@nocobase/db'`.

What kind of failure a Repository error is, named with Google's canonical error codes (AIP-193). These are the names `ApiError.status` uses, so an HTTP layer maps a Repository error to its response without knowing any error code, and a code added here cannot reach a caller with a status nobody chose for it. `INTERNAL` marks the server's own fault, such as a Policy the server built wrongly: the caller cannot repair the request, so an HTTP layer answers it with an opaque 500 and reveals neither its message nor its details.

```ts
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
```

## TemporalSqlClient

[Source](../../../src/repository/internal/temporal-sql.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface TemporalSqlClient {
  readonly client: Knex.Client;
  raw: Knex['raw'];
}
```

## TemporalType

[Source](../../../src/repository/temporal.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type TemporalType = 'date' | 'time' | 'datetime' | 'datetimeTz';
```

## WritePolicyProblem

[Source](../../../src/repository/writable-fields.ts)

Import: `import type { WritePolicyProblem } from '@nocobase/db'`.

One way a write policy does not fit a Collection: where in the policy, and why.

```ts
/** One way a write policy does not fit a Collection: where in the policy, and why. */
export interface WritePolicyProblem {
  /** The offending member, such as `['relations', 'tags', 'create', 'fields', 0]`. */
  readonly path: readonly (string | number)[];
  readonly message: string;
}
```

## filterOperatorsForFieldType

[Source](../../../src/repository/repository.ts)

Import: `import { filterOperatorsForFieldType } from '@nocobase/db'`.

The filter operators a condition on a scalar Field of `type` accepts, or `undefined` for a type no condition can name. It is the table every Repository validates conditions against, exported so a description of the filter grammar, such as an API document, is derived from it rather than copied.

```ts
/**
 * The filter operators a condition on a scalar Field of `type` accepts, or `undefined` for a type no condition can
 * name. It is the table every Repository validates conditions against, exported so a description of the filter
 * grammar, such as an API document, is derived from it rather than copied.
 */
export declare function filterOperatorsForFieldType(
  type: string,
): readonly FilterOperator[] | undefined;
```

Related declarations: [FilterOperator](./inputs.md#filteroperator).

## isManagedField

[Source](../../../src/repository/writable-fields.ts)

Import: `import { isManagedField } from '@nocobase/db'`.

Whether the database or the Repository assigns a scalar field's value, so no write may name it: an `increments` or auto-increment column, a generated column, or the optimistic-lock version.

```ts
/**
 * Whether the database or the Repository assigns a scalar field's value, so no write may name it: an `increments` or
 * auto-increment column, a generated column, or the optimistic-lock version.
 */
export declare function isManagedField(
  collection: CollectionDefinition,
  field: FieldDefinition,
): boolean;
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [FieldDefinition](./builder.md#fielddefinition).

## isSortableFieldType

[Source](../../../src/repository/repository.ts)

Import: `import { isSortableFieldType } from '@nocobase/db'`.

Whether a Field of `type` may be named in a sort.

```ts
/** Whether a Field of `type` may be named in a sort. */
export declare function isSortableFieldType(type: string): boolean;
```

## isTemporalType

[Source](../../../src/repository/temporal.ts)

Import: `import { isTemporalType } from '@nocobase/db'`.

```ts
export declare function isTemporalType(type: string): type is TemporalType;
```

Related declarations: [TemporalType](./values.md#temporaltype).

## normalizeTemporalValue

[Source](../../../src/repository/temporal.ts)

Import: `import { normalizeTemporalValue } from '@nocobase/db'`.

Validate before parsing; Date.parse alone silently normalizes invalid dates.

```ts
/** Validate before parsing; Date.parse alone silently normalizes invalid dates. */
export declare function normalizeTemporalValue(
  field: FieldDefinition,
  input: unknown,
  code?: RepositoryErrorCode,
  path?: readonly (string | number)[],
): string | null;
```

Related declarations: [FieldDefinition](./builder.md#fielddefinition), [RepositoryErrorCode](./values.md#repositoryerrorcode).

## repositoryErrorStatuses

[Source](../../../../repository-input/src/errors.ts)

Import: `import { repositoryErrorStatuses } from '@nocobase/db'`.

The status of every error code. Typing it as a `Record` over `RepositoryErrorCode` makes a new code fail to compile until it has a status. An error whose status is not `INTERNAL` is shown to the caller with its `path` and `details`, so those must describe only the caller's own request: never another user's data, SQL, or server configuration.

```ts
/**
 * The status of every error code. Typing it as a `Record` over `RepositoryErrorCode` makes a new code fail to compile
 * until it has a status.
 *
 * An error whose status is not `INTERNAL` is shown to the caller with its `path` and `details`, so those must describe
 * only the caller's own request: never another user's data, SQL, or server configuration.
 */
export declare const repositoryErrorStatuses: Readonly<
  Record<RepositoryErrorCode, RepositoryErrorStatus>
>;
```

Related declarations: [RepositoryErrorCode](./values.md#repositoryerrorcode), [RepositoryErrorStatus](./values.md#repositoryerrorstatus).

## supportsFilterShorthand

[Source](../../../src/repository/repository.ts)

Import: `import { supportsFilterShorthand } from '@nocobase/db'`.

Whether a Field of `type` may appear in the `{ field: value }` filter shorthand.

```ts
/** Whether a Field of `type` may appear in the `{ field: value }` filter shorthand. */
export declare function supportsFilterShorthand(type: string): boolean;
```

## writableFields

[Source](../../../src/repository/writable-fields.ts)

Import: `import { writableFields } from '@nocobase/db'`.

The fields of a Collection a write may name: every scalar field the database and the Repository leave to the caller. A relation is written through a policy's `relations`, never through its field list. This is the list a write policy's `fields` must stay within.

```ts
/**
 * The fields of a Collection a write may name: every scalar field the database and the Repository leave to the caller.
 * A relation is written through a policy's `relations`, never through its field list. This is the list a write policy's
 * `fields` must stay within.
 */
export declare function writableFields(
  collection: CollectionDefinition,
): string[];
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition).

## writePolicyProblems

[Source](../../../src/repository/writable-fields.ts)

Import: `import { writePolicyProblems } from '@nocobase/db'`.

Every member of a write policy that does not fit the Collection metadata: a field that is missing or not a writable scalar, a relation that does not exist or whose target is missing, and `through` on anything but a `belongsToMany`. The same checks a write runs before it starts, which would refuse the policy with `INVALID_WRITE_POLICY`, collected rather than thrown so configuration can be checked when it is saved.

```ts
/**
 * Every member of a write policy that does not fit the Collection metadata: a field that is missing or not a writable
 * scalar, a relation that does not exist or whose target is missing, and `through` on anything but a `belongsToMany`.
 * The same checks a write runs before it starts, which would refuse the policy with `INVALID_WRITE_POLICY`, collected
 * rather than thrown so configuration can be checked when it is saved.
 */
export declare function writePolicyProblems(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  policy: WritePolicy,
): Promise<WritePolicyProblem[]>;
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [ConnectionCollections](./collections.md#connectioncollections), [WritePolicy](./policies.md#writepolicy), [WritePolicyProblem](./values.md#writepolicyproblem).
