---
title: "NocoBase CLI"
description: "NocoBase CLI (nb command) complete command reference: initialization, installation, environment management, build & run, plugin management, scaffolding, and API operations."
keywords: "NocoBase CLI,nb,command line,command reference,installation,environment management,plugin management,API"
---

# NocoBase CLI

NocoBase CLI (`nb`) is a command-line tool for initializing, connecting to, and managing NocoBase applications in a local workspace. It helps you set up NocoBase applications, save CLI env configurations, and provides everyday management commands such as start, stop, view logs, upgrade, and clean up, enabling AI Agents to connect and use NocoBase.

The CLI supports two common initialization approaches:

- Connect to an existing NocoBase application for AI Agent to use directly.
- Install a new NocoBase application via Docker, npm, or Git, and save it as a CLI env.

## Installation

```bash
npm install -g @nocobase/cli@beta
```

All commands support `nb <command> --help` to view the full parameter description. For a detailed installation guide, see [Quick Start](../../ai/quick-start.md).

## Core Concepts

| Concept        | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| **Workspace**  | The current project directory where the CLI saves `.nocobase` config |
| **Env**        | A saved NocoBase connection configuration, the env name in `nb init` |
| **Source**     | The source of a local application, supports `docker`, `npm`, and `git` |
| **Remote env** | An env that only saves API connection info for an existing NocoBase application |

## Common Scenarios

### Install a New NocoBase Application

Use a browser form for interactive initialization:

```bash
nb init --ui
```

Install with Docker (non-interactive):

```bash
nb init --env app1 --yes --source docker --version alpha
```

Install with npm:

```bash
nb init --env app1 --yes --source npm --version alpha --app-port 13080
```

Install from Git source:

```bash
nb init --env app1 --yes --source git --version alpha
```

### Connect to an Existing NocoBase Application

```bash
nb env add app1 --base-url http://localhost:13000/api
```

`nb env add` will automatically enter the authentication flow when needed.

### Start, Stop, and View Logs

```bash
nb start --env app1     # Start the application or Docker container
nb stop --env app1      # Stop the application or Docker container
nb logs --env app1      # View application logs
nb ps                   # View the running status of all envs
```

### Upgrade

```bash
nb upgrade --env app1          # Update source/image and restart
nb upgrade --env app1 -s       # Skip code update, restart only
```

### Database Management

```bash
nb db ps                       # View database running status
nb db start --env app1         # Start the built-in database
nb db stop --env app1          # Stop the built-in database
nb db logs --env app1          # View database logs
```

### Clean Up

```bash
nb down --env app1                    # Stop and remove containers (keep data and config)
nb down --env app1 --remove-data      # Also delete storage and database data
nb down --env app1 --remove-source    # Also delete source directory
nb down --env app1 --remove-env       # Also delete CLI env config
```

### Environment Management

```bash
nb env                         # View current env
nb env list                    # List all envs
nb env use app1                # Switch current env
nb env auth app1               # Re-authenticate
nb env update app1             # Update runtime command metadata
```

### API Calls

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 -j    # Output raw JSON
```

## Configuration Files

NocoBase CLI configuration is stored in the `.nocobase/` directory, with two scopes:

- **project** — `.nocobase/` in the current working directory
- **global** — `~/.nocobase/` (can be overridden with the `NOCOBASE_CTL_HOME` environment variable)

If `.nocobase/` exists in the current directory, the project scope is used by default; otherwise, the global scope is used.

Structure of the configuration file `.nocobase/config.json`:

```json
{
  "currentEnv": "local",
  "envs": {
    "local": {
      "baseUrl": "http://localhost:13000/api",
      "auth": { "type": "token", "accessToken": "..." },
      "appRootPath": "./nocobase",
      "appPort": "13000",
      "dbDialect": "postgres"
    }
  }
}
```

Runtime cache is stored in `.nocobase/versions/<hash>/commands.json`, automatically generated and updated by `nb env update`.


## Command Reference

Below is the complete parameter description for all commands.

## nb init

Initialize the working directory. After running, it will guide you through Skills installation, NocoBase installation, or environment configuration step by step.

```bash
nb init
```

| Parameter     | Type    | Default   | Description                                                                           |
| ------------- | ------- | --------- | ------------------------------------------------------------------------------------- |
| `--yes`, `-y` | boolean | `false`   | Skip all prompts and use default configuration (auto-install Skills, fresh NocoBase install) |
| `--env`, `-e` | string  |           | Environment name, required in non-interactive mode                                     |
| `--source`    | string  |           | Source: `docker`, `npm`, `git`                                                         |
| `--version`   | string  |           | Version: dist-tag, image tag, or branch                                                |
| `--ui`        | boolean | `false`   | Open a browser visual wizard, cannot be used with `--yes`                              |
| `--ui-host`   | string  | `0.0.0.0` | Bind address for `--ui` mode, requires `--ui`                                          |
| `--ui-port`   | integer | `0`       | Port for `--ui` mode, `0` means auto-assigned by the system, requires `--ui`           |
| `--locale`    | string  |           | UI language for `--ui` mode, currently supports `zh-CN` and `en-US`, requires `--ui`   |

`nb init` internally executes the following steps in order:

1. Ask whether to install [NocoBase Skills](https://github.com/nocobase/skills) (installed by default)
2. Ask whether you already have a NocoBase application
   - If not: run `nb install` for a fresh installation
   - If yes: run `nb env add` to configure the existing environment

## nb install

Install a NocoBase application — including database initialization, storage directory creation, and admin account setup.

```bash
nb install -e local
```

| Parameter               | Type    | Default           | Description                                                    |
| ----------------------- | ------- | ----------------- | -------------------------------------------------------------- |
| `--env`, `-e`           | string  |                   | Environment name (required), storage directory defaults to `./storage/<name>` |
| `--yes`, `-y`           | boolean | `false`           | Skip interactive prompts                                       |
| `--lang`, `-l`          | string  | `en-US`           | Language during installation                                   |
| `--force`, `-f`         | boolean | `false`           | Force reinstallation (clears the database)                     |
| `--app-root-path`       | string  | `./nocobase`      | Application root directory                                     |
| `--app-port`            | string  | `13000`           | Application port                                               |
| `--storage-path`        | string  | `./storage/<env>` | Storage directory                                              |
| `--root-username`, `-u` | string  |                   | Admin username                                                 |
| `--root-email`, `-m`    | string  |                   | Admin email                                                    |
| `--root-password`, `-p` | string  |                   | Admin password                                                 |
| `--root-nickname`, `-n` | string  |                   | Admin nickname                                                 |
| `--fetch-source`        | boolean | `false`           | Run `nb download` to fetch source before installation          |
| `--start-builtin-db`    | boolean | `false`           | Start built-in database before installation                    |
| `--db-dialect`          | string  | `postgres`        | Database type: `postgres`, `mysql`, `mariadb`, `kingbase`      |
| `--db-host`             | string  |                   | Database host                                                  |
| `--db-port`             | string  |                   | Database port                                                  |
| `--db-database`         | string  |                   | Database name                                                  |
| `--db-user`             | string  |                   | Database user                                                  |
| `--db-password`         | string  |                   | Database password                                              |

After installation, the application is automatically started in daemon mode (`nb start -e <env> -d`), and the environment information is written to `.nocobase/config.json`.

## nb download

Download NocoBase source code or images, supporting npm, Docker, and Git methods.

```bash
nb download -s npm
```

| Parameter                  | Type    | Default                                    | Description                                                                     |
| -------------------------- | ------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `--source`, `-s`           | string  |                                            | Download method: `npm`, `docker`, `git`                                         |
| `--version`, `-v`          | string  | `latest`                                   | Version — npm: dist-tag or version number, docker: image tag, git: branch       |
| `--yes`, `-y`              | boolean | `false`                                    | Skip interactive prompts                                                        |
| `--replace`, `-r`          | boolean | `false`                                    | Delete existing target directory before re-downloading                          |
| `--output-dir`, `-o`       | string  | `./nocobase-<version>`                     | Output directory                                                                |
| `--dev-dependencies`, `-D` | boolean | `false`                                    | npm: whether to install devDependencies                                         |
| `--git-url`                | string  | `https://github.com/nocobase/nocobase.git` | git: remote repository URL                                                      |
| `--docker-registry`        | string  | `nocobase/nocobase`                        | docker: image name (without tag)                                                |
| `--docker-platform`        | string  |                                            | docker: platform, e.g. `linux/amd64`, `linux/arm64`                             |
| `--docker-save`            | boolean | `false`                                    | docker: whether to save the image as a `.tar` file                              |
| `--npm-registry`           | string  |                                            | npm / git: custom registry URL                                                  |
| `--build`                  | boolean | `true`                                     | npm / git: whether to run `nb build` after downloading                          |
| `--build-dts`              | boolean | `false`                                    | npm / git: whether to generate `.d.ts` declaration files during build           |

Git mode version aliases: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## nb env

View the current environment.

```bash
nb env
```

## nb env add

Add an environment configuration — specify the NocoBase API address and authentication method, and save it to `.nocobase/config.json`.

```bash
nb env add my-app
```

| Parameter              | Type    | Description                                                            |
| ---------------------- | ------- | ---------------------------------------------------------------------- |
| `[name]`               | string  | Environment name, optional in interactive mode                         |
| `--scope`, `-s`        | string  | Config storage scope: `project` (current directory) or `global`        |
| `--api-base-url`, `-u` | string  | API address, including the `/api` prefix, e.g. `http://localhost:13000/api` |
| `--auth-type`, `-a`    | string  | Authentication method: `token` or `oauth`                              |
| `--access-token`, `-t` | string  | API Key (used with `token` authentication)                             |
| `--verbose`            | boolean | Show verbose output                                                    |

In terminal interactive mode, missing parameters will be prompted for input. When choosing `oauth` authentication, `nb env auth` is automatically run to open the browser for login.

## nb env update

Refresh the runtime information of an environment — fetch the latest OpenAPI Schema from the NocoBase application and update the local cache.

```bash
nb env update my-app
```

| Parameter       | Type    | Description                                    |
| --------------- | ------- | ---------------------------------------------- |
| `[name]`        | string  | Environment name, uses current env if omitted  |
| `--scope`, `-s` | string  | Config storage scope: `project` or `global`    |
| `--base-url`    | string  | Override API address (persisted)                |
| `--token`, `-t` | string  | Override API Key (persisted)                    |
| `--role`        | string  | Role override (sent as `X-Role` request header) |
| `--verbose`     | boolean | Show verbose output                            |

After running, it regenerates the dynamic commands under `nb api` and caches them to `.nocobase/versions/<hash>/commands.json`.

## nb env list

List all configured environments.

```bash
nb env list
```

| Parameter       | Type   | Description                                 |
| --------------- | ------ | ------------------------------------------- |
| `--scope`, `-s` | string | Config storage scope: `project` or `global` |

The output table includes: current env marker (`*`), name, API address, authentication method, and runtime version.

## nb env remove

Remove an environment configuration.

```bash
nb env remove my-app
```

| Parameter       | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| `<name>`        | string  | Environment name (required)                 |
| `--force`, `-f` | boolean | Skip confirmation and delete directly       |
| `--scope`, `-s` | string  | Config storage scope: `project` or `global` |
| `--verbose`     | boolean | Show verbose output                         |

## nb env auth

Perform OAuth authentication for a specified environment — open the browser to complete login, automatically obtain and save the token.

```bash
nb env auth my-app
```

| Parameter       | Type   | Description                                 |
| --------------- | ------ | ------------------------------------------- |
| `<name>`        | string | Environment name (required)                 |
| `--scope`, `-s` | string | Config storage scope: `project` or `global` |

Internally uses the PKCE flow: start a local callback server → open browser for authorization → exchange token → save to config file. Timeout is 5 minutes.

## nb env use

Switch the current environment.

```bash
nb env use my-app
```

| Parameter       | Type   | Description                                 |
| --------------- | ------ | ------------------------------------------- |
| `<name>`        | string | Environment name (required)                 |
| `--scope`, `-s` | string | Config storage scope: `project` or `global` |

## nb build

Build the NocoBase application.

```bash
nb build
```

| Parameter       | Type     | Description                                                     |
| --------------- | -------- | --------------------------------------------------------------- |
| `[packages...]` | string[] | Specify package names to build, e.g. `@nocobase/acl`, builds all if omitted |
| `--cwd`, `-c`   | string   | Working directory                                               |
| `--no-dts`      | boolean  | Do not generate `.d.ts` declaration files                       |
| `--sourcemap`   | boolean  | Generate sourcemaps                                             |

## nb start

Start the NocoBase application or Docker container.

```bash
nb start
```

| Parameter           | Type    | Description                                 |
| ------------------- | ------- | ------------------------------------------- |
| `--env`, `-e`       | string  | Environment name, uses current env if omitted |
| `--scope`, `-s`     | string  | Config storage scope: `project` or `global` |
| `--port`, `-p`      | string  | Port, overrides the port in env config      |
| `--daemon`, `-d`    | boolean | Run in daemon mode                          |
| `--instances`, `-i` | integer | Number of running instances                 |
| `--launch-mode`     | string  | Launch method: `pm2` or `node`              |
| `--quickstart`      | boolean | Quick start                                 |

## nb stop

Stop the NocoBase application or Docker container.

```bash
nb stop
```

| Parameter       | Type   | Description                                 |
| --------------- | ------ | ------------------------------------------- |
| `--env`, `-e`   | string | Environment name, uses current env if omitted |
| `--scope`, `-s` | string | Config storage scope: `project` or `global` |

## nb logs

View application logs.

```bash
nb logs app1
```

| Parameter     | Type   | Description                                      |
| ------------- | ------ | ------------------------------------------------ |
| `[name]`      | string | Environment name, uses current env if omitted    |
| `--env`, `-e` | string | Environment name (alternative to positional arg) |

## nb ps

View environment running status.

```bash
nb ps
```

| Parameter     | Type   | Description                                      |
| ------------- | ------ | ------------------------------------------------ |
| `--env`, `-e` | string | Environment name, shows all envs if omitted      |

## nb down

Stop and remove local running containers. Data, source code, and env config are kept by default, and can be selectively deleted with parameters.

```bash
nb down app1
```

| Parameter         | Type    | Description                                           |
| ----------------- | ------- | ----------------------------------------------------- |
| `[name]`          | string  | Environment name                                      |
| `--env`, `-e`     | string  | Environment name (alternative to positional arg)      |
| `--remove-data`   | boolean | Delete storage and database data (requires confirmation) |
| `--remove-source` | boolean | Delete npm/Git source directory                       |
| `--remove-env`    | boolean | Delete CLI env config                                 |

## nb dev

Start development mode (with hot reload). Only supported for npm/Git source environments; for Docker environments, use `nb logs` to view logs.

```bash
nb dev
```

| Parameter         | Type    | Description         |
| ----------------- | ------- | ------------------- |
| `--env`, `-e`     | string  | Environment name    |
| `--port`, `-p`    | string  | Port                |
| `--db-sync`       | boolean | Sync database       |
| `--client`, `-c`  | boolean | Start client only   |
| `--server`, `-s`  | boolean | Start server only   |
| `--inspect`, `-i` | string  | Node.js debug port  |

## nb upgrade

Update source code or images and restart the NocoBase application.

```bash
nb upgrade
```

| Parameter                  | Type    | Description                      |
| -------------------------- | ------- | -------------------------------- |
| `--env`, `-e`              | string  | Environment name                 |
| `--skip-code-update`, `-s` | boolean | Skip code update, restart only   |

## nb pm list

List all installed plugins.

```bash
nb pm list
```

## nb pm enable

Enable one or more plugins.

```bash
nb pm enable @nocobase/plugin-sample
```

| Parameter       | Type     | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| `<packages...>` | string[] | Plugin package names (required), supports multiple, space-separated |

## nb pm disable

Disable one or more plugins.

```bash
nb pm disable @nocobase/plugin-sample
```

| Parameter       | Type     | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| `<packages...>` | string[] | Plugin package names (required), supports multiple, space-separated |

## nb scaffold plugin

Generate plugin scaffold code.

```bash
nb scaffold plugin @nocobase-example/plugin-hello
```

| Parameter                | Type    | Description                               |
| ------------------------ | ------- | ----------------------------------------- |
| `<pkg>`                  | string  | Plugin package name (required)            |
| `--force-recreate`, `-f` | boolean | Force recreate (overwrite existing files) |

## nb scaffold migration

Generate database migration script scaffold.

```bash
nb scaffold migration add-status-field --pkg @nocobase/plugin-sample
```

| Parameter | Type   | Description                                              |
| --------- | ------ | -------------------------------------------------------- |
| `<name>`  | string | Migration script name (required)                         |
| `--pkg`   | string | Plugin package name it belongs to (required)             |
| `--on`    | string | Execution timing: `beforeLoad`, `afterSync`, or `afterLoad` |

## nb api resource

Perform generic CRUD operations on any NocoBase data table. All `nb api resource` subcommands share the following global parameters:

| Parameter             | Type    | Description                                                  |
| --------------------- | ------- | ------------------------------------------------------------ |
| `--base-url`          | string  | NocoBase API address, e.g. `http://localhost:13000/api`      |
| `--env`, `-e`         | string  | Environment name                                             |
| `--token`, `-t`       | string  | API Key                                                      |
| `--role`              | string  | Role override (`X-Role` request header)                      |
| `--verbose`           | boolean | Show verbose output                                          |
| `--json-output`, `-j` | boolean | Output raw JSON (enabled by default)                         |

### nb api resource list

List resource records.

```bash
nb api resource list --resource users --page 1 --page-size 20
```

| Parameter       | Type     | Description                                                  |
| --------------- | -------- | ------------------------------------------------------------ |
| `--resource`    | string   | Resource name (required), e.g. `users`, `posts.comments`     |
| `--data-source` | string   | Data source, defaults to `main`                              |
| `--source-id`   | string   | Source record ID of the associated resource                   |
| `--filter`      | string   | Filter conditions, JSON format                               |
| `--fields`      | string[] | Query fields, can be specified multiple times                |
| `--appends`     | string[] | Append associated fields, can be specified multiple times    |
| `--except`      | string[] | Exclude fields, can be specified multiple times              |
| `--sort`        | string[] | Sort fields, e.g. `-createdAt` for descending, can be specified multiple times |
| `--page`        | integer  | Page number                                                  |
| `--page-size`   | integer  | Number of records per page                                   |
| `--paginate`    | boolean  | Whether to paginate                                          |

### nb api resource get

Get a single record.

```bash
nb api resource get --resource users --filter-by-tk 1
```

| Parameter        | Type     | Description                         |
| ---------------- | -------- | ----------------------------------- |
| `--resource`     | string   | Resource name (required)            |
| `--filter-by-tk` | string   | Filter by primary key               |
| `--data-source`  | string   | Data source                         |
| `--source-id`    | string   | Source record ID of the associated resource |
| `--fields`       | string[] | Query fields                        |
| `--appends`      | string[] | Append associated fields            |
| `--except`       | string[] | Exclude fields                      |

### nb api resource create

Create a record.

```bash
nb api resource create --resource users --values '{"username":"test","email":"test@example.com"}'
```

| Parameter       | Type     | Description                              |
| --------------- | -------- | ---------------------------------------- |
| `--resource`    | string   | Resource name (required)                 |
| `--values`      | string   | Record data, JSON format (required)      |
| `--data-source` | string   | Data source                              |
| `--source-id`   | string   | Source record ID of the associated resource |
| `--whitelist`   | string[] | Whitelist of fields allowed to write     |
| `--blacklist`   | string[] | Blacklist of fields forbidden to write   |

### nb api resource update

Update a record.

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"New Nickname"}'
```

| Parameter                     | Type     | Description                              |
| ----------------------------- | -------- | ---------------------------------------- |
| `--resource`                  | string   | Resource name (required)                 |
| `--values`                    | string   | Update data, JSON format (required)      |
| `--filter-by-tk`              | string   | Filter by primary key                    |
| `--filter`                    | string   | Filter conditions, JSON format           |
| `--data-source`               | string   | Data source                              |
| `--source-id`                 | string   | Source record ID of the associated resource |
| `--whitelist`                 | string[] | Whitelist of fields allowed to write     |
| `--blacklist`                 | string[] | Blacklist of fields forbidden to write   |
| `--update-association-values` | string[] | Also update associated data              |
| `--force-update`              | boolean  | Force update                             |

### nb api resource destroy

Delete a record.

```bash
nb api resource destroy --resource users --filter-by-tk 1
```

| Parameter        | Type   | Description                         |
| ---------------- | ------ | ----------------------------------- |
| `--resource`     | string | Resource name (required)            |
| `--filter-by-tk` | string | Filter by primary key               |
| `--filter`       | string | Filter conditions, JSON format      |
| `--data-source`  | string | Data source                         |
| `--source-id`    | string | Source record ID of the associated resource |

### nb api resource query

Aggregate query.

```bash
nb api resource query --resource orders --measures '[{"field":"amount","aggregation":"sum"}]'
```

| Parameter      | Type    | Description              |
| -------------- | ------- | ------------------------ |
| `--resource`   | string  | Resource name (required) |
| `--measures`   | string  | Measures, JSON array     |
| `--dimensions` | string  | Dimensions, JSON array   |
| `--orders`     | string  | Sort order, JSON array   |
| `--filter`     | string  | Filter conditions        |
| `--having`     | string  | Post-aggregation filter  |
| `--limit`      | integer | Maximum number of rows   |
| `--offset`     | integer | Number of rows to skip   |
| `--timezone`   | string  | Timezone                 |

## nb api Dynamic Commands

In addition to `nb api resource`, there is a set of dynamically generated commands under `nb api` based on the NocoBase application's OpenAPI Schema. These commands are automatically generated and cached when you first run `nb env add` or `nb env update`.

Available command groups:

| Command                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `nb api acl`             | Access control — roles, resource permissions, and action permissions |
| `nb api api-keys`        | API Key management                                        |
| `nb api app`             | Application management                                    |
| `nb api authenticators`  | Authentication management — password, SMS, SSO, etc.      |
| `nb api data-modeling`   | Data modeling — data sources, tables, and fields          |
| `nb api file-manager`    | File management — storage services and attachments        |
| `nb api flow-surfaces`   | Page orchestration — pages, blocks, fields, and actions   |
| `nb api system-settings` | System settings — title, logo, language, etc.             |
| `nb api theme-editor`    | Theme management — colors, sizes, and theme switching     |
| `nb api workflow`        | Workflow — automation process management                  |

The specific commands available under each group depend on the NocoBase application version you are connected to and the enabled plugins. Run `nb api <topic> --help` to view the currently available subcommands.

All dynamic commands share the following global parameters:

| Parameter             | Type    | Description                          |
| --------------------- | ------- | ------------------------------------ |
| `--base-url`          | string  | NocoBase API address                 |
| `--env`, `-e`         | string  | Environment name                     |
| `--token`, `-t`       | string  | API Key                              |
| `--role`              | string  | Role override (`X-Role` request header) |
| `--verbose`           | boolean | Show verbose output                  |
| `--json-output`, `-j` | boolean | Output raw JSON                      |

Commands with a request body also support `--body` (JSON string) or `--body-file` (JSON file path); the two are mutually exclusive.

## Related Links

- [Quick Start](../../ai/quick-start.md) — Installation guide and getting started
- [Environment Variables](../app/env) — Global environment variables supported by NocoBase
- [AI Builder](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [Plugin Development](../../plugin-development/index.md) — Learn how to create and publish custom plugins
