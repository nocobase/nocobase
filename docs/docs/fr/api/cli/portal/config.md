---
title: "nb portal config"
description: "nb portal config command reference: update the development path, source storage, and Git source configuration for a portal."
keywords: "nb portal config,NocoBase CLI,Portal"
---

# nb portal config

Met à jour la configuration source du workspace Portal local et la synchronise avec l’enregistrement distant lorsque c’est possible

## Utilisation

```bash
nb portal config <portal> [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--path` | string | Portal development workspace directory. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the repository root (`.`). |

## Exemples

```bash
nb portal config customer --path ./portals/customer
nb portal config customer --source-storage nocobase
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal config customer --git-branch main --git-path portals/customer
```

## Notes

Pass at least one configuration flag. `--path` updates the selected CLI env config. `--source-storage` and `--git-*` update the remote portal record options.

## Commandes liées

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
