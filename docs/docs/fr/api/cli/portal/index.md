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
| [`nb portal config`](./config.md) | Met à jour la configuration source du workspace Portal local et la synchronise avec l’enregistrement distant lorsque c’est possible |
| [`nb portal create`](./create.md) | Crée un workspace Portal local à partir d’un template et crée ou met à jour l’enregistrement Portal |
| [`nb portal deploy`](./deploy.md) | Construit et déploie le workspace Portal spécifié |
| [`nb portal destroy`](./destroy.md) | Supprime l’enregistrement Portal et le workspace local |
| [`nb portal dev`](./dev.md) | Démarre le mode développement pour le workspace Portal spécifié |
| [`nb portal info`](./info.md) | Affiche les détails de l’enregistrement Portal spécifié et du workspace local |
| [`nb portal list`](./list.md) | Liste les enregistrements Portal et l’état de synchronisation du workspace local |
| [`nb portal pull`](./pull.md) | Récupère le code source Portal depuis le source storage vers le workspace local |
| [`nb portal push`](./push.md) | Pousse les changements locaux du code source Portal vers le source storage |
| [`nb portal registry`](./registry/index.md) | Gère les intégrations Registry publiées par les plugins NocoBase activés |

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

Source configuration is written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Mode | Description |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `docker` | The workspace is shared with the app through a Docker volume. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

Portals are stored under the selected env storage:

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
