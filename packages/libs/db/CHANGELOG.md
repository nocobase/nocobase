# @nocobase/db

## 1.0.0-beta.18

### Minor Changes

- 37c8d20: Load sample data only when an installation asks for it. A seed declared with `defineSeed({ name, sample: true, run })` runs only when the Seeder is created with `sample: { enabled: true }`; otherwise it is recorded as skipped and never runs on its own. `Seeder` gains `runSamples()`, which runs the sample seeds recorded as skipped, and `record(entry)`, which records an entry no seed file describes. The seed history table gains a nullable `status` column (`executed` or `skipped`), added by the library the next time a run ensures the table; existing rows read as executed. `SeedHistoryRecord` carries `status` and `SeedRunResult` carries `skippedSamples`.

  `@nocobase/app-server` enables sample seeds when a run installs the connection — it held no migration or seed history before the run, or a fresh run rebuilt it — and `app.sampleData` is set (`APP_SAMPLE_DATA=true`); the seeds entry of a run reports `freshInstall` and `skippedSamples`. `@nocobase/app-server/sample-data` adds `sampleDataToken`, on which a plugin registers sample data that has to go through services: the application builds it once every provider is ready, under the same condition, and records it in the default connection's seed history as `sample-data:<name>`. The database task operation `sample` runs the skipped sample seeds.

  `@nocobase/app-cli` adds `pnpm nocobase db sample`, which runs every sample seed recorded as skipped, then starts the application without serving it and builds the registered sample data that is skipped or not recorded. A deployment refuses it.

### Patch Changes

- 6993158: Dropping an enum Field works again. The previous release compiled every dropped Field's columns to tell whether it owned any, and compiling an existing enum Field with a native type throws; only relations are now checked.
- a6796d9: Dropping a relation field that owns no column (`hasOne`, `hasMany`, `belongsToMany`, or a `belongsTo` over an existing Field) no longer issues `DROP COLUMN`. On PostgreSQL that statement failed for a column that never existed, which stopped `@nocobase/app-plugin-workflow`'s `202610010001_workflow_application_ids` migration, and with it every fresh installation of the workflow plugin on PostgreSQL.

## 1.0.0-beta.17

### Minor Changes

- 21d274c: Permission Sets can no longer be saved with a write grant that every write would reject. `POST /api/authorization/permissionSets`, and a `PATCH` that replaces `grants`, now check each `database.collection` `create` and `update` grant against the Collection's metadata and answer `400 INVALID_ARGUMENT` with reason `INVALID_AUTHORIZATION_INPUT`, domain `authorization`, and one `fieldViolations` entry per offending member, such as `grants.0.actions.1.policy.fields.2`, when a listed field does not exist or is one a write cannot set (auto-increment, generated or optimistic-lock version), when a listed relation does not exist, or when `through` is given on a relation that is not `belongsToMany`. Such a grant used to save and then fail every write it allowed with an opaque `500`. Read and delete grants, `'*'`, and Collections the database does not hold are not checked, and a `PATCH` that changes only the key or title still saves a set whose stored grants have gone stale. Clients that saved such grants must remove the offending fields.

  An `update` grant with `fields: '*'` on a Collection whose primary key is an auto-increment column failed every write with `500 INTERNAL`, because `'*'` resolved to every field, the primary key included, and db refuses a Policy naming a field it assigns itself. `'*'` on `create` and `update` now resolves to the fields a write may set. `AuthorizationCollection` gains `writableFields` accordingly.

  The startup scan of stored Permission Sets now also reports `database.collection` write grants, given directly or composed by a stored composite grant's definition, that name a field or relation a write can no longer use, for example after a field was dropped or a seed wrote the grant directly. As for composite grants that no longer expand, it throws in development and warns in production.

  `@nocobase/db` exports the rule those checks share: `writableFields(collection)` lists the fields a write may name, `isManagedField(collection, field)` says whether the database or Repository assigns a field, and `writePolicyProblems(collections, collection, policy)` returns every member of a write policy that does not fit the Collection metadata, each with its path, instead of throwing `INVALID_WRITE_POLICY` on the first. The Repository's own write-policy validation now runs on the same code.

- 7dbc54b: Repository writes can now be observed. `connection.onRepositoryMutation({ collections, keys?, values?, id? }, { inTransaction?, afterCommit? })` subscribes to the rows Repository writes change and returns a function that unsubscribes. Every write method emits one event per call that wrote at least one row, listing each row it created, updated or deleted — nested relation targets, foreign keys and through rows included — with its key and the fields written; a subscription matches when any of those rows belongs to one of its Collections. Subscriptions belong to the root connection and are shared with its transactions and policy-bound connections.

  `inTransaction(event, connection)` runs inside the call's transaction once its writes are done; throwing fails the call with that error and rolls back an implicit transaction. `afterCommit(events, connection)` runs once per outermost commit with that transaction's matching events and the root connection, and drops them when the transaction or savepoint rolls back; its errors go to the new connection option `onRepositoryEventError(error, { subscriptionId, operationIds })`, or become a process warning whose `code` is `REPOSITORY_EVENT_LISTENER_FAILED` and whose `cause` is the error. Writes made through the connection either listener receives emit events with `parentOperationId`, nested at most `repositoryEventMaxDepth` levels (a new connection option, default 8) before they fail with the new `RepositoryError` code `REPOSITORY_EVENT_RECURSION`. A subscription matches an event by its root Collection or any Collection among its row changes.

  A connection without subscriptions runs every write exactly as before. When a subscription asks for keys (the default), `updateMany` and `deleteMany` lock the matching rows and write them by key, and `createMany` keeps its single statement when every row supplies its key, otherwise uses one multi-row `INSERT … RETURNING` where the dialect runtime declares the new `insertManyReturning` flag (`@nocobase/db-sqlite` does) or inserts row by row. Subscriptions declaring `keys: false`, and Collections whose rows have no primary key or non-null unique key, keep the single statement and receive a `count` event. `connection.explainRepositoryEvents({ collection, operation })` reports the strategy, granularity and whether an implicit transaction is opened.

  The write methods accept a `meta` option built with the new `defineRepositoryEventMeta<T>(namespace)` handle, whose `read(event)` returns the typed value; `values: true` subscriptions also receive the written values. Writes made through `query`, `client()`, migration and seed tasks, and rows changed by database cascades emit nothing, and events are delivered only in the process that wrote.

  `@nocobase/app-server` ignores the two new connection options when deciding whether two connections point at the same database, and answers `REPOSITORY_EVENT_RECURSION` as a server error.

- be0fbbd: `@nocobase/db/testing` exports `TestDatabaseProvisioner`, the contract a dialect package implements so `@nocobase/db-testing` can create isolated databases on it, with `ProvisionedTestDatabase`, `TestDatabaseProvisionOptions` and `TestDatabaseEnvironment`. `@nocobase/db-sqlite`, `@nocobase/db-postgres` and `@nocobase/db-mysql` export one as `testDatabaseProvisioner` from a new `./testing` entry: SQLite creates a database file under `NOCOBASE_TEST_DB_SQLITE_DIRECTORY` or the system's temporary directory, so a second manager opens the same database as on a server, PostgreSQL creates a schema in the database its `POSTGRES_*` variables name, and MySQL creates a database through the administrative account in `MYSQL_ADMIN_USER` and `MYSQL_ADMIN_PASSWORD` (or `MYSQL_ROOT_PASSWORD`). `postgresTestConnection()` and `mysqlTestConnection()` return the connection options those variables describe. All three also implement the optional `listProvisioned` and `dropProvisioned`, which `@nocobase/db-testing` uses to remove the databases an interrupted run left behind; `TestDatabaseListOptions` describes the first. A provisioner also carries `capabilities`, the capabilities its driver declares. `createSqlTestDatabaseProvisioner()` builds one for a server dialect from its connection options and the statements that create, drop and list isolated databases, each run on an administrative connection opened for it and closed afterwards; the PostgreSQL and MySQL provisioners are built with it.
- 463a7a8: `@nocobase/db-testing` can run tests on every server dialect. `@nocobase/db-kingbase`, `@nocobase/db-oceanbase`, `@nocobase/db-mssql`, `@nocobase/db-oracle` and `@nocobase/db-dameng` each export a `testDatabaseProvisioner` from a new `./testing` entry, with defaults matching the services in the examples application's `docker-compose.yml`: KingbaseES isolates a test database in a schema, OceanBase and SQL Server in a database, and Oracle and Dameng in a user of its own, since both inspect the connected user's objects. `@nocobase/db-testing` declares the five as optional peers. `createSqlTestDatabaseProvisioner()` from `@nocobase/db/testing` accepts a list of statements for a step, binds every `??` and `?` in them to the database's identifier, and takes an `identifier` option for a server that folds unquoted names to upper case; when a later create statement fails, it drops what the earlier ones created. The Oracle provisioner drops a test user on every supported version rather than only on 23ai, and grants it the materialized view and synonym privileges a migration may need. `@nocobase/db-testkit` exports `describeTestDatabaseProvisioner()`, the suite each dialect's integration tests run against its provisioner.
- 7dbc54b: `DatabaseConnection` gains `afterCommit(callback)` and `afterRollback(callback)`. A commit callback runs after the outermost transaction commits, in registration order, once the transaction's Collection metadata changes are applied, and `transaction()` resolves only after every commit callback has finished. Registered inside a nested `transaction()`, it waits for the outer commit and is dropped if that savepoint rolls back; outside a transaction it starts at once. Rollback callbacks receive the error after the transaction or savepoint rolls back, including when the commit itself fails. A callback that throws does not change the transaction's outcome: the error goes to the new connection option `onTransactionCallbackError(error, phase)`, or becomes a process warning whose `code` is `TRANSACTION_CALLBACK_FAILED` and whose `cause` is the error. The `COLLECTION_METADATA_INVALIDATION_FAILED` warning now carries its code the same way. Registering either on a transaction connection after its transaction has finished throws. Policy-bound connections forward both methods.

  Collection metadata changed inside a nested `transaction()` now reaches the connection's Registry when the outer transaction commits; before, only the outer transaction's own changes did, so the root connection could keep serving the old schema. If `onTransactionCallbackError` itself throws, that error becomes a warning too and the transaction's outcome is still unchanged.

  `@nocobase/app-server` ignores `onTransactionCallbackError` when deciding whether two connections point at the same database.

- 0b933b3: Applications now generate an OpenAPI 3.1 document for their `/api` routes and serve it at `GET /api/swagger`, with Swagger UI at `GET /api/swagger/docs`, which keeps what "Authorize" was given, such as an API key, across reloads. The Swagger UI files ship in `@nocobase/app-server`'s `dist`; no CDN is involved and templates declare nothing.

  `@nocobase/app-server/router` exports what a route declares itself with: `describeRoute()` re-exported from `hono-openapi`, `resolver(schema, direction?)`, `apiValidator(target, schema)` — which validates a Standard Schema such as a zod schema, answers invalid input exactly as `parseApiInput()` does (`400 INVALID_ARGUMENT`, reason `INVALID_INPUT`, domain `app`, one field violation per issue) and documents the parameters or body — and the response helpers `dataResponse()`, `listResponse()`, `emptyResponse()`, `apiErrorResponse()` and `apiErrorResponses`, which reference the shared standard error body. `apiErrorResponses` is `401`, `403` and `500`, for an authenticated route with a permission check; it does not include `400`. A route with an `apiValidator()` gets the `400` for invalid input in the document automatically, as the shared `InvalidInput` response, and a route without one gets none; a `400` the route declares itself for another reason, such as a failed precondition, is kept and documented after the invalid-input description. `parseApiInput()` keeps working and is superseded. Plugins import these from `@nocobase/app-server/router` and must not declare `hono-openapi` themselves; `pnpm peers:check` now fails one that does.

  Data endpoints from `defineRepositoryApiRoutes` are documented automatically: each action gets an operation whose record, `values` and filter schemas are read from the Collection field by field, with the filter operators each field accepts and a shared `RepositoryFilter` component describing the grammar. Fields a fixed Policy forbids are left out. An exposure entry accepts `computedFields: { name: schema }`, a Standard Schema such as a zod schema or an OpenAPI schema per field, for fields it adds to every returned record that the Collection does not have; they are documented read-only in the exposure's record schema wherever a record is returned and never in `values`, `filter` or `sort`. The declaration changes nothing at runtime, and a name the Collection also has fails when the routes are created. `GET /api/healthz` is declared too, with `security: []` because it needs no credential.

  The documentation is served only to requests an access check allows. Plugins register checks, and fragments for routes a library defines, through the new `apiDocsToken` service (`addAccess()`, `addFragment()`, `invalidate()`); a fragment may also carry `components.securitySchemes` and `security` requirements, which the document lists at its top level as alternatives, so a route that needs no credential declares `security: []`, and a document nothing contributes a scheme to has no `security` at all; until a check is registered the documentation routes answer `404 ROUTE_NOT_FOUND`, so an application without one publishes nothing. `inspectApiRoutes(app)` and `findUndeclaredApiRoutes(app)` report what each route of a started application declares, and `Application.apiRouter` exposes the assembled `/api` router. A plugin that serves routes through a runtime dispatcher, a catch-all on `/api` that hands each request to a router at request time, registers each router with `addApiRouter({ owner, prefix, scope?, router })`: its routes are documented, inspected and checked for duplicates at `prefix` followed by their own paths, exactly like routes mounted on `/api`. `scope` names the sub-path the dispatcher actually forwards to the router, such as `/sharingRules`; a route the router declares outside it is never reached, so it is left out of the document and the duplicate check and reported as undeclared. A forwarded target the framework cannot see into, such as a plain function, is registered with `addUndeclaredApiRoute({ owner, method, path, reason? })`, which `findUndeclaredApiRoutes(app)` always reports and the document never lists; `pnpm openapi:check` prints the `reason` of such a route. Both return a function that removes the registration, and `Application.forwardedApiRoutes` lists what is registered. A plugin route under `/api/swagger` now fails start as a duplicate route.

  Schemas are converted under the document's conventions rather than hono-openapi's defaults. A response object is open unless its zod schema is strict (`z.strictObject()` or `.strict()`), so adding a response field is not a breaking change; a request body validated with `z.strictObject()` stays closed. A recursive schema such as `z.json()` becomes a component named by its `ref`, or `JsonValue`, or `Recursive<hash>` for another anonymous one, instead of a converter-generated `__schema0` that collided across routes or a `$ref` into `#/$defs` that resolved nowhere. A property whose schema is a shared one keeps its own description next to the `$ref`, and the shared component keeps its own. `apiValidator('header', ...)` leaves `Accept`, `Authorization` and `Content-Type` out of the parameters, as OpenAPI ignores them there. `findApiDocumentSchemaProblems(document)` lists unresolved references and converter-generated component names, for a test to expect none.

  `@nocobase/db` exports `filterOperatorsForFieldType()`, `supportsFilterShorthand()` and `isSortableFieldType()`, the tables the Repository validates filters and sorts against, so descriptions of the filter grammar are derived from them rather than copied.

  The `nocobase-app-development` Skill's HTTP API reference describes the API documentation: how people and agents read it (`<APP_BASE_PATH>/api/swagger/docs` and `<APP_BASE_PATH>/api/swagger` with a session or an `x-api-key` header, `401` without one and `404` when no access check is registered), how to declare a route and list only the error statuses it can produce (no `400` for input validation, which `apiValidator()` adds; `apiErrorResponses` only for an authenticated route with a permission check), `security: []` for a route reached without a credential, the five kinds of route that may be hidden, response schemas typed against the service's view type, `computedFields` on a data exposure, routes registered through `authz.routes.add` with `createRouteHandler`, routers forwarded by a plugin's own runtime dispatcher (`addApiRouter()` and `addUndeclaredApiRoute()`), and the test assertions. Its entry `SKILL.md` tells an agent to learn an application's endpoints from the JSON document rather than from route sources, and its server routes, testing and organisation references show routes declared with `describeRoute()` and validated with `apiValidator()`. The `nocobase-deployment` Skill describes the API documentation in production: who may read it, that there is no switch to make it public, and that restricting it further is done at the reverse proxy.

- 21d274c: Every `RepositoryError` now carries a `status`, the canonical error status its code maps to through the new `repositoryErrorStatuses` table exported by `@nocobase/db` (`INVALID_ARGUMENT`, `PERMISSION_DENIED`, `NOT_FOUND`, `ABORTED` or `INTERNAL`). The table is typed over every `RepositoryErrorCode`, so a new code does not compile until it has a status.

  `@nocobase/app-server` reads that status instead of keeping its own list of codes, so a code added to the Repository reaches an `/api` caller with the status chosen for it. Two answers change:

  - `RELATION_TARGET_NOT_FOUND` is `400 INVALID_ARGUMENT` instead of `404`: the missing target is one the request body names, not the resource in the URL.
  - `INVALID_WRITE_POLICY` is an opaque `500 INTERNAL` instead of `400`: write policies are server-owned, so an invalid one is a server misconfiguration.

  Every Repository error a caller sees now carries its `path` and `details` in `metadata`, not only the write-forbidden codes, and an `INVALID_ARGUMENT` one also names its path in `fieldViolations`.

### Patch Changes

- 7f9450e: `updateMany` and `deleteMany` with `select`, and bulk updates checked against a Policy scope, no longer fail on SQLite past about a thousand rows with "Expression tree is too large". The writes, scope checks and reloads that address every locked row by key now run in batches inside the same transaction: at most 200 keys, and fewer for wide composite keys so a statement binds no more than 1,000 key values. Rows that an earlier batch already removed through a database cascade count as deleted. A nested hasOne `create` on a source that already has a target now detaches the current target before inserting the new one, as `connect` does, instead of failing with the database's unique constraint error; when the foreign key cannot be cleared it fails with `RELATION_ACTION_NOT_ALLOWED` and writes nothing. Detaching that current target now honours the relation scope of the Policy, for `create` and `connect` alike: a current target the scope cannot locate stays attached and the write fails with `RELATION_TARGET_NOT_FOUND`, where it used to be detached regardless of scope.
- 4403687: A dialect's schema runtime can give a column's default as an expression through `schema.columnDefault({ client, column, altering })`, used in place of the literal `defaultValue` when a table is created or a column is added or altered. MySQL needs it for a TEXT column, which takes a default only as `default ('…')`.
- be0fbbd: `builder.dropConstraint()` drops a unique constraint that exists as a partial unique index — one declared with a `predicate`, which no database attaches to a constraint — as that index. It was dropped as a constraint, which PostgreSQL refuses (`constraint … does not exist`), so a migration whose `down` dropped one could not be rolled back there; `@nocobase/app-plugin-notification`'s `202609080001_create_notification_idempotency` was one. Constraints a definition resolved from the database lists by the name of an index are dropped the same way.
- 463a7a8: A dry run of a migrator's `rollback` or `repair`, or of a seeder's `repair`, only reads. It no longer takes the task lock, creates the history or lock table, or upgrades legacy checksums, so `nocobase db rollback --dry-run`, `db redo --dry-run` and `db repair --dry-run` leave the database as their output says they do. Before, on a database no migration or seed had run on, they created `__nocobase_migrations`, `__nocobase_migration_lock`, `__nocobase_seeds` and `__nocobase_seed_lock`. A database without a history table now has an empty history, as `history()` already reported. A dry run also no longer waits for a run that holds the lock, so its preview can be overtaken by that run.
- be0fbbd: The query builder binds a value compared with a temporal or boolean Field the way a write to that Field binds it, in a select's where clause and now also in an update's and a delete's, including `between`. A comparison bound the caller's value verbatim before: MySQL rejected `next_run_at <= '2026-10-02T03:45:25.880Z'` (`Incorrect datetime value`) although the same string was accepted by `set`, which already encoded it, and an update or delete compared a boolean Field with an unencoded value. Only a value the Field could store is encoded: a `like` pattern, a null test, a date without a time against a `datetime` and any other string that is not a complete literal reach the database as given, as every comparison did before.
- 463a7a8: The in-process check of a migration or seed lock is kept per Database Connection instead of per connection name. Two Database Managers in one process — two applications a host embeds, or two tests — each have a connection called `main` on databases of their own, and one migrating while the other did failed with `TaskLockBusyError` ("already held for connection \"main\"") although the two never shared a database. Two managers on the same database still take turns through the lock row. `@nocobase/db-testing` no longer runs the migrations and seeds of its test databases one after another, which it did only to avoid that error.
- Updated dependencies [7dbc54b]
- Updated dependencies [21d274c]
  - @nocobase/repository-input@0.1.0-beta.2

## 1.0.0-beta.16

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

- ec92b20: A busy migration or seed lock throws `TaskLockBusyError` (checked with `isTaskLockBusyError()`), carrying the lock table, the holder, its heartbeat and whether it expired, instead of a plain `Error`; the messages are unchanged. `Seeder.history()` reads the executed seeds without taking a lock, as `Migrator.history()` does for migrations. The application's database task runner accepts `dryRun` for `run` and reports the pending migrations and seeds per connection in each result's `pending`, which `nocobase db apply --dry-run` uses. A driver may implement `hasStorage(config)` to say whether the local storage a connection opens exists yet; `@nocobase/db-sqlite` checks for the database file. A dry run consults it and answers for an empty database rather than preparing storage and connecting, so previewing an application whose SQLite file does not exist yet no longer creates it.

### Patch Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- 05af1d4: Refresh the Collection cache when migrations change a schema

  `database/<connection>/collections/` went stale after every migration until someone ran `collections generate`. It is now refreshed where the schema changes:

  - `db apply`, `db redo`, `db rollback` and `db reset` regenerate it for each connection whose migrations they executed, rolled back or rebuilt. `--no-collections` skips it, and a built `dist/` never writes it. A failed refresh is a warning, not a failure: the migrations stay applied and the command still exits 0. With `--json`, the result gains a `collections` field listing each refresh; it is absent when nothing was refreshed.
  - `pnpm dev` does the same after the startup migrations of the application it started. `nocobase dev` names that application's root in `NOCOBASE_COLLECTIONS_REFRESH`, which `DatabaseProvider` compares against its own root, so a Hub's in-process applications and production never write the cache.
  - `refreshAppCollectionsArtifact()` in `@nocobase/app-server/database` is the shared implementation: given a database run's result, it regenerates the cache of every connection whose schema changed.

  Seeds and `db repair` or `db unlock` do not trigger a refresh. After editing an external connection's `metadata/`, or when another system changes its schema, run `collections generate` yourself.

## 1.0.0-beta.15

### Patch Changes

- 4e58fe3: Add `nocobase app config init`, which writes the configuration file an application starts from, and run it in an application with `pnpm config:init`.

  It generates `config.yml` from the application's `config.example.yml` so the example's comments reach the file people edit, fills in `auth.secret` and `session.secret`, and points `database.connections.main` at the selected dialect while leaving every other connection alone. The dialect defaults to the installed driver when there is exactly one, is asked for on a terminal when there are several, and must be given with `--dialect` in a script.

  The command installs nothing. Which dialects an application can run on is decided by the driver it depends on, so a missing one is reported with the `pnpm add` that supplies it — pinned to the range the installed `@nocobase/app-server` declares for that driver, because the newest release is not necessarily one the runtime was built against — rather than installed behind the user's back — in a deployment, where adding a driver to a built `dist` would be undone by the next build, it reports that the application has to be built again instead. Everything is validated before anything is written, so a run that reports a problem leaves the directory untouched and can simply be repeated once the driver is there.

  The three application templates now declare `@nocobase/db-sqlite`, the driver their own `server/config/database.ts` defaults to, so a new application can be configured and started without installing one first.

  `@nocobase/app-server` exports `OFFICIAL_DIALECTS` and `OfficialDialect` from `@nocobase/app-server/database`, so tooling that has to name the dialects reads the same list the runtime loads drivers from.

  The application development and deployment Skills describe the new step: how an application is configured, that the driver decides which dialects it can run on, and that a deployment writes its configuration with `pnpm config:init` inside `dist/`, from the `config.example.yml` the archive carries. The database Skill shipped with `@nocobase/db` now points at `pnpm config:init` rather than at a creation flag that no longer exists.

## 1.0.0-beta.14

### Minor Changes

- 8f1ead4: Add `nocobase app db doctor`, which compares stored Collection metadata with the schema behind it and deletes the records whose table is gone.

  The physical schema and the Collection metadata are two records of what exists, and they can disagree: a table dropped outside a migration leaves its metadata record behind, and from then on resolving that Collection fails — including inside the migration that would recreate it, which is how the state becomes self-sustaining. Until now nothing reported it and nothing fixed it, so the only way out was deleting rows from `__nocobase_collection_metadata` by hand, which the documentation forbids for good reason.

  `ConnectionCollections.diagnose()` walks every metadata record, reports the ones whose physical table is missing as `COLLECTION_TABLE_MISSING`, and for the rest reports whatever resolving them reports. Only a missing table is marked `orphaned`, because deleting the record is then a complete fix; every other issue means the table is there and something in it no longer matches, which a migration has to reconcile.

  `db doctor` prints what disagrees per connection and exits non-zero while anything remains. `--fix` deletes the orphaned records and leaves the rest alone, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. The three templates gain a `db:doctor` script.

  `runAppCollectionsDoctor` is exported for hosts that run it themselves, and the connection selection the artifact generator already had is now shared rather than duplicated.

  The migrations reference also records why `onChecksumMismatch` defaults to `warn` and when to set `error` for a connection. The default was an implicit choice in the code, leaving a reader no way to judge whether to flip it: a checksum hashes the migration's file contents, so formatting the directory changes it and `error` would then stop the application from starting; startup runs migrations, so refusing to run turns drift into an outage on an upgrade where the compiled representation hashes differently. Nothing about the behaviour changes.

- a1a8690: Expire a task lock whose holder was killed, and add `nocobase app db unlock` to inspect and release one.

  A run that is hard-killed — SIGKILL, a stopped container, a lost machine — runs no cleanup, so its lock row survived it and every later run waited out the acquire timeout and then failed, until somebody deleted the row by hand. A holder now refreshes a `heartbeat_at` column every five seconds while it works, and a lock that has not been refreshed for thirty seconds is taken over by the next run, which then continues normally. The takeover is reported through `onStaleLock` and logged by the application, because it means a previous run did not shut down cleanly. A working run is never taken over: several missed beats are tolerated, so a slow database does not hand the lock to a second run.

  The lock table gains `heartbeat_at`, added in place when the table predates it. It cannot be a migration: the lock is what every migration runs inside.

  `db unlock` reports who holds each lock — the owner, when it was taken, and its last heartbeat — and releases the ones that have stopped beating. A lock that is still beating is reported rather than released; `--force` releases it anyway, which lets a second run start beside the first. It covers the migration and the seed lock together, takes `--connection` / `--all` / `--json` like the other database commands, and needs no migration or seed directory, since startup and plugins take the same locks. The three templates gain a `db:unlock` script.

  `Migrator` and `Seeder` gain `lock()`, which reads the lock without creating its table, and `unlock(options)`. `AppDatabaseTaskOperation` gains `'unlock'`, and a task result carries `lock`, `released` and `lockReason`. The exhausted-wait message now names the last heartbeat and points at `db unlock` rather than at deleting a row by hand.

### Patch Changes

- ffafc2a: Preserve undefined temporal query values before dialect encoding so optional notification delivery timestamps use insert defaults or remain unchanged on update instead of becoming invalid date strings.

## 1.0.0-beta.13

### Minor Changes

- fa01814: Report migration and seed checksum drift as a warning instead of failing, and add `nocobase app db repair` to realign the recorded history.

  An executed migration or seed whose source has since changed no longer stops the run. `latest()`, `rollback()` and `run()` return the drift in a new `warnings` field, the CLI prints it, `--json` carries it, and startup logs it through the application logger. Set `onChecksumMismatch: 'error'` on a connection's `migrations` or `seeds` configuration, or at the top level, to keep refusing to run. A history record whose migration is missing from the sources entirely still fails regardless of the policy.

  `pnpm db:repair` rewrites recorded checksums to match the current sources, covering both migrations and seeds in one command. It previews before writing, prompts for confirmation unless `--force` is passed, supports `--dry-run` for inspection in CI, and conditions every write on the checksum it read, so a history changed in between fails rather than being overwritten. It never deletes a history record, so a repair cannot make an executed task run again.

- 38e5253: Store an offset-bearing ISO string in a `datetime` Field as the local wall clock it names, and validate temporal strings written through `database.query()`.

  `datetime` is a wall-clock type, so a value carrying `Z` or `±HH:MM` is not something it can hold as written. Repository refused such a value outright, while `database.query()` passed every string to the driver untouched: `2026-09-06T09:30:00Z` was accepted by the write and then stored verbatim on SQLite, where the first read of the row failed with `FIELD_CAPABILITY_NOT_SUPPORTED` because no valid local value carries an offset. Every other dialect took the write too and silently dropped the offset, giving one value on PostgreSQL and a different one on MySQL.

  Both writers now converge on one answer: the offset is applied and the instant is stored as the host's local reading of it, which is exactly where the equivalent `Date` value has always landed. `2026-09-06T09:30:00Z`, `2026-09-06T17:30:00+08:00` and `new Date('2026-09-06T09:30:00Z')` are one value for a host at `+08:00`, through `createOne`, `createMany`, `updateOne`, `updateMany`, `upsertOne`, and Query `insertInto` and `updateTable`. `datetimeTz` is unchanged and still keeps the instant. Rows already holding an offset, which only SQLite could store, are read back through the same conversion rather than failing.

  Temporal strings written through `database.query()` are now validated the way Repository has always validated them, so a value that cannot be stored is reported at the write instead of at a later read. This rejects shapes the query builder used to accept silently, including the space-separated `2026-08-14 10:00:00`: write `2026-08-14T10:00:00`, or pass a `Date`.

- 7bde7bd: Add `nocobase app db rollback` and `nocobase app db redo`, so a migration corrected before its branch is merged can be re-run without resetting the database.

  Editing an executed migration changes nothing on its own: it is recorded as executed, so `db apply` skips it and the database keeps the schema the old source produced. Until now the only way forward was `db reset`, which drops every managed table and every row with it, or editing the history table by hand — which the documentation forbids, and which splits the two records of what exists: dropping a table without its metadata record leaves the Collection unresolvable.

  `db rollback` runs `down()` for the latest migration batch, newest first, and deletes its history records. The batch is the unit the history records, so a batch that mixed application and plugin migrations rolls back as one, and the confirmation lists every migration with the package it belongs to before anything runs. It fails having run nothing when a migration in the batch is irreversible or has no `down()`. `db redo` is that followed by `db apply`. Both are destructive in the same way and confirm the same way: CI and non-interactive terminals require `--force`, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. Seeds are not re-run, so rows a seed inserted into a table the batch recreates are not restored.

  `Migrator.rollback()` accepts `{ dryRun: true }`, which is what the confirmation is built from: it takes the lock, resolves the batch, rejects an irreversible one, and reports what a run would undo without running any `down`. `MigrationRollbackResult` gains `records` — the batch's history records in rollback order, carrying each migration's package — and `dryRun`. `AppDatabaseTaskOperation` gains `'rollback'`, which applies to migrations alone: a plan including seeds is refused, because seeds have no inverse.

  The three templates gain `db:rollback` and `db:redo` scripts. The migrations reference now documents re-running a corrected migration, states what `db:repair` is and is not for — it records that the schema already matches, so using it on a change the database never received leaves the schema wrong and nothing recording that — and lists each internal table with the command that maintains it.

- 5380642: Publish a `nocobase-db` Skill so an application's agents get the database rules with the package.

  The package's documentation is not published — `files` carried `dist` alone — so an application that installed `@nocobase/db` had no guidance from it, and what existed lived in the application template as a second-hand copy that covered `QueryAdapter` and not Repository. The Skill ships under `skills/` and `nocobase skills sync` copies it into `.agents/skills/` of every application that depends on the package, alongside the plugin Skills already synchronized there.

  It is organized as the six areas an application meets: connection and dialect configuration, migrations and seeds, the Collection Builder, Repository and Query, transactions, and Collections. It records what the type declarations cannot — which layer a task belongs to, the reverse criterion for reaching past `query` in a migration or seed, that `database/<connection>/collections/` is derived output for a managed connection but committed metadata for an external one, and the API shapes that do not exist and are otherwise guessed.

- 3187ace: Let a Collection be created again when its metadata outlived its physical table.

  `createCollection` resolved the Collection it was about to create, which fails with `COLLECTION_SCHEMA_DRIFT` when a metadata record survived without its table — the state a corrected migration re-runs into, and the state a hand-rolled reset leaves behind. The resolved definition was then discarded and replaced by the operation's own, so the lookup could only fail, never inform the operation. Collections that these operations define themselves are no longer resolved; referenced Collections still are, and every other operation on a Collection whose table is missing still reports the drift.

- 5380642: Give migrations and seeds a `repository` on their context, bound to the connection the task runs on.

  `query` reaches rows through the Connection naming strategy and expresses exactly what it is given, which leaves three things for each task to assemble by hand: cross-dialect field encoding, Collection-level naming overrides, and relation writes including the junction rows behind a `belongsToMany`. `context.repository(name)` covers them, taking the Collection as the database itself records it — the metadata a previous `builder` operation wrote — rather than importing any application definition.

  The two contexts default differently. A migration changes structure, so `builder` and `query` remain its tools and `repository` is for the writes `query` would get wrong; a migration that uses it should say in a comment why `query` was not enough, keep it out of `down`, and not walk a table with it. A seed changes no structure and writes installation data in Collection terms, so `repository` is its normal tool and `query` covers what that cannot express.

  Inside a transaction the Repository comes from the transaction's own connection, so a failed task discards its writes. This is what the database task service container has been protecting: resolving the application's `DatabaseManager` there would have produced a Repository writing outside the task's transaction, and its refusal now names the supported path instead of only refusing.

- 3187ace: Wait for a contended migration or seed lock instead of failing on the first conflict, report who holds it, and stop abandoning it held when a restart interrupts startup.

  Acquiring the lock now retries with backoff until `lockAcquireTimeoutMs` — a new Migrator and Seeder option defaulting to 30 seconds — so the brief overlap between two starts resolves itself rather than surfacing as an error. A conflicting insert is treated as contention on its own: the previous implementation re-read the lock row to decide what to report, and a holder that released in between left the driver's `UNIQUE constraint failed` text as the whole explanation. When the wait does expire, the message names the holder recorded in `locked_by`, the time in `locked_at`, how long it waited, and that the row has to be deleted if the process holding it was killed. An insert that keeps failing while the lock table holds no row is still reported as the driver error it is, rather than being retried until the timeout.

  Startup watches `SIGINT` and `SIGTERM` from before the application boots until the HTTP server registers its own handlers. Migrations and seeds run in that window, and Node's default disposition terminated the process outright, so a `tsx watch` restart triggered by a dependency install left the lock held by a process that no longer existed and the next start had to wait it out. The signal is now recorded, startup finishes and releases the lock the ordinary way, and the application shuts down instead of listening. A second signal still forces the exit. `watchStartupShutdownSignals` is exported for hosts that run their own startup sequence, and the app-host CLI uses it: its handlers were registered before the host existed, so a signal during startup exited the process immediately and abandoned the same locks.

  Migrations and seeds share one lock implementation, so contention behaves and reports identically for both.

### Patch Changes

- c5f4438: Keep one implementation of the task ledger and the source loader behind the two kinds, and apply the history table's column upgrade to the seed ledger as well.

  Migrations and seeds keep separate ledgers because only one of them is reversible, but the table, its reads and writes, and most of loading a source directory were the same work written twice: the two `internal/history.ts` modules differed by one column and their names, and the two loaders by which fields a definition must define. The shared halves now live in `migration/internal/history.ts` and `migration/internal/task-loader.ts`, with each kind naming its own table and messages — the arrangement the task locks already use. Every exported function keeps its name and signature, and no message changes.

  The duplication had a cost beyond size: a change to one side could be forgotten on the other, which is how the seed ledger never got the `package_name` column upgrade the migration ledger has. It has it now, so a ledger created before that column existed is upgraded in place on the next run rather than failing its first read.

- 38e5253: Accept `YYYY-MM-DD HH:mm:ss` when writing a `datetime` or `datetimeTz` value

  Reading has always accepted the space separator, because it is the shape catalogs and drivers hand back, while writing required the `T` and reported a value that "is not a valid V1 temporal value" without naming the separator. The two halves of one contract disagreed, and the literal they disagreed about is the one every SQL dialect spells.

  Both writers now normalize it, so `'2026-09-02 09:00:00'` and `'2026-09-02T09:00:00'` store the same canonical value. The space is unambiguous — no valid V1 value carries one — and this only widens what is accepted, so nothing that worked before changes.

- 38e5253: Read temporal values through the result normalizer in Repository, and resolve a stored timestamp on the UTC pivot

  Repository decoded stored timestamps with the mutation validator rather than the result normalizer Query has always used, so the same row read through the two APIs could differ or fail on one of them. It now decodes through the result normalizer, which is what recognizes the shapes storage produces rather than the shapes a caller writes.

  That matters most after a Field is converted between `datetime` and `datetimeTz`. The two types disagree about what a stored value is, and the physical column is not rewritten: a widened SQLite column holds text carrying no offset, which Repository rejected outright with `FIELD_CAPABILITY_NOT_SUPPORTED`, and a narrowed one holds text that carries one.

  Both are now resolved on UTC, in both directions, for the same reason MySQL's `datetime(3)` already pivots there: it is the only reading that does not depend on the host the row is read on, so one database reports the same value everywhere and a Field converted one way and back returns what it started with. A previously stored offset in a `datetime` value therefore reads as the instant's UTC wall clock rather than the host's — writing keeps resolving a caller's offset against the host, where a caller is present and `Date` semantics apply.

  PostgreSQL still converts these columns by reading each value in the session time zone, so a migration that widens or narrows one has to pin that session to UTC itself.

## 1.0.0-beta.12

### Minor Changes

- 43592e9: Expose a read-only config.get() reader and service container to migration and seed callbacks. Inject application configuration snapshots for startup and CLI database tasks and document configuration and rollback semantics.

  Restrict application database task service access to the ID generator and reuse the templates’ application factory for CLI migrations and seeds. CLI tasks share the application database manager and dispose application and scope resources without booting providers or triggering autoRun.

  Simplify createAppCommands to one options object with lazy rootDir-based runtime and application discovery and optional factory overrides.

## 1.0.0-beta.11

### Minor Changes

- e9da3c2: Resolve installed official database drivers asynchronously from application configuration before provider registration or standalone database tasks. Configure only the needed dialects and install their optional peer packages in application dependencies. Preserve explicit driver registrations and synchronous core manager APIs; direct core consumers continue to register drivers explicitly. Standard development and test loaders require no synchronous ESM compatibility configuration.

### Patch Changes

- c84bfe8: Reject collection reads whose input resolves to a different logical collection name, instead of silently omitting logical field metadata. Use the logical name for get, getResolution, and getPhysical; inspect physical table names through schemaInspector.getPhysicalCollection.

  Refresh the collection naming index when metadata documents are created or removed, including field-only metadata, so explicitly declared underscored logical names remain valid during and after migrations.

  Resolve Query relative table identifiers to their logical collection before loading field metadata, preserving snake_case table inputs, aliases, and connection prefixes without relaxing public Collection name validation.

## 1.0.0-beta.10

### Minor Changes

- e0c4b3d: Add a transaction-safe physical row upsert API and use it through a unified Queue adapter accepting DatabaseConnection, with the upstream Knex client bridge kept private. Fix scheduler startup across database dialects while preserving schedule execution history.

  Preserve the outer Oracle transaction when a nested savepoint completes, allowing inserted rows to roll back with their owning transaction.

  Retry deadlocks with bounded backoff when a physical row upsert owns its transaction; preserve caller-owned transaction boundaries and propagate failures requiring the caller to retry.

  Recognize Dameng unique-key conflicts during concurrent upserts and preserve the outer transaction when knex-dm finishes a nested savepoint.

  Declare Knex as a Dameng runtime dependency so nested transaction support also works in registry installations.

## 1.0.0-beta.9

### Patch Changes

- 24e771f: Remove circular development dependencies between the database core, shared testkit, and dialect packages. Move runnable database examples, the playground, and benchmarks to repository development tools.
- 26ac480: Add code-defined Cron scheduling with timezone support, transactional synchronization, and stable schedule identities. Applications and plugins register schedules with `SchedulerService.defineSchedule(definition)` and execution targets with `registerTarget()` during provider registration or boot.

  Route scheduled jobs and workers through the application's configured logical queue, with an adapter-neutral schedule store. Keep the upstream queue dependency unmodified and store queue and scheduler timestamps compatibly with their adapters while preserving absolute instants.

  Move queue storage migrations from Scheduler into the queue library, which resolves configured database connections and physical tables. Assemble these sources centrally in app-server for startup and CLI commands, rejecting overlapping active queue tables before execution. Support immutable target parameters, shared migration history and locks, upstream-compatible physical schemas, and read-only execution conditions that leave skipped migrations unapplied.

  Track idempotent occurrences through the target's final outcome, including asynchronous Workflow completion and recovery with stable run references. Target registration returns a completion-reporting handle scoped to that target; long-running executions can report completion without a fixed scheduler observation timeout.

  Provide an authorized, read-only schedule management page and API with paginated schedules, trigger counts, execution history, and separate schedule and execution statuses. Register `pnpm nocobase schedule sync` as a global CLI command and integrate it into all application templates.

  Include application examples for custom task targets and scheduled Workflows, and agent guidance for schedule definition, target selection, asynchronous execution, diagnostics, and recovery.

  Keep the database manifest CLI entry available before compilation so fresh workspace installs link the command required by package builds.

  Declare the OpenTelemetry dependencies referenced by the upstream queue declarations so consumers can typecheck published Server APIs without enabling tracing or skipping library checks.

## 1.0.0-beta.8

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

## 1.0.0-beta.7

### Major Changes

- 1c70f60: Remove the `syncMetadata` execution option from CollectionBuilder. Executed schema changes always validate and synchronize supplemental metadata so logical field types, relations, and optimistic locking remain available to data input and output. Legacy calls that pass the removed option now fail before DDL; remove the option to migrate.

### Minor Changes

- 63db898: Let a driver declare the connection shape its hooks receive.

  Splitting the dialects into packages left the driver descriptor's hooks disagreeing about how to say "a connection": seven took `unknown` and `resolveConnection` took the closed `ConnectionConfig` union. Neither is a type a contributed dialect can work with, so each package asserted its way back to its own — `@nocobase/db-dameng` through `source as unknown as DamengConnectionConfig`, a double assertion, which is what two types with no overlap require.

  `DatabaseDriverDefinition<TDialect, TConfig>` now carries the connection type, and every hook receives it. All eight dialect packages name theirs and the assertions are gone; the lint rule that reports a redundant assertion is what removed the last of them.

  The hooks are declared as methods rather than function properties. TypeScript checks method parameters bivariantly, which is what lets a driver narrowed to one dialect sit in the `drivers` map holding drivers for all of them. The pairing that gives up on is one the runtime enforces anyway: a driver is looked up by the connection's own dialect, so it is only ever handed a config of the dialect it declares.

  `DatabaseConfig` is now an alias of `ExtensibleDatabaseConfig<ConnectionConfig>` rather than a second interface. The two were written out separately and stayed field-for-field identical, which left every consumer choosing between two names for one shape — `@nocobase/app-server` chose the closed one, which is why an application could not configure a contributed dialect at all.

  Also: `AnyConnectionConfig` is exported as the constraint to write connection-generic code against; `BaseConnectionConfig.pool` is `Knex.PoolConfig` instead of `unknown`, which is what `configurePool` already said it was; and `@nocobase/db-oceanbase` declares `OceanbaseConnectionConfig` instead of reusing `MysqlConnectionConfig`, whose dialect literal is `'mysql'`.

  This is a step toward inferring a database's connections from its registered `drivers`, which would turn `Database dialect "..." is not registered.` from a startup error into a compile error. That inference needs the driver to own its connection type first.

- 63db898: Move concrete database connection types into their owning dialect packages and keep the core connection contract independent of installed dialects. Import `SqliteConnectionConfig`, `PostgresConnectionConfig`, `MysqlConnectionConfig`, `OracleConnectionConfig`, and `MssqlConnectionConfig` from the corresponding `@nocobase/db-<dialect>` package instead of `@nocobase/db`.

  `ConnectionConfig` and the default `DatabaseConfig` and `AppDatabaseConfig` now describe the common runtime contract. For strict configuration checking, supply a concrete connection type or use `DatabaseConfigFromDrivers` and `AppDatabaseConfigFromDrivers`. The core also exports `DriverConnectionConfig` and `ConnectionConfigFromDrivers` for reusable driver inference. Preserve mutually exclusive host and socket targets in MySQL and OceanBase configuration and factory options.

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.

### Patch Changes

- 63db898: Require each driver registration key to match the driver's declared dialect in inferred database configurations. Reject aliases and mismatched keys even when no connection uses that driver or the connections map is empty, while preserving connection inference for correctly registered factories and descriptors.

## 1.0.0-beta.6

### Minor Changes

- 1d5ee9a: Add Collection artifact serialization, `Migrator.history()`, and skip NocoBase bookkeeping tables when listing Collections

  `serializeCollectionArtifact()` and `serializeCollectionArtifactManifest()` turn one Collection's resolution, physical schema and stored metadata document into the three deterministic JSON files an application commits under `database/<connection>/collections/<name>/`, plus a connection-level manifest recording the dialect, the schema management mode and the last applied migration. Object keys are sorted and `undefined` members dropped; arrays whose order carries meaning — fields, index columns, relations — are left in resolution order, and only unordered sets such as warnings are sorted. `validateCollectionArtifactDirectoryName()` and `assertCollectionArtifactDirectoryNames()` apply the file-system rules a logical name has to satisfy to become a directory, including rejecting names that differ only by case.

  `Migrator.history()` returns the applied migrations, oldest first, without creating the history table when none exists. It is what lets a read-only command record which migration a snapshot was taken after.

  `connection.collections.list()` and `scan()` used to throw on any migrated database: the registry only treated the metadata store's own table as internal, so the first `__nocobase_migration_lock` or `__nocobase_migrations` table it met failed to map to a logical name. Every table under the `__nocobase_` prefix is now recognised as NocoBase's own bookkeeping and skipped, and a connection can declare further bookkeeping tables — a migration or seed history or lock table given a custom name — through the new `internalTables` option.

- 211538b: Add `db.collections(name?)` to `DatabaseManager`

  The Manager already mirrored three of the four Connection handles that work in logical names — `builder`, `query` and `repository` — but not `collections`, so reading one Collection definition from the Manager took `db.connection().collections.get('orders')` while the neighbouring handles took one call. The omission read as an accident rather than a boundary.

  `db.collections(name?)` returns the very object `db.connection(name).collections` holds, so the resolution cache stays shared with every Builder, Repository and Migration on that connection. The mirroring stops at these four: `schema`, `schemaInspector` and `collectionMetadata` work in physical names or write supplemental metadata and remain Connection-only.

- 1d5ee9a: Add `DirectoryCollectionMetadataStore` and a declarative `metadataStore` configuration

  `DirectoryCollectionMetadataStore` reads supplemental Collection metadata from a Collection artifact directory — one `<name>/metadata.json` per Collection, in the format `serializeCollectionArtifact()` writes — so the files an application commits are the metadata source for a connection whose schema it does not own. It is read-only, like the Module store, and treats a missing directory or a `null` document as no metadata.

  A connection's or the top-level `metadataStore` may now be given declaratively as `{ type: 'directory', directory }` instead of an instance; `createDatabaseManager` resolves it when the connection is first created. An instance still passes through, and an external connection without a store at either level still raises `CollectionMetadataStoreRequiredError`.

### Patch Changes

- 1d5ee9a: Resolve a json column's default to the document it encodes

  `connection.collections.get()` reported a json Field's `defaultValue` as the text between the quotes of the SQL literal — `'{"storage":"local"}'` came back as the string `{"storage":"local"}` — while the Builder had been given the object. The inspector parses defaults at the literal level and does not know the column's type, so the resolver now decodes the text for `json` columns; the physical literal stays in `db.defaultExpression`. A default that is not valid JSON keeps `defaultValue` unset and adds a `COLLECTION_JSON_DEFAULT_INVALID` resolution warning instead of failing.

## 1.0.0-beta.5

### Major Changes

- ceb356b: Move all concrete dialect connection resolution, schema inspectors, native
  driver loading, pool hooks, precise integer codecs, and capability profiles into
  the corresponding dialect packages. `@nocobase/db` now requires an explicitly
  registered dialect driver and no longer exports concrete dialect inspectors or
  native-driver fallbacks.
- ceb356b: Expose the dialect runtime strategy contract used by database connections and
  the Knex-backed query, repository, schema, and application composition
  adapters. Dialect packages now own connection defaults, ownership identity, and
  local storage preparation, while the database configuration API accepts
  additional dialect identifiers without core changes.

### Minor Changes

- ceb356b: Add dialect driver registration support and the initial PostgreSQL dialect package.
- ceb356b: Add the destructive `pnpm migrate --fresh --force` workflow for managed
  connections. It clears dialect-owned schema objects, reruns visible migrations,
  requires confirmation in interactive terminals, and rejects external
  connections.
- c960d07: Add `narrow` to a policy-bound Repository, and publish the policy types and
  `ScopedDatabaseConnection` from the package entry. Narrowing intersects scopes,
  field lists and relations, and `false` on either side wins, so no patch can
  widen what is already in force.
- c960d07: Add `ref(target)` for reusing another Collection's read node inside
  `read.relations`. References resolve against the same `withPolicies` map and
  are expanded when the map is bound, so a cycle or a missing target is a
  configuration error rather than a failure at request time.
- c960d07: Constrain relation write targets by `RelationWriteNode.scope`. A `connect`,
  `disconnect`, `set`, `delete`, or relation `update`/`upsert` now locates its
  target within that scope, so a caller confined to their own rows can no longer
  attach or modify somebody else's through a relation.
- c960d07: Degrade the record type a policy-bound Repository returns: binding a `read`
  node makes reads come back as `Partial<TRecord>`, since a query with no select
  returns `read.fields` alone. `read: true` keeps the complete record type.
- c960d07: Enforce the Repository Policy write-back invariant: a created or updated record
  must still satisfy that operation's scope once the write lands, or the
  transaction rolls back with `SCOPE_VIOLATION`. An upsert whose target exists
  outside `update.scope` raises `RECORD_OUTSIDE_SCOPE` instead of degrading to an
  insert, and no longer merges the scope into the unique selector that locates
  the target.
- c960d07: Add the Repository Policy read model: policy types, scope normalization, scope
  pushdown into the query, and field and relation allowlists enforced across
  every read surface — select, filter, sort, distinct, cursor, aggregate and
  group by, including the returning select of a write and each relation branch,
  which is judged by its own collection's allowlist and narrowed by its own
  scope.
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

### Patch Changes

- ceb356b: Normalize JSON field values at the Repository and Query API boundaries so
  direct JSON columns accept and return structured `JsonValue` values across
  database drivers.
- ceb356b: Improve Dameng integration compatibility for typed numeric query results, streaming rows, temporal projections, default-only inserts, schema capability warnings, and native constraint error messages.
- ceb356b: Decode Dameng LOB values returned by mutation returning queries before exposing records.
- ceb356b: Return DECIMAL fields as database-formatted decimal strings across Query and Repository,
  including aliases, scalar subqueries, grouped fields, relation records, streaming,
  mutation results, and MIN/MAX. Preserve PostgreSQL/MySQL native strings and
  avoid numeric metadata lookups and redundant text projections on these drivers.
  Use PostgreSQL RETURNING without a decimal-specific reload. Enforce mysql2
  `decimalNumbers: false` to preserve precision, including when driverOptions requests numbers. Other drivers project
  decimal text before number conversion while preserving numeric filtering and ordering. Avoid SQLite
  text formatting truncating stored significant digits; SQLite REAL storage remains
  approximate. Synchronous Query.compile does not resolve field metadata and may
  omit decimal result projections added during execution on other drivers.

  Preserve the declared logical type of implicitly generated belongsTo foreign
  keys so Oracle integer references are not decoded as decimal strings.

- 590861e: Remove the integration test scripts from `@nocobase/db`.

  `test:integration`, `test:integration:<dialect>` and `test:integration:all` only
  forwarded to the dialect packages, and the indirection misled more than it
  helped: `pnpm --filter @nocobase/db test:integration` read as a full run while
  it ran SQLite alone, and `test:integration:all` invited an eight-dialect serial
  run that CI already performs on every pull request. Run a suite through the
  package that owns it, as CI does:
  `pnpm --filter @nocobase/db-<dialect> test:integration`.

- e11b855: Read temporal columns that still hold epoch milliseconds from before the query builder normalized temporal Fields, so an application upgraded in place on SQLite can read its existing users, sessions, and records instead of failing with `FIELD_CAPABILITY_NOT_SUPPORTED`.
- 72ed008: Stop reporting a MySQL expression default as a generated column

  MySQL describes a column whose default has to be written as an expression with `EXTRA = 'DEFAULT_GENERATED'`, and the schema inspector matched on the word `GENERATED`. That is the wrong signal: `DEFAULT_GENERATED` describes a default, while a generated column reports `VIRTUAL GENERATED` or `STORED GENERATED` and is the only kind that carries a `GENERATION_EXPRESSION`. The inspector now derives it from that expression.

  Two things were wrong while it did not. The column's default was dropped from the introspected schema, and the Repository refused to write the column at all — `createOne` and `updateOne` rejected it as `FIELD_NOT_WRITABLE`, "managed by the database or Repository".

  Every defaulted `json` column on MySQL was affected, because MySQL accepts no literal default on `json` and the builder therefore emits `DEFAULT (json_object())` for one. A Collection declaring `collection.json('options').notNull().defaultTo({})` could not have its `options` written on MySQL, while the same Collection worked on every other database.

- ceb356b: Return BIGINT columns as exact strings before driver number conversion in Query and Repository reads. Preserve precision through aliases, relationships, streaming, transaction clients, and mutation results across the five supported databases, while normalizing Repository integer and increment fields to safe numbers.

  Align the file Repository size type with exact string results from BIGINT-backed collections.

- ceb356b: Avoid issuing a second SELECT after creating a record when no relations need to be loaded.
- ceb356b: Support exact BIGINT and DECIMAL string filters, validate plain integer writes before SQL execution, and preserve numeric atomic-update operands without floating-point promotion. Reject SQLite int64 arithmetic overflow before storage and retain native PostgreSQL/MySQL read and aggregate behavior.
- e11b855: Prevent relation indexes from colliding with an explicitly indexed foreign-key field, and report conflicting physical index names before schema execution.

  A `belongsTo` relation's automatic index is now suppressed by an index on the relation's foreign-key **column** rather than on the relation's field name, which is what removes the collision: `collection.index('productId')` alongside a `product` relation used to compile to the same physical index twice.

  Suppression is also narrower than it was. Only a single-column index on that foreign key stands in for the automatic one; a composite index no longer does, even when it already leads with the same column. An application that indexed `['productId', 'scannedAt']` and relied on it to suppress the relation index will therefore see a single-column index on `productId` appear at its next schema synchronization. Declaring the same physical index name twice with different definitions now fails before execution rather than silently taking one of them.

- ceb356b: Preserve SQL `NULL` values when Query writes nullable temporal fields.
- 590861e: Decode JSON columns according to a result form the dialect declares instead of guessing from the value.

  A driver either parses a JSON column before returning the row or hands back the stored text, and the returned value carries no evidence of which. Decoding by attempting to parse any string therefore corrupted a JSON string whose content is itself JSON: writing `'{"a":1}'` and reading it back produced the object `{ a: 1 }` on PostgreSQL, Kingbase, MySQL, and OceanBase, whose drivers parse JSON themselves. Each dialect now declares `jsonResults`, and a value that a text driver cannot parse is reported as `INVALID_STORED_VALUE` rather than returned as the raw string.

  Where the driver can be told to behave the other way, the declaration is derived from the resolved connection rather than fixed: mysql2 returns a json column as text under `jsonStrings`, which reaches it through `driverOptions`, and the Dameng driver decodes the column under `parseJson`. A fixed declaration would be wrong for exactly those connections, which is the failure this change exists to remove.

  Query and Repository also no longer disagree about a column holding the JSON literal `null`: Query fell back to the raw value whenever a decoder legitimately returned `null`, so the stored text leaked back to the caller.

  Altering a JSON column on Oracle no longer fails with `ORA-40664`. Knex compiles a JSON column to `varchar2(4000) check (col is json)`, and repeating that definition on a MODIFY asks Oracle for a second IS JSON check constraint on the same column. A dialect now learns whether a column is being created or redefined, and Oracle omits the constraint while altering; the MODIFY leaves the constraint the original definition created in place.

  A dialect that builds a JSON column as something other than Knex's `json()` also loses the JSON default handling that comes with it, and an object default would reach the column as `[object Object]` — on Oracle that is text its own IS JSON constraint then rejects. Such a dialect now asks for the default as encoded text, while MySQL keeps receiving the value because that is what makes it compile the expression form its engine requires. A JSON default consequently works on Dameng, where the column is a plain clob and the default was silently stored as something that could not be read back.

- ceb356b: Support local `Date` values for `date`, `time`, and `datetime` mutations while
  preserving Better Auth date values when records are read through its adapter.
- c960d07: Fix two Policy configurations that were refused although they are legitimate: a
  relation `combine` branch judged the relation's own scope as if the caller had
  written it, and narrowing a `create` node with `defaults` was rejected as an
  unsupported update option.
- c960d07: Treat a foreign key as readable when the relation it points through is
  authorized and returns the key it points at. Refusing `ownerId` while allowing
  `owner { id }` hid nothing, since the same value came back by the other route.
- c960d07: Close four ways a Policy claimed more than it enforced: a bound Repository can
  no longer have its Policy replaced by another `withPolicy` call, the degraded
  read type survives a Policy held in a variable of its declared type, a
  malformed `through` rule is refused instead of reinterpreted as an empty
  allowlist, and `explainPolicy` hands out a copy of a Date default rather than
  the instance the writes read from. `validateMutation` also reports an
  unsatisfiable `create.scope` instead of deferring it to the first insert.
- c960d07: Let a Repository API action declare a `policy`, normalized when the routes are
  defined and bound to the Repository the handler uses. `@nocobase/db` gains
  `RepositoryOperations`, the operation methods a plain and a policy-bound
  Repository share, so code that only runs queries can accept either.
- c960d07: Close five ways a relation write escaped its Policy scope: a to-one
  `connect`/`disconnect` writing the root foreign key now triggers the root
  write-back check, the relation scope reaches the to-one target resolved before
  an insert, `disconnect` and `set` may only detach targets the scope can locate,
  and a relation `update` is judged again after its values are applied.
- c960d07: Reject a dotted field name in a Policy scope when the Policy is bound, the same
  way an explicit relation path already was. `{ 'owner.tenantId': 'T1' }` kept the
  dotted name as one path segment, so it slipped past the relation check and
  failed much later as an unknown field.
- ceb356b: Unify aggregate result types using native PostgreSQL/MySQL behavior. COUNT returns a safe integer number and rejects values above Number.MAX_SAFE_INTEGER. SUM/AVG of integer, BIGINT and DECIMAL fields return database-formatted strings; FLOAT/DOUBLE SUM/AVG return numbers. MIN/MAX preserve field result types. Do not strip trailing zeros. Preserve nulls, numeric filtering, ordering, grouping, aliases and relation aggregates.

  Remove PostgreSQL AVG input casts and accept native computation and rounding. SQL Server promotes integral SUM/AVG inputs to DECIMAL(38,0), retains native DECIMAL precision rules, and preserves exact outputs before driver conversion. SQLite retains exact aggregates for integral/decimal fields while floating fields use native aggregation. Prepare aggregate field information only on adapters that need it, once per execution; PostgreSQL/MySQL do not load collections for numeric adaptation. Broaden shared SUM/AVG TypeScript results to string | number | null.

- ceb356b: Make dialect integration tests own their disposable Docker Compose environments
  with random host ports and automatic cleanup.
- ceb356b: Add the `@nocobase/db/testing` subpath for dialect packages to exercise shared database internals without importing core source files directly.
- ceb356b: Normalize boolean field values at the Repository and Query API boundaries so
  direct boolean columns accept and return JavaScript booleans consistently
  across database drivers.
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
  - @nocobase/repository-input@0.1.0-beta.1

## 1.0.0-beta.4

### Patch Changes

- 0a3fa83: Compile constraint removal according to the stored constraint type so unique, primary, check, and foreign-key constraints use the correct dialect operation.

## 1.0.0-beta.3

### Major Changes

- 90a4903: Replace the accidental flat export surface with a single Agent-oriented root API. Internal Knex, collection composition, migration history and locking, and seed history and locking implementations are no longer package exports. The root entry includes the reusable `CollectionOperation` plan type accepted by `CollectionBuilder.apply()`. The public package entry is protected by a value-and-type API baseline, and published builds now contain source output only.
- 90a4903: Remove arbitrary Collection `tableName` and Field `columnName` mappings while retaining Connection- and Collection-level `underscored` and `tablePrefix` naming options. Table Collection renames now update the physical table and metadata together, reject dependencies that cannot be updated atomically, and reject View or Materialized View renames until kind-specific DDL is supported. Legacy physical-name mappings are validated before a connection starts. Query table sources now accept Connection-relative identifiers and automatically apply the Connection `tablePrefix`; complete physical table names must use the underlying connection client instead.
- 90a4903: Replace the legacy database connection `managed` flag with the explicit `schemaManagement` mode, and prevent external-schema connections from executing Builder DDL or migrations while retaining query access and dry-run compilation. Remove unused Collection `writable`, Field `interface` and `uiSchema` properties, and implicit virtual-field metadata creation.

### Minor Changes

- 90a4903: Return a lazy, awaitable and asynchronously iterable query from Repository findMany. Repeated promise consumption shares one execution; mixing consumption modes or repeating iteration raises QUERY_ALREADY_CONSUMED.
- 90a4903: Integrate Collection Builder with resolved Collections and supplemental Metadata documents, invalidate Collection Registry entries after physical Schema changes, and reject non-atomic renames or read-only Metadata writes before DDL.
- 90a4903: Add read-only module and persistent database Collection Metadata document Store backends with content revisions, atomic compare-and-swap, stable pagination, and self-contained internal table initialization.
- 90a4903: Add the revisioned Collection Metadata document Store contract, an in-memory compare-and-swap backend, stable Store errors, paginated summaries, and a read-only legacy transition adapter.
- 90a4903: Add CollectionMetadataService for validated compare-and-swap collection, field, and relation updates with deterministic patch semantics and post-commit Registry invalidation.
- 90a4903: Finalize the Collection Metadata architecture by making the V1 supplemental document Store the only `CollectionMetadataStore` contract, using persistent database Metadata by default for managed connections, requiring an explicit Store for external connections, and removing the legacy full-Collection Store and Builder Metadata-only APIs.
- 90a4903: Add the versioned Collection Metadata V1 document contract, strict runtime validation, TypeScript definition helper, structured validation issues, and legacy Collection definition extraction diagnostics.
- 90a4903: Isolate Collection Metadata and Registry changes inside database transactions, publish targeted invalidations after commit, discard them after rollback, and invalidate Collection caches after Migration batches.
- 90a4903: Add the Collection Registry, Naming Index, lazy resolved Collection reads, lightweight listing and explicit scanning, cache invalidation, cross-Collection relation validation, and DatabaseConnection collections and collectionMetadata entry points.
- 90a4903: Define the Collection Resolver input, result, warning, naming context, and stable aggregate error contracts, and support the complete set of inspected referential actions.
- 90a4903: Implement the pure Collection Resolver with deterministic logical naming, physical Schema mapping, supplemental Metadata merging, inspection warnings, and aggregate local drift validation.
- 90a4903: Add `database.createMigrator()` and `database.createSeeder()` convenience methods that bind migration and seed runners to a Database Manager.
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

- 90a4903: Add `connection.collections.getPhysical(name)` to inspect the physical database schema backing a logical Collection name.
- 90a4903: Add `migrator.upTo(name)` to run pending migrations through an inclusive target without rolling back later applied migrations.
- 90a4903: Add Microsoft SQL Server support through Knex and the `tedious` driver, including connection configuration, Collection Builder and Query behavior, Schema Inspector introspection, real Docker integration tests, generated-application driver installation, and template runtime packaging.
- 90a4903: Add Oracle Database support through the `oracledb` Thin driver, including connection configuration, Collection Builder and Query behavior, Schema Inspector introspection, real Docker integration tests, generated-application driver installation, and template runtime packaging.
- 90a4903: Add portable Repository AST and mutation input builders shared by browser and server clients. Support synchronous builder callbacks and complete JSON options helpers for all nine remote Repository actions, including nested selections, relation mutations, and numeric updates. Preserve relation create client keys through an explicit JSON envelope and reject unserializable builder inputs before sending requests.
- 90a4903: Add Repository V1 public contracts and persisted Collection optimistic-lock metadata.
- 90a4903: Add transactional Repository relation mutations, nested creates, capability discovery, validation, and optimistic-lock integration.
- 90a4903: Add Collection-aware Repository relation selection, filtering, sorting, and batched result assembly.
- 90a4903: Add Collection-aware scalar Repository CRUD, filtering, selection, sorting, and optimistic locking.
- 90a4903: Remove the public Repository stream method and StreamOptions type. Consume findMany queries with await or for-await using the same filters, projections, relations, combine, sorting, distinct and pagination semantics. Relation and backward queries use a private disk buffer before batched relation loading; scalar forward queries retain driver streaming. Reject consumption after transaction completion and snapshot plain input data when consumption begins.

### Patch Changes

- 90a4903: Add the logical char field type and explicit-length Collection Builder shortcut, preserve CHAR inspection and UUID compatibility, and support strict string mutations, filtering, selection, sorting, pagination, and returning without trimming native padding.
- 90a4903: Add bounded string enum fields, Collection Builder declarations, member metadata persistence and additive evolution safeguards, strict Repository values and stored-data validation, and exact equality filters across five databases. Explicitly reject unsupported enum identity, join-key, ordering, grouping, and value aggregate operations.
- 90a4903: Persist declared scalar field types in metadata, add temporal and floating-point Builder helpers, and define explicit temporal schema mappings. Validate final metadata for combined field alterations and preserve schema management permission checks before metadata writes.
- 90a4903: Support enum fields as Repository groupBy keys with exact member identity across database collations, nullable groups and stored-value validation. Preserve existing enum ordering restrictions. Replace per-status aggregate queries in the Repository example with a single enum groupBy request.
- 90a4903: Make database integration test commands explicit for SQLite, PostgreSQL, MySQL, Oracle, and SQL Server, and wait for Docker services to become healthy before testing.
- 90a4903: Fix Oracle default-only repository inserts with returning fields and read ordinary view definitions directly from the catalog to reduce schema inspection overhead.
- 90a4903: Preserve configured API and realtime endpoints after splitting the client services. Integrate file inventory and the plugin-owned inbox with the shared API and realtime clients, including reconnection refresh and isolated event listeners.

  Allow the Oracle driver install script in both templates’ standalone deployment workspace settings.

  Resolve SQLite auto-incrementing bigint metadata correctly, narrow Oracle LOB values before reading their type, preserve legacy file timestamps, and rebuild the AI registry against the current API client.

- 90a4903: Recognize inspected MySQL FLOAT columns as numeric fields, restoring Repository numeric Filter support for those columns.
- 90a4903: Validate malformed Repository Sort ASTs before inspecting their nodes or requiring a nonempty sort. Invalid structures now return INVALID_SORT instead of silently falling back to default ordering or raising native TypeErrors.
- 90a4903: Validate relation Select result and combine branch structures before execution. Reject malformed projections with structured diagnostics instead of accepting unintended record selections or throwing native type errors.
- 90a4903: Align Repository relation keys, locking, aliases, numeric versions, and logical unique constraints across SQLite, PostgreSQL, MySQL, Oracle, and MSSQL.
- 90a4903: Validate Repository Filter callback results, groups, nodes, field paths and relation quantifiers before traversal. Malformed inputs now return structured Filter diagnostics before executing queries or mutations, instead of throwing native errors or treating unknown relation quantifiers as existence checks.
- 90a4903: Recognize physical FLOAT columns as numeric fields so Repository numeric filters work for SQLite decimal, float and double columns emitted by Knex. Preserve the existing MSSQL FLOAT-to-double mapping.
- 90a4903: Return structured diagnostics for invalid relation Filter callback results and non-string variable paths before executing mutations.
- 90a4903: Validate malformed Repository Select structures before traversing them, returning structured Select diagnostics instead of native type errors and rejecting invalid projections before writes.
- 90a4903: Wait for Repository streams to close before completing iterator cleanup, preventing delayed connection release after database pool teardown.
- 90a4903: Expose physical string length units, numeric widths, character collations, and SQLite declaration capabilities. Distinguish fixed-length character columns and preserve their physical category through Collection resolution. Keep Oracle NUMBER columns decimal and distinguish SQL Server floating-point precision.
- 90a4903: Enforce strict boolean Repository inputs and consistent boolean results across database drivers, including variables, filters, unique selectors, cursors, returning, relations, grouping, and streaming. Report invalid stored representations instead of silently coercing them. Reject non-portable boolean value aggregates before issuing database queries; boolean counting remains supported.
- 90a4903: Distinguish instant-bearing physical columns from local date-times during schema inspection, retain PostgreSQL offset times as native types, and expose fractional-second precision separately from numeric precision and column length.
- 90a4903: Validate and normalize temporal Repository values, filters, cursors, and projections using explicit local-date-time and UTC-instant semantics. Add five-database temporal regression coverage, precision guards, safe Oracle temporal batch inserts, and updated usage documentation. Oracle floating-point Builder fields now use binary floating-point storage rather than decimal NUMBER aliases.
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/repository-input@0.1.0-beta.0

## 1.0.0-beta.2

### Major Changes

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

The versions below were published as `@nocobase/app-database`, the name this package carried until it was renamed to
`@nocobase/db`. They are kept because they describe this same codebase; the `@nocobase/app-database` releases they
name are not, and never will be, versions of `@nocobase/db`.

## 0.0.1-beta.1

### Patch Changes

- Updated dependencies [ce4eab8]
  - @nocobase/service-provider@0.0.2-beta.0

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
