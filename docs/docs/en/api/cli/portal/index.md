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
| [`nb portal config`](./config.md) | Update the portal development path, source storage, and Git source configuration |
| [`nb portal create`](./create.md) | Create a local portal from a template and create or update the portal record |
| [`nb portal deploy`](./deploy.md) | Build and deploy the specified portal |
| [`nb portal destroy`](./destroy.md) | Delete the portal record and local workspace |
| [`nb portal dev`](./dev.md) | Start development mode for the specified portal |
| [`nb portal info`](./info.md) | Show details for the specified portal record and local workspace |
| [`nb portal list`](./list.md) | List portal records and development paths |
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

Portal source storage is stored in the remote portal record options:

| Mode | Description |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the portal source should be reviewed, versioned, or built through an existing team workflow.

`nb portal config` updates source storage and Git settings in the remote portal record. The development workspace path is stored separately in the CLI env config as `portals.<portal>.path`, maintained by `create`, `pull --path`, or `config --path`.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Mode | Description |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. `pull` writes source to the development path, and `deploy` builds from that path before syncing deployment output. |
| `docker` | The workspace is shared with the app through a Docker volume. `pull` writes source to the development path, and `deploy` builds from that path before syncing deployment output. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support portal management in the current version.

## Development And Deployment Paths

Portal development workspaces are created under the current working directory by default:

```text
./<portal>
```

Use `--path` with `create`, `pull`, or `config` to choose a different development path. Deployment output is still stored under the target app storage:

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
