---
title: 'NocoBase CLI'
description: 'NocoBase CLI (`nb` command) reference: initialization, backup and restore, configuration, environment management, app runtime, source code, database, plugins, commercial license, API, CLI self-update, and Skills management.'
keywords: 'NocoBase CLI,nb,command line,command reference,backup,restore,environment management,plugin management,commercial license,API'
---

# NocoBase CLI

## Description

NocoBase CLI (`nb`) is the command-line entry point for NocoBase, used to initialize, connect to, and manage NocoBase applications in a local workspace.

It supports two common initialization paths:

- Connect to an existing NocoBase application and save it as a CLI env
- Install a new NocoBase application via Docker, npm, or Git, then save it as a CLI env

When creating a new local application, [`nb init`](./init.md) can also install or update NocoBase AI coding skills. To skip this step, use `--skip-skills`.

## Usage

```bash
nb [command]
```

The root command itself is mainly used to display help and dispatch invocations to command groups or standalone commands.

## Command groups (Topics)

The following command groups are shown in `nb --help`:

| Command group                        | Description                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| [`nb api`](./api/index.md)           | Call NocoBase APIs through the CLI.                                                           |
| [`nb app`](./app/index.md)           | Manage the application runtime: start, stop, restart, logs, and upgrade.                      |
| [`nb backup`](./backup/index.md)     | Create backups and download them locally, or restore a local backup file to the target env.   |
| [`nb config`](./config/index.md)     | Manage CLI default configuration.                                                             |
| [`nb db`](./db/index.md)             | Manage the built-in database of the selected env.                                             |
| [`nb env`](./env/index.md)           | Manage NocoBase project environments, the current env, status, details, and runtime commands. |
| [`nb license`](./license/index.md)   | Manage commercial licenses and licensed plugins.                                              |
| [`nb plugin`](./plugin/index.md)     | Manage plugins in the selected NocoBase env.                                                  |
| [`nb scaffold`](./scaffold/index.md) | Generate scaffolding for NocoBase plugin development.                                         |
| [`nb self`](./self/index.md)         | Check or update NocoBase CLI itself.                                                          |
| [`nb session`](./session/index.md)   | Configure `NB_SESSION_ID` so the current env is isolated by shell or agent runtime.           |
| [`nb skills`](./skills/index.md)     | Check or sync NocoBase AI coding skills in the current workspace.                             |
| [`nb source`](./source/index.md)     | Manage local source projects: download, develop, build, and test.                             |

## Commands

Standalone commands currently exposed directly by the root command:

| Command                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| [`nb init`](./init.md) | Initialize NocoBase so coding agents can connect and work. |

## Viewing help

View help for the root command:

```bash
nb --help
```

View help for a command or command group:

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## Examples

Interactive initialization:

```bash
nb init
```

Initialize using a browser form:

```bash
nb init --ui
```

Create a Docker application non-interactively:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Connect to an existing application:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

Resync env status after starting the application:

```bash
nb app start -e app1
nb env update app1
```

Call an API:

```bash
nb api resource list --resource users -e app1
```

View CLI default configuration:

```bash
nb config list
nb config get docker.network
```

View commercial license status:

```bash
nb license status -e app1
nb license plugins list -e app1
```

Create and download a backup:

```bash
nb backup create -e app1 --output ./backups
```

Restore a local backup:

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Environment variables

The following environment variables affect CLI behavior:

| Variable        | Description                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | Root directory where the CLI stores `.nocobase` configuration and local application files. Defaults to the current user's home directory. |
| `NB_LOCALE`     | CLI prompt language and local initialization UI language. Supports `en-US` and `zh-CN`.                                                   |
| `NB_SESSION_ID` | Session ID for the current shell or agent runtime. When set, `nb env use` and `nb env current` are isolated by session.                   |

Example:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Configuration files

Default configuration file:

```text
~/.nocobase/config.json
```

After setting `NB_CLI_ROOT=/your/workspace`, the configuration file path becomes:

```text
/your/workspace/.nocobase/config.json
```

The CLI is also compatible with reading legacy project configuration in the current working directory.

The session-level cache for the current env is stored in:

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

The globally last-used env is stored in the `lastEnv` field of `config.json`. When `NB_SESSION_ID` is not set, the CLI falls back to this global value.

The runtime command cache is stored in:

```text
.nocobase/versions/<hash>/commands.json
```

This file is generated or refreshed by [`nb env update`](./env/update.md) and is used to cache runtime commands synchronized from the target application.

## Related links

- [Quick Start](../../ai/quick-start.mdx)
- [Global Environment Variables](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Plugin Development](../../plugin-development/index.md)
