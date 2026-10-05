# @nocobase/app-server

## 2.0.0-beta.0

### Major Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.

## 2.0.0-beta

Moves the package to the 2.0.0 prerelease line, so that the breaking changes released as 1.0.0-beta.33 show in the major version. This version is never published; the first release on the line is 2.0.0-beta.0.

## 1.0.0-beta.33

### Major Changes

- 21d274c: An application now fails to start when two API routes answer the same method and path. Hono runs only the first matching route, so a plugin route that repeats another plugin's route, or a hand-written route that repeats a `defineRepositoryApiRoutes` data endpoint, used to be dead code that nothing reported. Parameter names do not distinguish routes (`/orders/:id` and `/orders/:orderId` are the same route), an `ALL` route collides with every method on its path, and middleware is not counted. The error names the method, the path and both owners: a plugin's routes are named by its package name, the application's own routes by the application's package name, and a contribution passed to `Application.addRoutes()` by its position unless the new optional `{ owner }` argument names it.

  The `nocobase-app-development` Skill's HTTP API reference states this rule, uses `/translation/translateText` instead of `/ai/translateText` as the example of a computation on no stored resource, and adds that a route schema never uses `z.any()` and uses `z.unknown()` only for a genuinely free-form value, with a comment saying why.

- 3f01f61: Every failed `/api` response now has one body, `{ error: { code, status, reason, domain, message, localizedMessage?, fieldViolations?, metadata?, requestId } }`, following Google's AIP-193: `code` is the HTTP status, `status` one of a fixed set such as `NOT_FOUND`, and `reason` the stable, machine-readable cause clients branch on.

  - `@nocobase/app-server/router` exports `ApiError`, which a route throws to answer in that body, and `parseApiInput()`, which validates input against a zod schema inside Hono's `validator()` and answers `400 INVALID_ARGUMENT` naming every invalid field. The application renders anything a route does not: an unexpected error is an opaque `500 INTERNAL`, Hono's `HTTPException` and any error carrying a 4xx `status` keep it, and an unknown `/api` path is a JSON `404 ROUTE_NOT_FOUND` instead of the SPA page. Every `/api` response carries the request's id in `x-request-id`, reusing a safe id the caller sent, and the request log uses the same id. Repository routes report their errors in the new body, with the Repository error code as `reason` and `domain` `app`; a write refused by Policy carries its `path` and `details` in `metadata`.
  - `ApiClientError` (from `@nocobase/api-client`, re-exported by `@nocobase/app-client`) replaces `code` with `reason` and `domain`, read from the new body; `requestId` falls back to the body when the header is absent. Replace `error.code === 'X'` with `error.reason === 'X'`.
  - `AuthorizationDeniedError` carries `reason` `AUTHORIZATION_DENIED` and `domain` `authorization`, and its `getResponse()` answers the new body.
  - `auth.required()` answers an anonymous request with `401 UNAUTHENTICATED`, reason `AUTHENTICATION_REQUIRED`, and a credential Better Auth refuses with its status and Better Auth's code as `reason`, instead of `{ code: 'UNAUTHORIZED' }` and Better Auth's own body. Better Auth's own routes under `/api/auth/` are unchanged.
  - The authorization routes answer a denial with `403 PERMISSION_DENIED` and invalid settings input with `400 INVALID_ARGUMENT`, reason `INVALID_AUTHORIZATION_INPUT`, instead of `{ code: 'FORBIDDEN' }` and `{ code: 'INVALID_AUTHORIZATION_INPUT' }`.

- 21d274c: Data endpoints from `defineRepositoryApiRoutes` separate the exposure name and the action with a slash instead of a colon: `POST /api/{name}:{action}` is now `POST /api/{name}/{action}`, such as `POST /api/salesOrders/findMany`. The colon form is no longer routed and answers `404 ROUTE_NOT_FOUND`. `api.repository(name)` in `@nocobase/api-client` sends the new path.

  An exposure name must be a camelCase path segment matching `/^[a-z][a-zA-Z0-9]*$/`, and must not be `auth`, `healthz` or `swagger`. `defineRepositoryApiRoutes` throws at declaration for any other name, so an application exposing a name such as `sales/orders` or `sales-orders` must rename it, and its clients must use the new name. A duplicate name now reports which name was declared twice.

  The HTTP API specification in `@nocobase/app-skills` now covers singular or plural plugin namespaces, plugins mounted through another plugin's dispatcher, fixed segments registered before path parameters, the not-found rule, the `413`/`415` statuses and the removal of `422` and `502`, binary and multipart input, and the routes that keep their own shape. The generated plugin `AGENTS.md` from `@nocobase/create-plugin` states the namespace and data endpoint rules accordingly.

- 21d274c: Every `RepositoryError` now carries a `status`, the canonical error status its code maps to through the new `repositoryErrorStatuses` table exported by `@nocobase/db` (`INVALID_ARGUMENT`, `PERMISSION_DENIED`, `NOT_FOUND`, `ABORTED` or `INTERNAL`). The table is typed over every `RepositoryErrorCode`, so a new code does not compile until it has a status.

  `@nocobase/app-server` reads that status instead of keeping its own list of codes, so a code added to the Repository reaches an `/api` caller with the status chosen for it. Two answers change:

  - `RELATION_TARGET_NOT_FOUND` is `400 INVALID_ARGUMENT` instead of `404`: the missing target is one the request body names, not the resource in the URL.
  - `INVALID_WRITE_POLICY` is an opaque `500 INTERNAL` instead of `400`: write policies are server-owned, so an invalid one is a server misconfiguration.

  Every Repository error a caller sees now carries its `path` and `details` in `metadata`, not only the write-forbidden codes, and an `INVALID_ARGUMENT` one also names its path in `fieldViolations`.

### Minor Changes

- 21d274c: An application can set global limits for every `/api` request in a new `api` section of `config.yml`. All three are off by default and nothing is installed for one that is unset, so an application that does not set them behaves as before.

  ```yaml
  api:
    bodyLimit: 10mb
    timeout: 30s
    rateLimit:
      max: 600
      window: 1m
  ```

  - `bodyLimit` refuses a larger body, whether it declares its length or streams it, with `413 INVALID_ARGUMENT`, reason `BODY_TOO_LARGE`. It is a ceiling over every route; a route that needs a smaller limit sets its own.
  - `timeout` answers `503 UNAVAILABLE`, reason `REQUEST_TIMEOUT`, when a handler has not returned its response within the deadline. It covers only the time until the response exists, so a streaming response (SSE, NDJSON) that has started is not cut off. The handler is not cancelled; what it returns or throws after the deadline is discarded.
  - `rateLimit` allows `max` requests per `window` from each client connection address and answers `429 RESOURCE_EXHAUSTED`, reason `RATE_LIMITED`, with a `Retry-After` header in seconds. `GET /api/healthz` is exempt; Better Auth's routes under `/api/auth/` are counted. Counters are fixed windows kept in process memory and bounded, so each instance of a multi-instance deployment counts on its own, and behind a reverse proxy every request shares the proxy's address. A request whose address is unknown, such as one a Hub forwards to an application it hosts in process, is not counted.

  All three answer in the standard error body with domain `app` and the request's `x-request-id`. Sizes are a number of bytes or a string such as `512kb`, `10mb` or `1gb`; durations a number of milliseconds or a string such as `500ms`, `30s`, `1m` or `1h`.

  `@nocobase/app-server/router` exports `defineApiConfig()`, which declares the section with its validation, so `pnpm nocobase config check` and every start report a malformed value, and maps `API_BODY_LIMIT` and `API_TIMEOUT`; `installApiLimits()` and the individual middlewares are exported too. The three templates declare the section in `server/config/api.ts` and document it, commented out, in `config.example.yml`. An existing application adds the same `server/config/api.ts` and registers it in `server/config/index.ts` to get validation and the environment variables; without it, the limits it sets in `config.yml` still apply, but `config check` reports `api` as an unknown section.

  The `nocobase-app-development` Skill's HTTP API reference describes the limits and their reasons, and the `nocobase-deployment` Skill lists them among the production settings to review.

- 0b933b3: Applications now generate an OpenAPI 3.1 document for their `/api` routes and serve it at `GET /api/swagger`, with Swagger UI at `GET /api/swagger/docs`, which keeps what "Authorize" was given, such as an API key, across reloads. The Swagger UI files ship in `@nocobase/app-server`'s `dist`; no CDN is involved and templates declare nothing.

  `@nocobase/app-server/router` exports what a route declares itself with: `describeRoute()` re-exported from `hono-openapi`, `resolver(schema, direction?)`, `apiValidator(target, schema)` — which validates a Standard Schema such as a zod schema, answers invalid input exactly as `parseApiInput()` does (`400 INVALID_ARGUMENT`, reason `INVALID_INPUT`, domain `app`, one field violation per issue) and documents the parameters or body — and the response helpers `dataResponse()`, `listResponse()`, `emptyResponse()`, `apiErrorResponse()` and `apiErrorResponses`, which reference the shared standard error body. `apiErrorResponses` is `401`, `403` and `500`, for an authenticated route with a permission check; it does not include `400`. A route with an `apiValidator()` gets the `400` for invalid input in the document automatically, as the shared `InvalidInput` response, and a route without one gets none; a `400` the route declares itself for another reason, such as a failed precondition, is kept and documented after the invalid-input description. `parseApiInput()` keeps working and is superseded. Plugins import these from `@nocobase/app-server/router` and must not declare `hono-openapi` themselves; `pnpm peers:check` now fails one that does.

  Data endpoints from `defineRepositoryApiRoutes` are documented automatically: each action gets an operation whose record, `values` and filter schemas are read from the Collection field by field, with the filter operators each field accepts and a shared `RepositoryFilter` component describing the grammar. Fields a fixed Policy forbids are left out. An exposure entry accepts `computedFields: { name: schema }`, a Standard Schema such as a zod schema or an OpenAPI schema per field, for fields it adds to every returned record that the Collection does not have; they are documented read-only in the exposure's record schema wherever a record is returned and never in `values`, `filter` or `sort`. The declaration changes nothing at runtime, and a name the Collection also has fails when the routes are created. `GET /api/healthz` is declared too, with `security: []` because it needs no credential.

  The documentation is served only to requests an access check allows. Plugins register checks, and fragments for routes a library defines, through the new `apiDocsToken` service (`addAccess()`, `addFragment()`, `invalidate()`); a fragment may also carry `components.securitySchemes` and `security` requirements, which the document lists at its top level as alternatives, so a route that needs no credential declares `security: []`, and a document nothing contributes a scheme to has no `security` at all; until a check is registered the documentation routes answer `404 ROUTE_NOT_FOUND`, so an application without one publishes nothing. `inspectApiRoutes(app)` and `findUndeclaredApiRoutes(app)` report what each route of a started application declares, and `Application.apiRouter` exposes the assembled `/api` router. A plugin that serves routes through a runtime dispatcher, a catch-all on `/api` that hands each request to a router at request time, registers each router with `addApiRouter({ owner, prefix, scope?, router })`: its routes are documented, inspected and checked for duplicates at `prefix` followed by their own paths, exactly like routes mounted on `/api`. `scope` names the sub-path the dispatcher actually forwards to the router, such as `/sharingRules`; a route the router declares outside it is never reached, so it is left out of the document and the duplicate check and reported as undeclared. A forwarded target the framework cannot see into, such as a plain function, is registered with `addUndeclaredApiRoute({ owner, method, path, reason? })`, which `findUndeclaredApiRoutes(app)` always reports and the document never lists; `pnpm openapi:check` prints the `reason` of such a route. Both return a function that removes the registration, and `Application.forwardedApiRoutes` lists what is registered. A plugin route under `/api/swagger` now fails start as a duplicate route.

  Schemas are converted under the document's conventions rather than hono-openapi's defaults. A response object is open unless its zod schema is strict (`z.strictObject()` or `.strict()`), so adding a response field is not a breaking change; a request body validated with `z.strictObject()` stays closed. A recursive schema such as `z.json()` becomes a component named by its `ref`, or `JsonValue`, or `Recursive<hash>` for another anonymous one, instead of a converter-generated `__schema0` that collided across routes or a `$ref` into `#/$defs` that resolved nowhere. A property whose schema is a shared one keeps its own description next to the `$ref`, and the shared component keeps its own. `apiValidator('header', ...)` leaves `Accept`, `Authorization` and `Content-Type` out of the parameters, as OpenAPI ignores them there. `findApiDocumentSchemaProblems(document)` lists unresolved references and converter-generated component names, for a test to expect none.

  `@nocobase/db` exports `filterOperatorsForFieldType()`, `supportsFilterShorthand()` and `isSortableFieldType()`, the tables the Repository validates filters and sorts against, so descriptions of the filter grammar are derived from them rather than copied.

  The `nocobase-app-development` Skill's HTTP API reference describes the API documentation: how people and agents read it (`<APP_BASE_PATH>/api/swagger/docs` and `<APP_BASE_PATH>/api/swagger` with a session or an `x-api-key` header, `401` without one and `404` when no access check is registered), how to declare a route and list only the error statuses it can produce (no `400` for input validation, which `apiValidator()` adds; `apiErrorResponses` only for an authenticated route with a permission check), `security: []` for a route reached without a credential, the five kinds of route that may be hidden, response schemas typed against the service's view type, `computedFields` on a data exposure, routes registered through `authz.routes.add` with `createRouteHandler`, routers forwarded by a plugin's own runtime dispatcher (`addApiRouter()` and `addUndeclaredApiRoute()`), and the test assertions. Its entry `SKILL.md` tells an agent to learn an application's endpoints from the JSON document rather than from route sources, and its server routes, testing and organisation references show routes declared with `describeRoute()` and validated with `apiValidator()`. The `nocobase-deployment` Skill describes the API documentation in production: who may read it, that there is no switch to make it public, and that restricting it further is done at the reverse proxy.

### Patch Changes

- 463a7a8: The database tests of `@nocobase/app-server`, `@nocobase/app-cli` and the examples template take their databases from `@nocobase/db-testing` instead of configuring SQLite files or in-memory databases, so they run on the dialect `NOCOBASE_TEST_DB_DIALECT` selects and on SQLite otherwise. Cases whose subject is SQLite itself, such as preparing SQLite storage or the examples template's SQLite stand-in for an external CRM, move to files marked `db-test-portability: sqlite-only`. Each package adds `@nocobase/db-testing` as a development dependency, and applications generated from the examples template get it with the tests they ship. Nothing any of these packages runs in production changes.
- 7dbc54b: Repository writes can now be observed. `connection.onRepositoryMutation({ collections, keys?, values?, id? }, { inTransaction?, afterCommit? })` subscribes to the rows Repository writes change and returns a function that unsubscribes. Every write method emits one event per call that wrote at least one row, listing each row it created, updated or deleted — nested relation targets, foreign keys and through rows included — with its key and the fields written; a subscription matches when any of those rows belongs to one of its Collections. Subscriptions belong to the root connection and are shared with its transactions and policy-bound connections.

  `inTransaction(event, connection)` runs inside the call's transaction once its writes are done; throwing fails the call with that error and rolls back an implicit transaction. `afterCommit(events, connection)` runs once per outermost commit with that transaction's matching events and the root connection, and drops them when the transaction or savepoint rolls back; its errors go to the new connection option `onRepositoryEventError(error, { subscriptionId, operationIds })`, or become a process warning whose `code` is `REPOSITORY_EVENT_LISTENER_FAILED` and whose `cause` is the error. Writes made through the connection either listener receives emit events with `parentOperationId`, nested at most `repositoryEventMaxDepth` levels (a new connection option, default 8) before they fail with the new `RepositoryError` code `REPOSITORY_EVENT_RECURSION`. A subscription matches an event by its root Collection or any Collection among its row changes.

  A connection without subscriptions runs every write exactly as before. When a subscription asks for keys (the default), `updateMany` and `deleteMany` lock the matching rows and write them by key, and `createMany` keeps its single statement when every row supplies its key, otherwise uses one multi-row `INSERT … RETURNING` where the dialect runtime declares the new `insertManyReturning` flag (`@nocobase/db-sqlite` does) or inserts row by row. Subscriptions declaring `keys: false`, and Collections whose rows have no primary key or non-null unique key, keep the single statement and receive a `count` event. `connection.explainRepositoryEvents({ collection, operation })` reports the strategy, granularity and whether an implicit transaction is opened.

  The write methods accept a `meta` option built with the new `defineRepositoryEventMeta<T>(namespace)` handle, whose `read(event)` returns the typed value; `values: true` subscriptions also receive the written values. Writes made through `query`, `client()`, migration and seed tasks, and rows changed by database cascades emit nothing, and events are delivered only in the process that wrote.

  `@nocobase/app-server` ignores the two new connection options when deciding whether two connections point at the same database, and answers `REPOSITORY_EVENT_RECURSION` as a server error.

- 7dbc54b: `DatabaseConnection` gains `afterCommit(callback)` and `afterRollback(callback)`. A commit callback runs after the outermost transaction commits, in registration order, once the transaction's Collection metadata changes are applied, and `transaction()` resolves only after every commit callback has finished. Registered inside a nested `transaction()`, it waits for the outer commit and is dropped if that savepoint rolls back; outside a transaction it starts at once. Rollback callbacks receive the error after the transaction or savepoint rolls back, including when the commit itself fails. A callback that throws does not change the transaction's outcome: the error goes to the new connection option `onTransactionCallbackError(error, phase)`, or becomes a process warning whose `code` is `TRANSACTION_CALLBACK_FAILED` and whose `cause` is the error. The `COLLECTION_METADATA_INVALIDATION_FAILED` warning now carries its code the same way. Registering either on a transaction connection after its transaction has finished throws. Policy-bound connections forward both methods.

  Collection metadata changed inside a nested `transaction()` now reaches the connection's Registry when the outer transaction commits; before, only the outer transaction's own changes did, so the root connection could keep serving the old schema. If `onTransactionCallbackError` itself throws, that error becomes a warning too and the transaction's outcome is still unchanged.

  `@nocobase/app-server` ignores `onTransactionCallbackError` when deciding whether two connections point at the same database.

- Updated dependencies [21d274c]
- Updated dependencies [7f9450e]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [27f09bd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [be0fbbd]
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/db-mysql@0.1.0-beta.3
  - @nocobase/db-sqlite@0.1.0-beta.4
  - @nocobase/db-postgres@0.1.0-beta.3
  - @nocobase/db-kingbase@0.1.0-beta.3
  - @nocobase/db-oceanbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.2
  - @nocobase/db-oracle@0.1.0-beta.3
  - @nocobase/db-dameng@0.1.0-beta.3
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.8
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.32

### Minor Changes

- 9291dbb: Pass `locales` the same way on the client and the server

  `defineClientPlugin`, `defineServerPlugin` and both sides' `defineAppRuntime` now accept the `locales/index.ts` module itself or a function importing it, typed as the new `LocalesContribution` from `@nocobase/i18n`, which also exports `resolveLocalesContribution` to turn either into the module. Previously the client took only the module and the server only a function, so a plugin wired the same file two different ways. The module is the recommended form on both sides: each language in it is already a separate dynamic import, so importing the map statically loads no translations early. Existing `locales: () => import('./locales/index.js')` declarations keep working unchanged. `@nocobase/app-server` exports `AppServerPluginLocales` for the widened type and keeps `AppServerPluginLocalesLoader` as a deprecated alias. The bundled plugins, the application templates' `server/runtime.ts` and plugins generated by `create-plugin` now import their server locales statically.

- e77641b: Rebuild `@nocobase/queue` on BullMQ 6.3.6, with producers, consumers and managers per application

  **Breaking.** `@nocobase/queue` no longer wraps `@boringnode/queue`. `createQueueService(config, { appName, storagePath, logger?, onFallback? })` creates one application's `QueueService`, whose `producer(queue, configKey?)`, `consumer(queue, configKey?)` and `manager(queue, configKey?)` are bound to a named queue:

  - `producer().publish(channel, message, options?)` and `publishMany([{ channel, message }], options?)` write JSON messages with `priority`, `delay`, `attempts`, `backoff` (`fixed` or `exponential`), `removeOnComplete`, `removeOnFail` and a `jobIdProducer`. A batch is prepared entirely before anything is written.
  - `consumer().consume(handler)` registers a handler `(channel, message, signal)` and returns the function that unregisters it once its running calls settle. Every handler of a queue runs for every job; `withChannel(channels, handler)` filters channels.
  - `manager().configure()` changes concurrency, job defaults and the global rate limit at runtime; `drain()` empties waiting jobs; `cancelJob()` and `cancelAllJobs()` cancel jobs this instance runs, without a retry.
  - An `adapter: 'redis'` configuration runs on BullMQ through its public Queue and Worker APIs, each queue under the hash-tagged prefix `nbq:{<digest>}`. `adapter: 'inMemory'` runs in the process and writes unfinished jobs to `storage/queue` when it shuts down; it serves one process. Its optional `queueBackend` names a BullMQ backend factory registered with `registerBackend()`, such as a PostgreSQL one; left out, BullMQ's own Redis backend is used. Redis Cluster is not supported yet.
  - `Job`, `Locator`, `Worker`, `Schedule`, `QueueManager`, `createQueueManager`, `createSyncQueueConfig`, the `sync` and `database` drivers, job discovery, job factories and the OpenTelemetry instrumentation are removed. So is the database driver's migration.

  The `queue` configuration section now has the shape of `jobs`: `default` names a key, and every other key is one complete configuration. Without `queue.default`, queues run on the built-in memory configuration, reported once outside development. A section in the former `connections`/`worker`/`jobs` format is ignored with one warning instead of stopping the application, and its `default` is ignored unless it names a key of the new format.

  `@nocobase/app-server/queue` exports `QueueServiceProvider`, constructed with `{ nodeEnv }`, `queueServiceToken` and `AppQueueConfig`; `QueueProvider`, `queueManagerToken` and `queueJobFactoryRegistryToken` are removed. The provider sets the service up in `start()`, after every provider has booted, and shuts it down last. `planAppRuntimeDatabaseTasks` and `AppRuntimeDatabaseTaskPlanOptions` are removed: planning no longer adds a queue migration source, and `runAppDatabaseTasks` keeps its `runtimeConfig` option. The plugin field `queue: { jobs }` and `createPluginJobLocations()` are deprecated: the field is accepted and ignored, each plugin declaring it is reported once at startup, plugin inspection reports it as the `SERVER_QUEUE_JOBS_DEPRECATED` warning in place of `SERVER_JOB_LOCATION_MISSING`, and `createPluginJobLocations()` returns an empty list.

  The templates compose `QueueServiceProvider`, declare a `memory` and a `redis` key in `server/config/queue.ts`, and drop the `@/jobs` path alias. `create-plugin`'s `server.jobs` capability now generates a `@nocobase/jobs` job and the provider that owns the plugin's `JobExecutor`, instead of a Queue Job; the plugin declares `@nocobase/jobs` as a peer. The Vitest presets no longer inline `@boringnode/queue`. The application development Skill makes `@nocobase/jobs` the default for background work — `JobExecutor` for one-off tasks, `ScheduleExecutor` for recurring ones — and keeps queues for delays, priorities, deduplicating IDs, batches, rate limits and fan-out; the deployment Skill covers the `queue` backend next to the `jobs` one. The queue example plugin now publishes greetings and digest batches and consumes them with two handlers.

  The `queue_jobs` and `queue_schedules` tables of the former database driver, and their migration's history record, are left in place: the migrator only checks packages that still contribute migrations, so startup is unaffected. Drop the tables by hand when nothing reads them. `pnpm nocobase db rollback` refuses to roll back a batch that contains that history record, so it fails while the latest batch is the one that created the tables, as in an application that has applied no migration since.

  Upgrading an application:

  1. In `server/app.ts`, replace `app.addServiceProvider(QueueProvider)` with `app.addServiceProvider(QueueServiceProvider, { nodeEnv: runtime.env.NODE_ENV })`, imported from `@nocobase/app-server/queue`.
  2. Replace `server/config/queue.ts` with configuration keys, such as `memory: { adapter: 'inMemory', persistence: { path: paths.storage('queue') } }` and `redis: { adapter: 'redis', connection: { host, port, db } }`, and set `queue.default` in `config.yml` to the one to run on; an application running more than one instance needs `redis`.
  3. Move each `server/jobs` Job to `@nocobase/jobs`: a `JobExecutor` job registered and set up by the provider that owns it, submitted with `addJob(new Job(payload))`, or a `ScheduleExecutor` rule for recurring work. Use a queue handler registered with `queueServiceToken` in a provider's `boot()`, published with `producer(queue).publish(channel, message)`, only for work that needs a delay, a priority, a deduplicating job ID, a batch, a rate limit or several handlers. Remove `queue: { jobs }` from plugin declarations and `createPluginJobLocations()` from configuration. Jobs still waiting in the former queue storage are not moved.

### Patch Changes

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [a859ba1]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.8
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.31

### Patch Changes

- 3d44c4c: Add one-off `JobExecutor` tasks alongside recurring `ScheduleExecutor` rules through the existing application jobs provider and service token. Jobs declare an own stable static `jobName`, accept only payload in their constructors, and reconstruct a fresh instance for every attempt from a strict JSON snapshot. Consumers register classes before setup; producer-only executors use `setup({ consume: false })`.

  Identify ordinary tasks by connection or storage path, namespace and scope, like Schedule, so renaming a configuration key or replacing the built-in default with `jobs.default: memory` keeps pending tasks; they use Redis queues and pending-only memory snapshots separate from Schedule's. Report local attempt events, including `JobProgress` for the 0–100 progress a handler reports through `reportProgress` (stored as BullMQ job progress on Redis), preserve explicitly interrupted work for recovery, and complete successful handlers even when shutdown has aborted their signal. Memory persistence remains setup-read and shutdown-write, so forced exits can lose new tasks or replay work completed since the last snapshot.

  Rename the shared configuration and service types from `Schedule*` to `Jobs*`, because they configure ordinary and recurring executors alike: `ScheduleConfig` is now `JobsConfig`, and `ScheduleAdapterConfig`, `RedisScheduleAdapterConfig`, `MemoryScheduleAdapterConfig`, `ScheduleRedisConnectionOptions`, `ScheduleRetentionPolicy`, `ScheduleLogger` and `ScheduleFallbackEvent` are now `JobsAdapterConfig`, `RedisJobsAdapterConfig`, `MemoryJobsAdapterConfig`, `JobsRedisConnectionOptions`, `JobsRetentionPolicy`, `JobsLogger` and `JobsFallbackEvent`. The old names are removed, so code importing them from `@nocobase/jobs` must switch to the new ones. Shared error messages now say "jobs" instead of "schedule". Types specific to recurring rules, such as `ScheduleExecutor` and `ScheduleJob`, keep their names.

  Document ordinary and recurring executor ownership in app-server and update application-development guidance to distinguish payload-only tasks from the unchanged queue-job and Scheduler APIs.

- Updated dependencies [3d44c4c]
  - @nocobase/jobs@0.1.0-beta.1
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.3
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.30

### Minor Changes

- aeff80a: Add `@nocobase/jobs`, persistent recurring jobs with one executor per consumer, and compose it under `@nocobase/app-server/jobs`

  `createJobExecutorService(config, { appName, storagePath, logger, onFallback })` hands out executors by scope and configuration key; an executor's concurrency, attempts and retention are those of its configuration. An executor stores each job's rule in a backend and runs its handler when the rule fires: `addJob(job, registerOnly?)` skips the write when the rule, payload and execution settings are unchanged, passes `immediately` only for a new job, and registers the handler alone with `registerOnly`; `removeJob` keeps the handler; `subscribe` reports the firings this instance ran, with `jobId`, `scheduledAt`, `runAt` and `nextRunAt`; a firing whose job has no handler fails once as `handler-not-registered`. Two adapters implement it. `redis` uses BullMQ 6.3.6 job schedulers through their public API only and runs each firing on exactly one instance. `memory` keeps rules, next firings and counts in the process, reads them from a versioned state file under `persistence.path` at setup and overwrites that file whole at shutdown; it serves one process, and one that ends without shutting down loses what changed since it started. A firing missed while the process was stopped runs once after it starts again.

  `@nocobase/app-server/jobs` exports `jobExecutorServiceToken`, `JobExecutorServiceProvider` and `AppJobsConfig`. The provider reads the `jobs` section, defaults `namespace` to the application name and the built-in memory configuration to `storage/jobs`, reports a fallback to that configuration outside `develop` and `development` (pass `{ nodeEnv }` when adding it), and shuts down executors their owners left running. `@nocobase/app-server` declares `@nocobase/jobs` as a peer; applications provide it.

### Patch Changes

- Updated dependencies [aeff80a]
  - @nocobase/jobs@0.1.0-beta.0

## 1.0.0-beta.29

### Major Changes

- 46ce11f: The client reads its runtime values only from the configuration the server renders into `index.html`. The router basename and `resolveAppUrl` take `app.basePath` from that block and throw when the page carries none, `defineAppRuntime` no longer accepts `basename`, and the block is read once per page. The server no longer writes `window` globals: `SpaConfig.runtime` and its `storagePrefix`, `storageType` and `shareToken` settings are removed. The public configuration gains `app.displayName` and `app.version` from the application's `package.json`, which the templates' sidebar footer now shows in place of the `__PORTAL_TEMPLATE_*` constants Vite used to define.

  The templates drop `@nocobase/app-portal-sdk`, `assetUrl`, every Vite `define` and `envPrefix`, and register a test setup that renders the configuration block. The `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

### Patch Changes

- @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.3
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.28

### Minor Changes

- a4ee8aa: A standalone application keeps its data under `APP_STORAGE_DIR` when it is set, absolute or relative to the deployment root, instead of `storage/` in the deployment root. Set it when the deployment root is replaced on every release, as an installer that keeps one directory per release does. Explicit storage paths still take precedence, and embedded applications keep the volume their host provides. The Hub template's own `HUB_STORAGE_DIR` is gone in favour of it: a Hub deployment that sets only `HUB_STORAGE_DIR` must rename it to `APP_STORAGE_DIR` before upgrading, or the Hub starts on an empty storage directory.

## 1.0.0-beta.27

### Major Changes

- 4adcf24: Keep hand-written Collection metadata apart from the generated `collections/` cache

  `database/<connection>/collections/` used to hold two opposite things: a generated snapshot for a managed connection, and, for an external connection, `metadata.json` files that were the hand-written metadata source. The two now live in separate directories, so a directory is either written by people or generated, never both.

  - `DirectoryCollectionMetadataStore` reads a directory of `<name>.json` files, each holding one Collection metadata document with no wrapper. It refuses a directory in the generated `<name>/metadata.json` layout and says how to move it.
  - An external connection with no configured `metadataStore` reads `database/<connection>/metadata/<name>.json`. A `metadataStore` string names a directory in that layout, and may not point at a generated `collections/` directory. An application that still keeps metadata at `database/<connection>/collections/<name>/metadata.json` fails at startup with the steps to move it, rather than silently resolving its Collections without metadata. `resolveAppMetadataDirectory()` is exported beside `resolveAppCollectionsDirectory()`.
  - `collections generate` treats `collections/` as a cache for every connection, external ones included: it writes all three files there and never touches `metadata/`. The `orphans` result field is gone; a hand-written document whose Collection the database no longer has is reported as `unusedMetadata` and left in place. `_manifest.json` now records `generated: true`.
  - `nocobase build` copies `database/<connection>/metadata/` into `dist` instead of the `metadata.json` files under `collections/`.
  - The templates and generated applications ignore `/database/*/collections/` with one line instead of naming each managed connection. The Examples template moves its external CRM metadata to `database/externalCrm/metadata/`.

  To upgrade an application with an external connection, write each `"document"` from `database/<connection>/collections/<name>/metadata.json` to `database/<connection>/metadata/<name>.json`, point any `metadataStore` string at the new directory, delete the old `collections/` directory and regenerate it. Replace the per-connection `collections/` lines in `.gitignore` with `/database/*/collections/`. The `nocobase-app-upgrade` Skill lists the steps.

### Minor Changes

- 05af1d4: Refresh the Collection cache when migrations change a schema

  `database/<connection>/collections/` went stale after every migration until someone ran `collections generate`. It is now refreshed where the schema changes:

  - `db apply`, `db redo`, `db rollback` and `db reset` regenerate it for each connection whose migrations they executed, rolled back or rebuilt. `--no-collections` skips it, and a built `dist/` never writes it. A failed refresh is a warning, not a failure: the migrations stay applied and the command still exits 0. With `--json`, the result gains a `collections` field listing each refresh; it is absent when nothing was refreshed.
  - `pnpm dev` does the same after the startup migrations of the application it started. `nocobase dev` names that application's root in `NOCOBASE_COLLECTIONS_REFRESH`, which `DatabaseProvider` compares against its own root, so a Hub's in-process applications and production never write the cache.
  - `refreshAppCollectionsArtifact()` in `@nocobase/app-server/database` is the shared implementation: given a database run's result, it regenerates the cache of every connection whose schema changed.

  Seeds and `db repair` or `db unlock` do not trigger a refresh. After editing an external connection's `metadata/`, or when another system changes its schema, run `collections generate` yourself.

- ec92b20: Console log records can go to stderr. `console.stream: 'stderr'` in the logging output options writes them there instead of stdout, and a standalone scope's `consoleLogStream` sets it for an application without touching its logging configuration. The application command line uses this for every application a command creates, so records never mix with a command's `--json` document on stdout. Servers are unaffected: without the option, records go to stdout as before.
- ec92b20: A busy migration or seed lock throws `TaskLockBusyError` (checked with `isTaskLockBusyError()`), carrying the lock table, the holder, its heartbeat and whether it expired, instead of a plain `Error`; the messages are unchanged. `Seeder.history()` reads the executed seeds without taking a lock, as `Migrator.history()` does for migrations. The application's database task runner accepts `dryRun` for `run` and reports the pending migrations and seeds per connection in each result's `pending`, which `nocobase db apply --dry-run` uses. A driver may implement `hasStorage(config)` to say whether the local storage a connection opens exists yet; `@nocobase/db-sqlite` checks for the database file. A dry run consults it and answers for an empty database rather than preparing storage and connecting, so previewing an application whose SQLite file does not exist yet no longer creates it.

### Patch Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- Updated dependencies [02d5402]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/logging@0.1.0-beta.6
  - @nocobase/db-sqlite@0.1.0-beta.3
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.26

### Minor Changes

- f6c3cd8: Let a configuration section declare validation and the fields the browser may read, and use it to hide sign-up when the server has disabled it.

  `defineAppConfig` in `@nocobase/app-server/config` now also takes an object, `{ defaults, validate, public }`, where `defaults` is an object or a function of the runtime; the function form keeps working unchanged. `validate` may be async and reports with `ctx.error(path, message, { fix })` and `ctx.warning(path, message)`. It runs when the application starts, where an error stops the start with every problem listed, on `AppConfig.reload()`, which refuses a configuration that breaks a rule and keeps the running one, and in `pnpm config:check`, which reports each problem with code `invalid`. `defineAppDatabaseConfig` now checks that `database.default` names a configured connection and that every connection sets a dialect. `checkConnections` moved from `@nocobase/app-cli` into `@nocobase/app-server/database`.

  `public` lists leaf fields, relative to the section, that are sent to the browser in a separate `public` block of the page's runtime configuration. The browser reads them with `config.public.get('<section>.<field>')` at the same path as on the server; `config.get` never returns them and, in development, throws when asked for one, and `config.public.get` warns with the published paths when asked for one that is not. Anything not listed is never sent, and an object, function or instance cannot be listed. `i18n.defaultLocale` is now always published this way; the client still falls back to `client.i18n.defaultLocale`. `pnpm config:check` lists the published values, and its `--json` result carries them under `public`.

  `@nocobase/app-plugin-authentication` adds `defineAuthConfig` for the `auth` section, which validates the `emailAndPassword` switches and publishes `emailAndPassword.enabled` and `emailAndPassword.disableSignUp`, and `useSignUpAvailable()` on the client. The templates declare `auth` with it, their `PasswordLoginForm` hides the sign-up link and `/register` redirects to `/login` while the server refuses sign-up. An existing application keeps working but must switch `server/config/auth.ts` to `defineAuthConfig({ defaults: { ... } })` for this to take effect; until then the plugin logs a warning at startup. Copy the updated `password-login-form.tsx` and `pages/auth/register.tsx` from the new template version to get the same behavior.

- f3917b6: Check each database connection's options against its dialect driver before the application starts. `defineAppDatabaseConfig` now runs the driver's own `normalizeConnection` and `resolveConnection` for every connection, both of which build options without connecting, and reports what the driver rejects under `database.connections.<name>` — at startup, on reload and in `pnpm config:check` — instead of only when the connection is first opened. A dialect whose driver is not installed is still reported by loading the configuration.
- d18e964: Declare environment variables on the configuration section they set, list them with `pnpm config:env`, and stop shipping environment variables nothing reads.

  `defineAppConfig` takes `env`, a map from variable to a mapping relative to the section, such as `{ APP_SERVER_PORT: envInteger('port') }`. The runtime loads these above the configuration file once the sections are known, and refuses one variable declared for two different fields. `defineAuthConfig` maps `AUTH_SECRET` itself, and the templates declare the rest in `server/config/session.ts`, `server.ts`, `app.ts`, `i18n.ts`, `snowflake.ts` and `spa.ts`. `server/environment.ts` is gone and `server/config.ts` loads only the configuration file. An existing application that keeps its own `server/environment.ts` still works, since a variable mapped twice to the same field is harmless; to move over, copy the `env` of each section file from the new template version and delete the mapping file.

  `pnpm config:env`, also in a built `dist/`, lists every variable the application reads — those its sections declare, with the configuration path each sets, and those the runtime reads itself, `APP_BASE_PATH`, `APP_CONFIG_FILE` and `NOCOBASE_STRICT_STARTUP` — and whether each is set, never its value. `--json` prints the same list. `RUNTIME_ENVIRONMENT_VARIABLES` in `@nocobase/app-server/config` names the runtime-read ones.

  `APP_NAME` is gone from the Hub's `.env.example` and from the `.env` that `create-app` writes for a Hub, which used to set it to the project directory's name: nothing read it, and an application's name follows from `APP_BASE_PATH`. The commented `API_CLIENT_*` lines are gone for the same reason. The Hub template gains a test that every variable `.env.example` names is one `config:env` lists. `pnpm build` no longer copies `DB_*`, `QUEUE_*`, `REDIS_*`, `SMTP_*`, `API_CLIENT_*` and the notification provider variables into `dist/.env`; nothing reads any of them.

## 1.0.0-beta.25

### Minor Changes

- 4e58fe3: Add `nocobase app config check` and `nocobase app config set`, run in an application as `pnpm config:check` and `pnpm config:set`, so a configuration is written by `config:init`, changed by `config:set` and verified by `config:check`.

  `config:check` loads the configuration through the application itself — its files, its environment and its code defaults — without starting it. A file that fails to parse, or a database driver that is not installed, fails here for the same reason it would fail a start. It then reports what loading alone does not show: a secret missing or still the placeholder, a `session.secret` that is regenerated at every start and so ends every session with the process, a top-level section nothing reads with the name that was probably meant, and a `${NAME}` written where it is not expanded and would be used as literal text. Databases other than SQLite are connected to, one connection each taken from the pool and handed back, without running SQL or migrating anything; `--connect` includes SQLite and `--no-connect` stays offline. Each finding carries the key and, where there is one, a command that fixes it, and the command exits non-zero on any error, or on any warning with `--strict`.

  `config:set` sets `key=value` assignments in the file the application reads, keeping its comments, and writes it once. A key under a section the application does not know is refused with the nearest known one, so a typo fails instead of being written where nothing reads it. With `--from-env` each value names an environment variable to read, so a secret stays out of the command line. After writing it loads the configuration again and reports any key an environment variable overrides.

  `config:init` now returns its `nextCommands` and, for a database other than SQLite, the `requiredSettings` still at a placeholder. On a terminal it asks for them, reading the password without echo, and tries the connection before writing. Run on an application that is already configured it leaves the file alone and reports `unchanged`, failing only when `--dialect` asks for a different database than the one configured.

  A built `dist/package.json` carries `config:check` and `config:set` scripts, and its `pnpm-workspace.yaml` sets `verifyDepsBeforeRun: false`, so running one of a deployment's own scripts never makes pnpm install first. `create-app` includes `pnpm config:check` in the `nextCommands` it returns.

  `AppConfig` gains `layers()`, which returns the code defaults and the values the application's own sources supply as separate read-only copies — the distinction a check needs to tell a known section from a misspelled one.

- 4e58fe3: Add `nocobase app config init`, which writes the configuration file an application starts from, and run it in an application with `pnpm config:init`.

  It generates `config.yml` from the application's `config.example.yml` so the example's comments reach the file people edit, fills in `auth.secret` and `session.secret`, and points `database.connections.main` at the selected dialect while leaving every other connection alone. The dialect defaults to the installed driver when there is exactly one, is asked for on a terminal when there are several, and must be given with `--dialect` in a script.

  The command installs nothing. Which dialects an application can run on is decided by the driver it depends on, so a missing one is reported with the `pnpm add` that supplies it — pinned to the range the installed `@nocobase/app-server` declares for that driver, because the newest release is not necessarily one the runtime was built against — rather than installed behind the user's back — in a deployment, where adding a driver to a built `dist` would be undone by the next build, it reports that the application has to be built again instead. Everything is validated before anything is written, so a run that reports a problem leaves the directory untouched and can simply be repeated once the driver is there.

  The three application templates now declare `@nocobase/db-sqlite`, the driver their own `server/config/database.ts` defaults to, so a new application can be configured and started without installing one first.

  `@nocobase/app-server` exports `OFFICIAL_DIALECTS` and `OfficialDialect` from `@nocobase/app-server/database`, so tooling that has to name the dialects reads the same list the runtime loads drivers from.

  The application development and deployment Skills describe the new step: how an application is configured, that the driver decides which dialects it can run on, and that a deployment writes its configuration with `pnpm config:init` inside `dist/`, from the `config.example.yml` the archive carries. The database Skill shipped with `@nocobase/db` now points at `pnpm config:init` rather than at a creation flag that no longer exists.

### Patch Changes

- 4e58fe3: Stop `pnpm dev` before it launches an application that has nowhere to read its configuration from, and say how to create one.

  Without configuration the server throws on startup, which `pnpm dev` then hides: it runs the server under `tsx watch`, which prints the error and waits for a file to change rather than exiting, while Vite carries on and prints a URL. The command looks like it succeeded, exits with nothing, and the page it points at has no API behind it. The check runs before anything is spawned and names `pnpm config:init`.

  What it checks is that a configuration source exists, not that its contents are valid — a file beside the application, a path in `APP_CONFIG_FILE`, or `AUTH_SECRET` in the environment as the application loads it, `.env` files included, all count, so an application configured entirely through the environment still starts. Validity stays with the runtime, which already reports a placeholder secret, a missing `auth.secret` and a dialect with no driver, each with the key and the command that fixes it.

  `pnpm start` — in the application and in a built `dist` alike — stops at once for the same reason, because a server with no `auth.secret` refuses to start. That failure is now an `ApplicationNotConfiguredError`, exported from `@nocobase/app-server/config`, which states only what is missing — the key, and the environment variable that can supply it. A standalone start prints it with the instruction to run `pnpm config:init` in place of a stack trace; the instruction is added there rather than carried by the error, because a Hub showing the same failure to an operator configures its applications itself. `build` is left alone as well — compiling the client and server, generating `dist/package.json` and installing production dependencies never reads a secret, and requiring one would break both an application's own `pnpm check` and any image build that builds before its configuration exists.

  A built `dist/package.json` now has a `config:init` script, so a deployment is configured with `pnpm config:init` inside `dist/` — the same step development uses — and the configuration lands beside `dist/`, where the built runtime reads it.

  The missing-driver error now says to add the driver to the application's dependencies and to build a deployment again afterwards, rather than implying it can be installed wherever the error appeared — in a deployment that runs from a built `dist`, installing one there is undone by the next build.

- 4e58fe3: Report every database connection whose driver is missing at once, with one `pnpm add` that installs them all.

  Resolution stopped at the first connection without a driver, so a configuration missing two — the Examples template on PostgreSQL still needs SQLite for its analytics connection — took two failed starts to discover, each naming half of the problem. The error is now a `MissingDatabaseDriversError`, exported from `@nocobase/app-server/database`, whose `missing` lists each connection with its dialect and package, so tooling can point at every one.

- Updated dependencies [4e58fe3]
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.2
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.24

### Minor Changes

- 8f1ead4: Add `nocobase app db doctor`, which compares stored Collection metadata with the schema behind it and deletes the records whose table is gone.

  The physical schema and the Collection metadata are two records of what exists, and they can disagree: a table dropped outside a migration leaves its metadata record behind, and from then on resolving that Collection fails — including inside the migration that would recreate it, which is how the state becomes self-sustaining. Until now nothing reported it and nothing fixed it, so the only way out was deleting rows from `__nocobase_collection_metadata` by hand, which the documentation forbids for good reason.

  `ConnectionCollections.diagnose()` walks every metadata record, reports the ones whose physical table is missing as `COLLECTION_TABLE_MISSING`, and for the rest reports whatever resolving them reports. Only a missing table is marked `orphaned`, because deleting the record is then a complete fix; every other issue means the table is there and something in it no longer matches, which a migration has to reconcile.

  `db doctor` prints what disagrees per connection and exits non-zero while anything remains. `--fix` deletes the orphaned records and leaves the rest alone, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. The three templates gain a `db:doctor` script.

  `runAppCollectionsDoctor` is exported for hosts that run it themselves, and the connection selection the artifact generator already had is now shared rather than duplicated.

  The migrations reference also records why `onChecksumMismatch` defaults to `warn` and when to set `error` for a connection. The default was an implicit choice in the code, leaving a reader no way to judge whether to flip it: a checksum hashes the migration's file contents, so formatting the directory changes it and `error` would then stop the application from starting; startup runs migrations, so refusing to run turns drift into an outage on an upgrade where the compiled representation hashes differently. Nothing about the behaviour changes.

- 77d34b6: Stop a dependency install from restarting the development server mid-way, refuse a second development server for one application root, and shorten the development shutdown budget so a restart is not force-killed.

  `package.json` was handed to the file watcher as an `--include`, so an install restarted the server on its first write and again on the later ones. The server came back against a half-installed `node_modules`, and a write arriving while it was still shutting down is where the watcher escalates SIGTERM to SIGKILL — which skips releasing the migration lock. The manifest, the lockfile and the package manager's install state are now watched here instead, and the restart waits for all of them to stay quiet, so one install produces one restart.

  A second `pnpm dev` for the same application root is refused, naming the first one's process id. Nothing else caught it: the port check advances to the next free port, and the duplicate then failed on the migration lock the first server holds, before it bound anything — an error that names neither cause nor remedy. `NOCOBASE_DEV_ALLOW_MULTIPLE=true` starts one anyway, a run that only proxies a remote backend does not take the lock, and a lock left by a killed run is taken over rather than reported.

  `APP_SHUTDOWN_TIMEOUT_MS` sets the total shutdown budget: the force exit lands on it and the HTTP drain a second earlier. `pnpm dev` supplies four seconds, inside the five the watcher waits before force-killing, so a development restart shuts down on its own and releases its locks. A deployment keeps the 30 second drain and 35 second force exit, which suit a load balancer. `resolveNodeShutdownTimeouts` is exported and `StandaloneServer` carries the resolved `shutdownOptions`.

  Checksum drift now names both ways out instead of one. `db repair` was the only suggestion, and it is the wrong one whenever the edit changed what the migration does: repair records that the source and the schema agree, so using it there makes an un-applied change look applied. The CLI and the startup log now point at `db repair` for an edit that left the schema identical and at `db redo` for one that did not.

- a1a8690: Expire a task lock whose holder was killed, and add `nocobase app db unlock` to inspect and release one.

  A run that is hard-killed — SIGKILL, a stopped container, a lost machine — runs no cleanup, so its lock row survived it and every later run waited out the acquire timeout and then failed, until somebody deleted the row by hand. A holder now refreshes a `heartbeat_at` column every five seconds while it works, and a lock that has not been refreshed for thirty seconds is taken over by the next run, which then continues normally. The takeover is reported through `onStaleLock` and logged by the application, because it means a previous run did not shut down cleanly. A working run is never taken over: several missed beats are tolerated, so a slow database does not hand the lock to a second run.

  The lock table gains `heartbeat_at`, added in place when the table predates it. It cannot be a migration: the lock is what every migration runs inside.

  `db unlock` reports who holds each lock — the owner, when it was taken, and its last heartbeat — and releases the ones that have stopped beating. A lock that is still beating is reported rather than released; `--force` releases it anyway, which lets a second run start beside the first. It covers the migration and the seed lock together, takes `--connection` / `--all` / `--json` like the other database commands, and needs no migration or seed directory, since startup and plugins take the same locks. The three templates gain a `db:unlock` script.

  `Migrator` and `Seeder` gain `lock()`, which reads the lock without creating its table, and `unlock(options)`. `AppDatabaseTaskOperation` gains `'unlock'`, and a task result carries `lock`, `released` and `lockReason`. The exhausted-wait message now names the last heartbeat and points at `db unlock` rather than at deleting a row by hand.

### Patch Changes

- Updated dependencies [8f1ead4]
- Updated dependencies [ffafc2a]
- Updated dependencies [a1a8690]
  - @nocobase/db@1.0.0-beta.14
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.2

## 1.0.0-beta.23

### Minor Changes

- fa01814: Report migration and seed checksum drift as a warning instead of failing, and add `nocobase app db repair` to realign the recorded history.

  An executed migration or seed whose source has since changed no longer stops the run. `latest()`, `rollback()` and `run()` return the drift in a new `warnings` field, the CLI prints it, `--json` carries it, and startup logs it through the application logger. Set `onChecksumMismatch: 'error'` on a connection's `migrations` or `seeds` configuration, or at the top level, to keep refusing to run. A history record whose migration is missing from the sources entirely still fails regardless of the policy.

  `pnpm db:repair` rewrites recorded checksums to match the current sources, covering both migrations and seeds in one command. It previews before writing, prompts for confirmation unless `--force` is passed, supports `--dry-run` for inspection in CI, and conditions every write on the checksum it read, so a history changed in between fails rather than being overwritten. It never deletes a history record, so a repair cannot make an executed task run again.

- fa01814: Add `db apply` and `db reset`, and retire `migrate --fresh`.

  `nocobase app db apply` (`pnpm db:apply`) runs migrations and seeds as one plan, in the order startup runs them: each connection is migrated, then seeded. Only pending tasks run, so repeating it is safe. `nocobase app db reset` (`pnpm db:reset`) drops every managed schema object first and reruns both from empty; it asks for confirmation and requires `--force` in CI or a non-interactive terminal.

  `migrate --fresh` is removed and now exits with a pointer to `db reset`. It rebuilt the schema without reseeding, so it left the seed history cleared and no seed executed — the default connection recovered on the next startup, and a connection with `autoRun: false` did not.

  The `migrate` and `seed` commands are removed along with their template scripts; `db apply` replaces both. Running one half on its own is not a separate command, because both halves apply only what is pending: on an already-migrated database `db apply` applies seeds alone, and the one case it does not cover — migrating ahead of a deployment without seeding — can be served by a flag later without breaking anything.

  `runAppDatabaseTasks` accepts several task kinds in one plan through its `kind` option, which is what makes a reset correct across both kinds: one plan means a connection's schema is rebuilt by its migrations task before its seeds run.

- 7bde7bd: Add `nocobase app db rollback` and `nocobase app db redo`, so a migration corrected before its branch is merged can be re-run without resetting the database.

  Editing an executed migration changes nothing on its own: it is recorded as executed, so `db apply` skips it and the database keeps the schema the old source produced. Until now the only way forward was `db reset`, which drops every managed table and every row with it, or editing the history table by hand — which the documentation forbids, and which splits the two records of what exists: dropping a table without its metadata record leaves the Collection unresolvable.

  `db rollback` runs `down()` for the latest migration batch, newest first, and deletes its history records. The batch is the unit the history records, so a batch that mixed application and plugin migrations rolls back as one, and the confirmation lists every migration with the package it belongs to before anything runs. It fails having run nothing when a migration in the batch is irreversible or has no `down()`. `db redo` is that followed by `db apply`. Both are destructive in the same way and confirm the same way: CI and non-interactive terminals require `--force`, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. Seeds are not re-run, so rows a seed inserted into a table the batch recreates are not restored.

  `Migrator.rollback()` accepts `{ dryRun: true }`, which is what the confirmation is built from: it takes the lock, resolves the batch, rejects an irreversible one, and reports what a run would undo without running any `down`. `MigrationRollbackResult` gains `records` — the batch's history records in rollback order, carrying each migration's package — and `dryRun`. `AppDatabaseTaskOperation` gains `'rollback'`, which applies to migrations alone: a plan including seeds is refused, because seeds have no inverse.

  The three templates gain `db:rollback` and `db:redo` scripts. The migrations reference now documents re-running a corrected migration, states what `db:repair` is and is not for — it records that the schema already matches, so using it on a change the database never received leaves the schema wrong and nothing recording that — and lists each internal table with the command that maintains it.

- 3187ace: Wait for a contended migration or seed lock instead of failing on the first conflict, report who holds it, and stop abandoning it held when a restart interrupts startup.

  Acquiring the lock now retries with backoff until `lockAcquireTimeoutMs` — a new Migrator and Seeder option defaulting to 30 seconds — so the brief overlap between two starts resolves itself rather than surfacing as an error. A conflicting insert is treated as contention on its own: the previous implementation re-read the lock row to decide what to report, and a holder that released in between left the driver's `UNIQUE constraint failed` text as the whole explanation. When the wait does expire, the message names the holder recorded in `locked_by`, the time in `locked_at`, how long it waited, and that the row has to be deleted if the process holding it was killed. An insert that keeps failing while the lock table holds no row is still reported as the driver error it is, rather than being retried until the timeout.

  Startup watches `SIGINT` and `SIGTERM` from before the application boots until the HTTP server registers its own handlers. Migrations and seeds run in that window, and Node's default disposition terminated the process outright, so a `tsx watch` restart triggered by a dependency install left the lock held by a process that no longer existed and the next start had to wait it out. The signal is now recorded, startup finishes and releases the lock the ordinary way, and the application shuts down instead of listening. A second signal still forces the exit. `watchStartupShutdownSignals` is exported for hosts that run their own startup sequence, and the app-host CLI uses it: its handlers were registered before the host existed, so a signal during startup exited the process immediately and abandoned the same locks.

  Migrations and seeds share one lock implementation, so contention behaves and reports identically for both.

### Patch Changes

- ca3188e: Report a connection whose Collection artifacts have never been generated as one line instead of one per expected file.

  `collections generate --check` compares the database with `database/<connection>/collections/` and reports every expected file it cannot read as `missing`. When the directory does not exist at all — the state of any application that has not run the command yet — that is three lines per Collection plus the manifest, none of which says anything the first one did not: an application with 41 Collections printed 124 of them. The result now carries `directoryExists` in check mode so the two cases can be told apart, and the command prints the count and what to run instead of the list. `--json` still carries every difference.

- 5380642: Give migrations and seeds a `repository` on their context, bound to the connection the task runs on.

  `query` reaches rows through the Connection naming strategy and expresses exactly what it is given, which leaves three things for each task to assemble by hand: cross-dialect field encoding, Collection-level naming overrides, and relation writes including the junction rows behind a `belongsToMany`. `context.repository(name)` covers them, taking the Collection as the database itself records it — the metadata a previous `builder` operation wrote — rather than importing any application definition.

  The two contexts default differently. A migration changes structure, so `builder` and `query` remain its tools and `repository` is for the writes `query` would get wrong; a migration that uses it should say in a comment why `query` was not enough, keep it out of `down`, and not walk a table with it. A seed changes no structure and writes installation data in Collection terms, so `repository` is its normal tool and `query` covers what that cannot express.

  Inside a transaction the Repository comes from the transaction's own connection, so a failed task discards its writes. This is what the database task service container has been protecting: resolving the application's `DatabaseManager` there would have produced a Repository writing outside the task's transaction, and its refusal now names the supported path instead of only refusing.

- Updated dependencies [fa01814]
- Updated dependencies [38e5253]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.2
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.22

### Minor Changes

- 43592e9: Expose a read-only config.get() reader and service container to migration and seed callbacks. Inject application configuration snapshots for startup and CLI database tasks and document configuration and rollback semantics.

  Restrict application database task service access to the ID generator and reuse the templates’ application factory for CLI migrations and seeds. CLI tasks share the application database manager and dispose application and scope resources without booting providers or triggering autoRun.

  Simplify createAppCommands to one options object with lazy rootDir-based runtime and application discovery and optional factory overrides.

### Patch Changes

- Updated dependencies [43592e9]
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.2

## 1.0.0-beta.21

### Patch Changes

- 64b3fdb: Separate authorization services from application integration: the library provides decisions, permission-set and access-rule services, store contracts and handlers; the application plugin owns database adapters, migrations, identities and management UI.

  Add configurable root and default permission sets, protected-set metadata, transaction-bound service APIs, and integration with user management and Hub roles. Add database authorization for explicitly registered collections through Repository policies, plus a runnable example plugin.

  Provide a permission-set workspace with routed editing and user assignments, nested resource groups, field and record-scope controls, and a permission inspector. Localize management UI and request-specific resource labels. Application routes may declare signed-in access without a page grant.

  Migration ownership changes inline the existing table definitions in the application plugin. This changes the checksums of previously executed migrations; upgrade compatibility must be resolved before deploying to an existing database.

- 64b3fdb: Add business-action authorization middleware for existing Repository route definitions. Intersect request constraints with endpoint policies, reject incomplete multi-scope shortcuts, and demonstrate project queries and editing in the authorization example. The example's project edit now uses `salesProjects:updateOne` with Repository input/output and 404 for out-of-scope targets.

  Document when to use generated CRUD versus custom business handlers in the authorization development Skill. Remove the separate authorization example Skill and its package publication entry.

  Remove the collection-aggregated `authz.db.repositories` adapter and its public types. Use `authz.db.authorizeRepository` with explicit business-action mappings for generated Repository routes.

- fe564d9: Exclude TypeScript declaration files from plugin queue job discovery so installed plugins do not attempt to execute .d.ts or .d.mts files during startup.
- fe564d9: Add opt-in strict startup verification that propagates job import failures and exits development and production processes on startup failure.
- Updated dependencies [fe564d9]
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.20

### Minor Changes

- e9da3c2: Resolve installed official database drivers asynchronously from application configuration before provider registration or standalone database tasks. Configure only the needed dialects and install their optional peer packages in application dependencies. Preserve explicit driver registrations and synchronous core manager APIs; direct core consumers continue to register drivers explicitly. Standard development and test loaders require no synchronous ESM compatibility configuration.

### Patch Changes

- Updated dependencies [c84bfe8]
- Updated dependencies [e9da3c2]
- Updated dependencies [e9da3c2]
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/db-kingbase@0.1.0-beta.2
  - @nocobase/db-dameng@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oceanbase@0.1.0-beta.1
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/db-sqlite@0.1.0-beta.2

## 1.0.0-beta.19

### Minor Changes

- e13ed84: Organize Hub storage by ownership, add explicit managed revision and log directories, retain legacy layouts, and provide an offline migration preview and copy workflow. Keep standalone Hub data outside build output and place template build archives under storage/exports with matching publishing defaults.
- e13ed84: Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

  Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

  Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

  Route HTTP request logs to separate request files by default in all application templates.

- e13ed84: Unify application directory fields and path helpers in AppPaths, shared by configuration factories, runtime and Application. Replace ConfigPaths and runtime.configPaths with AppPaths and runtime.paths, and construct applications through createAppFromRuntime so Host logging policy and the runtime application reference are wired consistently.

  Standalone applications declare their deployment root separately from their code root. Configuration and default persistent storage use that deployment root in both source and compiled execution. Explicit storage paths take precedence over HUB_STORAGE_DIR, and embedded applications retain Host-provided volumes.

  Standardize Hub storage and expanded releases on the hub, host and apps layout, remove legacy layout detection and offline storage migration commands, and replace appDeploymentsDir with appRevisionsDir. Expanded releases use appRevisionsDir/<appId>/<sha256>; standalone discovery records the selected revision. Consumers must update removed path and storage APIs and configure existing data locations explicitly before adopting this release. Rebuild application artifacts with the updated runtime and templates.

### Patch Changes

- e13ed84: Preserve structured workflow context alongside queued run return values when integrating scheduled execution. Route terminal observer failures and registered queue jobs through application loggers while retaining committed workflow outcomes.
- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- 00362cf: Restore colored log levels in the development terminal. Replacing the pino-pretty transport with `console.pretty` dropped the ANSI escapes, so INFO, WARN and ERROR lost the colors developers had in v2. Pretty output colors the level label again, using the previous palette, and only when it helps: `console.color` decides when set, otherwise a terminal check applies, `NO_COLOR` disables the escapes, `FORCE_COLOR` requests them, and piped or captured output stays plain. Structured console output, journals and log files still never contain escapes. Applications pass an explicit `logging.console.color` (or `hub.logging.apps.console.color`) through to the logging library. A managed App Host child inherits a pipe and cannot see the terminal its output is relayed to, so the supervisor requests `FORCE_COLOR` for it when the environment states no preference, and captured child output drops terminal escape sequences so the Hub log viewer keeps showing readable text.
- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
  - @nocobase/queue@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/logging@0.1.0-beta.5
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.18

### Minor Changes

- 26ac480: Add code-defined Cron scheduling with timezone support, transactional synchronization, and stable schedule identities. Applications and plugins register schedules with `SchedulerService.defineSchedule(definition)` and execution targets with `registerTarget()` during provider registration or boot.

  Route scheduled jobs and workers through the application's configured logical queue, with an adapter-neutral schedule store. Keep the upstream queue dependency unmodified and store queue and scheduler timestamps compatibly with their adapters while preserving absolute instants.

  Move queue storage migrations from Scheduler into the queue library, which resolves configured database connections and physical tables. Assemble these sources centrally in app-server for startup and CLI commands, rejecting overlapping active queue tables before execution. Support immutable target parameters, shared migration history and locks, upstream-compatible physical schemas, and read-only execution conditions that leave skipped migrations unapplied.

  Track idempotent occurrences through the target's final outcome, including asynchronous Workflow completion and recovery with stable run references. Target registration returns a completion-reporting handle scoped to that target; long-running executions can report completion without a fixed scheduler observation timeout.

  Provide an authorized, read-only schedule management page and API with paginated schedules, trigger counts, execution history, and separate schedule and execution statuses. Register `pnpm nocobase schedule sync` as a global CLI command and integrate it into all application templates.

  Include application examples for custom task targets and scheduled Workflows, and agent guidance for schedule definition, target selection, asynchronous execution, diagnostics, and recovery.

  Keep the database manifest CLI entry available before compilation so fresh workspace installs link the command required by package builds.

  Declare the OpenTelemetry dependencies referenced by the upstream queue declarations so consumers can typecheck published Server APIs without enabling tracing or skipping library checks.

### Patch Changes

- Updated dependencies [24e771f]
- Updated dependencies [26ac480]
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/queue@0.1.0-beta.5
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.17

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [028dd7c]
  - @nocobase/db@1.0.0-beta.8
  - @nocobase/queue@0.1.0-beta.4

## 1.0.0-beta.16

### Minor Changes

- 415d763: Add optional standalone HTTP and WebSocket proxy routing and configure Hub to forward paths outside its public mount to the current ready App Host port. Preserve public request identity and streaming, release proxy connections during shutdown, and use the shared public entry for hosted application links.

  Return 502 and close the upstream connection when a regular HTTP request receives an unexpected protocol upgrade. Validate App IDs against the normalized Hub mount and the managed Host's reserved `__` namespace before creating an application.

## 1.0.0-beta.15

### Major Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.

### Minor Changes

- 63db898: Let `AppDatabaseConfig` accept a connection shape from a dialect package it does not know about.

  `@nocobase/db` split its dialects into packages and added `ExtensibleDatabaseConfig<TConnection>` for exactly this, with an overload on `createDatabaseManager` and a compile-time contract test. `AppDatabaseConfig` was left extending the closed `DatabaseConfig`, so an application could register `@nocobase/db-kingbase`, `@nocobase/db-oceanbase` or `@nocobase/db-dameng` and watch it work at runtime while `pnpm typecheck` rejected the configuration: `Type '"kingbase"' is not assignable to type '"mssql"'`.

  `AppDatabaseConfig` and `AppDatabaseConnectionConfig` now take the same type parameter, defaulting to the dialects `@nocobase/db` declares. Every existing configuration is unchanged — the bare form still means what it meant — and an application on a contributed dialect names its shape instead of reaching for an assertion:

  ```ts
  type KingbaseConnection = KingbaseOptions & { dialect: 'kingbase' };

  const database: AppConfigFactory<
    AppDatabaseConfig<ConnectionConfig | KingbaseConnection>
  > = defineAppConfig(() => ({ drivers: { kingbase }, ... }));
  ```

  Widening applies to the named shape alone: a dialect nobody named is still rejected, `sqlite` still requires `filename`, and `serviceName` on a `postgres` connection is still an error. The constraint to write against when code is generic over a connection is `AnyConnectionConfig`, from `@nocobase/db`.

- 63db898: Move concrete database connection types into their owning dialect packages and keep the core connection contract independent of installed dialects. Import `SqliteConnectionConfig`, `PostgresConnectionConfig`, `MysqlConnectionConfig`, `OracleConnectionConfig`, and `MssqlConnectionConfig` from the corresponding `@nocobase/db-<dialect>` package instead of `@nocobase/db`.

  `ConnectionConfig` and the default `DatabaseConfig` and `AppDatabaseConfig` now describe the common runtime contract. For strict configuration checking, supply a concrete connection type or use `DatabaseConfigFromDrivers` and `AppDatabaseConfigFromDrivers`. The core also exports `DriverConnectionConfig` and `ConnectionConfigFromDrivers` for reusable driver inference. Preserve mutually exclusive host and socket targets in MySQL and OceanBase configuration and factory options.

### Patch Changes

- 63db898: Add `defineAppDatabaseConfig` to infer connection types from the drivers returned by a runtime configuration callback. Application templates now directly export this helper without explicit factory annotations, driver type maps, or `satisfies` clauses. Keep declaration emission but use full TypeScript inference for application server builds; library packages retain isolated declaration checking.
- 63db898: Require each driver registration key to match the driver's declared dialect in inferred database configurations. Reject aliases and mismatched keys even when no connection uses that driver or the connections map is empty, while preserving connection inference for correctly registered factories and descriptors.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/db@1.0.0-beta.7

## 1.0.0-beta.14

### Patch Changes

- c258b92: Reject `auth.secret` and `session.secret` left at the placeholder `config.example.yml` ships.

  The example declares both as live keys carrying `replace-with-a-unique-secret`, so that `@nocobase/create-app` can fill them in by replacing a value rather than by uncommenting a line. That leaves one way to end up running on it: copying `config.example.yml` to `config.yml` by hand and starting the application without editing it. The placeholder is a non-empty string, so every existing check accepted it — and it is the same string in every installation that did this, published in this repository.

  `resolveAuthSecret` and `resolveAppSessionConfig` now refuse it, naming the setting and how to generate a replacement. `@nocobase/app-server/config` exports `PLACEHOLDER_SECRET`, `isPlaceholderSecret`, and `assertSecretIsNotPlaceholder` so that anything else reading a secret out of configuration can apply the same rule.

  Applications generated by `create-app` are unaffected: their `config.yml` has real secrets written into it.

## 1.0.0-beta.13

### Patch Changes

- c01baf6: Resolve application namespace aliases in React translations, synchronize the document language at startup and on changes, and inject the configured default language into served HTML. Allow client-only language selections with an English server fallback and an informational toast, and standardize documented locale checks on `pnpm nocobase app i18n:check`.
- Updated dependencies [c01baf6]
  - @nocobase/i18n@1.0.0-beta.4

## 1.0.0-beta.12

### Minor Changes

- 1d5ee9a: Add `generateAppCollectionsArtifact()` for writing and checking Collection artifacts

  Reads every Collection a managed connection resolves and writes it under `database/<connection>/collections/<name>/` as `collection.json`, `metadata.json` and `schema.json`, with a `_manifest.json` per connection recording the dialect, whether the schema is managed or external, and the last applied migration. Connection selection follows the migration and seed commands — the default connection, `connection` for one, or `all` for every one — except that external connections take part too: their schema is owned elsewhere and they record no migration head, but a snapshot of what they resolve to is exactly what a reader without database access needs from them.

  Each Collection's files are staged and swapped in as a unit, directories of Collections that no longer exist are removed, and entries the generator does not own make it fail rather than delete them. `check: true` compares the generated result with the files on disk and reports each difference as missing, stale or unexpected without writing anything, which is what a CI step runs.

  Nothing here is read back at runtime; the files are derived output for developers, documentation and AI tooling.

- 1d5ee9a: Read an external connection's metadata from `database/<connection>/collections` by default

  An `external` connection that configures no `metadataStore` — on the connection or at the top level — now reads `database/<connection>/collections/*/metadata.json` through a `DirectoryCollectionMetadataStore`, so an existing database can be connected from `config.yml` alone. `metadataStore` also accepts a directory as a plain string, resolved against the application root, for metadata kept elsewhere.

  `generateAppCollectionsArtifact()` treats `metadata.json` as the source on such a connection: regenerating only normalizes its formatting, and when the database no longer has a Collection the generated files are removed while `metadata.json` is kept and reported under `orphans`. The generator resolves each connection's directory through the same `resolveAppCollectionsDirectory()` the store default uses. A connection's configured migration and seed `tableName` and `lockTableName` are passed to `@nocobase/db` as `internalTables`, so a custom-named history table is not reported as a Collection or written as an artifact.

### Patch Changes

- Updated dependencies [1d5ee9a]
- Updated dependencies [211538b]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
  - @nocobase/db@1.0.0-beta.6

## 1.0.0-beta.11

### Minor Changes

- ceb356b: Declare database dialect drivers on the application's own database config.

  An application lists the dialect packages it installs under `database.drivers`,
  next to the connections that use them, and the runtime, the CLI commands and the
  tests all resolve a dialect from that one place. The app-server runtime stays
  independent of every concrete database driver.

  This replaces the process-wide `registerAppDatabaseDrivers` registry and the
  `databaseDrivers` option on `Application`, both of which are removed. An
  application that used either one moves its drivers into `database.drivers` and
  drops the module it imported only for the registration side effect.

- f17f3a6: Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

  Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

  Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.

- f17f3a6: Support TypeScript authentication options in application templates and use the native authentication client. Keep authentication plugins and callbacks in editable server and client configuration, with YAML as the default format for deployment settings.

  Runtime assembly now prepares complete configuration before application creation. Module configuration factories use defineAppConfig and defaultAppConfigs, receive the runtime once, and retain their defaults when environment configuration reloads.

- ceb356b: Supply plugin migration and seed sources to database planning directly instead
  of through the database configuration.

  `AppDatabaseConfig.taskSources` is removed. It held the application's package
  name and the migration and seed directories contributed by registered server
  plugins — values the runtime derives from resolved plugins rather than values
  anyone configures. Carrying them in the `database` namespace put them where a
  `config.yml` deep-merges: `database.taskSources.migrations: []` silently
  dropped every plugin's migrations, and the application still started.

  They now travel as an `AppDatabaseTaskContributions` value alongside the
  configuration. `planAppDatabaseTasks`, `runAppDatabaseTasks`, `runAppMigrations`
  and `runAppSeeds` take an options object carrying it, with `paths`, `drivers`
  and the task selection, in place of their positional parameters.
  `createAppPluginDatabaseConfig` and `resolveAppPluginDatabaseConfig` are
  replaced by `createAppDatabaseTaskContributions`, which maps resolved plugins to
  that value. `contributions` is required, so a call site that has not been
  updated fails to compile rather than quietly planning without its plugins.

  An application's `server/config/database.ts` keeps only what it configures —
  drivers and connections — and no longer calls into the plugin resolver. Its
  `cli/database-command.ts` builds the contributions from the runtime it already
  resolves; `cli/commands/migrate.ts` and `cli/commands/seed.ts` are unchanged.

- ceb356b: Add the destructive `pnpm migrate --fresh --force` workflow for managed
  connections. It clears dialect-owned schema objects, reruns visible migrations,
  requires confirmation in interactive terminals, and rejects external
  connections.
- c960d07: Let a Repository API action declare a `policy`, normalized when the routes are
  defined and bound to the Repository the handler uses. `@nocobase/db` gains
  `RepositoryOperations`, the operation methods a plain and a policy-bound
  Repository share, so code that only runs queries can accept either.
- c960d07: Replace the Repository API's per-action `writePolicy` with a Repository Policy
  declared once per exposure.

  **Breaking.** `defineRepositoryApiRoutes()` no longer accepts `writePolicy` on
  an action, and every exposure must declare a `policy`. An action configuration
  now says only that an endpoint exists; what it may do is the exposure's Policy,
  which governs reading, creating, updating and deleting together. Declaring one
  is required rather than optional because `writePolicy` defaulted to refusing
  writes while an absent Policy restricts nothing — making it optional would have
  turned every existing declaration from "refuse every write" into "allow
  everything" without a word of warning.

  Declare `policy` as a function of a principal, together with a
  `principal(context)` resolver, to scope rows to the caller. The resolver belongs
  to the application, since this router installs no authentication; one that
  returns nothing refuses the request with 403 `PRINCIPAL_REQUIRED` rather than
  binding a Policy built from a principal that is not there. A fixed Policy is
  still normalized when the routes are defined, so a malformed one fails where it
  is written; a Policy function cannot be, and its `INVALID_POLICY` now reaches
  the host error handler as a server error instead of being reported to the caller
  as a 400.

  `@nocobase/db` gains `buildRepositoryPolicy`, a builder whose unmentioned nodes
  are denied, so the four-node requirement costs nothing to satisfy while the
  default stays refusal. Two related fixes travel with it: `create`, `update` and
  `delete` nodes that are `false` now refuse a write before its payload is read,
  so an empty body is reported as forbidden rather than as invalid input; and a
  `create` node whose relations grant `update`, `upsert`, `disconnect`, `set` or
  `delete` is refused during normalization, since a root create performs none of
  them.

  `@nocobase/app-plugin-file` exposures declare a Policy too, and it reaches
  uploads: the upload path binds a Policy derived from the exposure's, inheriting
  `create.scope` and `create.defaults` and substituting the file columns for the
  field allowlist. A file uploaded under a scoped Policy therefore lands inside
  the scope the same exposure reads from. The public content route under
  `accessPath` is unchanged and deliberately outside it.

  The method-level `writePolicy` option on `db.repository()` calls is unaffected
  and remains available for narrowing a single call.

- ceb356b: Register the split database dialect packages in the application server database manager.

### Patch Changes

- ceb356b: Expose the dialect runtime strategy contract used by database connections and
  the Knex-backed query, repository, schema, and application composition
  adapters. Dialect packages now own connection defaults, ownership identity, and
  local storage preparation, while the database configuration API accepts
  additional dialect identifiers without core changes.
- e11b855: Locate a built application's `config.yml` next to `dist/` when none exists inside it, build the client against the same `.env` files the server loads, and prefer the compiled dependency tree when resolving plugins from a production build.
- 40e2d49: Expose the application mode to plugin service providers

  `AppPluginApplication` carried no way to tell whether the app owns the process it runs in or is one of several an app host mounted, so a provider that needs the distinction had to infer it from configuration that cannot carry it. A template's defaults are merged in both modes, which means an embedded app holds a `server.port` it does not own — enough to mislead any provider reading it.

  The field is optional, so an application composed by hand need not state it, and absent means embedded, matching what `Application` itself defaults to.

- c960d07: Map the Repository Policy error codes to their HTTP status: the read and scope
  refusals answer 403 rather than 400, and an upsert onto a record outside the
  scope answers 409.
- Updated dependencies [f17f3a6]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [e11b855]
- Updated dependencies [72ed008]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
  - @nocobase/config@0.1.0-beta.1
  - @nocobase/db@1.0.0-beta.5
  - @nocobase/logging@0.1.0-beta.4

## 1.0.0-beta.10

### Minor Changes

- a009e2d: Derive the languages an application offers from its own locale files, and configure the default language in one place.

  `i18n.defaultLocale` in `config.yml` now names the language the application starts in, for the browser and the server alike. The `i18n.locales` setting and its `APP_LOCALES` environment variable are removed, along with `client.app.defaultLocale`: an application offers whichever languages its own `client/locales/index.ts` and `server/locales/index.ts` declare loaders for, so adding a language means adding its file rather than editing a second list. A plugin's locale file supplies translations for those languages and no longer adds one, which keeps an installed plugin from putting an unexpected language in the picker.

  The browser resolves its startup language as the visitor's stored choice, then `i18n.defaultLocale`, then `en-US`. `navigator.language` is no longer consulted. Switching language in the interface remains a user-level choice and does not change the configured default.

  An untranslated key now falls back through `i18n.defaultLocale` and then `en-US`, rather than through the default alone. An application that defaults to Chinese and adds Spanish leaves its plugins translated in neither, and English is the language they are most likely to ship; the fallback languages are loaded alongside the one in use so the fallback has resources to read. `pnpm nocobase app i18n:check` reports a language declared in `client/locales/` but not `server/locales/`, or the reverse — the case where the interface offers a language the server then rejects.

  `LocaleResource` and `PartialLocaleResource` now accept an `overrides` block at the top level. The shape is derived from the source locale, which never declares that key, so annotating a locale file with it and adding the block documented for rewording a plugin's copy was a compile error — the documented example did not compile.

  To migrate, replace `i18n.locales` and `client.app.defaultLocale` with `i18n.defaultLocale`, and make sure every language the application offers has a file in its own `client/locales/` and `server/locales/`.

### Patch Changes

- Updated dependencies [a009e2d]
  - @nocobase/i18n@1.0.0-beta.3

## 1.0.0-beta.9

### Minor Changes

- e3fa827: Add reusable user administration and Hub-scoped role-based authorization. Authentication now supports disabled accounts, transaction-aware administration, stable duplicate-identity conflicts, Session revocation, and immediate Realtime disconnects. Authorization supports protected Permission Sets, atomic scoped assignment replacement, and Client permission invalidation. The Users page supports protected role options, readable multi-role editing, explicit unassigned states, and a distinction between direct roles and authenticated-user defaults; password reset and database Session revocation share one transaction. The default App exposes its direct Authorization Permission Sets as application roles while keeping System administrator changes in Authorization. The Hub defines Administrator, Operator, and Viewer roles, batch-loads their user assignments, enforces every Hub and user-management action on the server, protects the final enabled Administrator, and hides unauthorized Client controls. Both templates register the reusable Users plugin; Hub exposes Applications, User management, and a read-only role matrix directly in its control-plane navigation, while the default App keeps Users in Settings. Only the Hub template receives Hub roles, disables public sign-up, and omits ordinary App Settings, workflows, notifications, and example plugins.

### Patch Changes

- Updated dependencies [0a3fa83]
  - @nocobase/db@1.0.0-beta.4

## 1.0.0-beta.8

### Minor Changes

- d29d1fe: Run application migrations and seeds on explicitly selected database connections, with per-connection configuration, startup policies, isolated results and fail-fast execution. Keep plugin tasks on the default system connection and reject task execution against externally managed databases. Preserve legacy configuration and directory support while adopting database/<connectionName> source directories in both application templates; add --connection and --all CLI options and document upgrade rules.

### Patch Changes

- Updated dependencies [5281fd1]
  - @nocobase/drive@0.1.0-beta.4

## 1.0.0-beta.7

### Minor Changes

- 90a4903: Stream exposed Repository `findMany` records as framed NDJSON when requested through HTTP content negotiation.
- 90a4903: Finalize the Collection Metadata architecture by making the V1 supplemental document Store the only `CollectionMetadataStore` contract, using persistent database Metadata by default for managed connections, requiring an explicit Store for external connections, and removing the legacy full-Collection Store and Builder Metadata-only APIs.
- 90a4903: Add defineRepositoryApiRoutes to expose explicitly configured Collection Repository methods through the api-client HTTP protocol, with JSON request validation, bounded list queries, and Repository error mapping. This basic adapter does not install authentication or authorization.
- 90a4903: Add server-owned writePolicy for single and bulk creates/updates, root upserts and
  mutation preflight. Internal Repository calls default to true. Explicit policies
  restrict scalar fields, each relation operation, nested create/update/upsert branches
  and through payloads before any writes. Add buildWritePolicy, buildUpsertWritePolicy
  and synchronous callback input, frozen snapshots and structured policy errors.

  Replace defineRepositoryApiRoutes action arrays with configuration objects and move
  maxLimit to actions.findMany. API create/update actions default to writePolicy false
  and require explicit allowlists; true and client-supplied policies are rejected.
  Return HTTP 403 for forbidden writes and migrate the Repository example's routes,
  fixtures and integration guidance to field and relationship policies.

- 90a4903: Replace the legacy database connection `managed` flag with the explicit `schemaManagement` mode, and prevent external-schema connections from executing Builder DDL or migrations while retaining query access and dry-run compilation. Remove unused Collection `writable`, Field `interface` and `uiSchema` properties, and implicit virtual-field metadata creation.
- a864497: Add standalone and Hub-managed host modes, startup-only YAML or JSON host configuration, FS and S3 release deployment through NocoBase Drive, strict desired deployment reconciliation, file configuration path selection, host-owned structured logging, shared ws-backed App WebSocket handling, private authenticated child-process management over Node IPC, and bounded managed-host crash recovery. Managed deployments use checksum-addressed immutable revision directories, stop-first Runtime replacement with bounded graceful request draining, and a three-revision local cache for fast rollback. Rename the Host's in-process runtime implementation to `InProcessAppHandle`.
- a864497: Register the Application Hub in the Hub template and provide an application control plane. Release artifacts supply their version and an optional `config.example.yml` or `config.example.yaml` template, while applications choose Config file or External configuration and reserve Hub-managed configuration for a future database-backed implementation. Hub actions reconcile only the selected application, reuse an already installed matching artifact, report deployment phase timings, and support removing an application and its persisted resources. Separate Hub desired configuration files from Host-owned runtime configuration, rebuild recovery targets when Host becomes ready, and split the management page into business modules.
- 90a4903: Add Microsoft SQL Server support through Knex and the `tedious` driver, including connection configuration, Collection Builder and Query behavior, Schema Inspector introspection, real Docker integration tests, generated-application driver installation, and template runtime packaging.
- 90a4903: Add Oracle Database support through the `oracledb` Thin driver, including connection configuration, Collection Builder and Query behavior, Schema Inspector introspection, real Docker integration tests, generated-application driver installation, and template runtime packaging.
- 90a4903: Expose opt-in aggregate and groupBy Repository HTTP actions with JSON AST validation, grouped filters and sorting, and lossless BigInt result serialization. Add matching remote Repository methods and public types. Switch the aggregate example to the generic authenticated endpoints and display its actual Repository requests.

### Patch Changes

- 90a4903: Extract the shared realtime wire protocol and browser WebSocket client into `@nocobase/realtime`. Replace the session-specific client reconnect method with a transport-level `reconnect()` operation, and make the application client and server consume the shared package.
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/realtime@0.0.2-beta.0

## 1.0.0-beta.6

### Minor Changes

- cee3251: Add authenticated realtime subscriptions, refresh their identity after authentication changes, and invalidate in-app notification state through user-scoped events.

### Patch Changes

- 8d88ff4: Replace the public AI Employee LLM service filesystem loader with the application `config.yml` contract at `ai.llmServices`. Configured model entries use a simple label/value array and are converted internally to custom mode. The App plugin validates and synchronizes declarative service definitions at startup and on application-config reload while preserving repository-managed enabled state for matching services. The default App template includes a commented configuration example, and the App config validator supports unique object properties for rejecting duplicate service names.
- Updated dependencies [813da59]
  - @nocobase/i18n@1.0.0-beta.2

## 1.0.0-beta.5

### Patch Changes

- 15c7197: Publish the `./i18n` subpath. `exports` declared it but `publishConfig.exports` did not, so it resolved from source in this repository and was absent from the published package. A generated application failed to start on `pnpm dev` with `ERR_PACKAGE_PATH_NOT_EXPORTED` for `./i18n`, imported by its own `server/app.ts`.

  `pnpm pack:check` now compares `exports` against `publishConfig.exports` and rejects a subpath present in one and missing from the other, in either direction. This class of defect is invisible in the workspace — every consumer resolves through the source map — and only appears once the package is installed from a registry.

  A generated application no longer stops its first install with `ERR_PNPM_IGNORED_BUILDS`. `tesseract.js` reaches the dependency tree through `officeparser` and its `postinstall` only prints a donation notice, so `allowBuilds` now records it as a deliberate `false` rather than leaving it undecided; entries accordingly carry their own value instead of always being written as `true`. The generated `pnpm-workspace.yaml` also sets `strictDepBuilds: false`, so a transitive dependency introduced later reports a skipped install script as a warning rather than failing the install of a project that is otherwise fine. The repository's own `pnpm-workspace.yaml` takes the same setting.

## 1.0.0-beta.4

### Major Changes

- 174eab5: Consolidate the browser packages into `@nocobase/app-client`.

  `@nocobase/app-sdk` is gone; its API client now lives in `@nocobase/app-client` and is imported from there. `@nocobase/app-portal-sdk` is deprecated and keeps only what still has consumers: `NocoBaseClient` and the runtime configuration it reads, which exist to reach a v2 NocoBase server, and the route surface containers under `/routing`. Its ACL, auth, data, extension, i18n, and system-settings modules are removed, as is the route tree that `/routing` used to export alongside the surfaces.

  `@nocobase/app-client` gains `resolveAppBase()`, which reports the path the application is mounted at.

  Four plugins built their API client at import time instead of resolving it from the application's service container, so they could not see `api.baseURL` from the application configuration. They now resolve it, which means an application that configures a base URL gets one client rather than two that disagree.

  The injected browser global `NOCOBASE_PORTAL_BASE` is renamed to `APP_BASE_PATH`. Its value has always been the `APP_BASE_PATH` environment variable, and the old name grouped it with the settings that address a v2 NocoBase server. Those keep their names. A client and the server that serves it must be upgraded together.

  `@nocobase/app-plugin-data-provider` is removed. It forwarded the Portal data provider, and applications built on the current client runtime do not use it.

  The Hub template is rebuilt from the default template and now runs the same client and server stack as every other v3 application. Its `/api/apps` endpoint and its v2 API proxy are gone, so a hub's `.env` no longer configures them.

  The Portal SDK's template compatibility check is removed with the rest: it had been disabled behind a constant, and its install script cost every generated project a `pnpm-workspace.yaml` `allowBuilds` entry it did not need. `createPortalViteConfig` no longer takes the plugin that injected it.

- 174eab5: Rename four packages, dropping the qualifiers they only carried to avoid names the v2 line had taken.

  | Before                     | After                  |
  | -------------------------- | ---------------------- |
  | `@nocobase/app-database`   | `@nocobase/db`         |
  | `@nocobase/app-i18n`       | `@nocobase/i18n`       |
  | `@nocobase/app-server-kit` | `@nocobase/app-server` |
  | `@nocobase/id-generator`   | `@nocobase/snowflake`  |

  There is no compatibility shim: the old names receive no further releases, and a dependency on one has to be repointed by hand. Each package keeps its version history, which is why the changelogs say which name the earlier releases went out under.

  `@nocobase/app-server` reclaims a name the v2 line abandoned at `0.11.1-alpha.5`, so it starts at `1.0.0-beta.0` rather than continuing its own `0.1.0-beta` line — `0.1.0` sorts below `0.11.1`, and npm would have rejected the publish. The other three take names that were never published.

  `@nocobase/snowflake` also now matches what it implements; its only source file was already called `snowflake.ts`.

### Patch Changes

- Updated dependencies [174eab5]
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/i18n@1.0.0-beta.1
  - @nocobase/snowflake@1.0.0-beta.3
  - @nocobase/queue@0.1.0-beta.3

The versions below were published as `@nocobase/app-server-kit`, the name this package carried until it was renamed to
`@nocobase/app-server`. They are kept because they describe this same codebase; the `@nocobase/app-server-kit` releases they
name are not, and never will be, versions of `@nocobase/app-server`.

## 0.1.0-beta.3

### Minor Changes

- ac3f033: Replace aggregated application configuration objects and config factories with typed module-owned configuration definitions. Applications now compose defaults, file providers, environment layers, validation, explicit reloads, and subscriptions through `AppConfig`, while providers read their configuration through `app.config.get(definition)`.
- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- 78cf0a2: Add declaration-level Server plugin inspection with real Route contribution order, and make the Routes example own a path-scoped authentication boundary.
- fb1a752: Transport public Client configuration through a versioned, safely escaped JSON data block in SPA HTML and read it automatically during Client runtime resolution.

  Apply the same HTML transformation to production static responses and development Vite proxy responses, and document the public `config.yml` Client section in the default template.

### Patch Changes

- 948304d: Close logging transport workers during application shutdown to prevent full application test suites and server processes from hanging during cleanup.
- Updated dependencies [948304d]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
  - @nocobase/logging@0.1.0-beta.3
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/drive@0.1.0-beta.2
  - @nocobase/snowflake@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.2
  - @nocobase/session@0.1.0-beta.2
  - @nocobase/config@0.0.2-beta.0
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.2

### Minor Changes

- 7cdffbd: Add reusable application-scope cancellation and disposer lifecycle primitives, and use them for the default template standalone scope.
- 7cdffbd: Add reusable application-scope path, environment, and routing resolvers, while keeping default-template configuration mappings application-owned.
- 7cdffbd: Move public base-path mounting and mounted origin proxy adapters into `@nocobase/app-server` so standalone applications can reuse the host-neutral runtime boundary.
- 7cdffbd: Replace separate API and root route arrays with one ordered `routes` contribution array. Route factories now receive the Application, create and return their own Hono router, and are mounted automatically at `/api` or the application root according to their definition.

  Standardize plugin server modules around `providers/index.ts` and `routes/index.ts` collection entries, `services/` domain implementations, and a stable `tokens.ts` public contract.

  Generated plugins now declare conventional database and queue contribution directories by default. Missing optional directories are ignored until executable migrations, seeds, or jobs are added.

  Generated plugins now include an App-facing starter Agent Skill under the package's `skills/` directory. Plugin registration and skill synchronization copy these package-owned Skills into registered applications' `.agents/skills/` directories.

  Unify Client page contributions behind one `routes` loader. Plugins now use `defineAppRoutes()` and `defineSettingsRoutes()` to add child Routes to the application's two built-in Client Routes, mirroring how Server plugins use `defineRootRoutes()` and `defineApiRoutes()` with the built-in Hono routers.

- 7cdffbd: Add reusable Node HTTP, WebSocket, and standalone server definition adapters with graceful shutdown handling, Vite overrides, mounted application lifecycle ownership, standard listen configuration, and startup cleanup. Reduce the default template standalone entry to binding its root directory, Runtime Definition, and shared server factory. Derive the application package name from its root package metadata and keep standard standalone routing defaults in the Node runtime instead of repeating them in each Runtime Definition.
- 7cdffbd: Add explicit `server/plugin.ts` definitions for Providers, API routes, root routes, database sources, and queue jobs. Register routes in a dedicated Application phase after Provider boot, add reusable HTTP and runtime composition helpers to their owning packages, and remove the default template's duplicate runtime layer and legacy plugin discovery contract.
- 7cdffbd: Move server plugin manifest resolution, Provider loading, and database or queue contribution discovery into the public `@nocobase/app-server/plugins` entry. The default application template now consumes the shared implementation.
- 7cdffbd: Add declarative application Runtime Definitions, shared application Scope, path, and disposal contracts, reusable Node standalone Scope and environment loading utilities, and focused Runtime Config section resolution. Resolve plugins before config factories and pass the complete resolved Runtime into application assembly, making Runtime plugins the single source for both configuration contributions and provider or route registration. Use the shared Runtime assembly across app-host and the default application template so embedded and standalone modes no longer maintain separate structural copies. Remove the template-local Scope and config-loading infrastructure, require standalone entrypoints to pass their resolved application root explicitly, and remove the legacy `/v2/api` proxy contract in favor of each application's local `/api` router.

### Patch Changes

- Report Server plugin locale declarations during static inspection without executing their loaders.
- Add a consistent Server inspection summary with deduplicated recovery suggestions.
- b049266: Add language switching on top of `@nocobase/i18n`. Applications and plugins declare their locales the same way on both sides, the browser loads only the language it is showing, and the chosen one is kept in storage and mirrored to the server session.
- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.
- Updated dependencies [b049266]
- Updated dependencies [ce4eab8]
- Updated dependencies [b049266]
  - @nocobase/i18n@0.0.2-beta.0
  - @nocobase/service-provider@0.0.2-beta.0
  - @nocobase/db@0.0.1-beta.1

## 0.0.1-beta.1

### Patch Changes

- 0465323: Expose application configuration paths to server plugins and add helpers for mounting redirect responses below an application's base path. Application hosts now rewrite root-relative redirects returned by embedded applications so installation and other redirects remain inside the mounted application.

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/db@0.0.1-beta.0
