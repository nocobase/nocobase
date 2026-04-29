---
title: "NocoBase CLI"
description: "NocoBase CLI (nb command) reference: initialization, environment management, app runtime, source, database, plugins, API, CLI self updates, and Skills management."
keywords: "NocoBase CLI,nb,command line,command reference,environment management,plugin management,API"
---

# NocoBase CLI

## Description

NocoBase CLI (`nb`) is the command-line entry point for initializing, connecting to, and managing NocoBase apps in a local workspace.

It supports two common setup paths:

- Connect an existing NocoBase app and save it as a CLI env
- Install a new NocoBase app from Docker, npm, or Git, then save it as a CLI env

When creating a new local app, [`nb init`](./init.md) can also install or update NocoBase AI coding skills. Use `--skip-skills` when you want to skip that step.

## Usage

```bash
nb [command]
```

The root command mainly displays help and dispatches execution to command groups or standalone commands.

## Topics

`nb --help` shows the following topics:

| Topic | Description |
| --- | --- |
| [`nb api`](./api/index.md) | Work with NocoBase API. |
| [`nb app`](./app/index.md) | Manage NocoBase app runtimes: start, stop, restart, logs, and upgrades. |
| [`nb db`](./db/index.md) | Manage the built-in database for the selected env. |
| [`nb env`](./env/index.md) | Manage NocoBase project environments, status, details, and command runtimes. |
| [`nb plugin`](./plugin/index.md) | Manage plugins in the selected NocoBase env. |
| [`nb scaffold`](./scaffold/index.md) | Generate NocoBase plugin development scaffolds. |
| [`nb self`](./self/index.md) | Inspect or update the NocoBase CLI itself. |
| [`nb skills`](./skills/index.md) | Inspect or synchronize NocoBase AI coding skills for the current workspace. |
| [`nb source`](./source/index.md) | Work with the local NocoBase source project: download, develop, build, and test. |

## Commands

Standalone commands exposed directly by the root command:

| Command | Description |
| --- | --- |
| [`nb init`](./init.md) | Set up NocoBase so coding agents can connect and work with it. |

## Display help text

Show help for the root command:

```bash
nb --help
```

Show help for a command or command group:

```bash
nb init --help
nb app --help
nb api resource --help
```

## Examples

Interactive setup:

```bash
nb init
```

Browser-based setup:

```bash
nb init --ui
```

Create a Docker-based app non-interactively:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Connect an existing app:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Start the app and refresh runtime commands:

```bash
nb app start -e app1
nb env update app1
```

Call an API:

```bash
nb api resource list --resource users -e app1
```

## Environment variables

The following environment variables affect CLI behavior:

| Variable | Description |
| --- | --- |
| `NB_CLI_ROOT` | Root directory where the CLI stores `.nocobase` config and local app files. Defaults to the current user's home directory. |
| `NB_LOCALE` | Language for CLI prompts and the local setup UI. Supported values are `en-US` and `zh-CN`. |

Example:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=en-US
```

## Configuration files

Default config file:

```text
~/.nocobase/config.json
```

After setting `NB_CLI_ROOT=/your/workspace`, the config file path becomes:

```text
/your/workspace/.nocobase/config.json
```

The CLI also keeps compatibility with legacy project config under the current working directory.

Runtime command cache is stored in:

```text
.nocobase/versions/<hash>/commands.json
```

This file is generated or refreshed by [`nb env update`](./env/update.md) and caches runtime commands synchronized from the target app.

## Related links

- [Quick Start](../../ai/quick-start.mdx)
- [Install, Upgrade, and Migration](../../ai/install-upgrade-migration.mdx)
- [Environment Variables](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Plugin Development](../../plugin-development/index.md)
