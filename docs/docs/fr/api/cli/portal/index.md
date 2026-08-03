---
title: "nb portal"
description: "Référence de nb portal : gérer les workspaces Portal, y compris configuration, création, développement, synchronisation du code source, déploiement et suppression."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` gère les workspaces Portal. Un Portal peut avoir son propre code source frontend, son chemin d’entrée et son résultat de déploiement ; ce groupe relie l’enregistrement Portal dans NocoBase au workspace local et au source storage.

Le flux courant consiste à créer un workspace local, lancer le mode développement, pousser les changements vers le source storage, puis builder et déployer. Pour reprendre un Portal existant, commencez par le récupérer avec `pull`.

## Utilisation

```bash
nb portal <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb portal config`](./config.md) | Update the portal development path, source storage, and Git source configuration |
| [`nb portal create`](./create.md) | Crée un workspace Portal local à partir d’un template et crée ou met à jour l’enregistrement Portal |
| [`nb portal deploy`](./deploy.md) | Construit et déploie le workspace Portal spécifié |
| [`nb portal destroy`](./destroy.md) | Supprime l’enregistrement Portal et le workspace local |
| [`nb portal dev`](./dev.md) | Démarre le mode développement pour le workspace Portal spécifié |
| [`nb portal info`](./info.md) | Affiche les détails de l’enregistrement Portal spécifié et du workspace local |
| [`nb portal list`](./list.md) | List portal records and development paths |
| [`nb portal pull`](./pull.md) | Récupère le code source Portal depuis le source storage vers le workspace local |
| [`nb portal push`](./push.md) | Pousse les changements locaux du code source Portal vers le source storage |

## Flux typique

Créer un Portal nommé `customer` :

```bash
nb portal create customer -e dev --yes
```

Démarrer le mode développement local :

```bash
nb portal dev customer -e dev --yes
```

Inspecter le workspace local et l’enregistrement distant :

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Pousser le code source et déployer :

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Reprendre un Portal existant :

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Changer le source storage :

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Lors de la création d’un Portal, choisissez où le code source est géré :

| Mode | Description |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

`nb portal config` updates source storage and Git settings in the remote portal record. The development workspace path is stored separately in the CLI env config as `portals.<portal>.path`, maintained by `create`, `pull --path`, or `config --path`.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Mode | Description |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. `pull` writes source to the development path, and `deploy` builds from that path before syncing deployment output. |
| `docker` | The workspace is shared with the app through a Docker volume. `pull` writes source to the development path, and `deploy` builds from that path before syncing deployment output. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

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

| Paramètre | Description |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Commandes liées

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
