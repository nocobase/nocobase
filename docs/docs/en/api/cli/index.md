---
title: "NocoBase CLI"
description: "NocoBase CLI (nb command) reference overview: initialization, environment management, app runtime, source, database, plugins, API, CLI self updates, and Skills management."
keywords: "NocoBase CLI,nb,command line,command reference,environment management,plugin management,API"
---

# NocoBase CLI

NocoBase CLI (`nb`) is used to initialize, connect to, and manage NocoBase applications in a local workspace. It saves CLI env configuration, manages local apps, Docker containers, built-in databases, source directories, and storage directories, and lets coding agents connect to NocoBase through a unified command interface.

The CLI supports two common setup paths:

- Connect an existing NocoBase app so coding agents can use it directly.
- Install a new NocoBase app from Docker, npm, or Git, then save it as a CLI env.

## Prerequisites

- Node.js v20+
- Yarn 1.x
- Git: required when installing from Git source
- Docker: required when installing with Docker or using the built-in database

## Installation

```bash
npm install -g @nocobase/cli@alpha
```

View available commands:

```bash
nb --help
nb init --help
```

All commands support `nb <command> --help` for parameter details. For the full installation flow, see [Quick Start](../../ai/quick-start.mdx).

## Core Concepts

| Concept | Description |
| --- | --- |
| Workspace | The current project folder where the CLI saves `.nocobase` configuration |
| Env | A named NocoBase connection saved by the CLI. In `nb init`, the app name is also the env name |
| Source | How the local app is obtained: `docker`, `npm`, or `git` |
| Remote env | An env that only stores an API connection to an existing NocoBase app |
| Runtime resources | Local app process, Docker app container, built-in database container, source directory, and storage directory managed by CLI commands |

## Quick Start

Use the browser-based setup form:

```bash
nb init --ui
```

Install with Docker in non-interactive mode:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Install from npm:

```bash
nb init --env app1 --yes --source npm --version alpha --app-port 13080
```

Install from Git source:

```bash
nb init --env app1 --yes --source git --version alpha
```

Connect an existing NocoBase app:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Start, stop, and view logs:

```bash
nb app start --env app1
nb app stop --env app1
nb app restart --env app1
nb app logs --env app1
```

## Commands

| Command | Description |
| --- | --- |
| [`nb init`](./init.md) | Set up NocoBase and connect it as a CLI env |
| [`nb app`](./app/) | Manage app runtimes: start, stop, restart, logs, cleanup, and upgrades |
| [`nb source`](./source/) | Manage the local source project: download, develop, build, and test |
| [`nb db`](./db/) | Inspect or manage built-in database runtime status |
| [`nb env`](./env/) | Manage saved CLI env connections |
| [`nb api`](./api/) | Call NocoBase APIs from the CLI |
| [`nb plugin`](./plugin/) | Manage plugins for the selected NocoBase env |
| [`nb self`](./self/) | Check or update the installed NocoBase CLI |
| [`nb skills`](./skills/) | Check, install, update, or remove NocoBase AI coding skills |
| [`nb scaffold`](./scaffold/) | Generate plugin and migration scaffolds |

## Configuration Files

NocoBase CLI uses the global config directory by default:

```text
~/.nocobase/config.json
```

Use `NB_CLI_ROOT` to change the root directory for configuration and local app files:

```bash
export NB_CLI_ROOT=/your/workspace
```

After setting it, the config file is saved to `/your/workspace/.nocobase/config.json`. When `NB_CLI_ROOT` is not set, the CLI also keeps compatibility with the legacy project config under the current working directory.

Example config file:

```json
{
  "currentEnv": "local",
  "envs": {
    "local": {
      "apiBaseUrl": "http://localhost:13000/api",
      "auth": { "type": "token", "accessToken": "..." },
      "appRootPath": "./local/source",
      "storagePath": "./local/storage",
      "appPort": "13000",
      "dbDialect": "postgres"
    }
  }
}
```

Runtime command cache is stored in `.nocobase/versions/<hash>/commands.json` and generated or refreshed by [`nb env update`](./env/update.md).

## Related Links

- [Quick Start](../../ai/quick-start.mdx)
- [Environment Variables](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Plugin Development](../../plugin-development/index.md)
