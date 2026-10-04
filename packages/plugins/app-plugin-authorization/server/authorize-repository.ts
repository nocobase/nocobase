import {
  dataScopeTarget,
  type AuthorizationEnv,
  type CompositeResourceActions,
  type CompositeResourceApi,
  type CompositeResourceReference,
} from '@nocobase/authorization/core';
import {
  addRepositoryRequestConstraint,
  ApiError,
  apiErrorHandler,
  type RepositoryApiAction,
} from '@nocobase/app-server/router';
import type { Context, MiddlewareHandler } from 'hono';

export interface AuthorizeRepositoryOptions<
  A extends CompositeResourceActions,
> {
  readonly repository: string;
  readonly resource: CompositeResourceReference<A>;
  readonly actions: Partial<
    Record<RepositoryApiAction, NoInfer<keyof A & string>>
  >;
}

const operations: Readonly<Record<RepositoryApiAction, string>> = {
  findMany: 'read',
  findOne: 'read',
  count: 'read',
  exists: 'read',
  aggregate: 'read',
  groupBy: 'read',
  createOne: 'create',
  updateOne: 'update',
  deleteOne: 'delete',
};

export interface RepositoryAuthorizationHost {
  readonly compositeResources: CompositeResourceApi;
  middleware(): MiddlewareHandler<AuthorizationEnv>;
}

export function createCompositeRepositoryAuthorization<
  A extends CompositeResourceActions,
>(
  authz: RepositoryAuthorizationHost,
  options: AuthorizeRepositoryOptions<A>,
): MiddlewareHandler<AuthorizationEnv> {
  if (!options.repository || options.repository.includes('*'))
    throw new TypeError(
      'Repository name must be non-empty and contain no wildcard',
    );

  const repository = options.repository;
  const resource = options.resource.name;
  const bindings = new Map<string, { action: string; collection: string }>();

  for (const [method, action] of Object.entries(options.actions)) {
    if (!Object.hasOwn(operations, method) || typeof action !== 'string')
      throw new TypeError('Invalid Repository action binding');

    const definition = authz.compositeResources.getAction(resource, action);
    const scopes = definition?.dataScopes ?? [];
    const target =
      definition && scopes.length === 1
        ? dataScopeTarget(definition, scopes[0].key)
        : undefined;
    const collection =
      target?.type === 'database.collection' ? target.id : undefined;
    if (
      !definition ||
      !collection ||
      definition.grants.some(
        (grant) =>
          grant.resource.type !== 'database.collection' ||
          grant.resource.id !== collection,
      ) ||
      !definition.grants.some((grant) =>
        grant.actions.some(
          (entry) => entry.action === operations[method as RepositoryApiAction],
        ),
      )
    ) {
      throw new TypeError(
        `Repository ${repository}:${method} requires a single-collection, single-scope composite action with the matching database operation`,
      );
    }
    bindings.set(method, { action, collection });
  }

  const identity = authz.middleware();
  return async (context, next) => {
    // A Repository endpoint is `POST /{name}/{action}`, wherever the router is mounted.
    const segments = context.req.path.split('/');
    const method = segments.at(-1) ?? '';
    if (segments.length < 3 || segments.at(-2) !== repository) return next();

    const binding = bindings.get(method);
    if (!binding) return denied(context, `${repository}/${method}`);

    const authorize = async (): Promise<void> => {
      const decision = await context.var.authz.authorize({
        resource: { type: 'composite', id: resource },
        action: binding.action,
      });
      const policies = decision.conditions?.database;
      if (
        decision.effect === 'deny' ||
        !policies ||
        Object.keys(policies).length !== 1 ||
        !policies[binding.collection]
      ) {
        context.res = denied(context, `${repository}/${method}`);
        return;
      }

      addRepositoryRequestConstraint(context, {
        repository,
        action: method as RepositoryApiAction,
        collection: binding.collection,
        policy: policies[binding.collection],
      });
      await next();
    };

    if (context.var.authz) return authorize();
    return identity(context, authorize);
  };
}

/** The standard `403` for a Repository endpoint the composite resource does not permit. */
function denied(context: Context, endpoint: string): Response {
  return apiErrorHandler(
    new ApiError({
      status: 'PERMISSION_DENIED',
      reason: 'AUTHORIZATION_DENIED',
      domain: 'authorization',
      message: `Repository endpoint ${endpoint} is not permitted.`,
    }),
    context,
  );
}
