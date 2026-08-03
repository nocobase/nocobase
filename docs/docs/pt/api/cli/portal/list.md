---
title: "nb portal list"
description: "nb portal list command reference: list portal records and development paths."
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

The list shows name, URL, portal type, source storage, development path, and enabled status. `--json-output` prints `name`, `url`, `portalType`, `developmentPath`, `deploymentPath`, `enabled`, and `sourceStorage`.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
