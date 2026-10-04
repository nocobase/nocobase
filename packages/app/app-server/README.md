# `@nocobase/app-server`

## Ordinary and recurring jobs

`JobExecutorServiceProvider` and `jobExecutorServiceToken` from `@nocobase/app-server/jobs` compose both `JobExecutor` and `ScheduleExecutor` from `@nocobase/jobs`. The provider lazily creates one service from the application's `jobs` configuration, application name, storage paths and logger. Owners set up their executors; the provider starts no worker by itself and shuts down all ordinary and schedule executors when the application stops. Repeated shutdown is safe, including executors their owners already stopped.

Resolve the existing token and call `getJobExecutor(scope, name?)` for ordinary one-off tasks or `getScheduleExecutor(scope, name?)` for recurring rules. Use the package name as the scope. Both select the named configuration, then `jobs.default`, then built-in single-process memory under `app.paths.storage('jobs')`. An invalid configured default rejects. The namespace defaults to `app.appName`; configure Redis before running multiple instances. Built-in fallback warns outside `develop` and `development`. Omitted, `default`, and unknown configuration names share the executor selected by the same resolved key and scope. Ordinary and Schedule executors remain separate.

For ordinary tasks, extend `Job` from `@nocobase/jobs` with a payload-only constructor and an explicit own stable `static jobName`. Register every class with `registerJob` before consumer `setup()`, then submit with `addJob(new JobClass(payload))`. A producer-only executor first calls `setup({ consume: false })`. Submission rejects before setup starts and waits if setup is still in progress. Its receipt confirms backend acceptance, not completion. Each task attempt creates a fresh class instance from a strict JSON payload snapshot; there is no job factory, global service container or dependency injection into this constructor. Executor settings come from the selected configuration, not method overrides.

Ordinary task identity is connection or storage path, namespace and scope, like Schedule's, so renaming a configuration key does not strand pending tasks; ordinary tasks still never share a queue or file with Schedule. Ordinary memory snapshots use separate pending-only files and are saved at shutdown; a forced exit can lose new work or replay work completed since the last snapshot. Scheduler plugin behavior is unchanged. See the [jobs package guide](../../libs/jobs/README.md) for examples, persistence identities, local attempt events and cooperative shutdown.

## Queues

Background work goes to the jobs service above by default; queues are for what it does not have — delays, priorities, deduplicating job IDs, batches, rate limits and several handlers per message. `QueueServiceProvider` and `queueServiceToken` from `@nocobase/app-server/queue` compose the application's `QueueService` from `@nocobase/queue`. Add the provider before plugin providers with `app.addServiceProvider(QueueServiceProvider, { nodeEnv })`. It creates the service lazily from the `queue` configuration section, with `app.appName` as the default namespace, `app.paths.storage('queue')` for memory state files, and the `queue` logger. `start()` calls `setup()` after every provider has booted, and `shutdown()` releases the service. `AppQueueConfig` types `server/config/queue.ts`.

Plugins resolve `queueServiceToken`, register backend factories in `register()`, register handlers with `consumer(queue).consume()` in `boot()`, publish after setup, and await their unregister functions in `shutdown()` before releasing what the handlers use. Without `queue.default`, queues run on the built-in memory configuration, which warns outside `develop` and `development`. A `queue` section in the former `connections`/`worker`/`jobs` format is ignored with one warning. See the [queue package guide](../../libs/queue/README.md) for configuration keys, delivery, retries, cancellation and shutdown.

## Standalone proxy

`defineStandaloneServer()` accepts an optional `proxy: ({ application }) => ({ match, target })` factory, evaluated after application startup. `match(pathname)` chooses requests before the application's public base path adapter; `target()` returns the current upstream HTTP(S) origin or `null`. Both `create()` and `start()` configure this boundary. Applications without a proxy retain their normal routing.

The listener applies the same rule to HTTP and WebSocket upgrades. It preserves request paths, query strings, public Host, Origin, cookies and authorization, forwards the protocol through `X-Forwarded-Proto`, streams HTTP bodies without decompressing them, and tunnels the upstream WebSocket handshake and connection. Configure the outer reverse proxy to preserve the public Host and set trustworthy protocol headers. Returning `null` yields 503; connection failures yield 502. Reading a target does not start an upstream, and changes apply to new requests and connections. Proxy connections are disposed with the standalone scope; upgraded connections are closed before HTTP shutdown drains.

## Repository API routes

`defineRepositoryApiRoutes()` exposes explicitly configured Collection Repository
methods as API route contributions. Importing or declaring a contribution does
not resolve services or query the database. The application resolves
`databaseManagerToken` when it creates the router.

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';
import path from 'node:path';
import { defineServerPlugin } from '@nocobase/app-server/plugins';

const repositoryRoutes = defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'orders',
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
        count: {},
        exists: {},
        createOne: {},
        updateOne: {},
        deleteOne: {},
        aggregate: {},
        groupBy: {},
      },
      policy: {
        read: true,
        create: { scope: true, fields: ['id', 'status'] },
        update: { scope: true, fields: ['status'] },
        delete: true,
      },
    },
    {
      name: 'salesOrders',
      collection: 'orders',
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
      },
      policy: { read: true, create: false, update: false, delete: false },
    },
  ],
});

export default defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-orders',
  routes: [repositoryRoutes],
});
```

Register the plugin in the target application's existing `server/plugins.ts`.
Applications may also include the contribution directly in their route array.
The Collection must already exist; this helper does not create schema or run
migrations. No repositories are exposed automatically.

Each entry requires `name` and an explicit `actions` object. `collection` defaults
to `name`; optional `connection` selects a configured database connection. Names
must be unique camelCase path segments, such as `salesOrders`. Empty action objects expose
nothing. `actions.findMany.maxLimit` defaults to 100 and is both the default and maximum
`findMany` limit. A limit of zero returns an empty list.

Action values must be configuration objects: `{}` enables an endpoint with defaults,
while an omitted action registers no endpoint. Boolean values and the former action
arrays are rejected. Unknown configuration keys fail at declaration time. Configure
pagination only in `actions.findMany.maxLimit`.

Every entry declares a `policy`, and it governs every action of that exposure.
It is a Repository Policy from `@nocobase/db`: `read`, `create`, `update` and
`delete`, each `true`, `false`, or a rule node. All four are required — an
exposure with a half-written Policy reads as configured while leaving the rest
open — so the shape is spelled out rather than defaulted. `buildRepositoryPolicy`
denies each node you do not mention, which is the compact way to write one.

```ts
import { buildRepositoryPolicy } from '@nocobase/db';

defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'projects',
      policy: buildRepositoryPolicy(
        (policy) =>
          policy
            .read((read) => read.scope(true).fields('id', 'name', 'status'))
            .create((create) =>
              create
                .scope(true)
                .fields('id', 'name', 'status')
                .relation('tasks', (tasks) =>
                  tasks.create((task) => task.fields('id', 'title')),
                ),
            )
            .update((update) =>
              update
                .scope(true)
                .fields('name', 'status')
                .relation('tasks', (tasks) =>
                  tasks
                    .update((task) => task.fields('title'))
                    .connect((edge) =>
                      edge.through((through) => through.fields('role')),
                    ),
                ),
            ),
        // `delete` is not mentioned, so deleting is refused.
      ),
      actions: { findMany: {}, createOne: {}, updateOne: {} },
    },
  ],
});
```

A node that is `false` refuses that operation with 403 before the request body
is read, so an empty or malformed payload is reported as forbidden rather than
as invalid input. A node with no `fields` is not the same thing: it accepts no
caller-supplied field while still allowing a create composed entirely of
`defaults`. Missing `fields` and `relations` each mean "nothing". There are no
wildcards and no implicit merges. Each nested `create` and `update` carries its
own field and relation rules, relation `upsert` requires both branches, and
many-to-many `create`, `connect` and `set` may allow a join payload with
`through: { fields: ['role'] }`. A `create` node's relations accept only
`create` and `connect`, because a create performs nothing else.

`read` governs reading everywhere it happens, which includes the record a write
returns: a `select` naming a field outside `read.fields` is refused rather than
quietly trimmed, and omitting `select` trims the result to what `read` allows.

### Scoping a Policy to the caller

Declare `policy` as a function of a principal and pass a resolver:

```ts
defineRepositoryApiRoutes<Session>({
  principal: (context) => context.get('auth'),
  repositories: [
    {
      name: 'projects',
      policy: (session) => ({
        read: { scope: { ownerId: session.userId }, fields: ['id', 'name'] },
        create: {
          scope: { ownerId: session.userId },
          fields: ['name'],
          defaults: { ownerId: session.userId },
        },
        update: { scope: { ownerId: session.userId }, fields: ['name'] },
        delete: false,
      }),
      actions: { findMany: {}, createOne: {}, updateOne: {} },
    },
  ],
});
```

The resolver is the application's: this router installs no authentication and
does not know how a request carries identity. It runs once per request; a
resolver returning `undefined` or `null` refuses the request with 403
`PRINCIPAL_REQUIRED` rather than binding a Policy built from a principal that is
not there. Declaring a Policy function without a resolver fails at declaration.

The two shapes differ in when they are checked. A fixed Policy is normalized
once, when the routes are defined, so a malformed one fails where it is written.
A Policy function cannot be — it is evaluated per request, and so is its
validation. Such a failure is `INVALID_POLICY`, and it propagates to the host
error handler as a server error rather than a 400, because a Policy is
server-owned and its mistakes are the server's.

`ref()` is rejected at declaration: a reference resolves against a
`withPolicies` map, and these routes bind one Policy per exposure. Write the
relation's rules out, or bind the Policies on the connection.

HTTP input cannot supply a Policy. `readInput` validates the body key by key
against a per-action allowlist and neither `policy` nor `scope` appears on any
of them, so both are refused with 400. `WRITE_FORBIDDEN`,
`FIELD_WRITE_FORBIDDEN` and `RELATION_WRITE_FORBIDDEN` return 403 with a
diagnostic `path` and `details`; `READ_FORBIDDEN`, `FIELD_READ_FORBIDDEN`,
`RELATION_READ_FORBIDDEN` and `SCOPE_VIOLATION` return 403;
`RECORD_OUTSIDE_SCOPE` returns 409. The entire mutation is checked before any
write. A scope that simply does not match is a different thing and never reaches
those codes: it is a 404 or an empty result, so forbidden and absent stay
indistinguishable.

Internal `db.repository()` calls are unaffected — they bind no Policy, as
before. The method-level `writePolicy` option remains available there for a
single call; it is no longer part of a route declaration. User authentication
and database cascades remain separate concerns. See the
[Policy quick start](../../libs/db/docs/zh-CN/repository/policy-quick-start.md).

The application adds `/api` under its deployment mount path. Each action uses `POST /api/{name}/{action}`, such as `POST /api/salesOrders/findMany`, with a JSON object containing Repository options. An exposure name is a camelCase path segment matching `/^[a-z][a-zA-Z0-9]*$/`; `defineRepositoryApiRoutes` throws for any other name, and for `auth`, `healthz` and `swagger`, which the application already answers under `/api`. The name shares the first path segment with plugin namespaces, so do not give an exposure the name of a plugin's namespace.

The following is an independent HTTP client's call to those server routes, not code to put in a server route handler. A Node script must supply an absolute API URL; replace the example host and mount path with the target application's actual API base URL and provide whatever authentication that application requires.

```ts
import { createApiClient } from '@nocobase/api-client';

const api = createApiClient({ baseURL: 'https://example.com/main/api' });
const orders = api.repository<{ id: string; status: string }>('orders');

const records = await orders.findMany({
  filter: { status: 'draft' },
  limit: 20,
});

for await (const record of orders.findMany({
  filter: { status: 'draft' },
  limit: 20,
})) {
  console.log(record);
}
const result = await orders.createOne({
  values: { id: 'order-1', status: 'draft' },
});
```

Inside a NocoBase React component or custom Hook, obtain this client with `useApiClient()` from `@nocobase/app-client` instead of creating another instance. Non-React application client code can resolve `apiClientToken` through `app.services.resolve(apiClientToken)` or receive the client explicitly. These paths reuse the application's configured `api.baseURL`; the Repository calls are otherwise the same. See [frontend API usage](../app-skills/skills/nocobase-app-development/references/frontend/references/api.md) for examples. Server code accessing its own database uses `db.repository()` as described above.

Supported actions are `findMany`, `findOne`, `count`, `exists`, `createOne`,
`updateOne`, `deleteOne`, `aggregate`, and `groupBy`. Unconfigured names and actions have no route.
Responses use `{ data: result }`, including complete mutation results (`record`,
`createdTargets`, and optional `version`). Missing `findOne` records return
`{ data: null }`, which the client converts to `undefined`. Delete success also
returns JSON (`{ data: { deleted: true } }`), not an empty 204 response.

`findMany()` also supports asynchronous iteration. Awaiting the query sends
`Accept: application/json` and returns the complete array. Iterating it sends
`Accept: application/x-ndjson`; the route consumes the database query as an
`AsyncIterable` and returns framed `record`, `error`, and `end` lines. The same
query instance supports only one consumption mode. Stopping iteration cancels
the response and closes the database iterator.

The adapter requires `application/json`, limits request bodies to 1 MiB, checks
the options envelope, and delegates AST, field, and mutation validation to the
Repository. JSON shorthand and AST inputs are supported; JavaScript builder
callbacks and client-supplied `context` are not. `idempotencyKey` is currently
rejected as an unsupported option rather than silently ignored. `ifVersion` is
forwarded for updates and deletes.

Every failure uses the standard error body, `{ error: { code, status, reason, domain, message, requestId } }`, with domain `app`. Input errors return 400 `INVALID_ARGUMENT`, record-not-found errors return 404 `NOT_FOUND`, and version or single-record cardinality conflicts return 409 `ABORTED`, each with the Repository error code as `reason`. Malformed JSON returns 400, non-JSON content returns 415 and oversized bodies return 413 with reason `BODY_TOO_LARGE`, all with status `INVALID_ARGUMENT`. Unexpected and database-configuration errors propagate to the host error handler, which answers an opaque 500 `INTERNAL`.

This basic adapter deliberately does **not** install authentication or
authorization. Configured endpoints accept anonymous requests and have no field
or record permission filtering. Exposure configuration is not a permission
policy. No application endpoints are enabled merely by importing this helper.

## Repository aggregate endpoints

Add `aggregate` and `groupBy` to an exposure's `actions` to enable
`POST /{name}/aggregate` and `POST /{name}/groupBy`. Neither endpoint is enabled
implicitly. As with other Repository actions, the contribution installs no
access policy: the owning application or plugin must guard its declared routes.

`aggregate` accepts a required Aggregate AST and an optional `filter`. `groupBy` also requires a non-empty `by` array and accepts `having` and `sort` over grouped fields and aggregate aliases. Envelopes must be JSON objects; unknown options, callbacks, database context, and pagination are unsupported. Repository validates AST versions, expressions, aliases and field capabilities and answers an invalid input with status 400 in the standard error body, the Repository error code as `reason` and domain `app`. The 1 MiB body limit also applies to both actions.

`maxLimit` applies only to `findMany`. Aggregations operate over all matching
rows, and `groupBy` returns all matching groups without pagination. Responses
are `{ data: aggregateObject }` or `{ data: groupObjects }`. BigInt scalar results
become decimal strings without precision loss. See the
[`@nocobase/api-client` examples](../../libs/api-client/README.md#aggregate-and-grouped-queries)
for the JSON Aggregate, Filter and Sort AST contracts.

## Plugin resource directories

Every Server plugin declares an absolute `baseDir`. In `server/plugin.ts`, use `baseDir: path.resolve(import.meta.dirname, '..')`; the same declaration in `dist/server/plugin.js` points to `dist`. Migrations and Seeds resolve only against that directory. The `queue: { jobs }` contribution is deprecated: it is accepted and ignored, each plugin declaring it is reported once at startup and as a `SERVER_QUEUE_JOBS_DEPRECATED` inspection warning, and `createPluginJobLocations()` returns an empty list. The runtime does not try a second source or build directory and does not infer the choice from `NODE_ENV` or the application command. Source and publish exports must load the matching plugin declaration.

`rootDir` remains the package root: the resolver walks upward from `baseDir` to a `package.json` whose name matches `packageName`. Inspection includes both directories and the resolved contribution paths, so an installed copy cannot silently borrow another copy's metadata. Missing `baseDir` is an API error; update all Server plugin declarations when upgrading.

## Request constraints for Repository routes

Trusted middleware can call `addRepositoryRequestConstraint(context, { repository, action, collection, connection?, policy })` from `@nocobase/app-server/router`. `policy` is a complete Repository policy; constraints only intersect the route's static or principal-derived policy. All constraints accumulate for the current request, and repository/action/collection/connection mismatches return 403. Request JSON cannot supply a constraint. Without middleware, existing route behavior is unchanged. Business applications should use the authorization plugin's `db.authorizeRepository` instead of resolving grants themselves.
