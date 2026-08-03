---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a Portal record and its deployment directory."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Exclui o registro do Portal e o diretório de implantação

## Uso

```bash
nb portal destroy <portal> [flags]
```

## Parâmetro

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip confirmation prompts. |
| `--force` | boolean | Ignore missing Portal records or deployment directories. |
| `--delete-dev-path`, `-D` | boolean | Delete the Portal development directory in addition to the deployed Portal. |

## Exemplos

```bash
nb portal destroy customer --yes
nb portal destroy customer --delete-dev-path --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## Notas

This command deletes the remote Portal record and deployment directory. The development directory is retained by default; pass `--delete-dev-path` to delete it as well. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or deployment files.

## Comandos relacionados

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
