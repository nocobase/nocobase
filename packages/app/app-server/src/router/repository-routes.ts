import {
  databaseManagerToken,
  normalizeRepositoryPolicy,
  type NormalizedReadNode,
  type NormalizedRepositoryPolicy,
  type PolicyRef,
  type RepositoryPolicy,
  type AggregateOptions,
  type GroupByOptions,
  type CreateOneOptions,
  type FindManyOptions,
  type Repository,
  type RepositoryOperations,
  type RepositoryFilter,
  type RepositoryRecord,
  type UpdateOneOptions,
} from '@nocobase/db';
import type { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { stream } from 'hono/streaming';

import {
  ApiError,
  appErrorDomain,
  apiErrorHandler,
  toApiError,
} from './api-error.js';
import { defineApiRoutes, type AppApiRouteContribution } from './routes.js';
import { getRepositoryRequestConstraints } from './repository-constraints.js';

export type RepositoryApiAction =
  | 'findMany'
  | 'findOne'
  | 'count'
  | 'aggregate'
  | 'groupBy'
  | 'exists'
  | 'createOne'
  | 'updateOne'
  | 'deleteOne';

/**
 * Options an action accepts. An action decides whether an endpoint exists;
 * what it may do is the exposure's Policy, which every action shares.
 */
export type RepositoryApiActionOptions = Readonly<Record<string, never>>;
export type RepositoryApiEmptyActionOptions = RepositoryApiActionOptions;
export interface RepositoryApiFindManyOptions {
  /** Default and maximum limit. Defaults to 100. */
  readonly maxLimit?: number;
}
export interface RepositoryApiActions {
  readonly findMany?: RepositoryApiFindManyOptions;
  readonly findOne?: RepositoryApiEmptyActionOptions;
  readonly count?: RepositoryApiEmptyActionOptions;
  readonly exists?: RepositoryApiEmptyActionOptions;
  readonly aggregate?: RepositoryApiEmptyActionOptions;
  readonly groupBy?: RepositoryApiEmptyActionOptions;
  readonly createOne?: RepositoryApiEmptyActionOptions;
  readonly updateOne?: RepositoryApiEmptyActionOptions;
  readonly deleteOne?: RepositoryApiEmptyActionOptions;
}

export interface RepositoryApiExposure<P = unknown> {
  /**
   * The name passed to api.repository(name), and the first segment of every
   * endpoint, `POST /api/{name}/{action}`. camelCase, such as `salesOrders`.
   */
  readonly name: string;
  /** Logical Collection name; defaults to name. */
  readonly collection?: string;
  /** Database connection name; defaults to the application's default connection. */
  readonly connection?: string;
  /**
   * The Policy every action of this exposure runs under. Required: an exposure
   * without one would accept anything, and a missing declaration is the one
   * mistake that reads exactly like a deliberate one.
   *
   * A function receives the principal resolved for the request, which is what
   * lets a scope name the caller. It is server-owned either way — a request
   * body naming `policy` or `scope` is refused, because the per-action
   * allowlist below enumerates what an action reads from the body and neither
   * is on it.
   */
  readonly policy: RepositoryPolicy | ((principal: P) => RepositoryPolicy);
  readonly actions: RepositoryApiActions;
}

export interface DefineRepositoryApiRoutesOptions<P = unknown> {
  readonly repositories: readonly RepositoryApiExposure<P>[];
  /**
   * Resolve the principal a Policy function receives. Required as soon as one
   * exposure declares a Policy function, and never called otherwise.
   *
   * The application owns this: `app-server` does not know how a request is
   * authenticated. Returning `undefined` or `null` refuses the request with
   * 403 rather than binding a Policy built from a principal that is not there,
   * which is why the return type admits both.
   */
  readonly principal?: (
    context: Context,
  ) => P | undefined | null | Promise<P | undefined | null>;
}

export interface RepositoryApiRoutesApplication {
  readonly container: ServiceContainer;
}

const allowedOptions: Record<RepositoryApiAction, readonly string[]> = {
  findMany: [
    'filter',
    'select',
    'sort',
    'distinct',
    'limit',
    'offset',
    'cursor',
    'direction',
  ],
  findOne: ['filter', 'select', 'sort'],
  count: ['filter'],
  aggregate: ['filter', 'aggregate'],
  groupBy: ['by', 'filter', 'aggregate', 'having', 'sort'],
  exists: ['filter'],
  createOne: ['values', 'select'],
  updateOne: ['filter', 'values', 'select', 'ifVersion'],
  deleteOne: ['filter', 'select', 'ifVersion'],
};

const repositoryStreamMediaType = 'application/x-ndjson';

/**
 * An exposure name is the first path segment of its endpoints, `POST
 * /api/{name}/{action}`, so it follows the HTTP API rule for path segments:
 * camelCase, starting with a lowercase letter. That also keeps it free of `/`,
 * `:` and anything else that would need encoding.
 */
const exposureNamePattern = /^[a-z][a-zA-Z0-9]*$/;

/**
 * First segments the application itself answers under `/api`. An exposure with
 * one of these names would sit beside, or behind, a route that is not a
 * Repository endpoint.
 */
const reservedExposureNames: ReadonlySet<string> = new Set([
  'auth',
  'healthz',
  'swagger',
]);

function assertExposureName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || !exposureNamePattern.test(name))
    throw new Error(
      `Repository API exposure name ${JSON.stringify(name)} is invalid. Exposure names are camelCase path segments matching /^[a-z][a-zA-Z0-9]*$/, such as "salesOrders".`,
    );
  if (reservedExposureNames.has(name))
    throw new Error(
      `Repository API exposure name "${name}" is reserved for /api/${name}. Choose another name.`,
    );
}

/**
 * Exposes only configured Repository endpoints using `POST /{name}/{action}`,
 * mounted under `/api`. Every path is literal — a name and an action, no
 * parameters — so the endpoints of one exposure cannot shadow each other. An
 * exposure name shares the first segment with plugin namespaces, so it must not
 * equal one: name an exposure after its Collection, such as `salesOrders`,
 * rather than after a plugin.
 *
 * This basic adapter does not install authentication or authorization. Database
 * services are resolved only when the application creates the router.
 */
export function defineRepositoryApiRoutes<P = unknown>(
  options: DefineRepositoryApiRoutesOptions<P>,
): AppApiRouteContribution<RepositoryApiRoutesApplication> {
  assertConfig(
    options,
    ['repositories', 'principal'],
    'Repository API configuration',
  );
  if (
    options.principal !== undefined &&
    typeof options.principal !== 'function'
  )
    throw new Error('Repository API principal must be a function.');
  if (!Array.isArray(options.repositories))
    throw new Error('repositories must be an array.');
  const names = new Set<string>();
  const repositories = options.repositories.map((entry) => {
    assertConfig(
      entry,
      ['name', 'collection', 'connection', 'policy', 'actions'],
      'Repository API exposure',
    );
    assertExposureName(entry.name);
    if (names.has(entry.name))
      throw new Error(
        `Repository API exposure name "${entry.name}" is declared more than once. Each exposure needs a unique name.`,
      );
    names.add(entry.name);
    const collection = entry.collection ?? entry.name;
    if (typeof collection !== 'string' || !collection)
      throw new Error('Repository API collection must not be empty.');
    if (
      entry.connection !== undefined &&
      (typeof entry.connection !== 'string' || !entry.connection)
    )
      throw new Error('Repository API connection must not be empty.');
    assertConfig(
      entry.actions,
      Object.keys(allowedOptions),
      'Repository API actions',
    );
    const policyInput = entry.policy;
    if (policyInput === undefined)
      throw new Error(
        `Repository API exposure "${entry.name}" requires a policy. Declare one for every exposure; an exposure without a Policy restricts nothing.`,
      );
    if (typeof policyInput === 'function' && options.principal === undefined)
      throw new Error(
        `Repository API exposure "${entry.name}" declares a policy function, which needs a principal resolver. Pass one as principal(context).`,
      );
    // A Policy that does not depend on the principal is normalized once, here,
    // so a malformed one fails where it is written. A function cannot be:
    // it is evaluated per request, and so is its validation.
    const policy =
      typeof policyInput === 'function'
        ? policyInput
        : assertBindablePolicy(
            normalizeRepositoryPolicy(policyInput as RepositoryPolicy),
          );
    const actions = Object.entries(entry.actions).map(([key, config]) => {
      const action = key as RepositoryApiAction;
      assertConfig(
        config,
        action === 'findMany' ? ['maxLimit'] : [],
        `Repository API action ${action}`,
      );
      const maxLimit =
        action === 'findMany' && config.maxLimit !== undefined
          ? config.maxLimit
          : 100;
      if (
        typeof maxLimit !== 'number' ||
        !Number.isSafeInteger(maxLimit) ||
        maxLimit <= 0
      )
        throw new Error(
          'Repository API maxLimit must be a positive safe integer.',
        );
      return { action, maxLimit };
    });
    return {
      name: entry.name,
      collection,
      connection: entry.connection,
      policy,
      actions,
    };
  });

  return defineApiRoutes((app: RepositoryApiRoutesApplication): Hono => {
    const router = new Hono();
    router.onError(apiErrorHandler);

    for (const entry of repositories) {
      if (entry.actions.length === 0) continue;
      const repository: Repository = app.container
        .resolve(databaseManagerToken)
        .repository(entry.collection, entry.connection);
      // A Policy that does not read the principal binds once, here. One that
      // does cannot: it is built per request, and so is the Repository it
      // binds to — `withPolicy` returns a new instance and leaves this one
      // unbound for the next request.
      const bound =
        typeof entry.policy === 'function'
          ? undefined
          : repository.withPolicy(entry.policy);
      const buildPolicy = entry.policy;
      for (const { action, maxLimit } of entry.actions) {
        router.post(
          `/${entry.name}/${action}`,
          bodyLimit({
            maxSize: 1024 * 1024,
            onError: (context) =>
              apiErrorHandler(
                new ApiError({
                  status: 'INVALID_ARGUMENT',
                  reason: 'BODY_TOO_LARGE',
                  domain: appErrorDomain,
                  message: 'Repository request exceeds 1 MiB.',
                  httpStatus: 413,
                }),
                context,
              ),
          }),
          async (context) => {
            let scoped =
              bound ??
              repository.withPolicy(
                // Normalized before binding so the reference check runs on
                // this Policy too; `withPolicy` normalizes again, which is
                // idempotent.
                assertBindablePolicy(
                  normalizeRepositoryPolicy(
                    (buildPolicy as (principal: P) => RepositoryPolicy)(
                      await resolvePrincipal(context, options.principal),
                    ),
                  ),
                ) as RepositoryPolicy,
              );
            for (const constraint of getRepositoryRequestConstraints(context)) {
              if (
                constraint.repository !== entry.name ||
                constraint.action !== action ||
                constraint.collection !== entry.collection ||
                constraint.connection !== entry.connection
              ) {
                fail(
                  403,
                  'AUTHORIZATION_TARGET_MISMATCH',
                  'Repository authorization target mismatch.',
                );
              }
              scoped = scoped.narrow(constraint.policy);
            }
            const input = await readInput(context, action, maxLimit);
            if (action === 'findMany' && acceptsRepositoryStream(context)) {
              return streamFindMany(context, scoped, input);
            }
            const data = await execute(scoped, action, input);
            if (action === 'aggregate' || action === 'groupBy') {
              return context.body(
                JSON.stringify({ data }, (_key, value: unknown) =>
                  typeof value === 'bigint' ? value.toString() : value,
                ),
                200,
                { 'Content-Type': 'application/json; charset=UTF-8' },
              );
            }
            return context.json({ data });
          },
        );
      }
    }
    return router;
  });
}

async function streamFindMany(
  context: Context,
  repository: RepositoryOperations,
  input: FindManyOptions<RepositoryRecord>,
): Promise<Response> {
  const iterator = repository.findMany(input)[Symbol.asyncIterator]();
  let first: IteratorResult<RepositoryRecord>;
  try {
    first = await iterator.next();
  } catch (error) {
    await iterator.return?.();
    throw error;
  }

  const firstFrame = first.done ? undefined : recordFrame(first.value);
  let closePromise: Promise<void> | undefined;
  const closeIterator = (): Promise<void> => {
    closePromise ??= Promise.resolve(iterator.return?.()).then(() => undefined);
    return closePromise;
  };

  context.header('Content-Type', `${repositoryStreamMediaType}; charset=utf-8`);
  context.header('Cache-Control', 'no-store');
  context.header('X-Content-Type-Options', 'nosniff');
  context.header('Vary', 'Accept', { append: true });

  return stream(
    context,
    async (output) => {
      output.onAbort(closeIterator);
      try {
        if (firstFrame !== undefined) await output.writeln(firstFrame);
        while (!output.aborted) {
          const result = await iterator.next();
          if (result.done) break;
          await output.writeln(recordFrame(result.value));
        }
        if (!output.aborted) await output.writeln('{"type":"end"}');
      } finally {
        await closeIterator();
      }
    },
    async (error, output) => {
      if (!output.aborted) await output.writeln(errorFrame(error));
    },
  );
}

function acceptsRepositoryStream(context: Context): boolean {
  return (context.req.header('accept') ?? '')
    .split(',')
    .some(
      (value) =>
        value.split(';', 1)[0]?.trim().toLowerCase() ===
        repositoryStreamMediaType,
    );
}

function recordFrame(record: RepositoryRecord): string {
  return JSON.stringify({ type: 'record', data: record });
}

function errorFrame(error: Error): string {
  return JSON.stringify({
    type: 'error',
    error: toApiError(error).toPayload(),
  });
}

async function readInput(
  context: Context,
  action: RepositoryApiAction,
  maxLimit: number,
): Promise<RepositoryRecord> {
  const contentType = context.req
    .header('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== 'application/json') {
    fail(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Repository requests require application/json.',
    );
  }
  let input: unknown;
  try {
    input = await context.req.json<unknown>();
  } catch {
    fail(400, 'INVALID_JSON', 'Request body must contain valid JSON.');
  }
  if (!isObject(input))
    fail(400, 'INVALID_REPOSITORY_INPUT', 'Request body must be an object.');
  if (Object.hasOwn(input, 'idempotencyKey')) {
    fail(
      400,
      'UNSUPPORTED_REPOSITORY_OPTION',
      'idempotencyKey is not supported by this adapter.',
    );
  }
  for (const key of Object.keys(input)) {
    if (!allowedOptions[action].includes(key)) {
      fail(
        400,
        'UNSUPPORTED_REPOSITORY_OPTION',
        `Unsupported Repository option: ${key}.`,
      );
    }
  }
  for (const key of [
    'filter',
    'values',
    'select',
    'sort',
    'cursor',
    'aggregate',
    'having',
  ]) {
    if (Object.hasOwn(input, key) && !isObject(input[key])) {
      fail(400, 'INVALID_REPOSITORY_INPUT', `${key} must be an object.`);
    }
  }
  if (
    ['findOne', 'updateOne', 'deleteOne'].includes(action) &&
    !isObject(input.filter)
  ) {
    fail(400, 'INVALID_REPOSITORY_INPUT', 'filter is required.');
  }
  if (['createOne', 'updateOne'].includes(action) && !isObject(input.values)) {
    fail(400, 'INVALID_REPOSITORY_INPUT', 'values is required.');
  }
  if (action === 'aggregate' || action === 'groupBy') {
    if (!isObject(input.aggregate))
      fail(400, 'INVALID_REPOSITORY_INPUT', 'aggregate is required.');
  }
  if (
    action === 'groupBy' &&
    (!Array.isArray(input.by) ||
      input.by.length === 0 ||
      input.by.some((field) => typeof field !== 'string' || !field))
  ) {
    fail(
      400,
      'INVALID_REPOSITORY_INPUT',
      'by must be a non-empty array of field names.',
    );
  }
  if (action === 'findMany') {
    const limit = input.limit === undefined ? maxLimit : input.limit;
    if (
      typeof limit !== 'number' ||
      !Number.isSafeInteger(limit) ||
      limit < 0 ||
      limit > maxLimit
    ) {
      fail(
        400,
        'INVALID_PAGINATION',
        `limit must be an integer between 0 and ${maxLimit}.`,
      );
    }
    input.limit = limit;
  }
  return input;
}

async function execute(
  repository: RepositoryOperations,
  action: RepositoryApiAction,
  input: RepositoryRecord,
): Promise<unknown> {
  // HTTP validates the envelope; Repository validates ASTs, fields, and mutations.
  const read = input as FindManyOptions<RepositoryRecord>;
  const filter = input.filter as RepositoryFilter<RepositoryRecord>;
  const values = input.values as CreateOneOptions<
    Partial<RepositoryRecord>
  >['values'];
  const ifVersion = input.ifVersion as string | number | undefined;
  switch (action) {
    case 'findMany':
      return await repository.findMany(
        input as FindManyOptions<RepositoryRecord>,
      );
    case 'findOne':
      return (await repository.findOne({ ...read, filter })) ?? null;
    case 'aggregate':
      return repository.aggregate(
        input as unknown as AggregateOptions<RepositoryRecord>,
      );
    case 'groupBy':
      return repository.groupBy(
        input as unknown as GroupByOptions<RepositoryRecord>,
      );
    case 'count':
      return repository.count(input);
    case 'exists':
      return repository.exists(input);
    case 'createOne':
      return repository.createOne({
        select: read.select,
        values,
      });
    case 'updateOne':
      return repository.updateOne({
        select: read.select,
        filter,
        values: input.values as UpdateOneOptions<
          Partial<RepositoryRecord>
        >['values'],
        ifVersion,
      });
    case 'deleteOne':
      return repository.deleteOne({ select: read.select, filter, ifVersion });
  }
}

function isObject(value: unknown): value is RepositoryRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(status: 400 | 403 | 415, reason: string, message: string): never {
  throw new ApiError({
    status: status === 403 ? 'PERMISSION_DENIED' : 'INVALID_ARGUMENT',
    reason,
    domain: appErrorDomain,
    message,
    ...(status === 415 ? { httpStatus: 415 } : {}),
  });
}

/**
 * Resolve the principal a Policy function is built from.
 *
 * No principal means no Policy, and no Policy would mean an unrestricted
 * Repository, so the request is refused here rather than bound to a Policy
 * whose scope names a principal that is not there. 403 rather than 401: this
 * router installs no authentication and has no challenge to issue.
 */
async function resolvePrincipal<P>(
  context: Context,
  resolve: DefineRepositoryApiRoutesOptions<P>['principal'],
): Promise<P> {
  const principal = await resolve?.(context);
  if (principal === undefined || principal === null) {
    fail(
      403,
      'PRINCIPAL_REQUIRED',
      'This endpoint requires a principal and none was resolved.',
    );
  }
  return principal;
}

/**
 * Refuse a Policy reference, which this router cannot expand.
 *
 * A `ref()` resolves against a `withPolicies` map, and these routes bind one
 * Policy per exposure. An unexpanded reference is not inert — it reaches a
 * request as RELATION_READ_FORBIDDEN on a relation the Policy appears to
 * grant, so it is rejected before it can be bound. For a fixed Policy that is
 * when the routes are defined; for one built from a principal it is the first
 * request that reaches it, which is as early as that Policy exists.
 */
function assertBindablePolicy(
  policy: NormalizedRepositoryPolicy,
): NormalizedRepositoryPolicy {
  const walk = (
    node: NormalizedReadNode | PolicyRef,
    path: readonly string[],
  ): void => {
    if ('kind' in node) {
      throw new Error(
        `Repository API policy at ${path.join('.')} uses ref("${node.target}"), which these routes cannot expand. Write the relation's rules out, or bind the Policies with connection.withPolicies().`,
      );
    }
    for (const [name, child] of Object.entries(node.relations))
      walk(child, [...path, 'relations', name]);
  };
  if (policy.read !== true && policy.read !== false)
    walk(policy.read, ['read']);
  return policy;
}

function assertConfig(
  value: unknown,
  keys: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (
    !isObject(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  )
    throw new Error(`${label} must be a plain configuration object.`);
  for (const key of Object.keys(value))
    if (!keys.includes(key))
      throw new Error(`${label}: unsupported option ${key}.`);
}
