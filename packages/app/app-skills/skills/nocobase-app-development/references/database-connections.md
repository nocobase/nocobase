# Database connections and dialects

Use this page to switch the application's database or add a connection: the dialect packages and their fields, what `server/config/database.ts` and `config.yml` each own, and the installation and typing problems that follow. For schema changes read [migrations and seeds](migrations.md); for runtime queries read [database and data access](database-and-data.md).

What a connection means once code touches it — `schemaManagement` as a schema-ownership boundary rather than read-only credentials, and what `database/<connectionName>/collections/` and `metadata/` hold — is in `.agents/skills/nocobase-db/SKILL.md` sections 1 and 6.

## Creating and configuring an application

Use `pnpm create @nocobase/app <directory> --json` for non-interactive creation. Creation does not choose a database: it scaffolds the project, installs dependencies unless `--no-install` is supplied, and returns the remaining procedure in `result.nextCommands`. Run those commands in order.

Configuration uses three commands of the application, each with `--json`:

```bash
pnpm nocobase config init --dialect postgres --json      # write config.yml
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm --json
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD --json
pnpm nocobase config check --json                        # verify, database connection included
```

`config init` writes `database.connections.main` and generated `auth.secret` and `session.secret` into `config.yml`, built from `config.example.yml` so its comments survive. Supported dialects are `sqlite`, `postgres`, `mysql`, `mssql`, `oracle`, `dameng`, `kingbase`, and `oceanbase`. For anything but SQLite its JSON `result` lists `requiredSettings` — the connection settings still at a placeholder — and `nextCommands`. On an application that is already configured it reports `status: "success-noop"` and exits 0, and it fails with `error.code` `ALREADY_CONFIGURED` only when `--dialect` asks for a different database than the one configured.

`config init` installs nothing. Which dialects an application can run on is decided by the driver packages it depends on, so a dialect whose driver is absent fails with `error.code` `DRIVER_MISSING`, and `error.suggestions[0].run` holds the `pnpm add` pinned to the range the runtime accepts; nothing is written. Run that command, then run `config init` again. Templates depend on `@nocobase/db-sqlite`, so SQLite needs no install; another dialect needs its driver added, and `pnpm remove @nocobase/db-sqlite` if nothing else uses SQLite.

`config set` sets `key=value` assignments in the file the application reads, keeping comments. It refuses a section the application does not know, with the nearest known name, and reports a key an environment variable overrides. Pass a password with `--from-env` and the name of a variable the user has set; never put a secret on the command line or in the conversation. Lists, such as notification channels, are edited in the file itself.

`config check` exits non-zero with `error.code` `CONFIG_INVALID` and a finding per problem in `error.details.findings` — a missing driver, a missing or placeholder secret, a failed connection — each with `key` and, where there is one, a `fix` command to run; a passing check lists its warnings in `result.findings`. It also warns about a section nothing reads, a `${NAME}` that is used as literal text, and a session secret that is regenerated at every start. Treat a passing check as the confirmation that the application can start; do not treat successful scaffolding or `config init` as verified connectivity.

Applications default to `verifyDepsBeforeRun: false` in `pnpm-workspace.yaml`; run `pnpm install` explicitly after changing dependencies or when creation used `--no-install`, before configuring, starting or building. If installation fails, retry `pnpm install` in the generated directory rather than recreating it. Keep `config.yml` gitignored and do not expose its secrets in output.

`pnpm dev` refuses to run until the application has a configuration source — a file, or `AUTH_SECRET` in the environment — and `pnpm start` exits at once without `auth.secret`. `pnpm build` needs neither, because building reads no secret.

## Configuration responsibilities

Start by reading `server/config/database.ts` and the connection structure in `config.example.yml`. The template's default connection is `main` on SQLite. Preserve other connections and driver registrations when changing one connection.

| Location                    | Responsibility                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `server/config/database.ts` | Declare connection defaults with `defineAppDatabaseConfig`; optionally register explicit drivers.                                     |
| `config.yml`                | Override connection settings for the environment, including credentials. This file is gitignored.                                     |
| `config.example.yml`        | Document the supported connection structure and credential placeholders for future installations. Keep it aligned with code defaults. |

The callback passed to `defineAppDatabaseConfig` receives the runtime context and runs during configuration resolution, not at module import. When supplied, explicit drivers determine the accepted dialects and connection fields in TypeScript. Without registrations, use a driver-owned connection type with `satisfies` when strict dialect-specific checking is needed. YAML overrides are resolved at runtime; passing `pnpm typecheck` does not validate their contents or prove connectivity.

`config.yml` deep-merges into code defaults. Changing a dialect in code does not remove an old YAML override or fields belonging to the previous dialect. Update both layers when switching, and check any existing environment overrides using the Configuration section of `README.MD` in the application root.

Official drivers are optional peers of `@nocobase/app-server`. Install the needed package in application `dependencies` and configure its dialect; no driver import or registration is required. The application runtime awaits `resolveDatabaseConfig()` after configuration and defaults are merged, before provider registration. It imports only configured dialects and does not open connections. The core manager stays synchronous and requires prepared or explicitly registered drivers. YAML cannot install packages. Explicit `drivers` and connection-level `databaseDriver` values retain precedence and conflict checking. Custom dialects require explicit registration; registration keys must match their driver's dialect.

### SQLite paths

TypeScript connections require `filename`, normally `runtime.paths.storage('database.sqlite')`. YAML also accepts `database: database.sqlite`: the SQLite driver resolves it under the application's storage directory. Absolute paths remain absolute, and `:memory:` is preserved.

The YAML `database` alias takes precedence over `filename` during normalization. If changing `filename` appears to have no effect, check for an existing `database` override. Use `filename` in typed code; the YAML alias is not part of `SqliteConnectionConfig`.

## Switch the default connection to PostgreSQL

Install the dialect package if it is not already a dependency:

```bash
pnpm add @nocobase/db-postgres
```

Installed driver packages belong in `dependencies` so they reach the deployed server. The dialect package includes its underlying driver dependency.

Configure the target in `config.yml` as shown below. Changing `server/config/database.ts` is optional; when updating the source defaults for an application with only `main`, use:

```ts
import { defineAppDatabaseConfig } from '@nocobase/app-server/database';

export default defineAppDatabaseConfig(() => ({
  default: 'main',
  connections: {
    main: {
      dialect: 'postgres',
      schemaManagement: 'managed',
      debug: false,
    },
  },
}));
```

Preserve other connections and any explicit custom driver registrations. Remove `filename` from the connection being switched.

Update `config.yml` to match the new dialect and target:

```yaml
database:
  default: main
  connections:
    main:
      dialect: postgres
      host: db.internal
      database: crm
      username: crm_app
      password: ${CRM_DB_PASSWORD}
```

Supply `CRM_DB_PASSWORD` through the application's environment. Update `config.example.yml` with the same connection structure and placeholders, without copying real credentials.

Changing the connection target does not migrate existing data. For PostgreSQL and other server databases, provision the target database and any required schema first; application migrations create their tables. SQLite can create its database file when opened. Existing data stays in the old target, and an existing new target retains its data until an explicit operation changes it.

Keep `default: 'main'` when changing where `main` connects. Changing `database.default` to another connection name also moves the application's system database selection: plugin migrations, seeds and default runtime reads and writes follow that connection.

## Add managed or external connections

Reuse an installed driver for additional connections of the same dialect. Install a new official driver only when needed; explicit registration is optional. Keep the existing default connection unless the task includes moving the system database.

This example keeps the default SQLite connection and adds two PostgreSQL connections:

```ts
import { defineAppDatabaseConfig } from '@nocobase/app-server/database';

export default defineAppDatabaseConfig((runtime) => ({
  default: 'main',
  connections: {
    main: {
      dialect: 'sqlite',
      filename: runtime.paths.storage('database.sqlite'),
      schemaManagement: 'managed',
    },
    analytics: {
      dialect: 'postgres',
      schemaManagement: 'managed',
      migrations: { autoRun: false },
      seeds: { autoRun: false },
    },
    externalCrm: {
      dialect: 'postgres',
      schemaManagement: 'external',
    },
  },
}));
```

Configure each new target and its credentials under `database.connections.analytics` or `database.connections.externalCrm` in YAML, using the same structure as the PostgreSQL example above. Document those connection names and placeholders in `config.example.yml`.

| Connection purpose | Schema and task behavior                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `managed`          | The application owns schema changes. Put application migrations and seeds under `database/<connectionName>/migrations/` and `seeds/` when needed.                                                                          |
| `external`         | Another system owns the schema. Startup skips migrations and seeds for this connection; explicitly running those tasks against it is an error. Runtime reads and writes remain possible according to database permissions. |

Connection names used by database tasks contain only letters, digits, underscores or hyphens. Directories do not register connections, and connections without application-owned migrations or seeds need no empty directories.

The default connection runs migrations and seeds at startup unless disabled. Other connections default to `autoRun: false`; enable each task explicitly when startup should run it. Plugin sources are added only to the default connection. See [task ordering and source selection](migrations.md#multiple-connections).

At the application layer, an external connection without a configured metadata store reads `database/<connectionName>/metadata/<name>.json` by default: one hand-written metadata document per Collection, committed. A connection-level `metadataStore` or shared `database.metadataStore` can provide another source; a directory string names a directory in the same layout, resolves relative to the application root, and may not be a generated `collections/` directory. Account for the target's naming conventions and collection metadata when verifying runtime access.

Use one managed connection per physical database/schema. The application rejects identical configured managed targets before running tasks; hostname aliases, symlinks and driver routing can hide a shared target. Different history table names do not isolate schema ownership. External connections are excluded from this duplicate-ownership check.

## Dialect fields and defaults

The fields below are TypeScript connection fields. Defaults describe the application driver's normalization, not database server provisioning. Supply the intended target and credentials explicitly in environment configuration.

| Dialect     | Package                  | Underlying driver | Default port | Target fields and notable defaults                                                      |
| ----------- | ------------------------ | ----------------- | ------------ | --------------------------------------------------------------------------------------- |
| `sqlite`    | `@nocobase/db-sqlite`    | `better-sqlite3`  | —            | Required `filename`; YAML also accepts `database` as described above.                   |
| `postgres`  | `@nocobase/db-postgres`  | `pg`              | 5432         | `database`; username `postgres`, schema `['public']`, `ssl: false`.                     |
| `mysql`     | `@nocobase/db-mysql`     | `mysql2`          | 3306         | `database`; username `root`, charset `utf8mb4`.                                         |
| `oracle`    | `@nocobase/db-oracle`    | `oracledb`        | 1521         | Required `serviceName` in typed code; runtime fallback `FREEPDB1`, username `nocobase`. |
| `mssql`     | `@nocobase/db-mssql`     | `tedious`         | 1433         | `database`; username `sa`, `encrypt: false`, `trustServerCertificate: false`.           |
| `kingbase`  | `@nocobase/db-kingbase`  | `pg`              | 54321        | `database`; username `nocobase`, schema `['public']`.                                   |
| `oceanbase` | `@nocobase/db-oceanbase` | `mysql2`          | 2881         | `database`; username `root`, charset `utf8mb4`.                                         |
| `dameng`    | `@nocobase/db-dameng`    | `dmdb`            | 5236         | `schema`; username `SYSDBA`; `connectString` can replace host and port.                 |

MariaDB uses the `mysql` dialect. MySQL and OceanBase accept `socketPath` instead of `host` and `port`; remove old host/port overrides when switching to a socket. Concrete connection types are exported by their owning `@nocobase/db-<dialect>` packages.

## Verify the changed connection

Run `pnpm typecheck` for the typed defaults, then verify the specific connection at runtime:

| Change                        | Runtime verification                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default managed connection    | Run `pnpm nocobase db apply` when applying pending migrations and seeds is intended. It targets `database.default`.                                                                                                     |
| Additional managed connection | Run `pnpm nocobase db apply --connection analytics` when applying that connection's pending tasks is intended. A successful default-connection run does not verify it.                                                  |
| External connection           | Perform a bounded read from an existing collection using `database.query('externalCrm')` in an application service or test. Verify the expected target, naming and metadata. Do not run migrations or seeds against it. |

Migration commands execute schema changes and write migration history; they are not read-only connection probes. Manual execution ignores `autoRun`. For connectivity-only verification of a managed connection, use a bounded read of an existing collection instead. See [database and data access](database-and-data.md) for resolving the manager, and the `nocobase-db` Skill for the query API itself.

Start the application with `pnpm dev` and exercise the feature that uses the changed connection. Startup alone does not prove an external or unused connection works, and may apply migrations and seeds to managed connections with `autoRun` enabled. Check that the expected target was used and that other connections still work.

When adding a driver dependency, also run `pnpm build` to verify deployment packaging. See [testing and verification](testing.md) for the application's remaining checks.

## Troubleshooting and type details

### Missing driver package

An official dialect without its package reports the connection name and an installation command such as `pnpm add @nocobase/db-postgres`. Install it in `dependencies`; no source registration is needed. Unknown dialects require an explicit custom driver. Errors inside an installed package retain their original cause and must not be treated as missing-driver errors.

### Driver loading outside the application runtime

Import `resolveDatabaseConfig` from `@nocobase/app-server/database` and await it before synchronous database preparation or manager creation. The built-in standalone migration/seed runner and collection artifact generator already do this. Configured dialects load during preparation, including connections not used immediately; unconfigured dialects are not imported. Ordinary `tsx` development and Vitest configuration work without synchronous ESM loader overrides.

### Installation and platform binaries

Generated applications already include `allowBuilds` decisions for `better-sqlite3` and `oracledb` in `pnpm-workspace.yaml`. Switching among the documented dialects does not normally require changing that file. For older applications, check the existing entries; pnpm 11 reads build permissions from this workspace file.

The generated workspace uses `strictDepBuilds: false`, so an undecided install script can produce a warning instead of failing installation. If a required binary is missing, inspect the driver's build permission and any `ignore-scripts` setting. After correcting the cause, rebuild the affected package, for example `pnpm rebuild better-sqlite3`.

Native dependencies must match the deployment platform and supported Node ABI. They may remain installed after switching away from SQLite, or arrive through other application dependencies. Use `pnpm build --target linux-x64` when appropriate; see the deployment reference in the application root's `README.MD` for supported targets.

### Inference and declaration generation

With explicit `drivers`, no manual connection union, `typeof drivers` annotation, `satisfies` clause or factory type annotation is needed with `defineAppDatabaseConfig`. Selecting a dialect selects its fields: SQLite requires `filename`, PostgreSQL accepts `host` and `port`, and SQLite's `filename` on a PostgreSQL connection is a type error. Application metadata paths, migration settings and seed settings remain available on every connection.

With multiple connections, TypeScript may omit suggestions inside an empty `dialect: ''` value. Enter the dialect name to receive its field suggestions; unregistered dialects and invalid fields are still rejected by type checking.

Application server builds retain declaration emission with `isolatedDeclarations: false`, allowing direct default exports of configuration factory calls. The helper returns the common `AppConfigFactory<AppDatabaseConfig>` contract; its result does not expose the inferred concrete driver types. Library packages retain isolated declaration checking. `AppDatabaseConfigFromDrivers` remains available for explicit annotations outside the helper.

Application templates declare `@nocobase/db-sqlite`, the driver for the dialect their `server/config/database.ts` defaults to, and `create-app` adds no other. Any further driver an application's configuration needs — for its main connection or an additional one — has to be installed into its `dependencies` before building, because a deployment installs only what the application declares.
