---
title: "nb portal"
description: "nb portal command reference: manage Portal workspaces, including configuration, creation, development, source sync, deployment, and deletion."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` manages Portal workspaces. A Portal can have its own frontend source, entry path, and deployment output; this command group connects the Portal record in NocoBase with the local workspace and source storage.

A typical flow is to create a local workspace, start development mode, push source changes to source storage, and then build and deploy. If you are taking over an existing Portal, pull it locally first.

## Usage

```bash
nb portal <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb portal config`](./config.md) | Update the local Portal workspace source configuration and sync it to the remote Portal record when possible |
| [`nb portal create`](./create.md) | Create a local Portal workspace from a template and create or update the Portal record |
| [`nb portal deploy`](./deploy.md) | Build and deploy the specified Portal workspace |
| [`nb portal destroy`](./destroy.md) | Delete the Portal record and local workspace |
| [`nb portal dev`](./dev.md) | Start development mode for the specified Portal workspace |
| [`nb portal info`](./info.md) | Show details for the specified Portal record and local workspace |
| [`nb portal list`](./list.md) | List Portal records and local workspace sync status |
| [`nb portal pull`](./pull.md) | Pull Portal source from source storage into the local workspace |
| [`nb portal push`](./push.md) | Push local Portal source changes to source storage |

## Typical Flow

Create a Portal named `customer`:

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

Take over an existing Portal:

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

When creating a Portal, choose where the source code is managed:

| Mode | Description |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

Source configuration is written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Mode | Description |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `docker` | The workspace is shared with the app through a Docker volume. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal workspace management in the current version.

## Local Workspace Path

Portal workspaces are stored under the selected env storage:

```text
<storagePath>/portals/<app>/<portal>
```

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
