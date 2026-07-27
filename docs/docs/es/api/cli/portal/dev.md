---
title: "nb portal dev"
description: "nb portal dev command reference: start a Portal workspace in development mode."
keywords: "nb portal dev,NocoBase CLI,Portal"
---

# nb portal dev

Inicia el modo de desarrollo para el workspace de Portal especificado

## Uso

```bash
nb portal dev <portal> [flags]
```

## Parámetro

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Ejemplos

```bash
nb portal dev customer
nb portal dev customer --env dev --yes
```

## Notas

The workspace must contain `package.json`. The command refreshes `.env` and `.env.local`, then runs `pnpm dev`. `ssh` envs are not supported in the current version.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
