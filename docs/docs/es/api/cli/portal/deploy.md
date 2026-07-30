---
title: "nb portal deploy"
description: "nb portal deploy command reference: build and deploy a Portal."
keywords: "nb portal deploy,NocoBase CLI,Portal"
---

# nb portal deploy

Compila y despliega el workspace de Portal especificado

## Uso

```bash
nb portal deploy <portal> [flags]
```

## Parámetro

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--dir` | string | Portal workspace directory. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Ejemplos

```bash
nb portal deploy customer
nb portal deploy customer --env dev --yes
```

## Notas

The command refreshes `.env` and `.env.local`, runs `pnpm build`, and expects `dist/index.html`. For `local`, `docker`, and `http` envs, it uploads the packed `dist` through the API and syncs the Portal record.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
