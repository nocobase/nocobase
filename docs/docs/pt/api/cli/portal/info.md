---
title: "nb portal info"
description: "nb portal info command reference: show Portal record and local workspace details."
keywords: "nb portal info,NocoBase CLI,Portal"
---

# nb portal info

Mostra detalhes do registro Portal especificado e do workspace local

## Uso

```bash
nb portal info <portal> [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--dir` | string | Portal workspace used for local file details. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal details as JSON. |

## Exemplos

```bash
nb portal info customer
nb portal info customer --env dev --yes
nb portal info customer --json-output
```

## Notas

Text output includes name, URL, development mode, local path, enabled status, and local sync status. `--json-output` prints `name`, `url`, `portalType`, `localPath`, `enabled`, `sourceStorage`, and `localSynced`. You can query by `routeName` or `uid`.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
