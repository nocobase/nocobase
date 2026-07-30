---
title: "nb portal"
description: "nb portal command reference: manage portals, including configuration, creation, development, source sync, deployment, and deletion."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` manages portals. A portal can have its own frontend source, entry path, and deployment output; this command group connects the portal record in NocoBase with the local workspace and source storage.

A typical flow is to create a local workspace, start development mode, push source changes to source storage, and then build and deploy. If you are taking over an existing portal, pull it locally first.

## Usage

```bash
nb portal <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb portal config`](./config.md) | Update the local portal source configuration and sync it to the remote portal record when possible |
| [`nb portal create`](./create.md) | Create a local portal from a template and create or update the portal record |
| [`nb portal deploy`](./deploy.md) | Build and deploy the specified portal |
| [`nb portal destroy`](./destroy.md) | Delete the portal record and local workspace |
| [`nb portal dev`](./dev.md) | Start development mode for the specified portal |
| [`nb portal info`](./info.md) | Show details for the specified portal record and local workspace |
| [`nb portal list`](./list.md) | List portal records and local workspace sync status |
| [`nb portal pull`](./pull.md) | Pull portal source from source storage into the local workspace |
| [`nb portal push`](./push.md) | Push local portal source changes to source storage |

## Typical Flow

Create a portal named `customer`:

```bash
nb portal create customer -e dev --yes
```

Start local development mode:

```bash
nb portal dev customer -e dev --yes
```

Inspect the local workspace and remote record:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Push source and deploy:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Take over an existing portal:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Switch source storage:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

When creating a portal, choose where the source code is managed:

| Mode | Description |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the portal source should be reviewed, versioned, or built through an existing team workflow.

The Portal name and source configuration are written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Mode | Description |
| --- | --- |
| `local` | The workspace is independent of app storage. Source and deployment output are synced through APIs. |
| `docker` | The workspace does not depend on a Docker volume. Source and deployment output are synced through APIs. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support portal management in the current version.

## Local Workspace Path

`create` defaults to a portal-named child of the current directory. The first `pull` uses the same location; if the current directory already contains `portal.config.json`, `pull` uses the current directory directly:

```text
<current-directory>/<portal>
```

`dev`, `push`, `deploy`, `config`, `destroy`, `info`, and `list` use the current directory as the local Portal workspace by default. Pass `--dir <path>` to any of these commands to select a workspace explicitly; relative paths are resolved from the current directory. The CLI does not derive the local workspace from the env `storagePath`.

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Flag | Description |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Related Commands

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
