---
title: "nb portal list"
description: "nb portal list command reference: list Portal records and local workspace sync status."
keywords: "nb portal list,NocoBase CLI,Portal"
---

# nb portal list

Liste les enregistrements Portal et l’état de synchronisation du workspace local

## Utilisation

```bash
nb portal list [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip cross-env confirmation. |
| `--json-output`, `-j` | boolean | Print Portal records as JSON. |

## Exemples

```bash
nb portal list
nb portal list --env dev --yes
nb portal list --json-output
```

## Notes

The list shows name, URL, development mode, source storage, local path, enabled status, and local sync status. Only `vibe-coding` Portals have local workspace sync checks; other Portal types show an empty sync status.

## Commandes liées

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
