import type { MiddlewareHandler } from 'hono';
import type {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationEnv,
  CompositeResourceActions,
  CompositeResourceApi,
  CompositeResourceCheck,
} from '@nocobase/authorization/core';
import type {
  DatabaseConnection,
  RepositoryPolicy,
  WritePolicy,
  WritePolicyProblem,
} from '@nocobase/db';
import {
  createCompositeRepositoryAuthorization,
  type AuthorizeRepositoryOptions,
} from '../authorize-repository.js';
import { UNRESTRICTED_ACCESS } from './authorizer.js';
import type { DatabaseOperation } from './builders.js';
import {
  DatabaseCollectionRegistry,
  type DatabaseCollections,
} from './collection-registry.js';
import type {
  AuthorizationCollection,
  DatabaseAuthorizationConditions,
  DatabaseAuthorizationParams,
} from './model.js';

/** `authz.database`. */
export interface DatabaseApi {
  readonly collections: DatabaseCollections;
  /** Folds the four CRUD decisions of one context into one Repository Policy. */
  policyFor(
    collection: string,
    context: AuthorizationContext,
    operation?: { resource: string; action: string },
  ): Promise<RepositoryPolicy>;
  /** Binds generated Repository routes to composite actions. */
  authorizeRepository<A extends CompositeResourceActions>(
    options: AuthorizeRepositoryOptions<A>,
  ): MiddlewareHandler<AuthorizationEnv>;
}

export interface DatabaseAuthorizationApi {
  database: DatabaseApi;
}

/** What the plugin learns during setup; read by the extension routes. */
export interface DatabaseHost {
  readonly compositeResources: CompositeResourceApi;
  middleware(): MiddlewareHandler<AuthorizationEnv>;
  readonly connection?: DatabaseConnection;
  describe(name: string): Promise<AuthorizationCollection | undefined>;
  /**
   * What db would refuse in `policy` as a write to the named Collection, or
   * `undefined` when there is no database or db does not know the Collection.
   */
  writePolicyProblems(
    name: string,
    policy: WritePolicy,
  ): Promise<readonly WritePolicyProblem[] | undefined>;
}

const hosts = new WeakMap<DatabaseApi, DatabaseHost>();

/** Package-internal: the setup-time host of an installed database API. */
export function databaseHost(api: DatabaseApi): DatabaseHost | undefined {
  return hosts.get(api);
}

export class DatabaseAuthorizationService implements DatabaseApi {
  readonly collections: DatabaseCollectionRegistry =
    new DatabaseCollectionRegistry();

  attach(host: DatabaseHost): void {
    hosts.set(this, host);
  }

  authorizeRepository<A extends CompositeResourceActions>(
    options: AuthorizeRepositoryOptions<A>,
  ): MiddlewareHandler<AuthorizationEnv> {
    const host = hosts.get(this);
    if (!host)
      throw new Error(
        'The database plugin is not installed in an Authorization',
      );
    return createCompositeRepositoryAuthorization(host, options);
  }

  async policyFor(
    collection: string,
    context: AuthorizationContext,
    operation?: { resource: string; action: string },
  ): Promise<RepositoryPolicy> {
    const resource = { type: 'database.collection', id: collection };
    const decide = async <A extends DatabaseOperation>(
      action: A,
    ): Promise<RepositoryPolicy[A]> =>
      foldDecision(
        action,
        await context.authorize<DatabaseAuthorizationParams>({
          resource,
          action,
          params: operation ? { operation } : {},
        }),
      );
    const [read, create, update, remove] = await Promise.all([
      decide('read'),
      decide('create'),
      decide('update'),
      decide('delete'),
    ]);
    return { read, create, update, delete: remove };
  }
}

/** Translate resolved checks only; this never runs authorization again. */
export function composeDatabasePolicies(
  checks: readonly CompositeResourceCheck[],
): Readonly<Record<string, RepositoryPolicy>> {
  type MutablePolicy = {
    -readonly [K in keyof RepositoryPolicy]: RepositoryPolicy[K];
  };
  const policies: Record<string, MutablePolicy> = Object.create(null) as Record<
    string,
    MutablePolicy
  >;
  for (const check of checks) {
    if (check.resource.type !== 'database.collection') continue;
    const policy = (policies[check.resource.id] ??= {
      read: false,
      create: false,
      update: false,
      delete: false,
    });
    switch (check.action) {
      case 'read':
        policy.read = foldDecision('read', check.decision);
        break;
      case 'create':
        policy.create = foldDecision('create', check.decision);
        break;
      case 'update':
        policy.update = foldDecision('update', check.decision);
        break;
      case 'delete':
        policy.delete = foldDecision('delete', check.decision);
        break;
    }
  }
  return policies;
}

declare module '@nocobase/authorization/core' {
  interface CompositeResourceConditions {
    /** Policies for the tables used by this operation; other operations remain denied. */
    database?: Readonly<Record<string, RepositoryPolicy>>;
  }
}

function foldDecision<A extends DatabaseOperation>(
  action: A,
  decision: AuthorizationDecision,
): RepositoryPolicy[A] {
  if (decision.effect === 'deny') return false;
  if (decision.effect === 'permit') return true;
  const conditions = decision.conditions;
  if (!isDatabaseConditions(conditions) || conditions.action !== action) {
    return false;
  }
  // An unrestricted identity bypassed every grant, so the allowlist the
  // handler reported is the whole Collection and says nothing a node should.
  if (decision.reasons.some((reason) => reason.code === UNRESTRICTED_ACCESS)) {
    return true;
  }
  // The authorizer resolves the action-specific relation tree. Keep the only
  // structural conversion at this DB adapter boundary.
  return action === 'delete'
    ? { scope: conditions.scope }
    : {
        scope: action === 'create' ? true : conditions.scope,
        fields: conditions.fields,
        relations: conditions.relations ?? false,
      };
}

function isDatabaseConditions(
  value: unknown,
): value is DatabaseAuthorizationConditions {
  return (
    value !== null &&
    typeof value === 'object' &&
    Reflect.get(value, 'type') === 'database'
  );
}
