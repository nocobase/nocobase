import type {
  AccessConstraint,
  AuthorizationConditions,
} from '@nocobase/authorization/core';
import type { FilterAst } from '@nocobase/db';
import type {
  PermissionFields,
  ReadPermission,
  RelationWritePermission,
} from './permissions.js';
import type {
  ResolvedReadPermission,
  ResolvedRelationWritePermission,
} from './relation-access.js';

/**
 * What authorization needs to know about a Collection, read from db.
 *
 * db owns this metadata, so nothing registers it here. The primary key names
 * the column an identifier scope compares against, and `generatedPrimaryKey`
 * says the database assigns it rather than the caller. `writableFields` is the
 * subset of `fields` a write may name, as db's `writableFields` decides it.
 */
export interface AuthorizationCollection {
  readonly name: string;
  readonly fields: readonly string[];
  readonly writableFields: readonly string[];
  readonly relations?: Readonly<
    Record<string, { readonly target: string; readonly through?: string }>
  >;
  readonly primaryKey: string;
  readonly generatedPrimaryKey: boolean;
}

export type ResolveAuthorizationCollection = (
  name: string,
) => Promise<AuthorizationCollection | undefined>;

export type DatabaseRecordAccess =
  | string
  | {
      key: string;
      params?: unknown;
    };

export interface DatabaseRecordAccessConfig {
  key: string;
  params?: unknown;
}

export interface DatabasePermissionFields {
  input?: '*' | readonly string[];
  output?: '*' | readonly string[];
}

export interface DatabaseActionGrant {
  fields?: PermissionFields;
  relations?:
    false | Readonly<Record<string, ReadPermission | RelationWritePermission>>;
  recordAccess?: readonly DatabaseRecordAccess[];
}

export type DatabaseAuthorizationPolicy = DatabaseActionGrant & {
  type: 'database';
};

/** One grant as the authorizer evaluates it, with its composite branch's rules. */
export interface DatabaseGrantConfig extends DatabaseActionGrant {
  branchConstraints?: readonly AccessConstraint[];
}

export type DatabaseGrantDefinition = Readonly<
  Record<string, DatabaseActionGrant>
>;

export interface DatabaseAuthorizationParams {
  operation?: { resource: string; action: string };

  fields?: DatabaseAuthorizationFieldRequest;
}

export interface DatabaseAuthorizationFieldRequest {
  input?: readonly string[];
  output?: readonly string[];
  filter?: readonly string[];
  sort?: readonly string[];
  group?: readonly string[];
}

/**
 * One action's node of a Repository Policy.
 *
 * `fields` is a list even when the grant says `'*'`, because a Policy node
 * treats an absent or `false` allowlist as no fields at all rather than as a
 * free pass. A grant with no record restriction carries `scope: true`; no rows
 * at all is a denial, not a scope, so it never reaches this shape.
 */
export interface DatabaseAuthorizationConditions extends AuthorizationConditions {
  type: 'database';
  collection: string;
  action: string;
  scope: true | FilterAst;
  fields: readonly string[];
  relations?: Readonly<
    Record<string, ResolvedReadPermission | ResolvedRelationWritePermission>
  >;
  /** Inspection metadata; repository enforcement uses scope and fields above. */
  fieldAccess?: DatabasePermissionFields;
  allFields?: boolean;
}
