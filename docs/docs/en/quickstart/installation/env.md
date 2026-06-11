# Application configuration and `.env`

This page only applies to applications created or hosted via the NocoBase CLI.

If you have just finished reading [Installation using CLI (recommended)](./cli.md) and have seen the "Installation Directory" section, then the most common problems you will encounter are usually the following:

- Where is the `.env` file placed?
- Which configurations are still suitable to be written into `.env`
- Which configurations are now more suitable to be handed over to `nb env update`

Let’s talk about the conclusion first:

- For CLI installed applications, `.env` is placed in `<app-path>/.env` by default
- This file is optional, not every env must be created manually
- Basic configurations such as `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH`, and `DB_*` are managed by `nb env update` by default.
- `.env` is mainly used to supplement runtime variables that the CLI has not directly taken over, such as storage, cache, logs, observations and some plug-in extension variables.

## Find `app-path` first

In [Install using CLI (recommended)](./cli.md#Installation directory), the default directory structure of CLI env is as follows:

```text
<app-path>/
├── source/
├── storage/
└── .env
```

If you are not sure where the currently applied `app-path` is, you can check directly:

```bash
nb env info app1 --field app.appPath
```

Just replace `app1` with your env name.

That is, for an application created or hosted via the CLI, the most appropriate location for the `.env` file is:

```text
<app-path>/.env
```

Generally speaking, there is no need to put it in `source/.env`, and there is no need to find `.env` in the root directory of the Docker Compose project according to the old installation method.

## When do you need to create `.env` yourself?

`.env` is optional.

If you just want to run the application first, or just modify basic configurations such as ports, time zones, database connections, and public access paths, then in many cases there is no need to manually create `.env`.

Only add them to `<app-path>/.env` if you need to add some runtime variables that the CLI has not directly taken over.

## Default is to use `nb env update` first

In the new CLI installation method, it is recommended that the basic application configuration be given priority to [`nb env update`](../../api/cli/env/update.md) by default.

This has two benefits:

- The configuration and env itself are saved in the same CLI mind, making it easier to check and modify
- In the future, you, scripts and AI agents can continue to use the same set of commands for maintenance, so it is not easy to have the situation of "one set of changes is made in the file, but another set is recorded in the CLI"

### These configurations are now more suitable to be handed over to `nb env update`

For the following items, you may have been used to writing them directly into `.env` in the past. However, in CLI installation mode, it is recommended to use `nb env update` by default:

| I want to change... | How to change the default |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Database type and connection parameters, such as `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| PostgreSQL schema, table prefix, underscore naming such database supplementary items, such as `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

For example, if you want to change the application port and time zone, you can write directly like this:

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

If you want to change the database connection parameters, you can write like this:

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

After making the changes, the CLI will usually prompt you to execute `nb app restart` later. For a more complete parameter description, just see [`nb env update`](../../api/cli/env/update.md).

## Which situations are more suitable to be written into `.env`

If a variable does not yet have a corresponding CLI parameter, or it is more like an extended configuration "passed directly to the application runtime", then just continue to write `<app-path>/.env`.

Usually include these categories:

- File storage and object storage configurations, such as `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Cache and Redis configuration, such as `CACHE_*`, `REDIS_URL`
- Log and observation configurations, such as `LOGGER_*`, `TELEMETRY_*`
- Certain plug-in or extension-specific variables, such as export, asynchronous tasks, workflow, and AI extension-related variables

for example:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

This type of variable is essentially an application runtime configuration, and the CLI currently will not take over it item by item. It is most natural to place it in `.env`.

## How to divide the work between `.env` and `nb env update`

If you're not sure where a certain configuration should go, just follow this rule by default:

- If `nb env update` already has a corresponding parameter, it will be used first by default.
- If there is no corresponding parameter, or it obviously belongs to runtime extension configuration such as plug-ins, storage, cache, and logs, put it in `<app-path>/.env`

In most scenarios, this division of labor is sufficient.

### A common misunderstanding

Do not maintain two copies of the same configuration at the same time.

For example, if you have saved basic items such as `APP_PORT`, `TZ`, `APP_PUBLIC_PATH`, and `DB_HOST` with `nb env update`, you usually don’t need to write them again in `.env`. Otherwise, when troubleshooting problems later, it will be easy to not tell which layer is the value you really want to take effect.

## A minimal `.env` example

If your basic configuration has been saved through the CLI, then `.env` probably only needs to retain a few extension variables, such as:

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

This is also the mentality that this page most wants to help you build:

`.env` is still useful, but in the new CLI installation method, it is more about supplementing the runtime extension configuration rather than continuing to assume all basic installation parameters.

## Where to look next

- If you have not confirmed the application directory structure, first go back to [Install using CLI (recommended)](./cli.md#Installation directory)
- If you want to modify basic configurations such as ports, time zones, database connections, and public access paths, continue to see [`nb env update`](../../api/cli/env/update.md)
- If you want to start, restart or view application logs, continue to see [Manage Application](../operations/manage-app.md)
