# Database migrations, seeds, and repositories

Use this reference when a plugin changes database structure, requires initial records, queries application data, or exposes a Collection through the Repository API.

For a complete authenticated exposure, typed host-client access, Builder/AST queries, CRUD, relation writes, and an HTTP test, read [Repository examples](repository-examples.md).

| Change                                                            | Mechanism                                    |
| ----------------------------------------------------------------- | -------------------------------------------- |
| Table, field, relation, index, constraint, or Collection metadata | Migration                                    |
| Stable records required for the plugin to function                | Seed                                         |
| Unit or integration sample data                                   | Test fixture or factory                      |
| User-created runtime data                                         | Service, Route, Job, or Repository operation |

Migrations establish structure before Seeds insert required records. A Seed never creates schema, and a Provider never substitutes for a Migration.

## Declare resource locations

```ts
import path from 'node:path';

export default defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-audit-log',
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});
```

Locations must begin with `./` and resolve below the absolute `baseDir`. In source, this declaration resolves the TypeScript directories below the package root; from `dist/server/plugin.js`, it resolves compiled JavaScript below `dist`. The runtime does not fall back between those copies. A missing directory or a scaffold file ending in `.ts.example` contributes no executable task.

The target App must explicitly register the plugin's Server definition and run its own migration or seed command.

## Write immutable, self-contained migrations

Before editing an existing Migration, run `git log -- <file>` and determine whether the feature branch that introduced it has merged into its target. It may be corrected only before that merge. Once merged, the file is immutable; every fix or later schema change requires a new Migration. Never hard-code an old checksum, overwrite history, or weaken checksum validation to make an edited file appear compatible.

A Migration is a fixed historical operation. Spell out every Collection, field, relation, index, constraint, and metadata operation it performs. Do not import or iterate over live Collection schemas, model definitions, field registries, or runtime registration lists, because later edits to those definitions would silently change historical behavior and checksums.

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609180001_create_audit_logs',

  async up({ builder }) {
    await builder.createCollection('auditLogs', (collection) => {
      collection.increments('id');
      collection.string('action', { length: 255, nullable: false });
      collection.datetime('createdAt', { nullable: false });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('auditLogs');
  },
});

export default migration;
```

Use explicit alter, field, index, constraint, and metadata operations for an existing Collection. Reverse `up()` in a safe dependency order in `down()`. If a change is genuinely irreversible, make that limitation visible in the implementation, test, and change description.

The filename and exported `name` should match and remain globally stable. Task sources from all packages are merged and ordered by name; `packageName` records provenance but does not participate in ordering, identity, or checksum, so names must be unique across all participating sources.

### Test a Migration against a real database

Every Migration needs a migration-level test that runs `up()` through the real Migrator and, when reversible, `down()`. Verify both logical metadata and the physical schema: Collection and field definitions, table and column names, types, nullability, relations, foreign keys, indexes, and constraints relevant to the change. An import test or `validateMigrations()` proves only shape and discovery, not DDL correctness.

For the `auditLogs` migration above, place this in the plugin's `tests/database.test.ts`. The plugin must provide its usual test dependencies, including the SQLite adapter. This fixture points at the plugin's own migration directory and assumes the example migration is part of the fresh batch:

```ts
// @vitest-environment node
import path from 'node:path';
import { createDatabaseManager } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import { expect, it } from 'vitest';

it('creates logical and physical audit schema and rolls it back', async () => {
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  try {
    const migrator = database.createMigrator({
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
      packageName: '@nocobase/app-plugin-audit-log',
    });
    await migrator.latest();
    const collections = database.connection().collections;
    expect((await collections.get('auditLogs'))?.fields).toContainEqual(
      expect.objectContaining({ name: 'action', type: 'string' }),
    );
    expect(
      (await collections.getPhysical('auditLogs'))?.columns,
    ).toContainEqual(
      expect.objectContaining({ columnName: 'action', nullable: false }),
    );

    await migrator.rollback();
    expect(await collections.get('auditLogs')).toBeUndefined();
    expect(await collections.getPhysical('auditLogs')).toBeUndefined();
  } finally {
    await database.destroy();
  }
});
```

The maintained Repository migration test (`packages/examples/app-plugin-repository-example/tests/database.test.ts`) additionally verifies relation metadata, physical foreign keys, indexes, optimistic-lock fields, and reverse deletion order.

Run the dialect integration suites selected by `packages/libs/db-testkit/docs/integration-testing.md` when the change affects shared `packages/libs/db*` behavior. A normal plugin-specific Migration usually needs its real test database and target App upgrade path rather than every dialect locally.

## Write deterministic Seeds

A Seed is appropriate only when the plugin cannot operate without stable initial records, such as a required system rule or default configuration. Demonstration rows, per-test fixtures, and data users naturally create at runtime do not belong in a published Seed.

```ts
import { defineSeed, type SeedDefinition } from '@nocobase/db';

const seed: SeedDefinition = defineSeed({
  name: '202609180002_seed_audit_settings',

  async run({ query }) {
    await query
      .insertInto('auditSettings')
      .values({ key: 'retentionDays', value: '30' })
      .execute();
  },
});

export default seed;
```

Use fixed identities and reproducible values. Avoid current time, random values, and external services unless they are part of the explicit product contract. The Seeder records successful task history and normally skips an already executed Seed. Also define what a deliberate replay or restored database should do when records already exist: reject, skip by a unique key, or update only fields the plugin owns. Never silently overwrite user edits.

Test first execution after prerequisite Migrations, the exact records created, existing-data behavior, deliberate replay behavior, transactional failure, and the application behavior that depends on the records. A failed Seed must not leave a successful history entry or misleading partial data.

## Preserve checksums across compiled output

TypeScript migration and Seed history uses the SHA-256 checksum of source text. A database-capable plugin build must run `nocobase-db-manifests` after TypeScript compilation and after any JavaScript rewriting. The generator seals each compiled task with a marker and writes `.manifest.json` beside tasks in every compiled migrations and seeds directory. Each entry records `sourceChecksum` and `artifactChecksum`; the loader verifies the artifact before import and uses the source checksum for history, so source TypeScript and compiled JavaScript share one task identity.

Keep generated manifests and marked JavaScript in the published `dist`. Clean stale compiled output when a task is renamed or removed. A missing, malformed, unsupported, incomplete, or mismatched manifest fails loading; marked JavaScript never falls back to TypeScript. Do not hand-edit manifests or task markers.

Legacy unmarked JavaScript keeps its raw content checksum. When a verified compiled artifact exactly matches legacy recorded output, the runner can convert that old checksum to the source checksum under the task lock and in a transaction without rerunning the task. If exact reproduction is impossible, restore the original release and build provenance; do not copy arbitrary old hashes or mutate task history.

## Query data inside Server code

Resolve `databaseManagerToken` from the container. Choose the layer deliberately:

```ts
const database = container.resolve(databaseManagerToken);
const auditLogs = database.repository<AuditLog>('auditLogs');
const rows = await auditLogs.findMany({ limit: 20 });
```

`database.repository(collection, connection?)` uses logical Collection and field metadata. `database.query(connection?)` is the lower-level query adapter and does not apply Collection metadata or Collection table-prefix resolution. `database.connection(name?)` provides connection-only facilities such as physical schema inspection. Do not copy obsolete `db.repository()` or string configuration examples without checking the current `DatabaseManager` API.

## Expose a Repository over HTTP

`defineRepositoryApiRoutes()` exposes only named Repository actions. It does not install authentication or authorization. Every exposure requires a server-owned policy, and omitted policy nodes deny that operation.

```ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  type AppApiRouteContribution,
  type RepositoryApiActions,
  type RepositoryApiExposure,
} from '@nocobase/app-server/router';
import { buildRepositoryPolicy } from '@nocobase/db';
import { Hono } from 'hono';

const actions: RepositoryApiActions = {
  findMany: { maxLimit: 100 },
  findOne: {},
  count: {},
  createOne: {},
  updateOne: {},
};

const repositories: readonly RepositoryApiExposure[] = [
  {
    name: 'auditLogs',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) => create.scope(true).fields('id', 'action'))
        .update((update) => update.scope(true).fields('action')),
    ),
    actions,
  },
];

const repositoryRoutes = defineRepositoryApiRoutes({ repositories });

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async (app) => {
    const router = new Hono();
    const authentication = app.container.resolve(authenticationToken);
    for (const { name, actions: exposedActions } of repositories) {
      for (const action of Object.keys(exposedActions)) {
        router.use(`/${name}/${action}`, authentication.required());
      }
    }
    router.route('/', await repositoryRoutes.createRouter(app));
    return router;
  });
```

Each action is served at `POST /api/{name}/{action}`. The exposure name is a camelCase path segment, `/^[a-z][a-zA-Z0-9]*$/`, checked when the routes are declared; name it after its Collection, never after a plugin namespace, whose first path segment it would share. The `actions` map is an endpoint allowlist. A request cannot supply its own `policy` or `scope`; such options are rejected. Use a policy function plus `principal(context)` when scopes depend on the authenticated caller; an unresolved principal fails with `403`. Field and relation operations must be explicitly allowed. `findMany.maxLimit` bounds one response. Add `aggregate`, `groupBy`, `exists`, or delete operations only when the API needs them.

Client code calls `api.repository('auditLogs')`, which sends `POST /api/auditLogs/{action}` through the App API Client. Builder callbacks are converted to JSON AST before transmission. They are not executable server callbacks, and browser code never connects directly to the database.

Test anonymous access to every exposed action, caller-dependent policy, allowed and forbidden fields and relations, maximum limits, errors, and at least one real database read/write through HTTP. Verify unrelated Repository names and actions remain unavailable and middleware does not affect later routes.

For maintained details, see database task checksum contract (`packages/libs/db/CHECKSUMS.md`), DatabaseManager (`packages/libs/db/src/database/manager.ts`), Repository Route implementation (`packages/app/app-server/src/router/repository-routes.ts`), and the runnable Repository plugin (`packages/examples/app-plugin-repository-example`).
