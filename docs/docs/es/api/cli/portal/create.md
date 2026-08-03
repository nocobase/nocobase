---
title: "nb portal create"
description: "nb portal create command reference: create a local Portal from a template and create or update the Portal record."
keywords: "nb portal create,NocoBase CLI,Portal"
---

# nb portal create

Crea un workspace local de Portal desde una plantilla y crea o actualiza el registro de Portal

## Uso

```bash
nb portal create <portal> [flags]
```

## Parámetro

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--template` | string | Template package, local path, or `file://` URL. Default: `@nocobase/portal-template-default`. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--title` | string | Portal display title. |
| `--path` | string | Portal workspace directory. Default: `./<portal>`. |
| `--force` | boolean | Delete the existing workspace and recreate it. |

## Ejemplos

```bash
nb portal create customer
nb portal create customer --path ./portals/customer
nb portal create customer --template @nocobase/portal-template-default
nb portal create customer --env dev --yes
```

## Notas

The command writes `.env` and `.env.local`, stores the workspace path in the selected CLI env config, and runs `pnpm install` when the template contains `package.json`. Portal names must use lowercase letters, numbers, underscores, or hyphens, and start with a lowercase letter or number.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
