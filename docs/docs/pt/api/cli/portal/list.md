---
title: "nb portal list"
description: "nb portal list command reference: list Portal records and local workspace sync status."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

Lista registros Portal e o status de sincronização do workspace local

## Uso

```bash
nb portal list [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal records as JSON. |

## Exemplos

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json-output
```

## Notas

The list shows name, URL, development mode, source storage, local path, enabled status, and local sync status. Only `ai` portals have local workspace sync checks; other Portal types show an empty sync status.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
