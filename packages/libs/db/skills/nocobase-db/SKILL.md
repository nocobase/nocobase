---
name: nocobase-db
description: 'Work with the database in a NocoBase 3 application: configure connections and dialects, add migrations and seeds, declare schema with the Collection Builder, read and write records with Repository or QueryAdapter, run transactions, and read Collection definitions. Use for any task under database/ or any server code that touches data. Do not use for the NocoBase 2 @nocobase/database package.'
metadata:
  short-description: Configure, migrate and query the database in a NocoBase 3 application
---

# The database in a NocoBase 3 application

Most mistakes here are made before the first line of code, by putting a task at the wrong layer: changing schema from runtime code, reading records through the schema builder, or reimplementing relation writes on top of raw queries.

Six areas, in the order an application grows into them:

| Area                                            | Owns                                                         |
| ----------------------------------------------- | ------------------------------------------------------------ |
| [Configuration](#1-configuration)               | which databases exist, and which dialect each one speaks     |
| [Migrations and seeds](#2-migrations-and-seeds) | schema history and install data                              |
| [Builder](#3-builder)                           | how a migration declares tables, fields and constraints      |
| [Repository and Query](#4-repository-and-query) | runtime reads and writes                                     |
| [Transactions](#5-transactions)                 | making several writes succeed or fail together               |
| [Collections](#6-collections)                   | what the database actually resolves to, for code and for you |

The exact parameters and return types are always the TypeScript declarations in `@nocobase/db`. This Skill decides which API to reach for, where the code belongs, and the boundaries the types cannot express.

## Where the code lives

```text
server/config/database.ts          connections and the default connection
config.yml                         per-environment overrides and credentials (gitignored)
database/<connection>/migrations   schema history for that connection
database/<connection>/seeds        install data for that connection
database/<connection>/collections  resolved Collection artifacts
server/routes/, server/providers   runtime reads and writes
```

`<connection>` is a connection name from `server/config/database.ts`, so the default connection's migrations are in `database/main/migrations/`. Adding a connection means adding its directory alongside and keeping `database/tsconfig.json` in place, so migrations and seeds are typechecked and linted as server source.

Runtime code never changes schema, and a migration never imports runtime code. That split is what these directories encode.

## 1. Configuration

Connections are declared in code and overridden per environment:

| Location                    | Responsibility                                                        |
| --------------------------- | --------------------------------------------------------------------- |
| `server/config/database.ts` | Connection defaults through `defineAppDatabaseConfig`                 |
| `config.yml`                | Environment overrides including credentials — gitignored              |
| `config.example.yml`        | The documented structure and credential placeholders; keep it in step |

```ts
import {
  connectionEnvironment,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';

export default defineAppDatabaseConfig(
  ({ paths }) => ({
    default: 'main',
    connections: {
      main: {
        dialect: 'sqlite',
        filename: paths.storage('database.sqlite'),
        schemaManagement: 'managed',
        debug: false,
      },
    },
  }),
  { env: connectionEnvironment('main') },
);
```

The second argument maps environment variables onto the section: `connectionEnvironment('main')` declares `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL` and `DB_FILENAME` for the main connection, each overriding `config.yml`. Only `main` has them; a connection you add declares its own with a prefix naming it, `connectionEnvironment('analytics', 'DB_ANALYTICS')`, merged into the same `env`.

The dialects are `sqlite`, `postgres`, `mysql`, `mssql`, `oracle`, `dameng`, `kingbase` and `oceanbase`. Each is an optional peer of `@nocobase/app-server` shipped as its own package: install `@nocobase/db-<dialect>` into `dependencies` — so it reaches the deployed server — and configure the dialect. No import or driver registration is needed, and the dialect package brings its own underlying driver.

Switching a dialect means changing **both** layers. `config.yml` deep-merges into the code defaults, so editing only the code leaves a stale YAML override in place — with fields belonging to the previous dialect still applied. Remove `filename` from a connection switched away from SQLite. In YAML, `database:` is an alias for `filename` and takes precedence over it, which is the usual reason a changed `filename` appears to do nothing.

`schemaManagement` decides who owns the schema. A connection the application owns is `'managed'` and has migrations; a database owned by another system is `'external'`, which rejects builder DDL and migrations while still allowing record reads and writes, subject to the database account's own permissions. `pnpm nocobase db apply --all` reports external connections as skipped, and targeting one explicitly is an error.

Passing `pnpm typecheck` validates neither the YAML contents nor connectivity. Only starting the application against the target proves either.

The mechanics belong to the application rather than to this package: how `pnpm nocobase config init` configures one, the per-dialect connection fields and defaults, driver installation and native binaries, and the typing of `defineAppDatabaseConfig` are in `.agents/skills/nocobase-app-development/references/database-connections.md`.

Keep `@nocobase/db` itself in `dependencies`, not `devDependencies`: the deployed server resolves it at runtime, and TypeScript reads that declaration to infer the database configuration.

## 2. Migrations and seeds

A migration creates structure. A seed inserts the records the application needs in order to run. Neither does the other's job. Sample or demonstration content is not install data: declare it as a sample seed, described below, never as a plain seed.

```ts
// database/main/migrations/202609020001_create_orders.ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609020001_create_orders',

  async up({ builder }) {
    await builder.createCollection('orders', (collection) => {
      collection.increments('id');
      collection.string('orderNo', { length: 64, nullable: false });
      collection.string('status', { length: 32, nullable: false });
      collection.datetime('createdAt', { nullable: false });
      collection.unique('orderNo');
      collection.index('status');
    });
  },

  async down({ builder }) {
    await builder.dropCollection('orders');
  },
});

export default migration;
```

```ts
// database/main/seeds/202609030002_default_order_statuses.ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202609030002_default_order_statuses',

  async run({ repository }) {
    await repository('orderStatuses').upsertOne({
      filter: { code: 'draft' },
      create: { code: 'draft', title: 'Draft' },
      update: { title: 'Draft' },
    });
  },
});
```

Apply both with `pnpm nocobase db apply`, adding `--connection <name>` for a non-default connection or `--all` for every managed one.

Each context carries its own tools, and which one to use is not a free choice — see [Repository and Query](#4-repository-and-query). In short: a migration works through `builder` and `query`, and a seed writes through `repository`.

The rules are absolute, because these files are history that has already run on other machines:

- **Self-contained.** Spell out every table, field, index, constraint and metadata operation in the file. Never import a Collection definition, model, registry or shared constant that keeps evolving — that silently changes both the behavior and the checksum of something already applied.
- **Immutable once merged.** Check with `git log -- <file>` if unsure. Before the branch is merged you may correct the file in place; after it, every change is a new, later file. Never hard-code a previous checksum to make an edited migration look untouched. Correcting it in place changes nothing on its own — it is recorded as executed, so a plain apply skips it and the database keeps the schema the old file produced. `pnpm nocobase db redo` rolls the latest batch back and applies it again.
- **The file name body matches `name`**, and the name is unique across every source in the application.
- **Declare `irreversible: true`** when there is no real reverse operation, instead of writing a `down()` that quietly does nothing.
- **A seed is idempotent**, keyed on a stable business value backed by a unique constraint, so a repeated run is a no-op — `upsertOne` is the direct way to express that. A seed context has no `builder` at all, and a seed has no rollback or truncate behavior.

A backfill belongs in the migration that makes it necessary, using `query` from the same context — not in a seed.

Sample data goes in the same `seeds` directory, declared with `defineSeed({ name, sample: true, run })`. It runs only when the application installs its database with `app.sampleData` set (`APP_SAMPLE_DATA=true`): the connection held no migration or seed history before that start, or `db reset` rebuilt it. Otherwise the seed is recorded as skipped and never runs on its own; `pnpm nocobase db sample` runs every skipped sample seed in development, and a deployment refuses it. Sample data that has to go through other plugins' services, such as projects with issues, is registered instead on `sampleDataToken` from `@nocobase/app-server/sample-data`, from a service provider's `boot()`: `container.resolve(sampleDataToken).register({ name, packageName, run })`. It runs once the application is ready, under the same condition, and is recorded in the default connection's seed history as `sample-data:<name>`. The seed history's `status` column, `executed` or `skipped`, records which happened; the library adds it to an existing history table on the next run.

Both run inside a transaction by default. `transaction: false` opts out, and a failure then leaves partial work behind with no history record, so take it only when the operation genuinely cannot run in one.

A task's `connection` is not the runtime connection either. It carries `dialect`, `capabilities` and `client()` — enough to branch on the database, and deliberately not a way back to the manager. Anything conditional on the dialect reads it from there.

## 3. Builder

`builder` is the schema API, and a migration is where it belongs. Runtime code has `db.builder()` available and should not use it: schema that changes outside the migration history is schema nothing can reproduce.

`createCollection(name, callback)` takes a callback, not a field array:

```ts
await builder.createCollection('orderItems', (collection) => {
  collection.increments('id');
  collection.integer('orderId', { nullable: false });
  collection.integer('quantity', { nullable: false, defaultValue: 1 });
  collection.foreignKey('orderId', {
    references: { collection: 'orders', fields: ['id'] },
    name: 'fk_order_items_order',
  });
  collection.index(['orderId', 'quantity']);
});
```

Field builders are `increments`, `integer`, `bigInt`, `string`, `char`, `text`, `boolean`, `decimal`, `float`, `double`, `date`, `time`, `datetime`, `datetimeTz`, `json`, `blob`, `uuid`, and `native` for a dialect-specific type. Options include `nullable`, `length`, `defaultValue`, `precision` and `scale`; the equivalent chained form (`.notNull()`, `.defaultTo()`, `.unique()`) is also available — pick one style and keep the file consistent.

Relations are `belongsTo`, `hasOne`, `hasMany` and `belongsToMany`. Constraints and indexes are `primary`, `unique`, `foreignKey` and `index`, each taking one field name or an array.

Change an existing table with explicit alter, rename and drop operations in a safe dependency order. Do not drop and recreate — that destroys data and is not what `down()` should undo.

Builder arguments are **logical names**. Physical table and column names are generated deterministically from `underscored` and `tablePrefix`; never store or concatenate `tableName` and `columnName` yourself. The exception is a raw index or constraint name such as `fk_order_items_order`, which is passed through unconverted and must be spelled the same way when dropped.

`db.builder()` is a method on the manager; `connection.builder` is a property. Getting that backwards is the most common typo in this area.

## 4. Repository and Query

Two layers over the same tables. The choice is not stylistic, and two questions settle almost every case.

**Where does the code run?** Runtime code under `server/` reaches both through the manager. A migration and a seed reach both through their own context — as `context.repository(name)`, a method on the context rather than on the minimal task `connection` — but with opposite defaults, and those defaults are the rule rather than a hint:

| Context   | Tools                            | Default for data |
| --------- | -------------------------------- | ---------------- |
| Migration | `builder`, `query`, `repository` | `query`          |
| Seed      | `repository`, `query`            | `repository`     |

A migration changes structure, so `builder` and `query` are its tools and `repository` is reserved for the writes `query` would get wrong: cross-dialect field encoding and decoding, Collection-level naming overrides, and relation writes including the junction rows behind a `belongsToMany`. **Anything `query` expresses correctly stays on `query`.** A seed changes no structure and writes installation data in Collection terms, so `repository` is its normal tool and `query` covers what that cannot express, such as reading a physical table backing no Collection.

This does not loosen the self-contained rule. `repository(name)` resolves the Collection from the database itself — the metadata a previous `builder` operation wrote — which is why it is available at all; importing or iterating the application's own collection definitions from a migration stays forbidden. But a migration using it is betting on a shape it did not declare in its own body, so three constraints follow:

- Say in a comment why `query` was not enough. Nothing static can check this, and the comment is what separates a considered use from a reflex.
- Do not use it in `down`. By the time a rollback runs, the Collection has moved past what `up` left behind, possibly several migrations past.
- Do not use it to walk a table. Selecting every row and updating each one through a Repository is the shape to avoid; a set-based `query` statement is both correct and bounded.

Both tasks take their Repository from the connection the task runs on, which inside a transaction is that transaction's connection, so a failed task discards its writes. That is also why `context.container` is not the application container. Its type is `ServiceResolver`, but at runtime it is a frozen allow list holding one token — `idGeneratorToken` from `@nocobase/app-server/id-generator`, for a task that has to generate an identifier. Every other `resolve` throws, `databaseManagerToken` included: a service taken from there would hold the application's connection rather than the task's, and inside a transaction would write outside it and survive a failure that should have discarded it.

**Is the unit of work a Collection's records, or a result set?** Records of one Collection and the things related to them are Repository's job. A shape that is not any Collection's records — a report joining unrelated tables, a set aggregated then paginated — is Query's.

| The task needs                                       | Use        |
| ---------------------------------------------------- | ---------- |
| Reading a relation, or a nested create/update/delete | Repository |
| Optimistic locking through a `version` field         | Repository |
| A row scope or write allow list (`withPolicy`)       | Repository |
| Cursor pagination over a stable sort                 | Repository |
| Collection-level naming overrides to be honored      | Repository |
| Dialect-correct JSON and temporal encoding on write  | Repository |
| A join between tables with no relation between them  | Query      |
| A subquery, or conditions composed programmatically  | Query      |
| Paging or limiting a grouped result                  | Query      |

The costly mistake is rebuilding a relation read as a hand-written join because the join is familiar. That loses the naming mapping, the relation metadata and the write path that goes with it, and it has to be maintained against a schema the Collection definition already describes. If the records belong to a Collection, start from Repository and only drop to Query for the part Repository genuinely cannot express.

They mix freely inside one transaction — take both from the callback `connection`, as the example in [Transactions](#5-transactions) does.

**Repository** is Collection-aware: it resolves fields and relations from the Collection definition, so relation reads and nested writes are expressed as data instead of assembled by hand.

```ts
import { databaseManagerToken } from '@nocobase/db';

const db = app.container.resolve(databaseManagerToken);
const projects = db.repository('projects');

const project = await projects.findOne({
  filter: { id },
  select: (select) =>
    select
      .fields('id', 'name')
      .include('owner', (owner) => owner.fields('name')),
});

const result = await projects.createOne({
  values: {
    name: 'Apollo',
    owner: (owner) => owner.connect({ id: ownerId }),
  },
  select: (select) => select.fields('id', 'name'),
});
```

Resolve the manager once — in a route factory, or as a constructor dependency of a service — not inside every handler. `db.repository()`, `db.query()`, `db.builder()`, `db.collections()` and `db.transaction()` take the connection name as their last argument and use the default connection when it is omitted, so single-connection code never names one.

`filter`, `values`, `select` and `sort` each accept a builder callback or the equivalent serializable JSON AST, and mean the same thing either way. They do not accept a shorthand string array such as `['id', 'name']` or `['-createdAt']`. Field names are Collection logical names, never column names. A write returns a result object — the record is `result.record`, alongside `result.version` and the created relation targets — rather than the record itself. `findMany` is awaited for an array or iterated asynchronously to consume a large result incrementally.

The methods are `findOne`, `findMany`, `count`, `exists`, `aggregate`, `groupBy`, `createOne`, `createMany`, `updateOne`, `updateMany`, `upsertOne`, `deleteOne` and `deleteMany`; `describeMutation` and `validateMutation` report capabilities and pre-validate input, and `withPolicy` returns a scoped Repository.

Boundaries that are easy to get wrong:

- `findOne` takes the first match; `updateOne` and `deleteOne` require exactly one; `upsertOne` requires a unique equality condition.
- `updateMany` and `deleteMany` refuse an empty scope. Pass `all: true` only when the task explicitly calls for every row — never to make an error go away.
- `createMany` and `updateMany` do not accept nested relation writes. `createOne` accepts `create` and `connect` on a relation, not the full set.
- `disconnect` detaches; `delete` removes the target record. A relation target update or delete stays inside the current parent record's scope.
- Repository does not apply the application's permissions. A route handler decides what the caller may see and change _before_ anything reaches `filter`, `values` or `select`. `writePolicy` defaults to `true` for an internal Repository and `false` for one reached from an API route, so a route-facing Repository needs an explicit allow list.
- Do not assume an `id` exists, and do not infer a field's type, primary key or auto-increment from its name.

**Query** knows tables and columns, not Collections: it does not read Collection metadata, does not honor Collection-level naming overrides, applies no policy or optimistic locking, and performs no relation-aware CRUD.

```ts
const rows = await db
  .query()
  .selectFrom('orders')
  .select(['id', 'orderNo', 'createdAt'])
  .where('status', '=', 'paid')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .execute();
```

Terminating methods are `execute()`, `executeTakeFirst()` and `executeTakeFirstOrThrow()`, plus the shorthands `value(column)`, `pluck(column)` and `exists()`.

Conditions are three-argument — `where(lhs, operator, rhs)` — or a callback taking the expression builder for anything composite. There is no two-argument `where(field, value)`, and none of Knex's `orWhere()`, `whereIn()`, `whereNull()`, `orOn()` or `orOnRef()` exist here. Values are parameterized; never build SQL by string concatenation.

`updateTable` and `deleteFrom` refuse to run without a `where`. Affecting every row requires an explicit `allowAllRows()`, because an omitted `where` is unrecoverable in production.

Write the same camelCase names the migration declared. A `createdAt` field lives in a `created_at` column and is converted in both directions, so rows come back with `createdAt` keys.

## 5. Transactions

```ts
await db.transaction(async (connection) => {
  await connection.repository('orders').createOne({ values: order });
  await connection.query
    .updateTable('inventory')
    .set({ reserved: true })
    .where('sku', '=', order.sku)
    .execute();
});
```

Use only the `connection` the callback hands you. Calling the outer `db.query()`, `db.builder()`, `db.repository()` or `db.connection()` inside the callback runs outside the transaction and will not roll back with it — the same applies to metadata work, which must go through the transaction connection's `collectionMetadata` and `collections`.

Returning commits; throwing rolls back. Swallowing an error inside the callback and continuing commits the partial work.

A Repository nested write opens its own transaction when none is active and joins an existing one when there already is, without a savepoint per write. Several independent calls that must roll back together need an explicit transaction around them.

Work that must happen only if the writes are kept — a realtime message, a cache delete, a job dispatch — goes in `connection.afterCommit(callback)`, never directly inside the callback, where it would still run when a later step rolls the transaction back:

```ts
await db.transaction(async (connection) => {
  await connection.repository('orders').createOne({ values: order });
  connection.afterCommit(() => ordersTopic.publish({ orderNo: order.orderNo }));
});
```

It runs after the outermost commit, in registration order, and `transaction()` resolves once every callback has finished, so keep it quick and hand slow work to a job. Inside a nested `transaction()` it waits for the outer commit and is dropped if that savepoint rolls back. Outside a transaction it starts at once, so a service can call it whether or not its caller opened one. A callback that throws does not undo the commit: the error goes to the connection's `onTransactionCallbackError`, or becomes a `TRANSACTION_CALLBACK_FAILED` warning whose `cause` is the error. The transaction connection is finished when the callback runs; write through `db` or a new transaction. `connection.afterRollback((error) => …)` is the counterpart for logging and cleanup after a rollback. Migration and seed contexts do not offer either.

### Observing Repository writes

`afterCommit` needs every write site to remember to register. When code must react to any change of some Collections — wherever it was made, including rows a nested relation write touched — subscribe once with `connection.onRepositoryMutation()` instead:

```ts
const off = db.connection().onRepositoryMutation(
  { id: 'task-board', collections: ['tasks'] },
  {
    afterCommit: async (events) => {
      for (const event of events) {
        if (event.granularity !== 'rows') continue;
        for (const change of event.changes)
          if (change.collection === 'tasks') boardTopic.publish(change.key);
      }
    },
  },
);
```

Every Repository write method emits one event per call whose `changes` list each row written (`created`, `updated` or `deleted`, its key and the fields written), nested targets, foreign keys and through rows included; `collections` matches the root Collection or any of them. `afterCommit(events, connection)` runs once per outermost commit with that transaction's matching events and the root connection, and its errors go to the connection's `onRepositoryEventError`. `inTransaction(event, connection)` runs inside the call's transaction before it ends: throwing fails the call and rolls it back. Writes made through the `connection` either listener receives emit events carrying `parentOperationId`, nested at most `repositoryEventMaxDepth` (default 8) deep before `REPOSITORY_EVENT_RECURSION`, so a listener that writes what it observes stops instead of looping; write through that connection rather than `db.connection()`. Subscriptions belong to the root connection and are shared by its transactions; call the returned function to unsubscribe.

A bulk `updateMany` or `deleteMany` observed by a subscription that wants keys locks the matching rows and writes them by key; declare `keys: false` when knowing that the table changed is enough (cache invalidation), which keeps the single statement and delivers a `count` event. Always check `event.granularity` before reading `changes`. `connection.explainRepositoryEvents({ collection, operation })` shows which strategy a call will use. Pass caller information with `meta` built by a `defineRepositoryEventMeta<T>(namespace)` handle and read it with `handle.read(event)`; ask for written values with `values: true` only when needed, since they may include secrets.

Events cover Repository writes only: not `query`, `client()`, `upsertPhysicalRow()`, database cascades, or anything a migration or seed writes. They are delivered in the writing process only and lost if it crashes before delivery, so durable consumers write an outbox row in `inTransaction` instead.

## 6. Collections

A Collection is what the database resolves to once physical schema and metadata are combined. There are two ways to reach it, and they answer different questions.

**`pnpm nocobase collections generate` writes it to disk, for you to read.** It reads every Collection of a connection and writes `collection.json`, `metadata.json` and `schema.json` per Collection under `database/<connection>/collections/<name>/`, plus one `_manifest.json` for the connection. The `db` commands and `pnpm dev` run it for you whenever migrations change a connection's schema; run it yourself after editing an external connection's metadata. Read the artifact before writing a query — it is the reliable way to learn the real field names, types, nullability, keys and relations instead of guessing them from a migration you have not read. `--connection <name>` and `--all` select connections; `--check` writes nothing and exits non-zero when the files are stale.

Those files are a cache for every connection, external ones included: gitignored, safe to delete, and never read at runtime. Never edit them — change the migration, or the metadata, and regenerate.

What is written by hand sits beside the cache, in its own directory:

| Directory                            | Written by             | Holds                                                                                                                                      |
| ------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `database/<connection>/migrations/`  | People                 | The authority on a `managed` connection's schema                                                                                           |
| `database/<connection>/metadata/`    | People                 | One `<name>.json` metadata document per Collection: the default metadata source of an `external` connection, committed and read at startup |
| `database/<connection>/collections/` | `collections generate` | The cache described above                                                                                                                  |

So an external connection's titles, descriptions and relations are edited in `metadata/<name>.json`, and deleting that directory removes the metadata the application runs on; deleting `collections/` costs nothing but a regeneration.

**`db.collections()` reads it at runtime**, for code that has to adapt to the schema rather than assume it:

```ts
const collections = db.collections();
const orders = await collections.get('orders');
```

Beyond `get(name)` there are `getPhysical(name)` for the physical schema behind a logical name, `list()` and `scan()` to enumerate, `refresh()` and `invalidate()` around cache lifetime, and `validateRelations()`. For read-only inspection of real tables, columns, indexes and constraints by physical identity, use `connection.schemaInspector`; to read or update titles, descriptions and relation metadata, use `connection.collectionMetadata`.

Ordinary feature code does not need any of this. Reading a Collection at runtime is for generic behavior — an exporter, an admin screen, a validator — not for a handler that already knows which fields it wants.

## What each API names

| API                                     | Names                              |
| --------------------------------------- | ---------------------------------- |
| `db.connection(name)`                   | a connection configuration name    |
| Builder collection, field, relation API | logical names                      |
| `query` table and column arguments      | connection-level query identifiers |
| `collections.get()` / `getPhysical()`   | Collection logical names           |
| `schemaInspector`                       | physical schema and table identity |
| `collectionMetadata`                    | Collection and field logical names |

Branch on `connection.dialect` (for example `'postgres'`) to detect the database; read `connection.driver` only for genuinely driver-specific code. `connection.client()` returns the underlying Knex instance and bypasses the schema guard, so it is the last resort and never a way around `'external'` — check `connection.capabilities` first.

## API shapes that do not exist

| Do not write                   | Write instead                       |
| ------------------------------ | ----------------------------------- |
| `db.builder`                   | `db.builder()`                      |
| `connection.builder()`         | `connection.builder`                |
| `db.query`                     | `db.query()`                        |
| `connection.query()`           | `connection.query`                  |
| `db.repository()` with no name | `db.repository('orders')`           |
| `connection.metadataStore`     | `connection.collectionMetadata`     |
| `connection.client`            | `await connection.client()`         |
| `connection.driver === 'pg'`   | `connection.dialect === 'postgres'` |

Do not generate `findUnique`, `findFirst`, `connectOrCreate`, `countDistinct`, `distinctOn`, native array fields, or a root-level `relations` argument. They are not part of this package, whatever a Prisma-shaped intuition or an old design proposal suggests.

## Verify

| Change              | Minimum verification                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| Configuration       | The application starts against the target and `pnpm nocobase db apply` succeeds |
| Migration           | `up` plus physical schema and metadata assertions; `down` when reversible       |
| Seed                | First run, repeat run, and a failed run leaving no history                      |
| Repository or query | A test against a real database, not only a mock                                 |
| Transaction         | Both commit and rollback                                                        |

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

`pnpm nocobase db apply` against a disposable database is what proves a migration runs; asserting the builder's return value is not. `pnpm nocobase db redo` reruns the latest batch through its own `down()` and `up()`, which is what a correction to an unmerged migration needs. `pnpm nocobase db reset --force` drops the managed schema and reruns everything from empty without calling any `down()` — only for a database that is genuinely disposable. Regenerate collection artifacts afterwards, or `pnpm nocobase collections generate --check` will fail.

Cover the empty result, the partial match and the absent relation, not only the happy path. Passing on SQLite does not verify PostgreSQL, MySQL, Oracle or SQL Server; report an unverified dialect rather than implying the behavior is uniform.

When reporting the work, say which layer you chose and why, which tests you added, which commands you actually ran, which dialects you actually exercised, and what you did not verify.
