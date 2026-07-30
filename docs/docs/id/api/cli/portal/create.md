---
title: "nb portal create"
description: "nb portal create command reference: create a local Portal from a template and create or update the Portal record."
keywords: "nb portal create,NocoBase CLI,Portal"
---

# nb portal create

Membuat workspace Portal lokal dari template dan membuat atau memperbarui record Portal

## Penggunaan

```bash
nb portal create <portal> [flags]
```

## Parameter

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `--dir` | string | Local workspace directory. Default: `<current-directory>/<portal>`. |
| `<portal>` | string | Portal name or slug. |
| `--template` | string | Template package, local path, or `file://` URL. Default: `@nocobase/portal-template-default`. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--title` | string | Portal display title. |
| `--force` | boolean | Delete the existing workspace and recreate it. |
| `--source-storage` | `nocobase` \| `git` | Where Portal source code is managed. Default: `nocobase`. |
| `--git-repo` | string | Git repository URL used with `--source-storage=git`. |
| `--git-branch` | string | Git branch used with `--source-storage=git`. |
| `--git-path` | string | Directory inside the Git repository; defaults to the repository root (`.`). |

## Contoh

```bash
nb portal create customer
nb portal create customer --template @nocobase/portal-template-default
nb portal create customer --env dev --yes
nb portal create customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
```

## Catatan

The command writes `.env`, `.env.local`, and `portal.config.json`. The config file records the Portal name and source settings. If the template contains `package.json`, the command runs `pnpm install`. Portal names must use lowercase letters, numbers, underscores, or hyphens, and start with a lowercase letter or number.

## Perintah terkait

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
