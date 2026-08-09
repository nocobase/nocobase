---
title: "nb portal deploy"
description: "nb portal deploy command reference: build and deploy a Portal."
keywords: "nb portal deploy,NocoBase CLI,Portal"
---

# nb portal deploy

Compila e faz deploy do workspace Portal especificado

## Uso

```bash
nb portal deploy <portal> [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |

## Exemplos

```bash
nb portal deploy customer
nb portal deploy customer --env dev --yes
```

## Notas

The command refreshes `.env` and `.env.local`, builds from the development path stored in the selected CLI env config, and syncs deployment output to the target app storage. Source storage and Git settings are managed by `nb portal config` in the remote Portal record.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
