---
title: "nb portal config"
description: "nb portal config command reference: update the development path, source storage, and Git source configuration for a portal."
keywords: "nb portal config,NocoBase CLI,Portal"
---

# nb portal config

Atualiza a configuração de source do workspace Portal local e sincroniza com o registro remoto quando possível

## Uso

```bash
nb portal config <portal> [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--path` | string | Portal development workspace directory. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the repository root (`.`). |

## Exemplos

```bash
nb portal config customer --path ./portals/customer
nb portal config customer --source-storage nocobase
nb portal config customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal config customer --git-branch main --git-path portals/customer
```

## Notas

Pass at least one configuration flag. `--path` updates the selected CLI env config. `--source-storage` and `--git-*` update the remote portal record options.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
